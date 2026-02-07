import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ExternalLink } from "lucide-react";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface LiXiCelebrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCamly: number;
  totalFun: number;
  successCount: number;
}

const ConfettiPiece = ({ delay, left, color, size }: { delay: number; left: number; color: string; size: number }) => (
  <motion.div
    className="absolute rounded-sm"
    style={{ left: `${left}%`, backgroundColor: color, width: size, height: size * 1.5 }}
    initial={{ y: -30, opacity: 0, rotate: 0, scale: 0 }}
    animate={{
      y: ["0%", "120vh"],
      opacity: [0, 1, 1, 1, 0],
      rotate: [0, 360, 720, 1080, 1440],
      scale: [0, 1.2, 1, 0.8, 0.3],
      x: [0, Math.random() > 0.5 ? 30 : -30, Math.random() > 0.5 ? -20 : 20],
    }}
    transition={{ duration: 4 + Math.random() * 2, delay, ease: "easeOut" }}
  />
);

const FallingCoin = ({ delay, left, size }: { delay: number; left: number; size: number }) => (
  <motion.div
    className="absolute z-10"
    style={{ left: `${left}%`, width: size, height: size }}
    initial={{ y: -60, opacity: 0, rotate: 0 }}
    animate={{
      y: ["0%", "130vh"],
      opacity: [0, 1, 1, 1, 0],
      rotate: [0, 360, 720, 1080],
      x: [0, Math.random() > 0.5 ? 15 : -15],
    }}
    transition={{ duration: 3.5 + Math.random() * 2, delay, ease: "easeIn" }}
  >
    <img src={camlyCoinLogo} alt="" className="w-full h-full drop-shadow-md" />
  </motion.div>
);

const FloatingSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.8, 0], opacity: [0, 1, 0] }}
    transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 0.8 }}
  >
    <Sparkles className="w-4 h-4 text-yellow-200 drop-shadow-lg" />
  </motion.div>
);

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
  "#FF9A9E", "#A18CD1", "#FBC2EB", "#84FAB0", "#F6D365",
];

export function LiXiCelebrationDialog({
  open,
  onOpenChange,
  totalCamly,
  totalFun,
  successCount,
}: LiXiCelebrationDialogProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const formatNum = (n: number) => n.toLocaleString("vi-VN");

  const confettiPieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
  }));

  const fallingCoins = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3.5,
    left: Math.random() * 100,
    size: 16 + Math.random() * 16,
  }));

  const sparkles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden max-h-[85vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative rounded-2xl p-6 shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #8B6914, #C49B30, #E8C252, #F5D976, #E8C252, #C49B30)",
          }}
        >
          {/* Hiệu ứng confetti + đồng Camly rơi + lấp lánh */}
          <AnimatePresence>
            {showConfetti && (
              <>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {confettiPieces.map((piece) => (
                    <ConfettiPiece key={`c-${piece.id}`} delay={piece.delay} left={piece.left} color={piece.color} size={piece.size} />
                  ))}
                </div>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {fallingCoins.map((coin) => (
                    <FallingCoin key={`coin-${coin.id}`} delay={coin.delay} left={coin.left} size={coin.size} />
                  ))}
                </div>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {sparkles.map((s) => (
                    <FloatingSparkle key={`s-${s.id}`} delay={s.delay} x={s.x} y={s.y} />
                  ))}
                </div>
              </>
            )}
          </AnimatePresence>

          {/* Lớp phủ sáng tạo chiều sâu */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />

          {/* Nút đóng */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Nội dung chính */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* Logo Camly Coin xoay */}
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 2, repeat: 2, ease: "linear" }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-300/50 blur-xl rounded-full" />
                <img src={camlyCoinLogo} alt="Camly Coin" className="w-20 h-20 relative z-10 drop-shadow-lg" />
              </div>
            </motion.div>

            {/* Tiêu đề */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-white drop-shadow-md"
            >
              🧧 Chúc mừng bạn được Lì xì
            </motion.h2>

            {/* Số lượng Camly Coin */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-full bg-white/95 backdrop-blur rounded-xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-center gap-2">
                <img src={camlyCoinLogo} alt="coin" className="w-8 h-8" />
                <span className="text-3xl font-bold" style={{ color: "#8B6914" }}>
                  {formatNum(totalCamly)}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#C49B30" }}>
                  Camly Coin
                </span>
              </div>

              <p className="text-sm text-gray-600">
                dựa trên <span className="font-bold" style={{ color: "#8B6914" }}>{formatNum(totalFun)}</span> Fun Money
              </p>

              <div className="border-t border-amber-200 pt-3 space-y-1.5">
                <p className="text-xs font-semibold" style={{ color: "#8B6914" }}>
                  🧧 Chương trình Lì xì Tết
                </p>
                <p className="text-lg font-bold" style={{ color: "#C49B30" }}>
                  26.000.000.000 VND
                </p>
                <p className="text-xs text-gray-500">
                  bằng Fun Money và Camly Coin
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ⏰ Áp dụng đến ngày 08/02/2026
                </p>
                {successCount > 1 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    ✅ Đã chuyển thành công cho {successCount} người dùng
                  </p>
                )}
              </div>
            </motion.div>

            {/* Nút hành động */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 w-full"
            >
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1"
                size="lg"
              >
                🧧 Claim
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-white/20 border-white/40 text-white hover:bg-white/30"
                size="lg"
                onClick={() => window.open("/admin/mint-stats", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Thêm Thông Tin
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
