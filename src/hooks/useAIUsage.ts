import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AIUsageItem {
  usage_type: string;
  usage_count: number;
  daily_limit: number | null;
}

export function useAIUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<AIUsageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc(
        'get_daily_ai_usage',
        { _user_id: user.id }
      );

      if (fetchError) {
        throw fetchError;
      }

      setUsage((data || []) as AIUsageItem[]);
    } catch (err) {
      console.error('Error fetching AI usage:', err);
      setError('Không thể tải thông tin sử dụng AI');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const getUsageByType = (type: string): AIUsageItem | undefined => {
    return usage.find(u => u.usage_type === type);
  };

  const canGenerate = (): boolean => {
    const genUsage = getUsageByType('generate_image');
    if (!genUsage || genUsage.daily_limit === null) return true;
    return genUsage.usage_count < genUsage.daily_limit;
  };

  const canEdit = (): boolean => {
    const editUsage = getUsageByType('edit_image');
    if (!editUsage || editUsage.daily_limit === null) return true;
    return editUsage.usage_count < editUsage.daily_limit;
  };

  return {
    usage,
    isLoading,
    error,
    fetchUsage,
    getUsageByType,
    canGenerate,
    canEdit,
  };
}
