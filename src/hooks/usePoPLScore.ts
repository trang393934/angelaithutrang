import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PoPLScoreData {
  score: number;
  positiveActions: number;
  negativeActions: number;
  isVerified: boolean;
  badgeLevel: string;
  isLoading: boolean;
}

const calculateBadgeLevel = (score: number, positiveActions: number): string => {
  if (score >= 90 && positiveActions >= 100) return "angel";
  if (score >= 80 && positiveActions >= 50) return "lightworker";
  if (score >= 70 && positiveActions >= 25) return "guardian";
  if (score >= 60 && positiveActions >= 10) return "contributor";
  return "newcomer";
};

export function usePoPLScore(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [data, setData] = useState<PoPLScoreData>({
    score: 50,
    positiveActions: 0,
    negativeActions: 0,
    isVerified: false,
    badgeLevel: "newcomer",
    isLoading: true
  });

  const fetchScore = async () => {
    if (!targetUserId) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch from user_light_totals
      const { data: totals } = await supabase
        .from("user_light_totals")
        .select("popl_score, positive_actions, negative_actions")
        .eq("user_id", targetUserId)
        .maybeSingle();

      // Fetch verification status from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("popl_verified, popl_badge_level")
        .eq("user_id", targetUserId)
        .maybeSingle();

      const score = totals?.popl_score ?? 50;
      const positiveActions = totals?.positive_actions ?? 0;
      const negativeActions = totals?.negative_actions ?? 0;
      
      // Calculate badge level based on score and actions
      const badgeLevel = profile?.popl_badge_level || calculateBadgeLevel(score, positiveActions);

      setData({
        score,
        positiveActions,
        negativeActions,
        isVerified: profile?.popl_verified ?? false,
        badgeLevel,
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching PoPL score:", error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateScore = async (actionType: string, isPositive: boolean) => {
    if (!user) return null;

    try {
      const { data: newScore, error } = await supabase
        .rpc("update_popl_score", {
          _user_id: user.id,
          _action_type: actionType,
          _is_positive: isPositive
        });

      if (error) throw error;

      // Refresh data
      await fetchScore();
      return newScore;
    } catch (error) {
      console.error("Error updating PoPL score:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchScore();
  }, [targetUserId]);

  return {
    ...data,
    updateScore,
    refreshScore: fetchScore
  };
}
