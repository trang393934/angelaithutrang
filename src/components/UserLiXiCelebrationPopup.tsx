import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ExternalLink } from "lucide-react";
import { useLiXiCelebration } from "@/hooks/useLiXiCelebration";
import camlyCoinLogo from "@/assets/camly-coin-new.png";
import funMoneyCoinLogo from "@/assets/fun-money-coin.png";

/* ── Hiệu ứng trang trí ── */

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

const FallingCoin = ({ delay, left, size, logo }: { delay: number; left: number; size: number; logo: string }) => (
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
    <img src={logo} alt="" className="w-full h-full drop-shadow-md" />
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

/* ── Dữ liệu animation tĩnh ── */

const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  delay: Math.random() * 3,
  left: Math.random() * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + Math.random() * 6,
}));

const fallingCoins = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  delay: Math.random() * 3.5,
  left: Math.random() * 100,
  size: 16 + Math.random() * 16,
  isCamly: i % 2 === 0,
}));

const sparkles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  delay: Math.random() * 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
}));

/* ── Component chính ── */

export function UserLiXiCelebrationPopup() {
  const { showPopup, setShowPopup, pendingLiXi, claim } = useLiXiCelebration();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (showPopup) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  if (!pendingLiXi) return null;

  const formatNum = (n: number) => n.toLocaleString("vi-VN");

  const handleClaim = () => {
    claim();
  };

  return (
    <Dialog open={showPopup} onOpenChange={(open) => { if (!open) handleClaim(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden max-h-[90vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative rounded-2xl p-5 shadow-2xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%), linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 35%, #ffec8b 50%, #ffd700 65%, #daa520 85%, #b8860b 100%)`,
          }}
        >
          {/* Hiệu ứng confetti + đồng coin rơi + lấp lánh */}
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
                    <FallingCoin
                      key={`coin-${coin.id}`}
                      delay={coin.delay}
                      left={coin.left}
                      size={coin.size}
                      logo={coin.isCamly ? camlyCoinLogo : funMoneyCoinLogo}
                    />
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

          {/* Lớp phủ ánh sáng */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-white/30 pointer-events-none" />

          {/* Trang trí hoa đào + đèn lồng */}
          <div className="absolute top-2 left-3 text-2xl pointer-events-none select-none opacity-80">🌸</div>
          <div className="absolute top-2 right-3 text-2xl pointer-events-none select-none opacity-80">🌸</div>
          <div className="absolute top-10 left-6 text-lg pointer-events-none select-none opacity-60">🏮</div>
          <div className="absolute top-10 right-6 text-lg pointer-events-none select-none opacity-60">🏮</div>
          <div className="absolute bottom-3 left-4 text-sm pointer-events-none select-none opacity-50">🌿</div>
          <div className="absolute bottom-3 right-4 text-sm pointer-events-none select-none opacity-50">🌿</div>

          {/* Nút đóng */}
          <button
            onClick={handleClaim}
            className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-amber-900/20 hover:bg-amber-900/40 transition-colors"
          >
            <X className="w-5 h-5 text-amber-900" />
          </button>

          {/* Nội dung chính */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4 pt-2">
            {/* Bao lì xì */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="text-5xl"
            >
              🧧
            </motion.div>

            {/* Khung giấy cổ – nội dung chính */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-full rounded-xl p-5 shadow-lg space-y-4 relative"
              style={{
                background: "linear-gradient(135deg, #fdf8e8 0%, #faf3d6 30%, #f5edc5 60%, #fdf8e8 100%)",
                border: "2px solid #d4a843",
                boxShadow: "inset 0 0 20px rgba(212, 168, 67, 0.15), 0 8px 32px rgba(0,0,0,0.15)",
              }}
            >
              {/* Viền trang trí trên */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: "linear-gradient(90deg, transparent, #d4a843, #ffd700, #d4a843, transparent)" }} />

              {/* Tiêu đề */}
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-bold drop-shadow-sm"
                style={{ color: "#8B4513" }}
              >
                🎊 Chúc mừng bạn đã nhận được Lì xì!
              </motion.h2>

              {/* Thông tin phần thưởng */}
              <div className="space-y-3 text-sm" style={{ color: "#5D3A1A" }}>
                {/* Dòng Camly Coin */}
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">🎁</span>
                  <div className="text-left flex-1">
                    <p>
                      Bạn nhận được{" "}
                      <span className="font-bold text-base" style={{ color: "#8B6914" }}>
                        {formatNum(pendingLiXi.camlyAmount)}
                      </span>{" "}
                      <span className="font-semibold" style={{ color: "#C49B30" }}>Camly Coin</span>,
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7A6530" }}>
                      được quy đổi dựa trên{" "}
                      <span className="font-bold" style={{ color: "#8B6914" }}>
                        {formatNum(pendingLiXi.funAmount)}
                      </span>{" "}
                      <span className="font-semibold">FUN Money</span>.
                    </p>
                  </div>
                </div>

                {/* Dòng chương trình */}
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">🎁</span>
                  <div className="text-left flex-1">
                    <p>
                      Chương trình Lì xì Tết tổng giá trị{" "}
                      <span className="font-bold" style={{ color: "#C49B30" }}>26.000.000.000 VND</span>,
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7A6530" }}>
                      được phân phối bằng FUN Money và Camly Coin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Logo đồng coin */}
              <div className="flex justify-between items-center px-2 pt-2">
                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 3, repeat: 2, ease: "linear" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-yellow-300/40 blur-lg rounded-full" />
                  <img src={camlyCoinLogo} alt="Camly Coin" className="w-12 h-12 relative z-10 drop-shadow-md rounded-full" />
                </motion.div>

                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 3, repeat: 2, ease: "linear", delay: 0.5 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-yellow-300/40 blur-lg rounded-full" />
                  <img src={funMoneyCoinLogo} alt="FUN Money" className="w-12 h-12 relative z-10 drop-shadow-md" />
                </motion.div>
              </div>

              {/* Viền trang trí dưới */}
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{ background: "linear-gradient(90deg, transparent, #d4a843, #ffd700, #d4a843, transparent)" }} />
            </motion.div>

            {/* Hai nút hành động */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 w-full"
            >
              <Button
                onClick={handleClaim}
                className="flex-1 text-white font-bold text-base tracking-wider"
                size="lg"
                style={{
                  background: "linear-gradient(135deg, #2d7a3a 0%, #38a349 50%, #2d7a3a 100%)",
                  border: "1px solid #1f5c2b",
                  boxShadow: "0 4px 12px rgba(45, 122, 58, 0.4)",
                }}
              >
                🧧 CLAIM
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-semibold"
                size="lg"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  borderColor: "#b8a070",
                  color: "#5D3A1A",
                }}
                onClick={() => window.open("/admin/tet-reward", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Thêm thông tin
              </Button>
            </motion.div>

            {/* Dòng thời hạn */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs font-medium"
              style={{ color: "#8B4513" }}
            >
              ⏰ Áp dụng đến ngày 08/02/2026
            </motion.p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
