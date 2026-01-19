import { Coins, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatRewardNotificationProps {
  reward: {
    coins: number;
    purityScore: number;
    message: string;
    questionsRemaining: number;
  } | null;
  onDismiss: () => void;
}

export function ChatRewardNotification({ reward, onDismiss }: ChatRewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (reward) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [reward, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && reward && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl p-1 shadow-2xl">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 relative">
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onDismiss, 300);
                }}
                className="absolute top-2 right-2 text-amber-600/50 hover:text-amber-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-500 animate-pulse" />
                </div>

                <div className="flex-1">
                  <p className="text-amber-900 font-bold text-lg">
                    +{reward.coins.toLocaleString()} Camly Coin!
                  </p>
                  <p className="text-amber-700/70 text-sm">
                    Tâm thuần khiết {Math.round(reward.purityScore * 100)}%
                  </p>
                  <p className="text-amber-600/60 text-xs mt-1">
                    Còn {reward.questionsRemaining} lượt thưởng hôm nay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ChatRewardNotification;
