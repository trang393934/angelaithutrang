import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  image_urls: string[];
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
  
  // Track pending actions to skip realtime updates for posts being interacted with
  const pendingActionsRef = useRef<Set<string>>(new Set());
  // Track whether initial fetch has completed to avoid showing loading spinner on realtime refetches
  const initialFetchDoneRef = useRef(false);

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

  const fetchPosts = useCallback(async (showLoading = true) => {
    // Only show loading spinner on initial fetch, not on realtime-triggered refetches
    if (showLoading && !initialFetchDoneRef.current) setIsLoading(true);
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
           // Normalize nullable counters/arrays to keep UI + optimistic updates accurate
           likes_count: post.likes_count ?? 0,
           comments_count: post.comments_count ?? 0,
           shares_count: post.shares_count ?? 0,
           image_urls: post.image_urls ?? [],
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
      initialFetchDoneRef.current = true;
    }
  }, [user, sortBy]);

  const createPost = async (content: string, imageUrls?: string[]) => {
    if (!user) {
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "create_post",
          content,
          imageUrls,
          // Keep backward compatibility
          imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
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
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    // Find current post state for optimistic update
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) {
      return { success: false, message: "Không tìm thấy bài viết" };
    }

    const wasLiked = currentPost.is_liked_by_me;
    const previousLikesCount = currentPost.likes_count ?? 0;

    // OPTIMISTIC UPDATE - Update UI immediately for instant feedback
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              likes_count: wasLiked
                ? Math.max(0, (p.likes_count ?? 0) - 1)
                : (p.likes_count ?? 0) + 1,
              is_liked_by_me: !wasLiked,
            }
          : p
      )
    );

    // Mark as pending to skip realtime updates
    pendingActionsRef.current.add(postId);

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "toggle_like",
          postId,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Sync with server response (handles edge cases like rewards)
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
      // ROLLBACK on error - revert to previous state
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                likes_count: previousLikesCount,
                is_liked_by_me: wasLiked,
              }
            : p
        )
      );
      console.error("Error toggling like:", error);
      return { success: false, message: error.message || "Lỗi khi thích bài viết" };
    } finally {
      // Remove from pending after API completes
      pendingActionsRef.current.delete(postId);
    }
  };

  const sharePost = async (postId: string) => {
    if (!user) {
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "share_post",
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
                  shares_count: (p.shares_count ?? 0) + 1,
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
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "add_comment",
          postId,
          content,
        },
      });

      if (error) throw error;

      if (data.success) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, comments_count: (p.comments_count ?? 0) + 1 }
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

  const editPost = async (postId: string, content: string, imageUrls?: string[]) => {
    if (!user) {
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "edit_post",
          postId,
          content,
          imageUrls,
          // Keep backward compatibility
          imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        await fetchPosts();
        toast.success(data.message);
      }

      return data;
    } catch (error: any) {
      console.error("Error editing post:", error);
      toast.error(error.message || "Lỗi khi chỉnh sửa bài viết");
      return { success: false, message: error.message || "Lỗi khi chỉnh sửa bài viết" };
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) {
      return { success: false, message: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("process-community-post", {
        body: {
          action: "delete_post",
          postId,
        },
      });

      if (error) throw error;

      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success(data.message);
      }

      return data;
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(error.message || "Lỗi khi xóa bài viết");
      return { success: false, message: error.message || "Lỗi khi xóa bài viết" };
    }
  };

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchDailyLimits();
    }
  }, [fetchPosts, fetchDailyLimits, user]);

  // Subscribe to realtime updates - optimized to avoid full refetch on UPDATE
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
        (payload) => {
          // Handle DELETE - remove from local state
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setPosts(current => current.filter(p => p.id !== deletedId));
            }
            return;
          }

          // Handle INSERT - refetch to get complete data with profiles
          if (payload.eventType === "INSERT") {
            fetchPosts(false);
            return;
          }

          // Handle UPDATE - merge data without refetch to preserve scroll position
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as any;
            const postId = updated?.id;
            
            if (!postId) return;
            
            // Skip if this post has a pending action (optimistic update already applied)
            if (pendingActionsRef.current.has(postId)) {
              return;
            }
            
            // Merge updated fields into existing post
            setPosts(current =>
              current.map(p =>
                p.id === postId
                  ? {
                      ...p,
                      likes_count: updated.likes_count ?? p.likes_count,
                      comments_count: updated.comments_count ?? p.comments_count,
                      shares_count: updated.shares_count ?? p.shares_count,
                      is_rewarded: updated.is_rewarded ?? p.is_rewarded,
                      reward_amount: updated.reward_amount ?? p.reward_amount,
                      content: updated.content ?? p.content,
                      image_url: updated.image_url ?? p.image_url,
                      image_urls: updated.image_urls ?? p.image_urls,
                    }
                  : p
              )
            );
          }
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
    editPost,
    deletePost,
    refreshPosts: fetchPosts,
  };
}
