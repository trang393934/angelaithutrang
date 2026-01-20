import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { Conversation } from "@/hooks/useDirectMessages";
import angelAvatar from "@/assets/angel-avatar.png";

interface ConversationListItemProps {
  conversation: Conversation;
  isOnline: boolean;
}

export function ConversationListItem({
  conversation,
  isOnline,
}: ConversationListItemProps) {
  return (
    <Link to={`/messages/${conversation.user_id}`}>
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Card
          className={`hover:bg-primary/5 transition-colors cursor-pointer border-0 ${
            conversation.unread_count > 0 ? "bg-primary-pale/30" : ""
          }`}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-14 h-14">
                <AvatarImage src={conversation.avatar_url || angelAvatar} />
                <AvatarFallback>
                  {conversation.display_name?.charAt(0) || "U"}
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
                    conversation.unread_count > 0
                      ? "text-foreground"
                      : "text-foreground/80"
                  }`}
                >
                  {conversation.display_name}
                </span>
                <span className="text-xs text-foreground-muted">
                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: false,
                    locale: vi,
                  })}
                </span>
              </div>
              <p
                className={`text-sm truncate ${
                  conversation.unread_count > 0
                    ? "text-foreground font-medium"
                    : "text-foreground-muted"
                }`}
              >
                {conversation.last_message}
              </p>
            </div>

            {conversation.unread_count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary text-primary-foreground text-xs font-bold min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full"
              >
                {conversation.unread_count}
              </motion.span>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
