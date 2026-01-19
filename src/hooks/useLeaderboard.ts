import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  balance: number;
  lifetime_earned: number;
  rank: number;
}

export interface TopQuestion {
  id: string;
  question_text: string;
  likes_count: number;
  user_id: string;
  user_display_name: string | null;
  user_avatar_url: string | null;
  created_at: string;
}

export interface LeaderboardStats {
  total_users: number;
  active_users: number;
  total_coins_distributed: number;
}

export function useLeaderboard() {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    total_users: 0,
    active_users: 0,
    total_coins_distributed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all users with their coin balances
      const { data: balances, error: balancesError } = await supabase
        .from("camly_coin_balances")
        .select("user_id, balance, lifetime_earned")
        .order("lifetime_earned", { ascending: false });

      if (balancesError) throw balancesError;

      // Get all user IDs from balances
      const userIdsWithBalance = balances?.map(b => b.user_id) || [];

      // Fetch all profiles (including users without balance)
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url");

      if (profilesError) throw profilesError;

      // Create a map of balances
      const balanceMap = new Map(
        balances?.map(b => [b.user_id, { balance: b.balance, lifetime_earned: b.lifetime_earned }]) || []
      );

      // Combine all users (with and without balance)
      const combinedUsers: LeaderboardUser[] = (allProfiles || []).map((profile, index) => {
        const balanceInfo = balanceMap.get(profile.user_id);
        return {
          user_id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          balance: balanceInfo?.balance || 0,
          lifetime_earned: balanceInfo?.lifetime_earned || 0,
          rank: 0, // Will be set after sorting
        };
      });

      // Sort by lifetime_earned
      combinedUsers.sort((a, b) => b.lifetime_earned - a.lifetime_earned);

      // Assign ranks
      combinedUsers.forEach((user, index) => {
        user.rank = index + 1;
      });

      setAllUsers(combinedUsers);
      setTopUsers(combinedUsers.slice(0, 10));

      // Calculate stats
      const totalCoins = combinedUsers.reduce((sum, u) => sum + u.lifetime_earned, 0);
      const activeUsers = combinedUsers.filter(u => u.lifetime_earned > 0).length;

      setStats({
        total_users: combinedUsers.length,
        active_users: activeUsers,
        total_coins_distributed: totalCoins,
      });

      // Fetch top questions by likes
      const { data: questions, error: questionsError } = await supabase
        .from("chat_questions")
        .select("id, question_text, likes_count, user_id, created_at")
        .eq("is_rewarded", true)
        .eq("is_spam", false)
        .gt("likes_count", 0)
        .order("likes_count", { ascending: false })
        .limit(10);

      if (questionsError) throw questionsError;

      if (questions && questions.length > 0) {
        // Get profiles for question authors
        const questionUserIds = [...new Set(questions.map(q => q.user_id))];
        const { data: questionProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", questionUserIds);

        const profileMap = new Map(
          questionProfiles?.map(p => [p.user_id, p]) || []
        );

        const enrichedQuestions: TopQuestion[] = questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          likes_count: q.likes_count || 0,
          user_id: q.user_id,
          user_display_name: profileMap.get(q.user_id)?.display_name || "Ẩn danh",
          user_avatar_url: profileMap.get(q.user_id)?.avatar_url || null,
          created_at: q.created_at,
        }));

        setTopQuestions(enrichedQuestions);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "camly_coin_balances",
        },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_questions",
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return {
    topUsers,
    allUsers,
    topQuestions,
    stats,
    isLoading,
    refreshLeaderboard: fetchLeaderboard,
  };
}
