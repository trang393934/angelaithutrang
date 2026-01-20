import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { motion } from "framer-motion";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  "Mặt cười": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝"],
  "Cảm xúc": ["🥳", "🤩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"],
  "Tim & Tình yêu": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  "Tay & Cử chỉ": ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐", "🖖", "👋", "🤙", "💪", "🙏"],
  "Động vật": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦄", "🐝", "🦋", "🐌", "🐞"],
  "Đồ ăn": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🌶", "🌽", "🥕", "🍕", "🍔", "🍟", "🌭", "🍿", "☕", "🍵", "🧃"],
  "Biểu tượng": ["✨", "🌟", "⭐", "💫", "🔥", "💥", "💯", "✅", "❌", "⚡", "💡", "🎉", "🎊", "🎁", "🏆", "🥇", "🎯", "💬", "💭", "🗨️"],
};

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Mặt cười");

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-foreground-muted hover:text-primary hover:bg-primary/10"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-background-pure border-primary-pale shadow-xl" 
        align="start"
        side="top"
      >
        <div className="flex flex-col max-h-80">
          {/* Quick reactions */}
          <div className="flex items-center justify-around p-2 border-b border-primary-pale bg-primary-pale/30">
            {QUICK_REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(emoji)}
                className="text-2xl p-1 hover:bg-primary/10 rounded-full transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {/* Category tabs */}
          <div className="flex overflow-x-auto p-1 gap-1 border-b border-primary-pale scrollbar-hide">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-2 py-1 text-xs whitespace-nowrap rounded-md transition-colors ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:bg-primary/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-2 overflow-y-auto max-h-48 grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(emoji)}
                className="text-xl p-1 hover:bg-primary/10 rounded transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ReactionPicker({ onReactionSelect, existingReactions = [] }: { 
  onReactionSelect: (emoji: string) => void;
  existingReactions?: string[];
}) {
  return (
    <div className="flex items-center gap-0.5 bg-background-pure rounded-full shadow-lg border border-primary-pale p-1">
      {QUICK_REACTIONS.map((emoji) => {
        const hasReacted = existingReactions.includes(emoji);
        return (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onReactionSelect(emoji)}
            className={`text-lg p-1 rounded-full transition-colors ${
              hasReacted ? "bg-primary/20" : "hover:bg-primary/10"
            }`}
          >
            {emoji}
          </motion.button>
        );
      })}
    </div>
  );
}
