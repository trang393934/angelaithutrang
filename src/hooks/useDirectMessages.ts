import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_display_name?: string;
  sender_avatar_url?: string | null;
}

export interface Conversation {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useDirectMessages(conversationUserId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async () => {
    if (!user || !conversationUserId) return;

    setIsLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(messagesData?.map((m) => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", senderIds);

      const enrichedMessages = (messagesData || []).map((msg) => {
        const profile = profiles?.find((p) => p.user_id === msg.sender_id);
        return {
          ...msg,
          sender_display_name: profile?.display_name || "Người dùng",
          sender_avatar_url: profile?.avatar_url || null,
        };
      });

      setMessages(enrichedMessages);

      // Mark messages as read
      if (messagesData && messagesData.length > 0) {
        const unreadIds = messagesData
          .filter((m) => m.receiver_id === user.id && !m.is_read)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from("direct_messages")
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in("id", unreadIds);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationUserId]);

  // Send a message
  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      return { success: false };
    }

    if (!content.trim()) {
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local messages
      setMessages((prev) => [...prev, { ...data, sender_display_name: "Bạn" }]);

      return { success: true, message: data };
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Lỗi khi gửi tin nhắn");
      return { success: false };
    }
  };

  // Fetch all conversations (list of people user has messaged with)
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Get all messages involving this user
      const { data: allMessages } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!allMessages || allMessages.length === 0) {
        setConversations([]);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, { messages: typeof allMessages; unread: number }>();

      allMessages.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, { messages: [], unread: 0 });
        }
        conversationMap.get(partnerId)!.messages.push(msg);
        if (msg.receiver_id === user.id && !msg.is_read) {
          conversationMap.get(partnerId)!.unread++;
        }
      });

      const partnerIds = Array.from(conversationMap.keys());

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", partnerIds);

      const conversationsList: Conversation[] = partnerIds.map((partnerId) => {
        const data = conversationMap.get(partnerId)!;
        const lastMsg = data.messages[0];
        const profile = profiles?.find((p) => p.user_id === partnerId);

        return {
          user_id: partnerId,
          display_name: profile?.display_name || "Người dùng",
          avatar_url: profile?.avatar_url || null,
          last_message: lastMsg.content,
          last_message_at: lastMsg.created_at,
          unread_count: data.unread,
        };
      });

      // Sort by last message time
      conversationsList.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(conversationsList);

      // Calculate total unread
      const totalUnread = conversationsList.reduce((sum, c) => sum + c.unread_count, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, [user]);

  // Fetch total unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    const { count } = await supabase
      .from("direct_messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => {
    if (conversationUserId) {
      fetchMessages();
    }
  }, [fetchMessages, conversationUserId]);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, [fetchConversations, fetchUnreadCount]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("direct_messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (conversationUserId && payload.new.sender_id === conversationUserId) {
            fetchMessages();
          }
          fetchConversations();
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationUserId, fetchMessages, fetchConversations, fetchUnreadCount]);

  return {
    messages,
    conversations,
    unreadCount,
    isLoading,
    sendMessage,
    fetchMessages,
    fetchConversations,
    refreshUnreadCount: fetchUnreadCount,
  };
}
