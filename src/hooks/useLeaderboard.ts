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
      // Fetch all data in parallel — including suspended users
      const [balancesResult, profilesResult, suspensionsResult] = await Promise.all([
        supabase
          .from("camly_coin_balances")
          .select("user_id, balance, lifetime_earned")
          .order("lifetime_earned", { ascending: false }),
        supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url"),
        supabase
          .from("user_suspensions")
          .select("user_id")
          .is("lifted_at", null), // Only active bans
      ]);

      const { data: balances, error: balancesError } = balancesResult;
      if (balancesError) throw balancesError;

      const { data: allProfiles, error: profilesError } = profilesResult;
      if (profilesError) throw profilesError;

      // Build a Set of banned user IDs for fast O(1) lookup
      const suspendedUserIds = new Set(
        suspensionsResult.data?.map(s => s.user_id) || []
      );

      // Create a map of profiles
      const profileMap = new Map(
        allProfiles?.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]) || []
      );

      // Combine all users — EXCLUDE banned users
      const combinedUsers: LeaderboardUser[] = [];
      
      // First add all users from balances — skip banned
      balances?.forEach(balance => {
        if (suspendedUserIds.has(balance.user_id)) return; // Skip banned users
        const profile = profileMap.get(balance.user_id);
        combinedUsers.push({
          user_id: balance.user_id,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          balance: balance.balance || 0,
          lifetime_earned: balance.lifetime_earned || 0,
          rank: 0,
        });
      });

      // Add profiles that don't have balance records — skip banned
      allProfiles?.forEach(profile => {
        if (suspendedUserIds.has(profile.user_id)) return; // Skip banned users
        const hasBalance = balances?.some(b => b.user_id === profile.user_id);
        if (!hasBalance) {
          combinedUsers.push({
            user_id: profile.user_id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            balance: 0,
            lifetime_earned: 0,
            rank: 0,
          });
        }
      });

      // Sort by lifetime_earned
      combinedUsers.sort((a, b) => b.lifetime_earned - a.lifetime_earned);

      // Assign ranks
      combinedUsers.forEach((user, index) => {
        user.rank = index + 1;
      });

      setAllUsers(combinedUsers);
      setTopUsers(combinedUsers.slice(0, 10));

      // Calculate stats - use profiles count as the source of truth for total members
      const totalCoins = combinedUsers.reduce((sum, u) => sum + u.lifetime_earned, 0);
      const activeUsers = combinedUsers.filter(u => u.lifetime_earned > 0).length;

      // Count non-suspended profiles only
      let profilesCount: number | null = null;
      if (suspendedUserIds.size > 0) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('user_id', 'in', `(${[...suspendedUserIds].join(',')})`);
        profilesCount = count;
      } else {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        profilesCount = count;
      }

      setStats({
        total_users: profilesCount || 0,
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
