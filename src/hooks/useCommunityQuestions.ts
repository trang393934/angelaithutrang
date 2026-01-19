import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CommunityQuestion {
  id: string;
  user_id: string;
  question_text: string;
  purity_score: number | null;
  likes_count: number;
  created_at: string;
  user_display_name?: string;
  user_avatar_url?: string;
  is_liked_by_me: boolean;
}

export function useCommunityQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("popular");

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch questions that are rewarded (quality questions only)
      const { data: questionsData, error } = await supabase
        .from("chat_questions")
        .select("id, user_id, question_text, purity_score, likes_count, created_at")
        .eq("is_rewarded", true)
        .eq("is_spam", false)
        .eq("is_greeting", false)
        .order(sortBy === "popular" ? "likes_count" : "created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!questionsData || questionsData.length === 0) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      // Get user profiles for display names
      const userIds = [...new Set(questionsData.map(q => q.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get likes by current user
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from("question_likes")
          .select("question_id")
          .eq("user_id", user.id)
          .in("question_id", questionsData.map(q => q.id));
        
        userLikes = likesData?.map(l => l.question_id) || [];
      }

      const enrichedQuestions: CommunityQuestion[] = questionsData.map(q => ({
        ...q,
        likes_count: q.likes_count || 0,
        user_display_name: profileMap.get(q.user_id)?.display_name || "Ẩn danh",
        user_avatar_url: profileMap.get(q.user_id)?.avatar_url || null,
        is_liked_by_me: userLikes.includes(q.id),
      }));

      setQuestions(enrichedQuestions);
    } catch (error) {
      console.error("Error fetching community questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, sortBy]);

  const toggleLike = useCallback(async (questionId: string) => {
    if (!user) return { success: false, message: "Vui lòng đăng nhập để thích câu hỏi" };

    try {
      const { data, error } = await supabase.functions.invoke("process-engagement-reward", {
        body: { questionId, likerId: user.id },
      });

      if (error) throw error;

      // Update local state
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            is_liked_by_me: data.liked,
            likes_count: data.liked 
              ? q.likes_count + 1 
              : Math.max(0, q.likes_count - 1),
          };
        }
        return q;
      }));

      return { success: true, ...data };
    } catch (error) {
      console.error("Toggle like error:", error);
      return { success: false, message: "Có lỗi xảy ra" };
    }
  }, [user]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("community_questions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_questions",
        },
        (payload) => {
          setQuestions(prev => prev.map(q => 
            q.id === payload.new.id 
              ? { ...q, likes_count: payload.new.likes_count } 
              : q
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    questions,
    isLoading,
    sortBy,
    setSortBy,
    toggleLike,
    refreshQuestions: fetchQuestions,
  };
}
