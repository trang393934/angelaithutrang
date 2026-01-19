import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_rewarded: boolean;
  reward_amount: number;
  created_at: string;
  user_display_name?: string;
  user_avatar_url?: string;
  is_liked_by_me?: boolean;
  is_shared_by_me?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  content_length: number;
  is_rewarded: boolean;
  reward_amount: number;
  created_at: string;
  user_display_name?: string;
  user_avatar_url?: string;
}

interface DailyLimits {
  postsRewarded: number;
  postsRemaining: number;
  commentsRewarded: number;
  commentsRemaining: number;
  sharesRewarded: number;
  sharesRemaining: number;
}

export function useCommunityPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyLimits, setDailyLimits] = useState<DailyLimits | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const fetchDailyLimits = useCallback(async () => {
    if (!user) return;

    // Fetch daily tracking directly since the RPC doesn't have posts_rewarded/comments_rewarded yet
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("daily_reward_tracking")
      .select("posts_rewarded, comments_rewarded, shares_rewarded")
      .eq("user_id", user.id)
      .eq("reward_date", today)
      .maybeSingle();

    if (data) {
      setDailyLimits({
        postsRewarded: data.posts_rewarded || 0,
        postsRemaining: Math.max(0, 3 - (data.posts_rewarded || 0)),
        commentsRewarded: data.comments_rewarded || 0,
        commentsRemaining: Math.max(0, 5 - (data.comments_rewarded || 0)),
        sharesRewarded: data.shares_rewarded || 0,
        sharesRemaining: Math.max(0, 5 - (data.shares_rewarded || 0)),
      });
    } else {
      setDailyLimits({
        postsRewarded: 0,
        postsRemaining: 3,
        commentsRewarded: 0,
        commentsRemaining: 5,
        sharesRewarded: 0,
        sharesRemaining: 5,
      });
    }
  }, [user]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("community_posts")
        .select("*")
        .order(sortBy === "popular" ? "likes_count" : "created_at", { ascending: false })
        .limit(50);

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(p => p.user_id))];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      // Check if current user liked/shared posts
      let userLikes: string[] = [];
      let userShares: string[] = [];

      if (user) {
        const { data: likesData } = await supabase
          .from("community_post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postsData.map(p => p.id));

        const { data: sharesData } = await supabase
          .from("community_shares")
          .select("post_id")
          .eq("sharer_id", user.id)
          .in("post_id", postsData.map(p => p.id));

        userLikes = (likesData || []).map(l => l.post_id);
        userShares = (sharesData || []).map(s => s.post_id);
      }

      // Merge data
      const enrichedPosts = postsData.map(post => {
        const profile = profiles?.find(p => p.user_id === post.user_id);
        return {
          ...post,
          user_display_name: profile?.display_name || "Người dùng ẩn danh",
          user_avatar_url: profile?.avatar_url || null,
          is_liked_by_me: userLikes.includes(post.id),
          is_shared_by_me: userShares.includes(post.id),
        };
      });

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, sortBy]);

  const createPost = async (content: string, imageUrl?: string) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "create_post",
          userId: user.id,
          content,
          imageUrl,
        },
      });

      if (error) throw error;

      if (data.success) {
        await fetchPosts();
        await fetchDailyLimits();
      }

      return data;
    } catch (error: any) {
      console.error("Error creating post:", error);
      return { success: false, message: error.message || "Lỗi khi đăng bài" };
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "toggle_like",
          userId: user.id,
          postId,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? {
                  ...p,
                  likes_count: data.newLikesCount,
                  is_liked_by_me: data.liked,
                  is_rewarded: data.postRewarded || p.is_rewarded,
                }
              : p
          )
        );
      }

      return data;
    } catch (error: any) {
      console.error("Error toggling like:", error);
      return { success: false, message: error.message || "Lỗi khi thích bài viết" };
    }
  };

  const sharePost = async (postId: string) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "share_post",
          userId: user.id,
          postId,
        },
      });

      if (error) throw error;

      if (data.success) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? {
                  ...p,
                  shares_count: p.shares_count + 1,
                  is_shared_by_me: true,
                }
              : p
          )
        );
        await fetchDailyLimits();
      }

      return data;
    } catch (error: any) {
      console.error("Error sharing post:", error);
      return { success: false, message: error.message || "Lỗi khi chia sẻ" };
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) {
      return { success: false, message: "Vui lòng đăng nhập" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "add_comment",
          userId: user.id,
          postId,
          content,
        },
      });

      if (error) throw error;

      if (data.success) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, comments_count: p.comments_count + 1 }
              : p
          )
        );
        await fetchDailyLimits();
      }

      return data;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      return { success: false, message: error.message || "Lỗi khi bình luận" };
    }
  };

  const fetchComments = async (postId: string): Promise<CommunityComment[]> => {
    const { data: commentsData, error } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error || !commentsData) return [];

    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    return commentsData.map(comment => {
      const profile = profiles?.find(p => p.user_id === comment.user_id);
      return {
        ...comment,
        user_display_name: profile?.display_name || "Người dùng ẩn danh",
        user_avatar_url: profile?.avatar_url || null,
      };
    });
  };

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchDailyLimits();
    }
  }, [fetchPosts, fetchDailyLimits, user]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("community_posts_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_posts",
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    dailyLimits,
    sortBy,
    setSortBy,
    createPost,
    toggleLike,
    sharePost,
    addComment,
    fetchComments,
    refreshPosts: fetchPosts,
  };
}
