import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserCamlyCoinData {
  balance: number;
  lifetimeEarned: number;
  isLoading: boolean;
}

export function useUserCamlyCoin(userId?: string) {
  const [data, setData] = useState<UserCamlyCoinData>({
    balance: 0,
    lifetimeEarned: 0,
    isLoading: true,
  });

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData({ balance: 0, lifetimeEarned: 0, isLoading: false });
      return;
    }

    try {
      const { data: balanceData } = await supabase
        .from("camly_coin_balances")
        .select("balance, lifetime_earned")
        .eq("user_id", userId)
        .maybeSingle();

      setData({
        balance: balanceData?.balance || 0,
        lifetimeEarned: balanceData?.lifetime_earned || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching user Camly coin:", error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription for this specific userId
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`camly_coins_public_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "camly_coin_balances",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  return data;
}
