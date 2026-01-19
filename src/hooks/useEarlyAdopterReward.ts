import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EarlyAdopterStatus {
  validQuestionsCount: number;
  isRewarded: boolean;
  rewardedAt: string | null;
  rewardAmount: number;
  userRank: number | null;
}

interface EarlyAdopterRewardResult {
  success: boolean;
  message: string;
  coinsAwarded: number;
  userRank: number;
}

export const useEarlyAdopterReward = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<EarlyAdopterStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardResult, setRewardResult] = useState<EarlyAdopterRewardResult | null>(null);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("early_adopter_rewards")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching early adopter status:", error);
        setStatus(null);
      } else if (data) {
        // Get user rank
        const { data: rankData } = await supabase.rpc("get_early_adopter_rank", {
          p_user_id: user.id
        });

        setStatus({
          validQuestionsCount: data.valid_questions_count,
          isRewarded: data.is_rewarded,
          rewardedAt: data.rewarded_at,
          rewardAmount: data.reward_amount,
          userRank: rankData || null
        });
      } else {
        // Auto-register if not exists
        await supabase.rpc("register_early_adopter", { p_user_id: user.id });
        setStatus({
          validQuestionsCount: 0,
          isRewarded: false,
          rewardedAt: null,
          rewardAmount: 20000,
          userRank: null
        });
      }
    } catch (error) {
      console.error("Error in fetchStatus:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Increment valid question count and check for reward eligibility
  const incrementQuestionCount = useCallback(async (): Promise<boolean> => {
    if (!user || !status) return false;

    try {
      // Increment count
      const { data: newCount } = await supabase.rpc("increment_early_adopter_questions", {
        p_user_id: user.id
      });

      console.log("New early adopter question count:", newCount);

      // Check if just reached 10 and not already rewarded
      if (newCount === 10 && !status.isRewarded) {
        // Try to claim reward
        const { data: rewardData, error: rewardError } = await supabase.rpc("process_early_adopter_reward", {
          p_user_id: user.id
        });

        if (rewardError) {
          console.error("Error processing early adopter reward:", rewardError);
          return false;
        }

        if (rewardData && rewardData.length > 0) {
          const result = rewardData[0];
          if (result.success) {
            setRewardResult({
              success: true,
              message: result.message,
              coinsAwarded: result.coins_awarded,
              userRank: result.user_rank
            });
            setShowRewardPopup(true);
            await fetchStatus();
            return true;
          }
        }
      } else if (newCount) {
        // Just update local status
        setStatus(prev => prev ? { ...prev, validQuestionsCount: newCount } : null);
      }

      return false;
    } catch (error) {
      console.error("Error incrementing question count:", error);
      return false;
    }
  }, [user, status, fetchStatus]);

  const dismissRewardPopup = useCallback(() => {
    setShowRewardPopup(false);
    setRewardResult(null);
  }, []);

  return {
    status,
    isLoading,
    showRewardPopup,
    rewardResult,
    incrementQuestionCount,
    dismissRewardPopup,
    refreshStatus: fetchStatus
  };
};
