import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatHistoryItem {
  id: string;
  question_text: string;
  answer_text: string;
  purity_score: number | null;
  reward_amount: number;
  is_rewarded: boolean;
  created_at: string;
  session_id?: string | null;
  folder_id?: string | null;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (sessionId?: string) => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Không thể tải lịch sử trò chuyện');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveToHistory = useCallback(async (
    questionText: string, 
    answerText: string,
    options?: {
      questionId?: string;
      purityScore?: number;
      rewardAmount?: number;
      isRewarded?: boolean;
      sessionId?: string;
      folderId?: string;
    }
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          question_text: questionText,
          answer_text: answerText,
          question_id: options?.questionId,
          purity_score: options?.purityScore,
          reward_amount: options?.rewardAmount || 0,
          is_rewarded: options?.isRewarded || false,
          session_id: options?.sessionId,
          folder_id: options?.folderId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setHistory(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Error saving to chat history:', err);
      return null;
    }
  }, [user]);

  const deleteFromHistory = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting from chat history:', err);
      return false;
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    fetchHistory,
    saveToHistory,
    deleteFromHistory,
  };
}
