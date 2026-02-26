import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProfilePublicSettings } from "@/hooks/useProfilePublicSettings";

export interface PublicProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_photo_url: string | null;
  handle: string | null;
  created_at: string;
  social_links: Record<string, string> | null;
}

export interface PublicProfileStats {
  friends: number;
  posts: number;
  balance: number;
  lifetimeEarned: number;
  lixiReward: number;
  likes: number;
  poplScore: number;
  badgeLevel: string;
  funMoneyTotal: number;
}

export interface PublicFriend {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
}

export interface PublicPost {
  id: string;
  content: string;
  image_url: string | null;
  image_urls: string[] | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  created_at: string;
}

export interface PublicSettings {
  public_profile_enabled: boolean;
  allow_public_message: boolean;
  allow_public_transfer: boolean;
  allow_public_follow: boolean;
  show_friends_count: boolean;
  show_stats: boolean;
  show_modules: boolean;
  show_donation_button: boolean;
  enabled_modules: string[];
  featured_items: Record<string, unknown> | null;
  tagline: string | null;
  badge_type: string | null;
}

const DEFAULT_SETTINGS: PublicSettings = {
  public_profile_enabled: true,
  allow_public_message: true,
  allow_public_transfer: true,
  allow_public_follow: true,
  show_friends_count: true,
  show_stats: true,
  show_modules: true,
  show_donation_button: false,
  enabled_modules: ["fun_play", "fun_academy", "fun_market", "fun_charity", "fun_farm", "fun_life", "fun_invest"],
  featured_items: null,
  tagline: null,
  badge_type: null,
};

export function usePublicProfile(handle?: string) {
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [stats, setStats] = useState<PublicProfileStats>({
    friends: 0, posts: 0, balance: 0, lifetimeEarned: 0, lixiReward: 0,
    likes: 0, poplScore: 0, badgeLevel: "newcomer", funMoneyTotal: 0,
  });
  const [recentPosts, setRecentPosts] = useState<PublicPost[]>([]);
  const [friends, setFriends] = useState<PublicFriend[]>([]);
  const [publicSettings, setPublicSettings] = useState<PublicSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!handle) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchPublicProfile = async () => {
      setIsLoading(true);
      setNotFound(false);

      try {
        // 1. Resolve handle to profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, bio, cover_photo_url, handle, created_at, social_links")
          .ilike("handle", handle)
          .maybeSingle();

        if (profileError || !profileData) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const userId = profileData.user_id;

        // 2. Fetch public settings
        const { data: settingsData } = await supabase
          .from("profile_public_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        const settings: PublicSettings = settingsData
          ? {
              ...settingsData,
              enabled_modules: Array.isArray(settingsData.enabled_modules)
                ? (settingsData.enabled_modules as string[])
                : DEFAULT_SETTINGS.enabled_modules,
              featured_items: settingsData.featured_items as Record<string, unknown> | null,
            }
          : DEFAULT_SETTINGS;

        // Respect public_profile_enabled
        if (!settings.public_profile_enabled) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setPublicSettings(settings);
        setProfile({
          ...profileData,
          social_links: (profileData.social_links && typeof profileData.social_links === "object" && !Array.isArray(profileData.social_links))
            ? profileData.social_links as Record<string, string>
            : null,
        });

        // 3. Fetch all stats in parallel
        const [
          postsResult, friendsCountResult, balanceResult, likesResult,
          friendsListResult, recentPostsResult, poplResult, funMoneyResult, lixiTxsResult,
        ] = await Promise.all([
          supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("friendships").select("*", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
          supabase.from("camly_coin_balances").select("balance, lifetime_earned").eq("user_id", userId).maybeSingle(),
          supabase.from("community_posts").select("likes_count").eq("user_id", userId),
          supabase.from("friendships").select("requester_id, addressee_id").eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).limit(6),
          supabase.from("community_posts").select("id, content, image_url, image_urls, likes_count, comments_count, shares_count, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(3),
          supabase.from("light_points").select("points").eq("user_id", userId),
          supabase.from("pplp_actions").select("status, pplp_scores(final_reward, decision)").eq("actor_id", userId),
          supabase.from("camly_coin_transactions").select("amount, metadata").eq("user_id", userId).eq("transaction_type", "admin_adjustment"),
        ]);

        const totalLikes = likesResult.data?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
        const totalPoints = poplResult.data?.reduce((sum, lp) => sum + (lp.points || 0), 0) || 0;
        const poplScore = Math.min(100, Math.round(totalPoints / 10));
        const badgeLevel = poplScore >= 80 ? "angel" : poplScore >= 60 ? "lightworker" : poplScore >= 40 ? "guardian" : poplScore >= 20 ? "contributor" : "newcomer";

        let funMoneyTotal = 0;
        (funMoneyResult.data || []).forEach((action: any) => {
          const score = action.pplp_scores as { final_reward: number; decision: string } | null;
          if (score) funMoneyTotal += score.final_reward || 0;
        });

        const lixiTotal = (lixiTxsResult.data || [])
          .filter((tx: any) => tx.metadata && typeof tx.metadata === "object" && (tx.metadata as any).source === "fun_to_camly_reward")
          .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

        const rawLifetimeEarned = balanceResult.data?.lifetime_earned || 0;

        setStats({
          friends: friendsCountResult.count || 0,
          posts: postsResult.count || 0,
          balance: balanceResult.data?.balance || 0,
          lifetimeEarned: rawLifetimeEarned - lixiTotal,
          lixiReward: lixiTotal,
          likes: totalLikes,
          poplScore,
          badgeLevel,
          funMoneyTotal,
        });

        setRecentPosts(recentPostsResult.data || []);

        // Fetch friend profiles
        if (friendsListResult.data && friendsListResult.data.length > 0) {
          const friendIds = friendsListResult.data.map((f) =>
            f.requester_id === userId ? f.addressee_id : f.requester_id
          );
          const { data: friendProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, handle")
            .in("user_id", friendIds);
          setFriends(friendProfiles || []);
        }
      } catch (error) {
        console.error("Error fetching public profile:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicProfile();
  }, [handle]);

  return { profile, stats, recentPosts, friends, publicSettings, isLoading, notFound };
}
