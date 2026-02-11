import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUnmintedCount(userId?: string) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Count scored+pass actions that have no mint request
      const { data, error } = await supabase
        .from("pplp_actions")
        .select("id, pplp_scores!inner(decision), pplp_mint_requests(id)")
        .eq("actor_id", userId)
        .eq("status", "scored")
        .eq("pplp_scores.decision", "pass");

      if (error) throw error;

      const unminted = (data || []).filter((a: any) => {
        const mr = a.pplp_mint_requests;
        if (!mr) return true;
        if (Array.isArray(mr)) return mr.length === 0;
        return false;
      });

      setCount(unminted.length);
    } catch (err) {
      console.error("Error fetching unminted count:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { unmintedCount: count, isLoading, refetch: fetch };
}
