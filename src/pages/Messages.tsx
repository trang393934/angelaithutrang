import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MessageCircle, Users, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { ConversationHeader } from "@/components/messages/ConversationHeader";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageInput } from "@/components/messages/MessageInput";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import angelAvatar from "@/assets/angel-avatar.png";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { LightGate } from "@/components/LightGate";
import { Loader2 } from "lucide-react";

const Messages = () => {
  const { userId: conversationUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<{
    display_name: string;
    avatar_url: string | null;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    sender_display_name: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    conversations,
    isLoading,
    sendMessage,
    addReaction,
    deleteMessage,
  } = useDirectMessages(conversationUserId);

  const { isUserOnline, getLastSeen, fetchOnlineStatus } = useOnlineStatus();
  const { isPartnerTyping, sendTypingIndicator, clearTypingIndicator } =
    useTypingIndicator(conversationUserId);

  // Fetch conversation partner's profile
  useEffect(() => {
    const fetchPartnerProfile = async () => {
      if (!conversationUserId) return;

      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", conversationUserId)
        .maybeSingle();

      setPartnerProfile(data);
    };

    fetchPartnerProfile();

    if (conversationUserId) {
      fetchOnlineStatus([conversationUserId]);
    }
  }, [conversationUserId, fetchOnlineStatus]);

  // Fetch online status for conversation list
  useEffect(() => {
    if (conversations.length > 0) {
      const userIds = conversations.map((c) => c.user_id);
      fetchOnlineStatus(userIds);
    }
  }, [conversations, fetchOnlineStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!conversationUserId) return;

    setIsSending(true);
    clearTypingIndicator();

    const result = await sendMessage(
      conversationUserId,
      content,
      imageUrl,
      replyTo?.id
    );

    if (result.success) {
      setReplyTo(null);
    }
    setIsSending(false);
  };

  const handleReply = (message: any) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      sender_display_name: message.sender_display_name,
    });
  };

  // Get reply-to message for each message
  const getReplyToMessage = (replyToId?: string | null) => {
    if (!replyToId) return null;
    const replyMsg = messages.find((m) => m.id === replyToId);
    if (!replyMsg) return null;
    return {
      content: replyMsg.content,
      sender_display_name: replyMsg.sender_display_name || "Người dùng",
    };
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Conversation list view (no userId selected)
  if (!conversationUserId) {
    return (
      <LightGate>
        <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
          <header className="sticky top-0 z-50 bg-background-pure/95 backdrop-blur-lg border-b border-primary-pale shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate("/")}
                  className="p-1.5 rounded-full hover:bg-primary-pale transition-colors"
                  title="Về trang chủ"
                >
                  <ArrowLeft className="w-5 h-5 text-primary" />
                </button>
                <h1 className="font-serif text-xl font-semibold text-primary-deep flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Tin nhắn
                </h1>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-4">
            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className="pl-10 bg-muted border-0 rounded-full"
              />
            </div>

            {filteredConversations.length === 0 ? (
              <Card className="p-8 text-center bg-background-pure">
                <Users className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground/70">
                  {searchQuery
                    ? "Không tìm thấy cuộc trò chuyện"
                    : "Chưa có cuộc trò chuyện nào"}
                </h3>
                <p className="text-sm text-foreground-muted mt-2">
                  Hãy kết bạn và bắt đầu trò chuyện!
                </p>
                <Link to="/community">
                  <Button className="mt-4">Đến cộng đồng</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conv) => {
                  const isOnline = isUserOnline(conv.user_id);

                  return (
                    <Link key={conv.user_id} to={`/messages/${conv.user_id}`}>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Card
                          className={`hover:bg-primary/5 transition-colors cursor-pointer border-0 ${
                            conv.unread_count > 0 ? "bg-primary-pale/30" : ""
                          }`}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-14 h-14">
                                <AvatarImage
                                  src={conv.avatar_url || angelAvatar}
                                />
                                <AvatarFallback>
                                  {conv.display_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              {/* Online indicator */}
                              <div
                                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background-pure ${
                                  isOnline ? "bg-green-500" : "bg-gray-400"
                                }`}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span
                                  className={`font-semibold ${
                                    conv.unread_count > 0
                                      ? "text-foreground"
                                      : "text-foreground/80"
                                  }`}
                                >
                                  {conv.display_name}
                                </span>
                                <span className="text-xs text-foreground-muted">
                                  {formatDistanceToNow(
                                    new Date(conv.last_message_at),
                                    { addSuffix: false, locale: vi }
                                  )}
                                </span>
                              </div>
                              <p
                                className={`text-sm truncate ${
                                  conv.unread_count > 0
                                    ? "text-foreground font-medium"
                                    : "text-foreground-muted"
                                }`}
                              >
                                {conv.last_message}
                              </p>
                            </div>

                            {conv.unread_count > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-primary text-primary-foreground text-xs font-bold min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full"
                              >
                                {conv.unread_count}
                              </motion.span>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </LightGate>
    );
  }

  // Conversation view
  const isOnline = isUserOnline(conversationUserId);
  const lastSeen = getLastSeen(conversationUserId);

  return (
    <LightGate>
      <div className="min-h-screen bg-gradient-to-b from-primary-pale/30 via-background to-background flex flex-col">
        <ConversationHeader
          partnerId={conversationUserId}
          partnerProfile={partnerProfile}
          isOnline={isOnline}
          lastSeen={lastSeen}
          isTyping={isPartnerTyping}
        />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="container mx-auto px-4 py-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-foreground-muted">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
                  <p className="text-sm mt-1">
                    Hãy gửi lời chào đến{" "}
                    {partnerProfile?.display_name || "người này"}!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === user?.id}
                    onReaction={addReaction}
                    onReply={handleReply}
                    onDelete={deleteMessage}
                    replyToMessage={getReplyToMessage(msg.reply_to_id)}
                  />
                ))
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {isPartnerTyping && (
                  <TypingIndicator
                    avatarUrl={partnerProfile?.avatar_url}
                    displayName={partnerProfile?.display_name}
                  />
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <MessageInput
          onSend={handleSendMessage}
          onTyping={sendTypingIndicator}
          isSending={isSending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </LightGate>
  );
};

export default Messages;
