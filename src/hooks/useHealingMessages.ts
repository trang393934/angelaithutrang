import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HealingMessage {
  id: string;
  message_type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface UserEnergyStatus {
  approval_status: "pending" | "approved" | "rejected" | "trial";
  current_energy_level: string;
  trial_days_remaining: number | null;
  positive_interactions_count: number;
  negative_interactions_count: number;
}

export function useHealingMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<HealingMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("healing_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const healingMessages: HealingMessage[] = (data || []).map(m => ({
        id: m.id,
        message_type: m.message_type,
        title: m.title,
        content: m.content,
        is_read: m.is_read,
        created_at: m.created_at,
      }));

      setMessages(healingMessages);
      setUnreadCount(healingMessages.filter(m => !m.is_read).length);
    } catch (error) {
      console.error("Error fetching healing messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("healing_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("user_id", user.id);

      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, is_read: true } : m))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from("healing_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    if (user) {
      const channel = supabase
        .channel(`healing_messages_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "healing_messages",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newMessage = payload.new as any;
            setMessages(prev => [{
              id: newMessage.id,
              message_type: newMessage.message_type,
              title: newMessage.title,
              content: newMessage.content,
              is_read: newMessage.is_read,
              created_at: newMessage.created_at,
            }, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    messages,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshMessages: fetchMessages,
  };
}

export function useUserEnergyStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<UserEnergyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionMessage, setSuspensionMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-user-energy", {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (!data.allowed) {
        setIsSuspended(true);
        setSuspensionMessage(data.message);
      } else {
        setIsSuspended(false);
        setSuspensionMessage(null);
        setStatus({
          approval_status: data.approval_status,
          current_energy_level: data.energy_level || "neutral",
          trial_days_remaining: data.trial_days_remaining,
          positive_interactions_count: 0,
          negative_interactions_count: 0,
        });
      }
    } catch (error) {
      console.error("Error checking user energy status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = async (activityType: string, content?: string) => {
    if (!user) return;

    try {
      await supabase.functions.invoke("check-user-energy", {
        body: { userId: user.id, activityType, content },
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  return {
    status,
    isLoading,
    isSuspended,
    suspensionMessage,
    checkStatus,
    logActivity,
  };
}
