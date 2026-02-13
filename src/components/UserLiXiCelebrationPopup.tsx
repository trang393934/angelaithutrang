import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLiXiCelebration } from "@/hooks/useLiXiCelebration";
import { FireworkBurst } from "@/components/lixi/FireworkBurst";
import { LiXiEffects } from "@/components/lixi/LiXiEffects";
import { Lantern } from "@/components/lixi/Lantern";
import camlyCoinNew from "@/assets/camly-coin-new.png";

/* ── Inline keyframes ── */
const inlineStyles = `
@keyframes goldShimmer {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
@keyframes floatSway {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-6px) rotate(2deg); }
}
@keyframes grainShift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-1px, 1px); }
  50% { transform: translate(1px, -1px); }
  75% { transform: translate(-1px, -1px); }
  100% { transform: translate(0, 0); }
}
`;

/* ── Cành hoa đào lớn, chi tiết (pink peach blossoms) ── */
const PeachBranch = ({ x, y, flip = false, scale = 1 }: { x: string; y: string; flip?: boolean; scale?: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: x,
      top: y,
      transform: `scale(${flip ? -scale : scale}, ${scale})`,
      transformOrigin: flip ? "right top" : "left top",
      filter: "drop-shadow(0 2px 4px rgba(180,80,80,0.15))",
    }}
  >
    <svg width="160" height="180" viewBox="0 0 160 180" fill="none">
      {/* Main branch */}
      <path d="M-5 50 Q20 42 45 55 Q65 65 90 60 Q115 54 140 68 Q150 72 160 75" stroke="#5C3310" strokeWidth="3.5" fill="none" opacity="0.85" strokeLinecap="round" />
      {/* Sub branches */}
      <path d="M35 55 Q40 75 52 92" stroke="#6B3E20" strokeWidth="2.2" fill="none" opacity="0.7" strokeLinecap="round" />
      <path d="M75 60 Q72 82 80 100" stroke="#6B3E20" strokeWidth="2" fill="none" opacity="0.65" strokeLinecap="round" />
      <path d="M110 58 Q115 78 108 95" stroke="#6B3E20" strokeWidth="1.8" fill="none" opacity="0.55" strokeLinecap="round" />
      {/* Large peach blossoms */}
      {[
        { cx: 22, cy: 38, r: 11 },
        { cx: 52, cy: 48, r: 12 },
        { cx: 88, cy: 52, r: 10 },
        { cx: 120, cy: 56, r: 11 },
        { cx: 42, cy: 78, r: 9 },
        { cx: 78, cy: 88, r: 10 },
        { cx: 112, cy: 82, r: 8 },
      ].map((f, i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx={f.cx}
              cy={f.cy - f.r * 0.7}
              rx={f.r * 0.45}
              ry={f.r * 0.85}
              fill={i % 3 === 0 ? "#ec407a" : i % 3 === 1 ? "#f48fb1" : "#f8bbd0"}
              opacity={0.82}
              transform={`rotate(${angle} ${f.cx} ${f.cy})`}
            />
          ))}
          <circle cx={f.cx} cy={f.cy} r={f.r * 0.32} fill="#ffd54f" />
          <circle cx={f.cx} cy={f.cy} r={f.r * 0.18} fill="#ffb300" opacity="0.6" />
        </g>
      ))}
      {/* Small buds */}
      {[
        { cx: 10, cy: 55 },
        { cx: 65, cy: 45 },
        { cx: 135, cy: 50 },
        { cx: 95, cy: 70 },
      ].map((pos, i) => (
        <g key={`bud-${i}`}>
          {[0, 120, 240].map((angle) => (
            <ellipse
              key={angle}
              cx={pos.cx}
              cy={pos.cy - 3}
              rx="2.5"
              ry="5"
              fill="#f8bbd0"
              opacity="0.65"
              transform={`rotate(${angle} ${pos.cx} ${pos.cy})`}
            />
          ))}
          <circle cx={pos.cx} cy={pos.cy} r="2" fill="#ffcc02" opacity="0.8" />
        </g>
      ))}
      {/* Leaves */}
      <ellipse cx="30" cy="65" rx="3.5" ry="9" fill="#66bb6a" opacity="0.55" transform="rotate(-25 30 65)" />
      <ellipse cx="68" cy="72" rx="3" ry="8" fill="#4caf50" opacity="0.45" transform="rotate(15 68 72)" />
      <ellipse cx="105" cy="68" rx="3" ry="7.5" fill="#66bb6a" opacity="0.5" transform="rotate(-20 105 68)" />
      <ellipse cx="140" cy="62" rx="2.5" ry="7" fill="#4caf50" opacity="0.4" transform="rotate(10 140 62)" />
    </svg>
  </div>
);

