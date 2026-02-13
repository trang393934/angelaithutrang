import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useLiXiCelebration } from "@/hooks/useLiXiCelebration";
import { FireworkBurst } from "@/components/lixi/FireworkBurst";
import { LiXiEffects } from "@/components/lixi/LiXiEffects";
import { Lantern } from "@/components/lixi/Lantern";
import camlyCoinNew from "@/assets/camly-coin-new.png";

/* ── Hoa đào SVG (hồng) ── */
const PeachBlossom = ({ x, y, size = 28, rotate = 0 }: { x: string; y: string; size?: number; rotate?: number }) => (
  <div className="absolute pointer-events-none" style={{ left: x, top: y, transform: `rotate(${rotate}deg)` }}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="20" cy="8" rx="5" ry="10"
          fill="#f48fb1"
          opacity="0.85"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="4" fill="#ffd54f" />
    </svg>
  </div>
);

/* ── Hoa mai SVG (vàng) ── */
const ApricotBlossom = ({ x, y, size = 24, rotate = 0 }: { x: string; y: string; size?: number; rotate?: number }) => (
  <div className="absolute pointer-events-none" style={{ left: x, top: y, transform: `rotate(${rotate}deg)` }}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="20" cy="9" rx="4.5" ry="9"
          fill="#ffd700"
          opacity="0.9"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3.5" fill="#b8860b" />
    </svg>
  </div>
);

