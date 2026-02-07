import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  actor_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined
  actor_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const toastedIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      if (data) {
        // Fetch actor profiles for notifications with actor_id
        const actorIds = [...new Set(data.filter(n => n.actor_id).map(n => n.actor_id!))];
        let actorProfiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
        
        if (actorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", actorIds);
          
          if (profiles) {
            actorProfiles = Object.fromEntries(
              profiles.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
            );
          }
        }

        const enriched: Notification[] = data.map(n => ({
          ...n,
          metadata: n.metadata as Record<string, unknown> | null,
          actor_profile: n.actor_id ? actorProfiles[n.actor_id] || null : null,
        }));

        setNotifications(enriched);
        setUnreadCount(enriched.filter(n => !n.is_read).length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotif = payload.new as Notification;
          
          // Fetch actor profile
          let actorProfile = null;
          if (newNotif.actor_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", newNotif.actor_id)
              .maybeSingle();
            actorProfile = profile;
          }

          const enriched: Notification = {
            ...newNotif,
            metadata: newNotif.metadata as Record<string, unknown> | null,
            actor_profile: actorProfile,
          };

          setNotifications(prev => [enriched, ...prev].slice(0, 30));
          setUnreadCount(prev => prev + 1);

          // Toast notification (only once per notification)
          if (!toastedIdsRef.current.has(newNotif.id)) {
            toastedIdsRef.current.add(newNotif.id);
            toast(newNotif.title, {
              description: newNotif.content.substring(0, 80),
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
