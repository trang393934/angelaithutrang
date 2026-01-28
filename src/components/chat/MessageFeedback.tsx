import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageFeedbackProps {
  messageIndex: number;
  questionText: string;
  answerText: string;
}

type FeedbackType = "like" | "dislike" | null;

export function MessageFeedback({ messageIndex, questionText, answerText }: MessageFeedbackProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: FeedbackType) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (isSubmitting) return;

    // Toggle off if same feedback clicked
    if (feedback === type) {
      setFeedback(null);
      return;
    }

    setIsSubmitting(true);
    const previousFeedback = feedback;
    setFeedback(type); // Optimistic update

    try {
      // Save feedback to database - use type assertion for new table
      const { error } = await (supabase as any)
        .from("chat_feedback")
        .upsert({
          user_id: user.id,
          question_text: questionText.slice(0, 500),
          answer_text: answerText.slice(0, 2000),
          feedback_type: type,
        }, {
          onConflict: "user_id,question_text",
        });

      // Silently handle any errors - feedback is non-critical
      if (error) {
        console.log("Feedback save skipped:", error.message);
      }

      toast.success(
        type === "like" 
          ? "Cảm ơn bạn! Angel sẽ tiếp tục học hỏi 💖" 
          : "Cảm ơn phản hồi! Angel sẽ cải thiện 🙏",
        { duration: 2000 }
      );
    } catch (error) {
      console.error("Feedback error:", error);
      setFeedback(previousFeedback); // Revert on error
      // Don't show error toast - silently fail for non-critical feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={() => handleFeedback("like")}
            disabled={isSubmitting}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              feedback === "like"
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            )}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {feedback === "like" ? (
                <motion.div
                  key="liked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <ThumbsUp className="w-4 h-4 fill-current" />
                </motion.div>
              ) : (
                <motion.div key="like">
                  <ThumbsUp className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>Câu trả lời hữu ích</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={() => handleFeedback("dislike")}
            disabled={isSubmitting}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              feedback === "dislike"
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {feedback === "dislike" ? (
                <motion.div
                  key="disliked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <ThumbsDown className="w-4 h-4 fill-current" />
                </motion.div>
              ) : (
                <motion.div key="dislike">
                  <ThumbsDown className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>Câu trả lời chưa tốt</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
