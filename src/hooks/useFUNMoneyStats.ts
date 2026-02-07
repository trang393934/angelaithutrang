import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FUNMoneyStats {
  totalScored: number;   // FUN ready to claim (scored + pass)
  totalMinted: number;   // FUN already minted on-chain
  totalPending: number;  // FUN pending/processing
  totalAmount: number;
  isLoading: boolean;
}

export function useFUNMoneyStats(userId?: string) {
  const [stats, setStats] = useState<FUNMoneyStats>({
    totalScored: 0,
    totalMinted: 0,
    totalPending: 0,
    totalAmount: 0,
    isLoading: true,
  });

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pplp_actions")
        .select("status, pplp_scores(final_reward, decision)")
        .eq("actor_id", userId);

      if (error) throw error;

      let totalMinted = 0;
      let totalScored = 0;
      let totalPending = 0;

      (data || []).forEach((action) => {
        // pplp_scores is one-to-one, so it's an object (or null)
        const score = action.pplp_scores as { final_reward: number; decision: string } | null;
        if (!score) return;

        const reward = score.final_reward || 0;

        if (action.status === "minted") {
          totalMinted += reward;
        } else if (action.status === "scored" && score.decision === "pass") {
          totalScored += reward;
        } else {
          totalPending += reward;
        }
      });

      setStats({
        totalScored,
        totalMinted,
        totalPending,
        totalAmount: totalMinted + totalScored + totalPending,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching FUN Money stats:", error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return stats;
}
