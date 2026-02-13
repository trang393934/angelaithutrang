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

/* ── Cành hoa đào SVG (hồng) – chi tiết hơn với branches ── */
const PeachBranch = ({ x, y, flip = false, scale = 1 }: { x: string; y: string; flip?: boolean; scale?: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: x,
      top: y,
      transform: `scale(${flip ? -scale : scale}, ${scale})`,
      transformOrigin: flip ? "right top" : "left top",
    }}
  >
    <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
      {/* Cành cây */}
      <path d="M0 40 Q30 35 50 50 Q65 58 80 55 Q95 50 110 60" stroke="#6B3E20" strokeWidth="2.5" fill="none" opacity="0.8" />
      <path d="M40 50 Q45 70 55 80" stroke="#6B3E20" strokeWidth="1.8" fill="none" opacity="0.7" />
      <path d="M70 55 Q68 75 75 90" stroke="#6B3E20" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Hoa đào lớn */}
      {[
        { cx: 25, cy: 30 },
        { cx: 55, cy: 42 },
        { cx: 85, cy: 48 },
        { cx: 45, cy: 68 },
        { cx: 70, cy: 80 },
      ].map((pos, i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx={pos.cx}
              cy={pos.cy - 8}
              rx="5"
              ry="9"
              fill="#f48fb1"
              opacity="0.8"
              transform={`rotate(${angle} ${pos.cx} ${pos.cy})`}
            />
          ))}
          <circle cx={pos.cx} cy={pos.cy} r="3.5" fill="#ffd54f" />
        </g>
      ))}
      {/* Hoa nhỏ (nụ) */}
      {[
        { cx: 15, cy: 45 },
        { cx: 95, cy: 40 },
        { cx: 60, cy: 55 },
      ].map((pos, i) => (
        <g key={`bud-${i}`}>
          {[0, 90, 180, 270].map((angle) => (
            <ellipse
              key={angle}
              cx={pos.cx}
              cy={pos.cy - 4}
              rx="2.5"
              ry="5"
              fill="#f8bbd0"
              opacity="0.7"
              transform={`rotate(${angle} ${pos.cx} ${pos.cy})`}
            />
          ))}
          <circle cx={pos.cx} cy={pos.cy} r="2" fill="#ffcc02" />
        </g>
      ))}
      {/* Lá xanh */}
      <ellipse cx="35" cy="55" rx="3" ry="8" fill="#4caf50" opacity="0.5" transform="rotate(-30 35 55)" />
      <ellipse cx="75" cy="65" rx="3" ry="7" fill="#4caf50" opacity="0.4" transform="rotate(20 75 65)" />
      <ellipse cx="100" cy="55" rx="2.5" ry="6" fill="#4caf50" opacity="0.45" transform="rotate(-15 100 55)" />
    </svg>
  </div>
);

/* ── Hoa mai vàng SVG ── */
const ApricotBranch = ({ x, y, flip = false, scale = 1 }: { x: string; y: string; flip?: boolean; scale?: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: x,
      top: y,
      transform: `scale(${flip ? -scale : scale}, ${scale})`,
      transformOrigin: flip ? "right bottom" : "left bottom",
    }}
  >
    <svg width="100" height="110" viewBox="0 0 100 110" fill="none">
      <path d="M0 60 Q25 55 45 65 Q60 72 80 68" stroke="#8B6914" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M35 65 Q38 80 42 95" stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.5" />
      {[
        { cx: 20, cy: 52 },
        { cx: 50, cy: 58 },
        { cx: 75, cy: 62 },
        { cx: 38, cy: 82 },
      ].map((pos, i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx={pos.cx}
              cy={pos.cy - 6}
              rx="4"
              ry="8"
              fill="#ffd700"
              opacity="0.85"
              transform={`rotate(${angle} ${pos.cx} ${pos.cy})`}
            />
          ))}
          <circle cx={pos.cx} cy={pos.cy} r="3" fill="#b8860b" />
        </g>
      ))}
      <ellipse cx="60" cy="75" rx="2.5" ry="7" fill="#66bb6a" opacity="0.4" transform="rotate(25 60 75)" />
    </svg>
  </div>
);

