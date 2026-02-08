import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ExternalLink } from "lucide-react";
import { useLiXiCelebration } from "@/hooks/useLiXiCelebration";
import camlyCoinLogo from "@/assets/camly-coin-new.png";
import funMoneyCoinLogo from "@/assets/fun-money-coin.png";

/* ── Hoa đào rơi (petal) ── */
const CherryPetal = ({ delay, startX, size }: { delay: number; startX: number; size: number }) => (
  <motion.div
    className="absolute pointer-events-none z-30"
    style={{
      left: `${startX}%`,
      width: size,
      height: size,
      borderRadius: "50% 0 50% 50%",
      background: `linear-gradient(135deg, #ffb7c5 0%, #ff69b4 40%, #ff1493 100%)`,
      opacity: 0.85,
      boxShadow: "0 0 4px rgba(255,105,180,0.4)",
    }}
    initial={{ y: -20, opacity: 0, rotate: 0 }}
    animate={{
      y: ["0%", "110vh"],
      opacity: [0, 0.9, 0.9, 0.7, 0],
      rotate: [0, 180, 360, 540],
      x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40],
    }}
    transition={{ duration: 5 + Math.random() * 3, delay, ease: "easeOut" }}
  />
);

/* ── Đèn lồng SVG ── */
const Lantern = ({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) => (
  <motion.div
    className="absolute pointer-events-none z-10"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8 }}
  >
    <motion.div
      animate={{ rotate: [-3, 3, -3] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "top center" }}
    >
      {/* Dây treo */}
      <div className="mx-auto" style={{ width: 2, height: size * 0.3, background: "#8B4513" }} />
      {/* Thân đèn */}
      <div
        className="rounded-lg relative overflow-hidden mx-auto"
        style={{
          width: size,
          height: size * 1.3,
          background: "linear-gradient(180deg, #e32636 0%, #cc0000 40%, #b30000 100%)",
          boxShadow: "0 0 12px rgba(255,50,50,0.5), inset 0 0 8px rgba(255,200,100,0.3)",
        }}
      >
        {/* Sọc vàng */}
        <div className="absolute top-1/4 inset-x-0 h-px" style={{ background: "#ffd700" }} />
        <div className="absolute top-1/2 inset-x-0 h-px" style={{ background: "#ffd700" }} />
        <div className="absolute top-3/4 inset-x-0 h-px" style={{ background: "#ffd700" }} />
        {/* Ánh sáng bên trong */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-300/20 to-transparent" />
      </div>
      {/* Tua đèn */}
      <div className="mx-auto" style={{ width: size * 0.3, height: size * 0.4, borderBottom: `${size * 0.4}px solid #ffd700`, borderLeft: "3px solid transparent", borderRight: "3px solid transparent", borderTop: 0 }} />
    </motion.div>
  </motion.div>
);

/* ── Cành hoa đào CSS ── */
const CherryBranch = ({ side }: { side: "left" | "right" }) => {
  const isLeft = side === "left";
  const flowers = isLeft
    ? [
        { x: 10, y: 18, s: 14 }, { x: 25, y: 8, s: 12 }, { x: 40, y: 25, s: 10 },
        { x: 5, y: 40, s: 11 }, { x: 30, y: 38, s: 8 }, { x: 18, y: 50, s: 13 },
      ]
    : [
        { x: 60, y: 18, s: 14 }, { x: 75, y: 8, s: 12 }, { x: 90, y: 25, s: 10 },
        { x: 95, y: 40, s: 11 }, { x: 70, y: 38, s: 8 }, { x: 82, y: 50, s: 13 },
      ];

  return (
    <div className="absolute top-0 inset-x-0 h-24 pointer-events-none z-10 overflow-hidden">
      {/* Cành */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        {isLeft ? (
          <>
            <path d="M-5 0 Q15 15 45 30" stroke="#5D3A1A" strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M0 5 Q20 20 35 40" stroke="#5D3A1A" strokeWidth="0.6" fill="none" opacity="0.5" />
          </>
        ) : (
          <>
            <path d="M105 0 Q85 15 55 30" stroke="#5D3A1A" strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M100 5 Q80 20 65 40" stroke="#5D3A1A" strokeWidth="0.6" fill="none" opacity="0.5" />
          </>
        )}
      </svg>
      {/* Hoa */}
      {flowers.map((f, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.s, height: f.s }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: i % 3 === 0
                ? "radial-gradient(circle, #fff 20%, #ffb7c5 60%, #ff69b4 100%)"
                : i % 3 === 1
                ? "radial-gradient(circle, #fff 20%, #ffe066 60%, #ffd700 100%)"
                : "radial-gradient(circle, #fff 30%, #ffc0cb 70%, #ff91a4 100%)",
              boxShadow: "0 0 4px rgba(255,105,180,0.4)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

/* ── Confetti ── */
const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
  "#FF9A9E", "#A18CD1", "#FBC2EB", "#84FAB0", "#F6D365",
];

const ConfettiPiece = ({ delay, left, color, size }: { delay: number; left: number; color: string; size: number }) => (
  <motion.div
    className="absolute rounded-sm pointer-events-none"
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

/* ── Đồng coin rơi ── */
const FallingCoin = ({ delay, left, size, logo }: { delay: number; left: number; size: number; logo: string }) => (
  <motion.div
    className="absolute z-10 pointer-events-none"
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
    <img src={logo} alt="" className="w-full h-full drop-shadow-md rounded-full" />
  </motion.div>
);

/* ── Bokeh lấp lánh ── */
const BokehDot = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      background: "radial-gradient(circle, rgba(255,255,200,0.8) 0%, rgba(255,215,0,0.3) 50%, transparent 100%)",
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.5, 0.5] }}
    transition={{ duration: 2.5, delay, repeat: Infinity, repeatDelay: 1 }}
  />
);

/* ── Dữ liệu animation tĩnh ── */
const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
  id: i, delay: Math.random() * 3, left: Math.random() * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], size: 5 + Math.random() * 5,
}));

