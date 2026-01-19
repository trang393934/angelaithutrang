import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import angelAvatar from "@/assets/angel-avatar.png";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";

const Messages = () => {
  const { userId: conversationUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, conversations, isLoading, sendMessage, fetchMessages } = useDirectMessages(conversationUserId);

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
  }, [conversationUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversationUserId || isSending) return;

    setIsSending(true);
    const result = await sendMessage(conversationUserId, messageText);
    if (result.success) {
      setMessageText("");
    }
    setIsSending(false);
  };

  // Conversation list view (no userId selected)
  if (!conversationUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
        <header className="sticky top-0 z-50 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link to="/community" className="p-2 rounded-full hover:bg-primary-pale transition-colors">
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Link>
              <h1 className="font-serif text-xl font-semibold text-primary-deep flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Tin nhắn
              </h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {conversations.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground/70">Chưa có cuộc trò chuyện nào</h3>
              <p className="text-sm text-foreground-muted mt-2">
                Hãy kết bạn và bắt đầu trò chuyện!
              </p>
              <Link to="/community">
                <Button className="mt-4">Đến cộng đồng</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Link key={conv.user_id} to={`/messages/${conv.user_id}`}>
                  <Card className="hover:bg-primary/5 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.avatar_url || angelAvatar} />
                        <AvatarFallback>{conv.display_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{conv.display_name}</span>
                          <span className="text-xs text-foreground-muted">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: vi })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground-muted truncate">{conv.last_message}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversation view
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/messages" className="p-2 rounded-full hover:bg-primary-pale transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Link>
            <Link to={`/user/${conversationUserId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="w-10 h-10">
                <AvatarImage src={partnerProfile?.avatar_url || angelAvatar} />
                <AvatarFallback>{partnerProfile?.display_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground">{partnerProfile?.display_name || "Người dùng"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-foreground-muted">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Chưa có tin nhắn nào</p>
                <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : ""}`}>
                      {!isOwn && (
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={msg.sender_avatar_url || angelAvatar} />
                          <AvatarFallback>{msg.sender_display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-foreground-muted"}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background-pure border-t border-primary-pale p-4">
        <form onSubmit={handleSendMessage} className="container mx-auto flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1"
            disabled={isSending}
          />
          <Button type="submit" disabled={!messageText.trim() || isSending} className="bg-sapphire-gradient">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Messages;