/* ── Bao lì xì đỏ (CSS) ── */
const RedEnvelope = () => (
  <div className="relative mx-auto" style={{ width: 56, height: 72 }}>
    <div
      className="absolute inset-0 rounded-lg"
      style={{
        background: "linear-gradient(180deg, #e32636 0%, #cc0000 50%, #a00000 100%)",
        boxShadow: "0 4px 16px rgba(200,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)",
      }}
    />
    {/* Đường viền trang trí */}
    <div className="absolute top-3 left-2 right-2 h-px" style={{ background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
    <div className="absolute bottom-3 left-2 right-2 h-px" style={{ background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
    {/* Đồng xu vàng ở giữa */}
    <div
      className="absolute rounded-full flex items-center justify-center"
      style={{
        width: 26, height: 26,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "linear-gradient(135deg, #ffd700 0%, #ffec8b 40%, #daa520 100%)",
        boxShadow: "0 2px 8px rgba(200,160,0,0.5)",
        border: "1.5px solid #b8860b",
      }}
    >
      <span style={{ color: "#8B6914", fontSize: 11, fontWeight: 800 }}>$</span>
    </div>
    {/* Nắp bao lì xì */}
    <div
      className="absolute top-0 left-0 right-0 rounded-t-lg"
      style={{
        height: "38%",
        background: "linear-gradient(180deg, #e32636 0%, #d42020 100%)",
        borderBottom: "2px solid #ffd700",
      }}
    />
  </div>
);

/* ── Cánh hoa rơi ── */
const FallingPetal = ({ delay, left, color }: { delay: number; left: number; color: string }) => (
  <motion.div
    className="absolute pointer-events-none z-10"
    style={{ left: `${left}%`, top: -10 }}
    initial={{ y: 0, opacity: 0, rotate: 0 }}
    animate={{
      y: ["0%", "120vh"],
      opacity: [0, 0.8, 0.8, 0],
      rotate: [0, 180, 360],
      x: [0, Math.random() > 0.5 ? 20 : -20],
    }}
    transition={{ duration: 5 + Math.random() * 3, delay, repeat: Infinity, repeatDelay: Math.random() * 2 }}
  >
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <ellipse cx="5" cy="6" rx="4" ry="5.5" fill={color} opacity="0.7" />
    </svg>
  </motion.div>
);

/* ── Component chính ── */
export function UserLiXiCelebrationPopup() {
  const isPreview = new URLSearchParams(window.location.search).get("preview_lixi") === "true";
  const hook = useLiXiCelebration();

  const [previewOpen, setPreviewOpen] = useState(isPreview);
  const showPopup = isPreview ? previewOpen : hook.showPopup;
  const setShowPopup = isPreview ? setPreviewOpen : hook.setShowPopup;
  const pendingLiXi = isPreview
    ? { id: "preview", camlyAmount: 5000, funAmount: 5 }
    : hook.pendingLiXi;
  const claim = isPreview ? () => setPreviewOpen(false) : hook.claim;
  const isClaiming = isPreview ? false : hook.isClaiming;
  const alreadyClaimed = isPreview ? false : hook.alreadyClaimed;

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

  const handleClaim = () => {
    if (alreadyClaimed) { setShowPopup(false); return; }
    claim();
  };

  const isDisabled = isClaiming || alreadyClaimed;

  return (
    <Dialog open={showPopup} onOpenChange={(open) => { if (!open) { if (alreadyClaimed) setShowPopup(false); else handleClaim(); } }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden max-h-[92vh]">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(170deg, #f5e6b8 0%, #e8cc7a 20%, #d4a843 50%, #c9953c 80%, #b8860b 100%)",
            border: "3px solid #b8860b",
            minHeight: 520,
          }}
        >
          {/* ── Hiệu ứng ánh kim nhẹ ── */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%, rgba(255,255,255,0.1) 100%)",
          }} />

          {/* ── Đèn lồng đỏ ── */}
          <Lantern x="6%" y="2%" size={32} delay={0.2} />
          <Lantern x="82%" y="2%" size={28} delay={0.4} />

          {/* ── Hoa đào (hồng) trang trí góc ── */}
          <PeachBlossom x="2%" y="8%" size={30} rotate={-15} />
          <PeachBlossom x="8%" y="18%" size={22} rotate={30} />
          <PeachBlossom x="78%" y="6%" size={26} rotate={20} />
          <PeachBlossom x="85%" y="16%" size={20} rotate={-25} />
          <PeachBlossom x="3%" y="82%" size={24} rotate={45} />
          <PeachBlossom x="82%" y="85%" size={22} rotate={-40} />

          {/* ── Hoa mai (vàng) trang trí ── */}
          <ApricotBlossom x="15%" y="5%" size={18} rotate={10} />
          <ApricotBlossom x="72%" y="10%" size={16} rotate={-30} />
          <ApricotBlossom x="10%" y="88%" size={18} rotate={60} />
          <ApricotBlossom x="75%" y="90%" size={16} rotate={-20} />

          {/* ── Cánh hoa rơi ── */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <FallingPetal key={i} delay={i * 0.8} left={10 + i * 15} color={i % 2 === 0 ? "#f48fb1" : "#ffd700"} />
          ))}

          {/* ── Pháo hoa ── */}
          <AnimatePresence>
            {showEffects && (
              <>
                <FireworkBurst x={20} y={10} delay={0.3} />
                <FireworkBurst x={80} y={15} delay={0.8} />
                <FireworkBurst x={50} y={5} delay={1.3} />
              </>
            )}
          </AnimatePresence>

          {/* ── Hiệu ứng confetti + coin rơi ── */}
          <LiXiEffects showEffects={showEffects} />

          {/* ── Nút đóng ── */}
          <button
            onClick={() => setShowPopup(false)}
            className="absolute top-3 right-3 z-40 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white drop-shadow" />
          </button>

          {/* ── Nội dung chính ── */}
          <div className="relative z-20 flex flex-col items-center text-center px-6 pt-6 pb-6">
            {/* ── Bao lì xì đỏ ── */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-4"
            >
              <RedEnvelope />
            </motion.div>

            {/* ── Khung giấy cổ (parchment) ── */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring" }}
              className="w-full rounded-xl p-6 relative"
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
              {/* Viền trang trí */}
              <div className="absolute top-0 left-4 right-4 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #d4a843, #ffd700, #d4a843, transparent)" }} />
              <div className="absolute bottom-0 left-4 right-4 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #d4a843, #ffd700, #d4a843, transparent)" }} />
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl" style={{ borderColor: "#c8a84e" }} />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr" style={{ borderColor: "#c8a84e" }} />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl" style={{ borderColor: "#c8a84e" }} />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br" style={{ borderColor: "#c8a84e" }} />

              {/* Tiêu đề */}
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-xl sm:text-2xl font-bold italic mb-5 leading-snug"
                style={{
                  color: "#6B3A10",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  textShadow: "0 1px 2px rgba(200,160,60,0.3)",
                }}
              >
                {alreadyClaimed ? "Bạn đã nhận Lì xì thành công!" : "Chúc mừng bạn đã nhận được Lì xì!"}
              </motion.h2>

              {/* Chi tiết phần thưởng */}
              <div className="space-y-4 text-base" style={{ color: "#5D3A1A" }}>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-center"
                >
                  <p className="leading-relaxed">
                    🎁 Bạn nhận được{" "}
                    <span className="font-bold text-lg sm:text-xl" style={{ color: "#8B6914" }}>
                      {formatNum(pendingLiXi.camlyAmount)}
                    </span>{" "}
                    <span className="font-bold" style={{ color: "#B8860B" }}>Camly Coin</span>,
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#7A6530" }}>
                    được quy đổi dựa trên{" "}
                    <span className="font-bold" style={{ color: "#8B6914" }}>
                      {formatNum(pendingLiXi.funAmount)}
                    </span>{" "}
                    FUN Money.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="text-center"
                >
                  <p className="leading-relaxed">
                    🎁 Chương trình Lì xì Tết tổng giá trị
                  </p>
                  <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: "#B8860B" }}>
                    26,000,000,000 VND,
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#7A6530" }}>
                    được phân phối bằng FUN Money & Camly Coin.
                  </p>
                </motion.div>
              </div>

              {/* Hai nút hành động */}
              <motion.div
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65, type: "spring" }}
                className="flex gap-3 w-full mt-5"
              >
                <motion.button
                  whileHover={!isDisabled ? { scale: 1.03 } : {}}
                  whileTap={!isDisabled ? { scale: 0.97 } : {}}
                  onClick={handleClaim}
                  disabled={isDisabled}
                  className="flex-1 h-12 rounded-xl text-white font-bold text-lg tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: isDisabled
                      ? "linear-gradient(145deg, #5a5a5a 0%, #4a4a4a 50%, #3a3a3a 100%)"
                      : "linear-gradient(145deg, #2d7a3a 0%, #1a6b28 50%, #145a1f 100%)",
                    border: `2px solid ${isDisabled ? '#444' : '#0f4a17'}`,
                    boxShadow: isDisabled
                      ? "0 4px 16px rgba(80,80,80,0.3)"
                      : "0 4px 16px rgba(30,100,40,0.5), inset 0 1px 1px rgba(255,255,255,0.2)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                >
                  {alreadyClaimed ? "ĐÃ NHẬN ✓" : isClaiming ? "ĐANG XỬ LÝ..." : "CLAIM"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.open("/admin/tet-reward", "_blank")}
                  className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "3px solid #b8a070",
                    color: "#5D3A1A",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  Thêm thông tin 👆
                </motion.button>
              </motion.div>

              {/* Dòng thời hạn */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="text-xs font-semibold tracking-wide text-center mt-3"
                style={{
                  color: "#6B3A10",
                  textShadow: "0 0 8px rgba(255,215,0,0.5)",
                }}
              >
                Áp dụng đến 08/02/2026
              </motion.p>
            </motion.div>
          </div>

          {/* ── Đồng Camly Coin góc trái dưới ── */}
          <motion.div
            className="absolute bottom-3 left-3 z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            <img src={camlyCoinNew} alt="Camly Coin" className="w-12 h-12 drop-shadow-lg rounded-full" />
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
