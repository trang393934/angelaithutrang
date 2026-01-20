import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOnlineStatus() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { isOnline: boolean; lastSeen: string }>>(new Map());

  // Update own online status
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!user) return;

    await supabase
      .from("user_online_status")
      .upsert({
        user_id: user.id,
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  }, [user]);

  // Fetch online status for specific users
  const fetchOnlineStatus = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("user_online_status")
      .select("user_id, is_online, last_seen_at")
      .in("user_id", userIds);

    if (data) {
      const newMap = new Map(onlineUsers);
      data.forEach((status) => {
        newMap.set(status.user_id, {
          isOnline: status.is_online,
          lastSeen: status.last_seen_at,
        });
      });
      setOnlineUsers(newMap);
    }
  }, [onlineUsers]);

  // Set online when component mounts, offline when unmounts
  useEffect(() => {
    if (!user) return;

    updateOnlineStatus(true);

    const handleVisibilityChange = () => {
      updateOnlineStatus(!document.hidden);
    };

    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Heartbeat to keep online status
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        updateOnlineStatus(true);
      }
    }, 30000); // Every 30 seconds

    return () => {
      updateOnlineStatus(false);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(heartbeat);
    };
  }, [user, updateOnlineStatus]);

  // Subscribe to online status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("online_status_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_online_status",
        },
        (payload) => {
          const status = payload.new as { user_id: string; is_online: boolean; last_seen_at: string };
          if (status && status.user_id !== user.id) {
            setOnlineUsers((prev) => {
              const newMap = new Map(prev);
              newMap.set(status.user_id, {
                isOnline: status.is_online,
                lastSeen: status.last_seen_at,
              });
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isUserOnline = useCallback((userId: string) => {
    const status = onlineUsers.get(userId);
    if (!status) return false;
    
    // Consider offline if last seen more than 2 minutes ago
    const lastSeenTime = new Date(status.lastSeen).getTime();
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    
    return status.isOnline && lastSeenTime > twoMinutesAgo;
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId: string) => {
    return onlineUsers.get(userId)?.lastSeen || null;
  }, [onlineUsers]);

  return {
    isUserOnline,
    getLastSeen,
    fetchOnlineStatus,
    onlineUsers,
  };
}
