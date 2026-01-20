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
  image_url?: string | null;
  message_type?: string;
  reply_to_id?: string | null;
  reactions?: string[];
  is_deleted?: boolean;
  deleted_at?: string | null;
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
  last_message_type?: string;
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

      const enrichedMessages: DirectMessage[] = (messagesData || []).map((msg) => {
        const profile = profiles?.find((p) => p.user_id === msg.sender_id);
        const reactions = Array.isArray(msg.reactions) ? msg.reactions as string[] : [];
        return {
          ...msg,
          reactions,
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
  const sendMessage = async (
    receiverId: string,
    content: string,
    imageUrl?: string,
    replyToId?: string
  ) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      return { success: false };
    }

    if (!content.trim() && !imageUrl) {
      return { success: false };
    }

    try {
      const messageData: any = {
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim() || "",
        message_type: imageUrl ? "image" : "text",
      };

      if (imageUrl) {
        messageData.image_url = imageUrl;
      }

      if (replyToId) {
        messageData.reply_to_id = replyToId;
      }

      const { data, error } = await supabase
        .from("direct_messages")
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Add to local messages
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          reactions: [],
          sender_display_name: "Bạn",
          sender_avatar_url: null,
        },
      ]);

      return { success: true, message: data };
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Lỗi khi gửi tin nhắn");
      return { success: false };
    }
  };

  // Add reaction to message
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const currentReactions = message.reactions || [];
    const newReactions = currentReactions.includes(emoji)
      ? currentReactions.filter((r) => r !== emoji)
      : [...currentReactions, emoji];

    try {
      await supabase
        .from("direct_messages")
        .update({ reactions: newReactions })
        .eq("id", messageId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, reactions: newReactions } : m
        )
      );
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // Delete message (soft delete)
  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("direct_messages")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          content: "",
        })
        .eq("id", messageId)
        .eq("sender_id", user.id);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, content: "" }
            : m
        )
      );

      toast.success("Đã xóa tin nhắn");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Lỗi khi xóa tin nhắn");
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
      const conversationMap = new Map<
        string,
        { messages: typeof allMessages; unread: number }
      >();

      allMessages.forEach((msg) => {
        const partnerId =
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
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

        let lastMessageText = lastMsg.content;
        if (lastMsg.is_deleted) {
          lastMessageText = "Tin nhắn đã bị xóa";
        } else if (lastMsg.message_type === "image" && !lastMsg.content) {
          lastMessageText = "📷 Hình ảnh";
        }

        return {
          user_id: partnerId,
          display_name: profile?.display_name || "Người dùng",
          avatar_url: profile?.avatar_url || null,
          last_message: lastMessageText,
          last_message_at: lastMsg.created_at,
          unread_count: data.unread,
          last_message_type: lastMsg.message_type,
        };
      });

      // Sort by last message time
      conversationsList.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
      );

      setConversations(conversationsList);

      // Calculate total unread
      const totalUnread = conversationsList.reduce(
        (sum, c) => sum + c.unread_count,
        0
      );
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
        async (payload) => {
          const newMessage = payload.new as DirectMessage;

          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", newMessage.sender_id)
            .maybeSingle();

          if (
            conversationUserId &&
            newMessage.sender_id === conversationUserId
          ) {
            setMessages((prev) => [
              ...prev,
              {
                ...newMessage,
                reactions: [],
                sender_display_name: profile?.display_name || "Người dùng",
                sender_avatar_url: profile?.avatar_url || null,
              },
            ]);

            // Mark as read immediately
            await supabase
              .from("direct_messages")
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq("id", newMessage.id);
          }

          fetchConversations();
          fetchUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const updatedMessage = payload.new as DirectMessage;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMessage.id
                ? { ...m, ...updatedMessage }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    user,
    conversationUserId,
    fetchConversations,
    fetchUnreadCount,
  ]);

  return {
    messages,
    conversations,
    unreadCount,
    isLoading,
    sendMessage,
    addReaction,
    deleteMessage,
    fetchMessages,
    fetchConversations,
    refreshUnreadCount: fetchUnreadCount,
  };
}
