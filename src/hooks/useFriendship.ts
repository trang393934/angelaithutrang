import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile extends Friendship {
  friend_id: string;
  friend_display_name: string;
  friend_avatar_url: string | null;
}

export function useFriendship(targetUserId?: string) {
  const { user } = useAuth();
  const [friendshipStatus, setFriendshipStatus] = useState<Friendship | null>(null);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check friendship status with a specific user
  const checkFriendshipStatus = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
      .maybeSingle();

    setFriendshipStatus(data as Friendship | null);
  }, [user, targetUserId]);

  // Send friend request
  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) {
      toast.error("Con yêu dấu, hãy đăng ký tài khoản để Ta đồng hành cùng con nhé!");
      return { success: false };
    }

    if (user.id === addresseeId) {
      toast.error("Không thể kết bạn với chính mình");
      return { success: false };
    }

    try {
      setIsLoading(true);

      // Check if request already exists
      const { data: existing } = await supabase
        .from("friendships")
        .select("*")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        if ((existing as Friendship).status === "accepted") {
          toast.info("Bạn đã là bạn bè rồi");
        } else if ((existing as Friendship).status === "pending") {
          toast.info("Đã có lời mời kết bạn đang chờ");
        }
        return { success: false };
      }

      const { error } = await supabase.from("friendships").insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Đã gửi lời mời kết bạn!");
      await checkFriendshipStatus();
      return { success: true };
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error("Lỗi khi gửi lời mời kết bạn");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user) return { success: false };

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", friendshipId)
        .eq("addressee_id", user.id);

      if (error) throw error;

      toast.success("Đã chấp nhận lời mời kết bạn!");
      await checkFriendshipStatus();
      await fetchFriends();
      await fetchPendingRequests();
      return { success: true };
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      toast.error("Lỗi khi chấp nhận lời mời");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Decline friend request
  const declineFriendRequest = async (friendshipId: string) => {
    if (!user) return { success: false };

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("friendships")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", friendshipId)
        .eq("addressee_id", user.id);

      if (error) throw error;

      toast.success("Đã từ chối lời mời kết bạn");
      await fetchPendingRequests();
      return { success: true };
    } catch (error: any) {
      console.error("Error declining friend request:", error);
      toast.error("Lỗi khi từ chối lời mời");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel sent friend request
  const cancelFriendRequest = async (friendshipId: string) => {
    if (!user) return { success: false };

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId)
        .eq("requester_id", user.id);

      if (error) throw error;

      toast.success("Đã hủy lời mời kết bạn");
      await checkFriendshipStatus();
      return { success: true };
    } catch (error: any) {
      console.error("Error canceling friend request:", error);
      toast.error("Lỗi khi hủy lời mời");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Unfriend
  const unfriend = async (friendshipId: string) => {
    if (!user) return { success: false };

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast.success("Đã hủy kết bạn");
      await checkFriendshipStatus();
      await fetchFriends();
      return { success: true };
    } catch (error: any) {
      console.error("Error unfriending:", error);
      toast.error("Lỗi khi hủy kết bạn");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all friends
  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!friendships || friendships.length === 0) {
      setFriends([]);
      return;
    }

    // Get friend user IDs
    const friendIds = friendships.map((f: Friendship) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", friendIds);

    const friendsWithProfiles = friendships.map((f: Friendship) => {
      const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      const profile = profiles?.find((p) => p.user_id === friendId);
      return {
        ...f,
        friend_id: friendId,
        friend_display_name: profile?.display_name || "Người dùng",
        friend_avatar_url: profile?.avatar_url || null,
      };
    });

    setFriends(friendsWithProfiles);
  }, [user]);

  // Fetch pending friend requests (received)
  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    const { data: requests } = await supabase
      .from("friendships")
      .select("*")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    if (!requests || requests.length === 0) {
      setPendingRequests([]);
      return;
    }

    const requesterIds = requests.map((r: Friendship) => r.requester_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", requesterIds);

    const requestsWithProfiles = requests.map((r: Friendship) => {
      const profile = profiles?.find((p) => p.user_id === r.requester_id);
      return {
        ...r,
        friend_id: r.requester_id,
        friend_display_name: profile?.display_name || "Người dùng",
        friend_avatar_url: profile?.avatar_url || null,
      };
    });

    setPendingRequests(requestsWithProfiles);
  }, [user]);

  useEffect(() => {
    checkFriendshipStatus();
  }, [checkFriendshipStatus]);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, [fetchFriends, fetchPendingRequests]);

  return {
    friendshipStatus,
    friends,
    pendingRequests,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    unfriend,
    refreshFriends: fetchFriends,
    refreshPendingRequests: fetchPendingRequests,
  };
}
