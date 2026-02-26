import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DailyLoginData {
  alreadyLoggedIn: boolean;
  streakCount: number;
  coinsEarned: number;
  isStreakBonus: boolean;
  newBalance: number;
  isLoading: boolean;
  hasProcessed: boolean;
  loginHistory: {
    login_date: string;
    streak_count: number;
    coins_earned: number;
  }[];
}

export function useDailyLogin() {
  const { user } = useAuth();
  const [data, setData] = useState<DailyLoginData>({
    alreadyLoggedIn: false,
    streakCount: 0,
    coinsEarned: 0,
    isStreakBonus: false,
    newBalance: 0,
    isLoading: true,
    hasProcessed: false,
    loginHistory: [],
  });

  const processLogin = useCallback(async () => {
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Process daily login
      const { data: loginResult, error } = await supabase
        .rpc("process_daily_login", { _user_id: user.id });

      if (error) {
        console.error("Error processing daily login:", error);
        setData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const result = loginResult?.[0];

      // DAILY_LOGIN only earns Camly Coin, not eligible for FUN Money minting

      // Fetch login history for calendar display (last 30 days)
      const { data: historyData } = await supabase
        .from("daily_login_tracking")
        .select("login_date, streak_count, coins_earned")
        .eq("user_id", user.id)
        .gte("login_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("login_date", { ascending: false });

      setData({
        alreadyLoggedIn: result?.already_logged_in || false,
        streakCount: result?.streak_count || 0,
        coinsEarned: result?.coins_earned || 0,
        isStreakBonus: result?.is_streak_bonus || false,
        newBalance: result?.new_balance || 0,
        isLoading: false,
        hasProcessed: true,
        loginHistory: historyData || [],
      });
    } catch (error) {
      console.error("Error in daily login:", error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  const getStreakDaysUntilBonus = useCallback(() => {
    const currentDay = data.streakCount % 7;
    return currentDay === 0 ? 0 : 7 - currentDay;
  }, [data.streakCount]);

  useEffect(() => {
    if (user && !data.hasProcessed) {
      processLogin();
    }
  }, [user, processLogin, data.hasProcessed]);

  return {
    ...data,
    processLogin,
    getStreakDaysUntilBonus,
  };
}
