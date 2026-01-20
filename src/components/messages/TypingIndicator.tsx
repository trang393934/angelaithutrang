import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import angelAvatar from "@/assets/angel-avatar.png";

interface TypingIndicatorProps {
  avatarUrl?: string | null;
  displayName?: string;
}

export function TypingIndicator({ avatarUrl, displayName }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-end gap-2"
    >
      <Avatar className="w-8 h-8">
        <AvatarImage src={avatarUrl || angelAvatar} />
        <AvatarFallback className="text-xs">
          {displayName?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-foreground-muted rounded-full"
          />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-foreground-muted rounded-full"
          />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-foreground-muted rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