/* ── Hoa mai vàng (yellow apricot blossoms) ── */
const ApricotBranch = ({ x, y, flip = false, scale = 1 }: { x: string; y: string; flip?: boolean; scale?: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: x,
      top: y,
      transform: `scale(${flip ? -scale : scale}, ${scale})`,
      transformOrigin: flip ? "right bottom" : "left bottom",
      filter: "drop-shadow(0 2px 4px rgba(180,140,20,0.15))",
    }}
  >
    <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
      <path d="M-5 70 Q20 62 50 72 Q75 80 100 74 Q115 70 130 78" stroke="#7A5518" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round" />
      <path d="M40 72 Q44 90 50 108" stroke="#7A5518" strokeWidth="1.8" fill="none" opacity="0.55" strokeLinecap="round" />
      <path d="M80 76 Q78 95 85 110" stroke="#7A5518" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      {[
        { cx: 18, cy: 60, r: 10 },
        { cx: 55, cy: 64, r: 11 },
        { cx: 90, cy: 68, r: 10 },
        { cx: 115, cy: 66, r: 9 },
        { cx: 45, cy: 92, r: 8 },
        { cx: 82, cy: 98, r: 9 },
      ].map((f, i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx={f.cx}
              cy={f.cy - f.r * 0.6}
              rx={f.r * 0.4}
              ry={f.r * 0.8}
              fill={i % 2 === 0 ? "#ffd700" : "#ffeb3b"}
              opacity={0.88}
              transform={`rotate(${angle} ${f.cx} ${f.cy})`}
            />
          ))}
          <circle cx={f.cx} cy={f.cy} r={f.r * 0.28} fill="#b8860b" />
        </g>
      ))}
      <ellipse cx="65" cy="85" rx="3" ry="8" fill="#66bb6a" opacity="0.45" transform="rotate(20 65 85)" />
      <ellipse cx="100" cy="80" rx="2.5" ry="7" fill="#4caf50" opacity="0.4" transform="rotate(-15 100 80)" />
    </svg>
  </div>
);

/* ── Bao lì xì đỏ (Red Envelope) – chi tiết cao ── */
const RedEnvelope = () => (
  <div className="relative mx-auto" style={{ width: 52, height: 68 }}>
    {/* Body */}
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(180deg, #e53935 0%, #d32f2f 40%, #b71c1c 100%)",
        borderRadius: 8,
        boxShadow: "0 6px 20px rgba(180,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.25)",
      }}
    />
    {/* Gold trim lines */}
    <div className="absolute left-2 right-2" style={{ top: 10, height: 1, background: "linear-gradient(90deg, transparent, #ffd700 30%, #ffec8b 50%, #ffd700 70%, transparent)" }} />
    <div className="absolute left-2 right-2" style={{ bottom: 10, height: 1, background: "linear-gradient(90deg, transparent, #ffd700 30%, #ffec8b 50%, #ffd700 70%, transparent)" }} />
    {/* Flap (top) */}
    <div
      className="absolute top-0 left-0 right-0"
      style={{
        height: "40%",
        background: "linear-gradient(180deg, #ef5350 0%, #e53935 100%)",
        borderRadius: "8px 8px 0 0",
        borderBottom: "2px solid #ffd700",
      }}
    />
    {/* Gold medallion center */}
    <div
      className="absolute rounded-full flex items-center justify-center"
      style={{
        width: 26, height: 26,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "linear-gradient(135deg, #ffd700 0%, #ffec8b 35%, #ffc107 65%, #daa520 100%)",
        boxShadow: "0 2px 8px rgba(200,160,0,0.6), inset 0 1px 2px rgba(255,255,255,0.4)",
        border: "2px solid #b8860b",
      }}
    >
      <span style={{ color: "#7A5518", fontSize: 12, fontWeight: 900, fontFamily: "serif" }}>福</span>
    </div>
  </div>
);

