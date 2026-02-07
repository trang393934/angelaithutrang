import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FUNMoneyStats {
  totalMinted: number;
  totalSigned: number;
  totalPending: number;
  totalAmount: number;
  isLoading: boolean;
}

export function useFUNMoneyStats(userId?: string) {
  const [stats, setStats] = useState<FUNMoneyStats>({
    totalMinted: 0,
    totalSigned: 0,
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
        .from("pplp_mint_requests")
        .select("amount, status")
        .eq("actor_id", userId);

      if (error) throw error;

      let totalMinted = 0;
      let totalSigned = 0;
      let totalPending = 0;

      (data || []).forEach((row) => {
        const amount = row.amount || 0;
        switch (row.status) {
          case "minted":
            totalMinted += amount;
            break;
          case "signed":
            totalSigned += amount;
            break;
          default:
            totalPending += amount;
            break;
        }
      });

      setStats({
        totalMinted,
        totalSigned,
        totalPending,
        totalAmount: totalMinted + totalSigned + totalPending,
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
