import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PendingCelebration {
  id: string;
  amount: number;
  tx_hash: string | null;
  wallet_address: string;
}

export const useWithdrawalNotify = () => {
  const { user, isAdmin } = useAuth();
  const [pendingCelebration, setPendingCelebration] = useState<PendingCelebration | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const hasCheckedInitial = useRef(false);

  // Check for uncelebrated withdrawals on mount/login
  const checkUncelebratedWithdrawals = useCallback(async () => {
    if (!user || isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('coin_withdrawals')
        .select('id, amount, tx_hash, wallet_address')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .is('celebrated_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking uncelebrated withdrawals:', error);
        return;
      }

      if (data) {
        console.log('Found uncelebrated withdrawal:', data);
        setPendingCelebration({
          id: data.id,
          amount: data.amount,
          tx_hash: data.tx_hash,
          wallet_address: data.wallet_address,
        });
      }
    } catch (err) {
      console.error('Error in checkUncelebratedWithdrawals:', err);
    }
  }, [user, isAdmin]);

  // Load audio from edge function
  const loadAudio = useCallback(async () => {
    // Check sessionStorage cache first
    const cachedAudio = sessionStorage.getItem('coin_celebration_audio');
    if (cachedAudio) {
      setAudioUrl(cachedAudio);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-coin-sound`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      // Cache in sessionStorage as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        sessionStorage.setItem('coin_celebration_audio', base64);
      };
      reader.readAsDataURL(audioBlob);

      setAudioUrl(url);
    } catch (err) {
      console.error('Error loading celebration audio:', err);
    } finally {
      setIsLoadingAudio(false);
    }
  }, []);

  // Mark withdrawal as celebrated
  const markAsCelebrated = useCallback(async () => {
    if (!pendingCelebration || !user) return;

    try {
      const { error } = await supabase
        .from('coin_withdrawals')
        .update({ celebrated_at: new Date().toISOString() })
        .eq('id', pendingCelebration.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking as celebrated:', error);
        return;
      }

      console.log('Marked withdrawal as celebrated:', pendingCelebration.id);
      setPendingCelebration(null);

      // Check if there are more uncelebrated withdrawals
      await checkUncelebratedWithdrawals();
    } catch (err) {
      console.error('Error in markAsCelebrated:', err);
    }
  }, [pendingCelebration, user, checkUncelebratedWithdrawals]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || isAdmin) return;

    // Check on mount (only once)
    if (!hasCheckedInitial.current) {
      hasCheckedInitial.current = true;
      checkUncelebratedWithdrawals();
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`withdrawal_notify_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'coin_withdrawals',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          console.log('Withdrawal update received:', { newData, oldData });

          // Only trigger if status changed TO completed
          if (
            newData.status === 'completed' &&
            oldData.status !== 'completed' &&
            !newData.celebrated_at
          ) {
            console.log('Triggering celebration for withdrawal:', newData.id);
            setPendingCelebration({
              id: newData.id,
              amount: newData.amount,
              tx_hash: newData.tx_hash,
              wallet_address: newData.wallet_address,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, checkUncelebratedWithdrawals]);

  // Preload audio when there's a pending celebration
  useEffect(() => {
    if (pendingCelebration && !audioUrl && !isLoadingAudio) {
      loadAudio();
    }
  }, [pendingCelebration, audioUrl, isLoadingAudio, loadAudio]);

  return {
    pendingCelebration,
    audioUrl,
    isLoadingAudio,
    markAsCelebrated,
  };
};
