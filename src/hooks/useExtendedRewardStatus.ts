import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ExtendedRewardStatus {
  questionsRewarded: number;
  questionsRemaining: number;
  journalsRewarded: number;
  journalsRemaining: number;
  canWriteJournal: boolean;
  loginsRewarded: number;
  sharesRewarded: number;
  sharesRemaining: number;
  feedbacksRewarded: number;
  feedbacksRemaining: number;
  ideasSubmitted: number;
  ideasRemaining: number;
  communityHelpsRewarded: number;
  communityHelpsRemaining: number;
  knowledgeUploads: number;
  knowledgeUploadsRemaining: number;
  totalCoinsToday: number;
  currentStreak: number;
  isLoading: boolean;
}

export function useExtendedRewardStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ExtendedRewardStatus>({
    questionsRewarded: 0,
    questionsRemaining: 10,
    journalsRewarded: 0,
    journalsRemaining: 3,
    canWriteJournal: false,
    loginsRewarded: 0,
    sharesRewarded: 0,
    sharesRemaining: 5,  // Changed from 3 to 5
    feedbacksRewarded: 0,
    feedbacksRemaining: 2,
    ideasSubmitted: 0,
    ideasRemaining: 2,
    communityHelpsRewarded: 0,
    communityHelpsRemaining: 5,
    knowledgeUploads: 0,
    knowledgeUploadsRemaining: 2,
    totalCoinsToday: 0,
    currentStreak: 0,
    isLoading: true,
  });

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc("get_extended_daily_reward_status", { _user_id: user.id });

      if (error) {
        console.error("Error fetching extended reward status:", error);
        setStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const result = data?.[0];

      if (result) {
        setStatus({
          questionsRewarded: result.questions_rewarded,
          questionsRemaining: result.questions_remaining,
          journalsRewarded: result.journals_rewarded,
          journalsRemaining: result.journals_remaining,
          canWriteJournal: result.can_write_journal,
          loginsRewarded: result.logins_rewarded,
          sharesRewarded: result.shares_rewarded,
          sharesRemaining: result.shares_remaining,
          feedbacksRewarded: result.feedbacks_rewarded,
          feedbacksRemaining: result.feedbacks_remaining,
          ideasSubmitted: result.ideas_submitted,
          ideasRemaining: result.ideas_remaining,
          communityHelpsRewarded: result.community_helps_rewarded,
          communityHelpsRemaining: result.community_helps_remaining,
          knowledgeUploads: result.knowledge_uploads,
          knowledgeUploadsRemaining: result.knowledge_uploads_remaining,
          totalCoinsToday: Number(result.total_coins_today),
          currentStreak: result.current_streak,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error in extended reward status:", error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...status,
    refreshStatus: fetchStatus,
  };
}
