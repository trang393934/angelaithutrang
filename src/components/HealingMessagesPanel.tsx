import { useState } from "react";
import { useHealingMessages } from "@/hooks/useHealingMessages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Heart, Sparkles, AlertTriangle, PartyPopper, MessageCircle } from "lucide-react";

const getMessageIcon = (type: string) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "celebration":
      return <PartyPopper className="w-5 h-5 text-green-500" />;
    case "healing":
      return <Heart className="w-5 h-5 text-pink-500" />;
    case "encouragement":
    default:
      return <Sparkles className="w-5 h-5 text-divine-gold" />;
  }
};

const getMessageBgColor = (type: string, isRead: boolean) => {
  if (isRead) return "bg-card/50";
  
  switch (type) {
    case "warning":
      return "bg-amber-50/50 border-amber-200";
    case "celebration":
      return "bg-green-50/50 border-green-200";
    case "healing":
      return "bg-pink-50/50 border-pink-200";
    case "encouragement":
    default:
      return "bg-divine-gold/5 border-divine-gold/20";
  }
};

const HealingMessagesPanel = () => {
  const { messages, unreadCount, markAsRead, markAllAsRead, isLoading } = useHealingMessages();
  const [selectedMessage, setSelectedMessage] = useState<typeof messages[0] | null>(null);

  const handleOpenMessage = (message: typeof messages[0]) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-divine-gold/20 shadow-soft animate-pulse">
        <CardContent className="pt-6">
          <div className="h-32 bg-divine-gold/10 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-divine-gold/20 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5 text-divine-gold" />
          Thông Điệp Từ Angel AI
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-divine-gold text-white rounded-full">
              {unreadCount} mới
            </span>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-1" />
            Đánh dấu tất cả
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-divine-gold/50" />
            <p>Chưa có thông điệp nào</p>
            <p className="text-sm">Angel AI sẽ gửi thông điệp yêu thương đến bạn</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {messages.map((message) => (
                <Dialog key={message.id}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => handleOpenMessage(message)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/50 ${getMessageBgColor(message.message_type, message.is_read)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getMessageIcon(message.message_type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium truncate ${!message.is_read ? "text-foreground" : "text-foreground-muted"}`}>
                              {message.title}
                            </h4>
                            {!message.is_read && (
                              <span className="w-2 h-2 bg-divine-gold rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-foreground-muted line-clamp-2 mt-1">
                            {message.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.created_at).toLocaleDateString("vi-VN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getMessageIcon(message.message_type)}
                        {message.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default HealingMessagesPanel;
