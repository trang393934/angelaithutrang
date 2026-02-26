import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Circle {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  circle_type: string;
  created_by: string;
  max_members: number | null;
  is_official: boolean | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: "admin" | "moderator" | "member";
  joined_at: string;
}

export function useCommunityCircles() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [myCircles, setMyCircles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCircles = async () => {
    try {
      // Fetch all visible circles
      const { data: circlesData, error: circlesError } = await supabase
        .from("community_circles")
        .select("*")
        .order("is_official", { ascending: false })
        .order("created_at", { ascending: false });

      if (circlesError) throw circlesError;

      // Get member counts for each circle
      const circlesWithCounts = await Promise.all(
        (circlesData || []).map(async (circle) => {
          const { count } = await supabase
            .from("circle_members")
            .select("*", { count: "exact", head: true })
            .eq("circle_id", circle.id);
          
          return {
            ...circle,
            member_count: count || 0
          };
        })
      );

      setCircles(circlesWithCounts);

      // Fetch user's circles if logged in
      if (user) {
        const { data: memberData } = await supabase
          .from("circle_members")
          .select("circle_id")
          .eq("user_id", user.id);

        setMyCircles((memberData || []).map(m => m.circle_id));
      }
    } catch (error) {
      console.error("Error fetching circles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinCircle = async (circleId: string) => {
    if (!user) {
      toast({
        title: "Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!",
        description: "Đăng ký tài khoản để tham gia Circle cùng cộng đồng Ánh Sáng.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("circle_members")
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: "member"
        });

      if (error) throw error;

      setMyCircles(prev => [...prev, circleId]);
      
      toast({
        title: "Đã tham gia Circle! 🎉",
        description: "Chào mừng bạn đến với cộng đồng"
      });

      // Refresh to update counts
      fetchCircles();
      return true;
    } catch (error: any) {
      console.error("Error joining circle:", error);
      toast({
        title: "Không thể tham gia",
        description: error.message || "Vui lòng thử lại sau",
        variant: "destructive"
      });
      return false;
    }
  };

  const leaveCircle = async (circleId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("circle_members")
        .delete()
        .eq("circle_id", circleId)
        .eq("user_id", user.id);

      if (error) throw error;

      setMyCircles(prev => prev.filter(id => id !== circleId));
      
      toast({
        title: "Đã rời Circle",
        description: "Bạn có thể tham gia lại bất cứ lúc nào"
      });

      fetchCircles();
      return true;
    } catch (error: any) {
      console.error("Error leaving circle:", error);
      toast({
        title: "Không thể rời Circle",
        description: error.message || "Vui lòng thử lại sau",
        variant: "destructive"
      });
      return false;
    }
  };

  const createCircle = async (data: {
    name: string;
    description: string;
    icon?: string;
    color?: string;
    circle_type?: "public" | "private" | "invite_only";
  }) => {
    if (!user) return null;

    try {
      const { data: newCircle, error } = await supabase
        .from("community_circles")
        .insert({
          ...data,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as admin
      await supabase.from("circle_members").insert({
        circle_id: newCircle.id,
        user_id: user.id,
        role: "admin"
      });

      toast({
        title: "Circle đã được tạo! ✨",
        description: "Mời bạn bè tham gia cùng bạn"
      });

      fetchCircles();
      return newCircle;
    } catch (error: any) {
      console.error("Error creating circle:", error);
      toast({
        title: "Không thể tạo Circle",
        description: error.message || "Vui lòng thử lại sau",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [user]);

  return {
    circles,
    myCircles,
    isLoading,
    joinCircle,
    leaveCircle,
    createCircle,
    refreshCircles: fetchCircles,
    isInCircle: (circleId: string) => myCircles.includes(circleId)
  };
}
