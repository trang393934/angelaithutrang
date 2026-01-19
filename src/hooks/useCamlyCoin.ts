import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CamlyCoinData {
  balance: number;
  lifetimeEarned: number;
  isLoading: boolean;
  dailyStatus: {
    questionsRewarded: number;
    questionsRemaining: number;
    journalsRewarded: number;
    journalsRemaining: number;
    canWriteJournal: boolean;
  } | null;
  recentTransactions: {
    id: string;
    amount: number;
    transaction_type: string;
    description: string | null;
    purity_score: number | null;
    created_at: string;
  }[];
}

export function useCamlyCoin() {
  const { user } = useAuth();
  const [data, setData] = useState<CamlyCoinData>({
    balance: 0,
    lifetimeEarned: 0,
    isLoading: true,
    dailyStatus: null,
    recentTransactions: [],
  });

  const fetchData = useCallback(async () => {
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch balance
      const { data: balanceData } = await supabase
        .from("camly_coin_balances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch daily status
      const { data: dailyStatusData } = await supabase
        .rpc("get_daily_reward_status", { _user_id: user.id });

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from("camly_coin_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const status = dailyStatusData?.[0];

      setData({
        balance: balanceData?.balance || 0,
        lifetimeEarned: balanceData?.lifetime_earned || 0,
        isLoading: false,
        dailyStatus: status ? {
          questionsRewarded: status.questions_rewarded,
          questionsRemaining: status.questions_remaining,
          journalsRewarded: status.journals_rewarded,
          journalsRemaining: status.journals_remaining,
          canWriteJournal: status.can_write_journal,
        } : null,
        recentTransactions: transactionsData || [],
      });
    } catch (error) {
      console.error("Error fetching Camly coin data:", error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  const refreshBalance = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to realtime balance updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`camly_coins_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "camly_coin_balances",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  return {
    ...data,
    refreshBalance,
  };
}
