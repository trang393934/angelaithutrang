import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, X, Crown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface EarlyAdopterRewardPopupProps {
  isOpen: boolean;
  coinsAwarded: number;
  userRank: number;
  onClose: () => void;
}

const EarlyAdopterRewardPopup = ({
  isOpen,
  coinsAwarded,
  userRank,
  onClose
}: EarlyAdopterRewardPopupProps) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-b from-amber-50 via-white to-yellow-50 rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti background effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#9B59B6"][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: `-10%`
                  }}
                  animate={{
                    y: ["0vh", "120vh"],
                    x: [0, (Math.random() - 0.5) * 100],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-amber-100 transition-colors z-10"
            >
              <X className="w-5 h-5 text-amber-700" />
            </button>

            {/* Content */}
            <div className="relative p-8 text-center">
              {/* Trophy icon with glow */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="relative inline-block mb-6"
              >
                <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Crown className="w-8 h-8 text-amber-500" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-amber-800 mb-2"
              >
                🎉 {t("earlyAdopter.congratulations")} 🎉
              </motion.h2>

              {/* Rank badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full text-white font-semibold mb-6"
              >
                <Star className="w-5 h-5" />
                <span>{t("earlyAdopter.rank")} #{userRank} / 100</span>
                <Star className="w-5 h-5" />
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-amber-700 mb-6 leading-relaxed"
              >
                {t("earlyAdopter.description")}
              </motion.p>

              {/* Coin reward display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", damping: 12 }}
                className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 rounded-2xl p-6 mb-6 border border-amber-200"
              >
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  >
                    <Coins className="w-10 h-10 text-amber-600" />
                  </motion.div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                    +{coinsAwarded.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-amber-600 mt-2 font-medium">Camly Coin</p>
              </motion.div>

              {/* Thank you message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-amber-600 mb-6"
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                {t("earlyAdopter.thankYou")}
                <Sparkles className="w-4 h-4 inline ml-1" />
              </motion.p>

              {/* Close button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={onClose}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  {t("earlyAdopter.awesome")}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EarlyAdopterRewardPopup;
