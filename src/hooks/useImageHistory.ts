import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ImageHistoryItem {
  id: string;
  user_id: string;
  image_type: 'generated' | 'analyzed';
  prompt: string;
  response_text: string | null;
  image_url: string;
  style: string | null;
  created_at: string;
}

export function useImageHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('image_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setHistory((data || []) as ImageHistoryItem[]);
    } catch (err) {
      console.error('Error fetching image history:', err);
      setError('Không thể tải lịch sử hình ảnh');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveToHistory = useCallback(async (
    imageType: 'generated' | 'analyzed',
    prompt: string,
    imageUrl: string,
    responseText?: string,
    style?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('image_history')
        .insert({
          user_id: user.id,
          image_type: imageType,
          prompt,
          image_url: imageUrl,
          response_text: responseText || null,
          style: style || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setHistory(prev => [data as ImageHistoryItem, ...prev]);
      
      return data;
    } catch (err) {
      console.error('Error saving to image history:', err);
      return null;
    }
  }, [user]);

  const deleteFromHistory = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('image_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting from image history:', err);
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
