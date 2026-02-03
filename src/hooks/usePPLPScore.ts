import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PPLPPillarScores {
  pillar_s: number; // Service to Life
  pillar_t: number; // Truth/Transparency
  pillar_h: number; // Healing/Compassion
  pillar_c: number; // Contribution durability
  pillar_u: number; // Unity alignment
}

export interface PPLPMultipliers {
  quality_q: number;    // 1.0 - 3.0
  impact_i: number;     // 1.0 - 5.0
  integrity_k: number;  // 0.0 - 1.0
}

export interface PPLPScoreData extends PPLPPillarScores, PPLPMultipliers {
  light_score: number;
  reward_amount: number;
  decision: "pass" | "fail";
  action_id: string;
  created_at: string;
}

export interface PPLPUserStats {
  total_actions: number;
  passed_actions: number;
  failed_actions: number;
  total_rewards: number;
  avg_light_score: number;
  avg_pillars: PPLPPillarScores;
}

const DEFAULT_PILLARS: PPLPPillarScores = {
  pillar_s: 50,
  pillar_t: 50,
  pillar_h: 50,
  pillar_c: 50,
  pillar_u: 50
};

export function usePPLPScore(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const [scores, setScores] = useState<PPLPScoreData[]>([]);
  const [stats, setStats] = useState<PPLPUserStats | null>(null);
  const [avgPillars, setAvgPillars] = useState<PPLPPillarScores>(DEFAULT_PILLARS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = useCallback(async (limit = 20) => {
    if (!targetUserId) return;

    try {
      // Fetch recent scores
      const { data: actionsData, error: actionsError } = await supabase
        .from("pplp_actions")
        .select("id")
        .eq("actor_id", targetUserId)
        .eq("status", "scored")
        .order("scored_at", { ascending: false })
        .limit(limit);

      if (actionsError) throw actionsError;

      if (!actionsData || actionsData.length === 0) {
        setScores([]);
        return;
      }

      const actionIds = actionsData.map(a => a.id);
      
      const { data: scoresData, error: scoresError } = await supabase
        .from("pplp_scores")
        .select("*")
        .in("action_id", actionIds)
        .order("created_at", { ascending: false });

      if (scoresError) throw scoresError;
      setScores((scoresData || []) as unknown as PPLPScoreData[]);
    } catch (error) {
      console.error("Error fetching PPLP scores:", error);
    }
  }, [targetUserId]);

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // Calculate user stats from pplp_scores
      const { data: actionsData } = await supabase
        .from("pplp_actions")
        .select("id, status")
        .eq("actor_id", targetUserId);

      if (!actionsData || actionsData.length === 0) {
        setStats(null);
        return;
      }

      const scoredActionIds = actionsData
        .filter(a => a.status === "scored" || a.status === "minted")
        .map(a => a.id);

      if (scoredActionIds.length === 0) {
        setStats({
          total_actions: actionsData.length,
          passed_actions: 0,
          failed_actions: 0,
          total_rewards: 0,
          avg_light_score: 50,
          avg_pillars: DEFAULT_PILLARS
        });
        return;
      }

      const { data: scoresData } = await supabase
        .from("pplp_scores")
        .select("*")
        .in("action_id", scoredActionIds);

      if (!scoresData || scoresData.length === 0) {
        setStats(null);
        return;
      }

      const passedActions = scoresData.filter(s => s.decision === "pass").length;
      const failedActions = scoresData.filter(s => s.decision === "fail").length;
      const totalRewards = scoresData.reduce((sum, s) => sum + (s.final_reward || 0), 0);
      const avgLightScore = scoresData.reduce((sum, s) => sum + (s.light_score || 0), 0) / scoresData.length;

      const avgS = scoresData.reduce((sum, s) => sum + (s.pillar_s || 0), 0) / scoresData.length;
      const avgT = scoresData.reduce((sum, s) => sum + (s.pillar_t || 0), 0) / scoresData.length;
      const avgH = scoresData.reduce((sum, s) => sum + (s.pillar_h || 0), 0) / scoresData.length;
      const avgC = scoresData.reduce((sum, s) => sum + (s.pillar_c || 0), 0) / scoresData.length;
      const avgU = scoresData.reduce((sum, s) => sum + (s.pillar_u || 0), 0) / scoresData.length;

      const calculatedAvgPillars: PPLPPillarScores = {
        pillar_s: Math.round(avgS),
        pillar_t: Math.round(avgT),
        pillar_h: Math.round(avgH),
        pillar_c: Math.round(avgC),
        pillar_u: Math.round(avgU)
      };

      setAvgPillars(calculatedAvgPillars);
      setStats({
        total_actions: actionsData.length,
        passed_actions: passedActions,
        failed_actions: failedActions,
        total_rewards: totalRewards,
        avg_light_score: Math.round(avgLightScore),
        avg_pillars: calculatedAvgPillars
      });
    } catch (error) {
      console.error("Error fetching PPLP stats:", error);
    }
  }, [targetUserId]);

  const triggerScore = useCallback(async (actionId: string) => {
    try {
      const response = await supabase.functions.invoke("pplp-score-action", {
        body: { action_id: actionId }
      });

      if (response.error) throw response.error;
      
      // Refresh data
      await Promise.all([fetchScores(), fetchStats()]);
      return response.data;
    } catch (error) {
      console.error("Error triggering score:", error);
      return null;
    }
  }, [fetchScores, fetchStats]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchScores(), fetchStats()]);
      setIsLoading(false);
    };

    if (targetUserId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [targetUserId, fetchScores, fetchStats]);

  return {
    scores,
    stats,
    avgPillars,
    isLoading,
    fetchScores,
    fetchStats,
    triggerScore
  };
}