/* ── Cánh hoa rơi – animation tự nhiên hơn ── */
const FallingPetal = ({ delay, left, color, size = 10 }: { delay: number; left: number; color: string; size?: number }) => (
  <motion.div
    className="absolute pointer-events-none z-10"
    style={{ left: `${left}%`, top: -15 }}
    initial={{ y: 0, opacity: 0, rotate: 0 }}
    animate={{
      y: ["0%", "110vh"],
      opacity: [0, 0.75, 0.75, 0],
      rotate: [0, 120 + Math.random() * 120, 360],
      x: [0, (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 25)],
    }}
    transition={{ duration: 6 + Math.random() * 4, delay, repeat: Infinity, repeatDelay: 1 + Math.random() * 3 }}
  >
    <svg width={size} height={size * 1.2} viewBox="0 0 10 12" fill="none">
      <ellipse cx="5" cy="6" rx="4" ry="5.5" fill={color} opacity="0.7" />
    </svg>
  </motion.div>
);

/* ── Viền trang trí góc parchment ── */
const CornerOrnament = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
  const rotations = { tl: "0", tr: "90", bl: "270", br: "180" };
  const positions = {
    tl: { top: -2, left: -2 },
    tr: { top: -2, right: -2 },
    bl: { bottom: -2, left: -2 },
    br: { bottom: -2, right: -2 },
  };
  return (
    <div className="absolute pointer-events-none" style={{ ...positions[position], transform: `rotate(${rotations[position]}deg)` }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M0 4 Q0 0 4 0 L12 0" stroke="#C9A227" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M0 4 L0 12" stroke="#C9A227" strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="3" cy="3" r="1.5" fill="#C9A227" opacity="0.5" />
      </svg>
    </div>
  );
};

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
    <>
      <style>{inlineStyles}</style>
      <Dialog open={showPopup} onOpenChange={(open) => { if (!open) { if (alreadyClaimed) setShowPopup(false); else handleClaim(); } }}>
        <DialogPortal>
          {/* Overlay: dark 45% + blur */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92%] max-w-[720px] outline-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="relative overflow-hidden"
              style={{
                /* ── Nền vàng ánh kim nhiều lớp ── */
                background: "linear-gradient(175deg, #FDF6D8 0%, #F5E4A0 30%, #EECF6D 60%, #D4A843 85%, #C49538 100%)",
                border: "2px solid #C9A227",
                borderRadius: 18,
                padding: "36px 44px",
                boxShadow: "0 25px 70px rgba(0,0,0,0.3), 0 8px 30px rgba(180,130,30,0.2), inset 0 0 40px rgba(255,220,100,0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
                maxHeight: "92vh",
                overflowY: "auto",
              }}
            >
              {/* ── Lớp texture grain vàng (SVG noise) ── */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
                  backgroundSize: "200px 200px",
                  animation: "grainShift 8s linear infinite",
                  opacity: 0.5,
                  mixBlendMode: "overlay",
                }}
              />

              {/* ── Gold shimmer sweep ── */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 25%, rgba(255,248,200,0.2) 45%, transparent 55%, rgba(255,255,255,0.15) 75%, transparent 100%)",
                  animation: "goldShimmer 6s ease-in-out infinite",
                }}
              />

              {/* ── Inner glow vàng ── */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 30%, rgba(255,220,100,0.3) 0%, transparent 60%)",
                }}
              />

              {/* ── Cành hoa đào góc trên trái ── */}
              <PeachBranch x="-20px" y="-20px" scale={0.85} />
              {/* ── Cành hoa đào góc trên phải (mirror) ── */}
              <PeachBranch x="calc(100% - 130px)" y="-15px" flip scale={0.72} />
              {/* ── Hoa mai góc dưới trái ── */}
              <ApricotBranch x="-10px" y="calc(100% - 115px)" scale={0.72} />
              {/* ── Hoa mai góc dưới phải ── */}
              <ApricotBranch x="calc(100% - 115px)" y="calc(100% - 105px)" flip scale={0.6} />

              {/* ── Đèn lồng đỏ – lớn hơn, chi tiết hơn ── */}
              <Lantern x="3%" y="-2%" size={42} delay={0.15} />
              <Lantern x="13%" y="4%" size={28} delay={0.3} />
              <Lantern x="82%" y="-1%" size={34} delay={0.25} />
              <Lantern x="91%" y="5%" size={22} delay={0.4} />

              {/* ── Cánh hoa rơi (nhiều hơn, tự nhiên hơn) ── */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <FallingPetal
                  key={i}
                  delay={i * 0.6}
                  left={5 + i * 12}
                  color={i % 3 === 0 ? "#ec407a" : i % 3 === 1 ? "#f48fb1" : "#ffd700"}
                  size={8 + (i % 3) * 2}
                />
              ))}

              {/* ── Pháo hoa ── */}
              <AnimatePresence>
                {showEffects && (
                  <>
                    <FireworkBurst x={18} y={8} delay={0.3} />
                    <FireworkBurst x={82} y={12} delay={0.8} />
                    <FireworkBurst x={50} y={4} delay={1.3} />
                  </>
                )}
              </AnimatePresence>

              {/* ── Hiệu ứng confetti + coin rơi ── */}
              <LiXiEffects showEffects={showEffects} />

              {/* ── Nút đóng ── */}
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-3.5 right-3.5 z-40 p-1.5 rounded-full transition-all"
                style={{
                  background: "rgba(90,58,0,0.12)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <X className="w-5 h-5" style={{ color: "#5A3A00" }} />
              </button>

              {/* ── Nội dung chính ── */}
              <div className="relative z-20 flex flex-col items-center text-center">
                {/* ── Bao lì xì đỏ ── */}
                <motion.div
                  initial={{ y: -25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  className="mb-5"
                  style={{ animation: "floatSway 4s ease-in-out infinite" }}
                >
                  <RedEnvelope />
                </motion.div>

                {/* ── Khung parchment (thiệp giấy cổ) ── */}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.18, duration: 0.35, ease: "easeOut" }}
                  className="w-full relative"
                  style={{
                    background: "linear-gradient(180deg, #FFFEFB 0%, #FFF9EC 40%, #FFF4D9 100%)",
                    border: "1.5px solid #DFC87A",
                    borderRadius: 16,
                    padding: "32px 28px",
                    boxShadow: "inset 0 0 24px rgba(200,160,60,0.08), 0 10px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(180,140,40,0.15)",
                  }}
                >
                  {/* Corner ornaments */}
                  <CornerOrnament position="tl" />
                  <CornerOrnament position="tr" />
                  <CornerOrnament position="bl" />
                  <CornerOrnament position="br" />

                  {/* ── Đường viền trang trí ngang ── */}
                  <div className="mx-auto mb-5" style={{ width: "60%", height: 1, background: "linear-gradient(90deg, transparent, #C9A227 20%, #DFC87A 50%, #C9A227 80%, transparent)" }} />

                  {/* Tiêu đề */}
                  <motion.h2
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.28 }}
                    className="mb-6 leading-snug"
                    style={{
                      color: "#5A3A00",
                      fontFamily: "'Playfair Display', 'Georgia', 'Noto Serif', 'Times New Roman', serif",
                      fontSize: 28,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      textShadow: "0 1px 2px rgba(180,140,40,0.1)",
                    }}
                  >
                    {alreadyClaimed ? "Bạn đã nhận Lì xì thành công!" : "Chúc mừng bạn đã nhận được Lì xì!"}
                  </motion.h2>

                  {/* ── Đường viền trang trí ngang ── */}
                  <div className="mx-auto mb-5" style={{ width: "40%", height: 1, background: "linear-gradient(90deg, transparent, #DFC87A 30%, #C9A227 50%, #DFC87A 70%, transparent)" }} />

                  {/* Info blocks – icon trái + text phải */}
                  <div className="space-y-4">
                    <motion.div
                      initial={{ x: -18, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.38 }}
                      className="flex items-start gap-3.5 text-left"
                    >
                      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>🎁</span>
                      <p style={{
                        color: "#5C4A1A",
                        fontSize: 16,
                        lineHeight: 1.65,
                        fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                      }}>
                        Bạn nhận được{" "}
                        <span style={{ fontWeight: 700, color: "#C99700" }}>
                          {formatNum(pendingLiXi.camlyAmount)} Camly Coin
                        </span>
                        , được quy đổi dựa trên{" "}
                        <span style={{ fontWeight: 700, color: "#C99700" }}>
                          {formatNum(pendingLiXi.funAmount)} FUN Money
                        </span>
                        .
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ x: -18, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.48 }}
                      className="flex items-start gap-3.5 text-left"
                    >
                      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>🎁</span>
                      <p style={{
                        color: "#5C4A1A",
                        fontSize: 16,
                        lineHeight: 1.65,
                        fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                      }}>
                        Chương trình Lì xì Tết tổng giá trị{" "}
                        <span style={{ fontWeight: 700, color: "#C99700" }}>
                          26.000.000.000 VND
                        </span>
                        , được phân phối bằng FUN Money & Camly Coin.
                      </p>
                    </motion.div>
                  </div>

                  {/* ── Hai nút hành động ── */}
                  <motion.div
                    initial={{ y: 22, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.58 }}
                    className="flex flex-col sm:flex-row gap-4 w-full mt-8 justify-center"
                  >
                    <motion.button
                      whileHover={!isDisabled ? { filter: "brightness(1.08)", y: -2 } : {}}
                      whileTap={!isDisabled ? { y: 3, boxShadow: "0 2px 0 #183018, 0 5px 10px rgba(0,0,0,0.15)" } : {}}
                      onClick={handleClaim}
                      disabled={isDisabled}
                      className="w-full sm:w-auto disabled:opacity-55 disabled:cursor-not-allowed transition-all"
                      style={{
                        height: 50,
                        padding: "0 40px",
                        borderRadius: 10,
                        background: isDisabled
                          ? "linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)"
                          : "linear-gradient(180deg, #2F5E2F 0%, #1E3D1E 100%)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: "1px",
                        border: "none",
                        boxShadow: isDisabled
                          ? "0 4px 0 #333, 0 8px 16px rgba(0,0,0,0.15)"
                          : "0 5px 0 #183018, 0 12px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      {alreadyClaimed ? "ĐÃ NHẬN ✓" : isClaiming ? "ĐANG XỬ LÝ..." : "CLAIM"}
                    </motion.button>

                    <motion.button
                      whileHover={{ background: "rgba(201,162,39,0.1)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => window.open("/admin/tet-reward", "_blank")}
                      className="w-full sm:w-auto transition-all"
                      style={{
                        height: 50,
                        padding: "0 32px",
                        borderRadius: 10,
                        border: "1.5px solid #C9A227",
                        background: "transparent",
                        color: "#5A3A00",
                        fontWeight: 500,
                        fontSize: 15,
                        cursor: "pointer",
                      }}
                    >
                      Thêm thông tin 👆
                    </motion.button>
                  </motion.div>

                  {/* ── Đường viền trang trí ngang ── */}
                  <div className="mx-auto mt-5 mb-2" style={{ width: "30%", height: 1, background: "linear-gradient(90deg, transparent, #DFC87A 30%, #C9A227 50%, #DFC87A 70%, transparent)" }} />

                  {/* Dòng thời hạn */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.68 }}
                    className="text-center mt-2"
                    style={{
                      fontSize: 13,
                      color: "#8A6B1F",
                      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                    }}
                  >
                    Áp dụng đến 08/02/2026
                  </motion.p>
                </motion.div>
              </div>

              {/* ── Đồng Camly Coin góc trái dưới (3 coins chồng, glow mạnh) ── */}
              <motion.div
                className="absolute bottom-4 left-4 z-30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.75, type: "spring", stiffness: 180 }}
              >
                <img
                  src={camlyCoinNew}
                  alt=""
                  className="absolute rounded-full"
                  style={{ width: 36, height: 36, bottom: 24, left: 28, filter: "drop-shadow(0 2px 6px rgba(255,215,0,0.3))", opacity: 0.6 }}
                />
                <img
                  src={camlyCoinNew}
                  alt=""
                  className="absolute rounded-full"
                  style={{ width: 46, height: 46, bottom: 14, left: 12, filter: "drop-shadow(0 3px 10px rgba(255,215,0,0.45))", opacity: 0.8 }}
                />
                <img
                  src={camlyCoinNew}
                  alt="Camly Coin"
                  className="relative rounded-full"
                  style={{ width: 58, height: 58, filter: "drop-shadow(0 4px 14px rgba(255,215,0,0.6))" }}
                />
              </motion.div>

              {/* ── Đồng coin nhỏ góc phải dưới ── */}
              <motion.div
                className="absolute bottom-5 right-5 z-30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 180 }}
              >
                <img
                  src={camlyCoinNew}
                  alt=""
                  className="rounded-full"
                  style={{ width: 38, height: 38, filter: "drop-shadow(0 3px 8px rgba(255,215,0,0.4))", opacity: 0.7 }}
                />
              </motion.div>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