/* ── Bao lì xì đỏ ── */
const RedEnvelope = () => (
  <div className="relative mx-auto" style={{ width: 44, height: 58 }}>
    <div
      className="absolute inset-0 rounded-lg"
      style={{
        background: "linear-gradient(180deg, #e32636 0%, #cc0000 50%, #a00000 100%)",
        boxShadow: "0 4px 16px rgba(200,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.2)",
      }}
    />
    <div className="absolute top-2.5 left-1.5 right-1.5 h-px" style={{ background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
    <div className="absolute bottom-2.5 left-1.5 right-1.5 h-px" style={{ background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
    <div
      className="absolute rounded-full flex items-center justify-center"
      style={{
        width: 22, height: 22,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "linear-gradient(135deg, #ffd700 0%, #ffec8b 40%, #daa520 100%)",
        boxShadow: "0 2px 6px rgba(200,160,0,0.5)",
        border: "1.5px solid #b8860b",
      }}
    >
      <span style={{ color: "#8B6914", fontSize: 10, fontWeight: 800 }}>$</span>
    </div>
    <div
      className="absolute top-0 left-0 right-0 rounded-t-lg"
      style={{
        height: "38%",
        background: "linear-gradient(180deg, #e32636 0%, #d42020 100%)",
        borderBottom: "1.5px solid #ffd700",
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

/* ── Gold shimmer animation keyframe (inline style) ── */
const shimmerStyle = `
@keyframes goldShimmer {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}
`;

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
      <style>{shimmerStyle}</style>
      <Dialog open={showPopup} onOpenChange={(open) => { if (!open) { if (alreadyClaimed) setShowPopup(false); else handleClaim(); } }}>
        <DialogPortal>
          {/* Custom overlay: rgba(0,0,0,0.45) + backdrop blur 4px */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92%] max-w-[720px] outline-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #FFF7D6 0%, #F4E2A4 100%)",
                border: "1px solid #E8D9A8",
                borderRadius: 16,
                padding: "32px 40px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25), inset 0 0 30px rgba(255,215,120,0.4)",
                maxHeight: "92vh",
                overflowY: "auto",
              }}
            >
              {/* Gold shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%, rgba(255,255,255,0.08) 100%)",
                  animation: "goldShimmer 6s ease-in-out infinite",
                }}
              />

              {/* ── Cành hoa đào góc trên trái ── */}
              <PeachBranch x="-10px" y="-10px" scale={0.85} />
              {/* ── Cành hoa đào góc trên phải ── */}
              <PeachBranch x="calc(100% - 100px)" y="-10px" flip scale={0.7} />
              {/* ── Hoa mai góc dưới trái ── */}
              <ApricotBranch x="-5px" y="calc(100% - 100px)" scale={0.7} />
              {/* ── Hoa mai góc dưới phải ── */}
              <ApricotBranch x="calc(100% - 90px)" y="calc(100% - 90px)" flip scale={0.6} />

              {/* ── Đèn lồng đỏ ── */}
              <Lantern x="4%" y="0%" size={36} delay={0.2} />
              <Lantern x="12%" y="5%" size={24} delay={0.35} />
              <Lantern x="84%" y="1%" size={28} delay={0.4} />

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
                className="absolute top-3 right-3 z-40 p-1.5 rounded-full transition-colors"
                style={{ background: "rgba(0,0,0,0.15)" }}
              >
                <X className="w-5 h-5" style={{ color: "#5A3A00" }} />
              </button>

              {/* ── Nội dung chính ── */}
              <div className="relative z-20 flex flex-col items-center text-center">
                {/* ── Bao lì xì đỏ ── */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mb-4"
                >
                  <RedEnvelope />
                </motion.div>

                {/* ── Khung parchment ── */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.32, ease: "easeOut" }}
                  className="w-full relative"
                  style={{
                    background: "linear-gradient(180deg, #FFFDF5 0%, #FFF9E6 50%, #FFF5D6 100%)",
                    border: "1px solid #E8D9A8",
                    borderRadius: 14,
                    padding: "28px 24px",
                    boxShadow: "inset 0 0 20px rgba(200,160,60,0.1), 0 8px 32px rgba(0,0,0,0.12)",
                  }}
                >
                  {/* Tiêu đề */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-5 leading-snug"
                    style={{
                      color: "#5A3A00",
                      fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
                      fontSize: 28,
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    {alreadyClaimed ? "Bạn đã nhận Lì xì thành công!" : "Chúc mừng bạn đã nhận được Lì xì!"}
                  </motion.h2>

                  {/* Info blocks – flex layout (icon trái + text phải) */}
                  <div className="space-y-3.5">
                    <motion.div
                      initial={{ x: -15, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-start gap-3 text-left"
                      style={{ margin: "14px 0" }}
                    >
                      <span style={{ fontSize: 20, color: "#D4A017", flexShrink: 0, marginTop: 2 }}>🎁</span>
                      <p style={{ color: "#5C4A1A", fontSize: 16, lineHeight: 1.6, maxWidth: 520 }}>
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
                      initial={{ x: -15, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-start gap-3 text-left"
                      style={{ margin: "14px 0" }}
                    >
                      <span style={{ fontSize: 20, color: "#D4A017", flexShrink: 0, marginTop: 2 }}>🎁</span>
                      <p style={{ color: "#5C4A1A", fontSize: 16, lineHeight: 1.6, maxWidth: 520 }}>
                        Chương trình Lì xì Tết tổng giá trị{" "}
                        <span style={{ fontWeight: 700, color: "#C99700" }}>
                          26.000.000.000 VND
                        </span>
                        , được phân phối bằng FUN Money & Camly Coin.
                      </p>
                    </motion.div>
                  </div>

                  {/* Hai nút hành động */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 w-full mt-7 justify-center"
                  >
                    <motion.button
                      whileHover={!isDisabled ? { filter: "brightness(1.06)", y: -1 } : {}}
                      whileTap={!isDisabled ? { y: 2 } : {}}
                      onClick={handleClaim}
                      disabled={isDisabled}
                      className="w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      style={{
                        height: 48,
                        padding: "0 36px",
                        borderRadius: 10,
                        background: isDisabled
                          ? "linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)"
                          : "linear-gradient(180deg, #2F5E2F 0%, #1E3D1E 100%)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 16,
                        letterSpacing: "0.5px",
                        border: "none",
                        boxShadow: isDisabled
                          ? "0 4px 0 #333, 0 10px 20px rgba(0,0,0,0.15)"
                          : "0 4px 0 #183018, 0 10px 20px rgba(0,0,0,0.2)",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {alreadyClaimed ? "ĐÃ NHẬN ✓" : isClaiming ? "ĐANG XỬ LÝ..." : "CLAIM"}
                    </motion.button>

                    <motion.button
                      whileHover={{ background: "rgba(201,162,39,0.08)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open("/admin/tet-reward", "_blank")}
                      className="w-full sm:w-auto transition-all"
                      style={{
                        height: 48,
                        padding: "0 28px",
                        borderRadius: 10,
                        border: "1px solid #C9A227",
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

                  {/* Dòng thời hạn */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-center mt-4"
                    style={{
                      fontSize: 13,
                      color: "#8A6B1F",
                    }}
                  >
                    Áp dụng đến 08/02/2026
                  </motion.p>
                </motion.div>
              </div>

              {/* ── Đồng Camly Coin góc trái dưới (2-3 coins chồng nhau) ── */}
              <motion.div
                className="absolute bottom-3 left-3 z-30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
              >
                <img
                  src={camlyCoinNew}
                  alt=""
                  className="absolute rounded-full"
                  style={{ width: 40, height: 40, bottom: 18, left: 22, filter: "drop-shadow(0 2px 6px rgba(255,215,0,0.4))", opacity: 0.7 }}
                />
                <img
                  src={camlyCoinNew}
                  alt=""
                  className="absolute rounded-full"
                  style={{ width: 48, height: 48, bottom: 10, left: 8, filter: "drop-shadow(0 3px 8px rgba(255,215,0,0.5))", opacity: 0.85 }}
                />
                <img
                  src={camlyCoinNew}
                  alt="Camly Coin"
                  className="relative rounded-full"
                  style={{ width: 56, height: 56, filter: "drop-shadow(0 4px 12px rgba(255,215,0,0.6))" }}
                />
              </motion.div>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
