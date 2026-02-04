import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck, MoreHorizontal, Reply, Trash2, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ReactionPicker } from "./EmojiPicker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import angelAvatar from "@/assets/angel-avatar.png";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
    image_url?: string | null;
    reactions?: string[];
    reply_to_id?: string | null;
    is_deleted?: boolean;
    sender_display_name?: string;
    sender_avatar_url?: string | null;
  };
  isOwn: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (message: any) => void;
  onDelete?: (messageId: string) => void;
  replyToMessage?: { content: string; sender_display_name: string } | null;
}

export function MessageBubble({
  message,
  isOwn,
  onReaction,
  onReply,
  onDelete,
  replyToMessage,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Đã sao chép tin nhắn");
  };

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="px-4 py-2 rounded-2xl bg-muted/50 italic text-foreground-muted text-sm">
          Tin nhắn đã bị xóa
        </div>
      </div>
    );
  }

  const reactions = message.reactions || [];
  const reactionCounts = reactions.reduce((acc, emoji) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div className={`flex gap-2 max-w-[85%] sm:max-w-[80%] ${isOwn ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        {!isOwn && (
          <Avatar className="w-8 h-8 shrink-0 mt-auto">
            <AvatarImage src={message.sender_avatar_url || angelAvatar} />
            <AvatarFallback className="text-xs">
              {message.sender_display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {/* Reply preview */}
          {replyToMessage && (
            <div className={cn(
              "text-xs px-3 py-1 rounded-t-xl mb-0.5 max-w-full truncate",
              isOwn ? "bg-primary/20 text-primary-foreground/70" : "bg-muted/70 text-foreground-muted"
            )}>
              <Reply className="w-3 h-3 inline mr-1" />
              <span className="font-medium">{replyToMessage.sender_display_name}: </span>
              {replyToMessage.content.slice(0, 30)}...
            </div>
          )}

          {/* Message bubble */}
          <div className="relative">
            {/* Action buttons */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 flex items-center gap-1",
                    isOwn ? "-left-24" : "-right-24"
                  )}
                >
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-1.5 rounded-full bg-background-pure shadow border border-primary-pale hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-sm">😊</span>
                  </button>
                  {onReply && (
                    <button
                      onClick={() => onReply(message)}
                      className="p-1.5 rounded-full bg-background-pure shadow border border-primary-pale hover:bg-primary/10 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5 text-foreground-muted" />
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-full bg-background-pure shadow border border-primary-pale hover:bg-primary/10 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-foreground-muted" />
                  </button>
                  {isOwn && onDelete && (
                    <button
                      onClick={() => onDelete(message.id)}
                      className="p-1.5 rounded-full bg-background-pure shadow border border-primary-pale hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reaction picker popup */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "absolute -top-12 z-10",
                    isOwn ? "right-0" : "left-0"
                  )}
                >
                  <ReactionPicker
                    onReactionSelect={(emoji) => {
                      onReaction?.(message.id, emoji);
                      setShowReactions(false);
                    }}
                    existingReactions={reactions}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image message */}
            {message.image_url && (
              <div className={cn(
                "rounded-2xl overflow-hidden mb-1",
                isOwn ? "rounded-br-sm" : "rounded-bl-sm"
              )}>
                <img
                  src={message.image_url}
                  alt="Hình ảnh"
                  className="max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.image_url!, "_blank")}
                />
              </div>
            )}

            {/* Text content */}
            {message.content && (
              <div
                className={cn(
                  "px-5 py-4 rounded-2xl transition-all",
                  isOwn
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}
              >
                <p className="text-[17px] sm:text-xl whitespace-pre-wrap break-words leading-relaxed message-content">{message.content}</p>
              </div>
            )}

            {/* Reactions display */}
            {Object.keys(reactionCounts).length > 0 && (
              <div className={cn(
                "flex flex-wrap gap-1 mt-1",
                isOwn ? "justify-end" : "justify-start"
              )}>
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                  <motion.span
                    key={emoji}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-0.5 text-xs bg-background-pure border border-primary-pale rounded-full px-1.5 py-0.5 shadow-sm"
                  >
                    {emoji} {count > 1 && <span className="text-foreground-muted">{count}</span>}
                  </motion.span>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp and read status */}
          <div className={cn(
            "flex items-center gap-1 mt-0.5",
            isOwn ? "flex-row-reverse" : ""
          )}>
            <span className="text-[10px] text-foreground-muted">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: vi })}
            </span>
            {isOwn && (
              message.is_read ? (
                <CheckCheck className="w-3 h-3 text-primary" />
              ) : (
                <Check className="w-3 h-3 text-foreground-muted" />
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