const fallingCoins = Array.from({ length: 18 }, (_, i) => ({
  id: i, delay: Math.random() * 3.5, left: Math.random() * 100,
  size: 14 + Math.random() * 14, isCamly: i % 2 === 0,
}));

const petals = Array.from({ length: 20 }, (_, i) => ({
  id: i, delay: Math.random() * 4, startX: Math.random() * 100,
  size: 6 + Math.random() * 8,
}));

const bokehs = Array.from({ length: 12 }, (_, i) => ({
  id: i, delay: Math.random() * 3, x: Math.random() * 100,
  y: Math.random() * 100, size: 8 + Math.random() * 20,
}));

/* ── Component chính ── */
export function UserLiXiCelebrationPopup() {
  const { showPopup, setShowPopup, pendingLiXi, claim } = useLiXiCelebration();
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    if (showPopup) {
      setShowEffects(true);
      const timer = setTimeout(() => setShowEffects(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  if (!pendingLiXi) return null;

  const formatNum = (n: number) => n.toLocaleString("vi-VN");

  const handleClaim = () => { claim(); };

  return (
    <Dialog open={showPopup} onOpenChange={(open) => { if (!open) handleClaim(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden max-h-[92vh]">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(255,236,139,0.6) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(255,215,0,0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(255,248,220,0.3) 0%, transparent 70%),
              linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 30%, #ffec8b 50%, #ffd700 70%, #daa520 85%, #b8860b 100%)
            `,
            minHeight: 420,
          }}
        >
          {/* ── Bokeh lấp lánh nền ── */}
          {bokehs.map((b) => (
            <BokehDot key={`bk-${b.id}`} delay={b.delay} x={b.x} y={b.y} size={b.size} />
          ))}

          {/* ── Cành hoa đào hai bên ── */}
          <CherryBranch side="left" />
          <CherryBranch side="right" />

          {/* ── Đèn lồng ── */}
          <Lantern x="6%" y="0" size={22} delay={0.4} />
          <Lantern x="82%" y="2%" size={18} delay={0.6} />

          {/* ── Hiệu ứng confetti + coin rơi + cánh hoa rơi ── */}
          <AnimatePresence>
            {showEffects && (
              <>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {confettiPieces.map((p) => (
                    <ConfettiPiece key={`c-${p.id}`} delay={p.delay} left={p.left} color={p.color} size={p.size} />
                  ))}
                </div>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {fallingCoins.map((c) => (
                    <FallingCoin key={`fc-${c.id}`} delay={c.delay} left={c.left} size={c.size} logo={c.isCamly ? camlyCoinLogo : funMoneyCoinLogo} />
                  ))}
                </div>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
                  {petals.map((p) => (
                    <CherryPetal key={`pt-${p.id}`} delay={p.delay} startX={p.startX} size={p.size} />
                  ))}
                </div>
              </>
            )}
          </AnimatePresence>

          {/* ── Lớp phủ ánh sáng mềm ── */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/25 pointer-events-none" />

          {/* ── Nút đóng ── */}
          <button
            onClick={handleClaim}
            className="absolute top-3 right-3 z-40 p-1.5 rounded-full bg-black/15 hover:bg-black/30 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white drop-shadow" />
          </button>

          {/* ── Nội dung chính ── */}
          <div className="relative z-20 flex flex-col items-center text-center px-5 pt-20 pb-5 space-y-4">
            {/* Bao lì xì 3D */}
            <motion.div
              initial={{ y: -30, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", bounce: 0.5 }}
              className="relative"
            >
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(145deg, #e32636 0%, #cc0000 50%, #a00000 100%)",
                  boxShadow: "0 6px 20px rgba(200,0,0,0.5), inset 0 1px 2px rgba(255,200,100,0.3)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: "radial-gradient(circle, #ffd700 30%, #daa520 70%, #b8860b 100%)",
                    boxShadow: "0 0 10px rgba(255,215,0,0.6)",
                  }}
                />
              </div>
              {/* Glow bao lì xì */}
              <div className="absolute -inset-2 bg-red-500/20 blur-xl rounded-full -z-10" />
            </motion.div>

            {/* ── Khung giấy cổ ── */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring" }}
              className="w-full rounded-xl p-5 relative"
              style={{
                background: `
                  url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"),
                  linear-gradient(170deg, #fdf8e8 0%, #faf3d6 25%, #f5edc5 50%, #faf3d6 75%, #fdf8e8 100%)
                `,
                border: "3px solid #c8a84e",
                boxShadow: `
                  inset 0 0 30px rgba(200,160,60,0.15),
                  inset 0 0 60px rgba(200,160,60,0.05),
                  0 10px 40px rgba(0,0,0,0.2),
                  0 2px 8px rgba(0,0,0,0.1)
                `,
              }}
            >
              {/* Viền trang trí trên */}
              <div className="absolute top-0 left-4 right-4 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #d4a843, #ffd700, #d4a843, transparent)" }} />
              {/* Viền trang trí dưới */}
              <div className="absolute bottom-0 left-4 right-4 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #d4a843, #ffd700, #d4a843, transparent)" }} />
              {/* Góc trang trí */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl" style={{ borderColor: "#c8a84e" }} />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr" style={{ borderColor: "#c8a84e" }} />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl" style={{ borderColor: "#c8a84e" }} />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br" style={{ borderColor: "#c8a84e" }} />

              {/* Tiêu đề */}
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-xl font-bold mb-4 leading-snug"
                style={{
                  color: "#6B3A10",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  textShadow: "0 1px 2px rgba(200,160,60,0.3)",
                }}
              >
                Chúc mừng bạn đã nhận được Lì xì!
              </motion.h2>

              {/* Chi tiết phần thưởng */}
              <div className="space-y-3.5 text-sm" style={{ color: "#5D3A1A" }}>
                {/* Dòng Camly Coin */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="text-lg mt-0.5">🎁</span>
                  <div className="text-left flex-1">
                    <p className="leading-relaxed">
                      Bạn nhận được{" "}
                      <span className="font-bold text-lg" style={{ color: "#8B6914" }}>
                        {formatNum(pendingLiXi.camlyAmount)}
                      </span>{" "}
                      <span className="font-bold" style={{ color: "#B8860B" }}>Camly Coin</span>,
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#7A6530" }}>
                      được quy đổi dựa trên{" "}
                      <span className="font-bold" style={{ color: "#8B6914" }}>
                        {formatNum(pendingLiXi.funAmount)}
                      </span>{" "}
                      FUN Money.
                    </p>
                  </div>
                </motion.div>

                {/* Dòng chương trình */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="text-lg mt-0.5">🎁</span>
                  <div className="text-left flex-1">
                    <p className="leading-relaxed">
                      Chương trình Lì xì Tết tổng giá trị
                    </p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: "#B8860B" }}>
                      26.000.000.000 VND,
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#7A6530" }}>
                      được phân phối bằng FUN Money & Camly Coin.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Logo đồng coin xoay 3D */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-between items-center px-4 pt-4"
              >
                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 2.5, repeat: 3, ease: "linear" }}
                  className="relative"
                  style={{ perspective: 200 }}
                >
                  <div className="absolute inset-0 bg-yellow-300/40 blur-xl rounded-full scale-150" />
                  <img src={camlyCoinLogo} alt="Camly Coin" className="w-14 h-14 relative z-10 drop-shadow-lg rounded-full" />
                </motion.div>

                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 2.5, repeat: 3, ease: "linear", delay: 0.4 }}
                  className="relative"
                  style={{ perspective: 200 }}
                >
                  <div className="absolute inset-0 bg-yellow-300/40 blur-xl rounded-full scale-150" />
                  <img src={funMoneyCoinLogo} alt="FUN Money" className="w-14 h-14 relative z-10 drop-shadow-lg rounded-full" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* ── Hai nút hành động ── */}
            <motion.div
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65, type: "spring" }}
              className="flex gap-3 w-full"
            >
              {/* Nút CLAIM - xanh lá đậm */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClaim}
                className="flex-1 h-12 rounded-xl text-white font-bold text-lg tracking-widest transition-all"
                style={{
                  background: "linear-gradient(145deg, #2d7a3a 0%, #1a6b28 50%, #145a1f 100%)",
                  border: "2px solid #0f4a17",
                  boxShadow: "0 4px 16px rgba(30,100,40,0.5), inset 0 1px 1px rgba(255,255,255,0.2)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                CLAIM
              </motion.button>

              {/* Nút Thêm thông tin */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.open("/admin/tet-reward", "_blank")}
                className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "2px solid #b8a070",
                  color: "#5D3A1A",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                Thêm thông tin
                <ExternalLink className="w-4 h-4" style={{ color: "#8B6914" }} />
              </motion.button>
            </motion.div>

            {/* Dòng thời hạn */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="text-xs font-semibold tracking-wide"
              style={{
                color: "#6B3A10",
                textShadow: "0 0 8px rgba(255,215,0,0.5)",
              }}
            >
              ⏰ Áp dụng đến 08/02/2026
            </motion.p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
