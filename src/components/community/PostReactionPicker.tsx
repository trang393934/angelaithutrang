import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

// Beautiful reaction options with icons and emojis
export const POST_REACTIONS = [
  { id: "heart", emoji: "❤️", label: "Yêu thích", color: "text-red-500", bgColor: "bg-red-50" },
  { id: "like", emoji: "👍", label: "Thích", color: "text-blue-500", bgColor: "bg-blue-50" },
  { id: "diamond", emoji: "💎", label: "Kim cương", color: "text-cyan-500", bgColor: "bg-cyan-50" },
  { id: "angel", emoji: "😇", label: "Thiên thần", color: "text-amber-500", bgColor: "bg-amber-50" },
  { id: "sparkle", emoji: "✨", label: "Tỏa sáng", color: "text-yellow-500", bgColor: "bg-yellow-50" },
  { id: "love_eyes", emoji: "😍", label: "Mê mẩn", color: "text-pink-500", bgColor: "bg-pink-50" },
  { id: "star", emoji: "⭐", label: "Ngôi sao", color: "text-orange-500", bgColor: "bg-orange-50" },
  { id: "pray", emoji: "🙏", label: "Cảm ơn", color: "text-purple-500", bgColor: "bg-purple-50" },
] as const;

export type ReactionType = typeof POST_REACTIONS[number]["id"];

function getReactionById(id?: ReactionType | null) {
  return POST_REACTIONS.find((r) => r.id === id);
}

interface PostReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onReactionSelect: (reaction: typeof POST_REACTIONS[number]) => void;
  currentReaction?: ReactionType | null;
}

export function PostReactionPicker({
  isOpen,
  onClose,
  onReactionSelect,
  currentReaction,
}: PostReactionPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute bottom-full left-0 mb-2 z-50"
          onMouseLeave={onClose}
        >
          <div className="bg-background-pure rounded-full shadow-xl border border-primary/10 p-1.5 flex items-center gap-0.5">
            {POST_REACTIONS.map((reaction, index) => (
              <motion.button
                key={reaction.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.03, type: "spring", stiffness: 500 }}
                whileHover={{ scale: 1.3, y: -8 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onReactionSelect(reaction);
                  onClose();
                }}
                className={cn(
                  "text-2xl p-1.5 rounded-full transition-all duration-200 relative group",
                  currentReaction === reaction.id
                    ? `${reaction.bgColor} ring-2 ring-primary/30`
                    : "hover:bg-primary/5"
                )}
                title={reaction.label}
              >
                <span className="block transform transition-transform">
                  {reaction.emoji}
                </span>
                {/* Tooltip */}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {reaction.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact display of a reaction
export function ReactionBadge({
  reaction,
  count,
  isActive,
  onClick,
  size = "sm",
}: {
  reaction: typeof POST_REACTIONS[number];
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full transition-all",
        size === "sm" ? "px-2 py-0.5 text-sm" : "px-3 py-1 text-base",
        isActive
          ? `${reaction.bgColor} ${reaction.color} ring-1 ring-current`
          : "bg-primary/5 hover:bg-primary/10"
      )}
    >
      <span>{reaction.emoji}</span>
      {count !== undefined && count > 0 && (
        <span className={cn("font-medium", isActive ? reaction.color : "text-foreground-muted")}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

// Beautiful like button with reaction picker trigger
interface LikeButtonWithReactionsProps {
  isLiked: boolean;
  likesCount: number;
  isLiking: boolean;
  onLike: (reactionId?: ReactionType) => void;
  onLongPress?: () => void;
  isNearThreshold?: boolean;
  isRewarded?: boolean;
  currentReaction?: ReactionType | null;
}

export function LikeButtonWithReactions({
  isLiked,
  likesCount,
  isLiking,
  onLike,
  onLongPress,
  isNearThreshold,
  isRewarded,
  currentReaction,
}: LikeButtonWithReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const activeReaction = useMemo(
    () => (isLiked ? getReactionById(currentReaction ?? "heart") : undefined),
    [isLiked, currentReaction]
  );

  // Desktop: mouse down/up for long press
  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setShowPicker(true);
      onLongPress?.();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Mobile: touch start/end for long press to show picker
  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setShowPicker(true);
      onLongPress?.();
    }, 400); // Slightly shorter for touch
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = () => {
    if (!showPicker) {
      onLike();
    }
  };

  // Toggle picker on tap for mobile (single tap shows picker, second tap closes)
  const handleTogglePicker = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPicker(!showPicker);
  };

  return (
    <div 
      className="relative flex-1"
      onMouseEnter={() => setShowPicker(true)}
      onMouseLeave={() => setShowPicker(false)}
    >
      <PostReactionPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onReactionSelect={(reaction) => {
          onLike(reaction.id);
          setShowPicker(false);
        }}
        currentReaction={isLiked ? (currentReaction ?? "heart") : null}
      />
      
      {/* Main like button */}
      <motion.button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        disabled={isLiking}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200",
          "hover:bg-primary/5 disabled:opacity-50",
          isLiked ? "text-red-500" : "text-foreground-muted"
        )}
      >
        <motion.span
          animate={isLiking ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {isLiked && activeReaction ? (
            <span className="text-xl leading-none">{activeReaction.emoji}</span>
          ) : (
            <Heart className="w-5 h-5" />
          )}
        </motion.span>
        <span className="text-sm font-medium">{isLiked && activeReaction ? activeReaction.label : "Thích"}</span>
        {isNearThreshold && !isRewarded && (
          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
            {5 - likesCount} nữa!
          </span>
        )}
      </motion.button>

      {/* Mobile: Extra tap zone to toggle picker */}
      <button
        className="absolute -top-1 -left-1 w-8 h-8 md:hidden flex items-center justify-center rounded-full bg-primary/10 opacity-0 active:opacity-100"
        onClick={handleTogglePicker}
        aria-label="Chọn biểu cảm"
      >
        <span className="text-xs">+</span>
      </button>
    </div>
  );
}
