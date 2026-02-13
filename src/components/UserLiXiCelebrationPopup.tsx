import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useLiXiCelebration } from "@/hooks/useLiXiCelebration";
import lixiPopupBg from "@/assets/lixi-popup-bg.jpg";
import { FireworkBurst } from "@/components/lixi/FireworkBurst";
import { LiXiEffects } from "@/components/lixi/LiXiEffects";

/* ── Component chính ── */
export function UserLiXiCelebrationPopup() {
  const isPreview = new URLSearchParams(window.location.search).get("preview_lixi") === "true";
  const hook = useLiXiCelebration();
  
  // Preview mode: mock data, no auth needed
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
    if (alreadyClaimed) {
      setShowPopup(false);
      return;
    }
    claim();
  };

  const isDisabled = isClaiming || alreadyClaimed;

  return (
    <Dialog open={showPopup} onOpenChange={(open) => { if (!open) { if (alreadyClaimed) setShowPopup(false); else handleClaim(); } }}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden max-h-[92vh]">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* ── Background image from design ── */}
          <img
            src={lixiPopupBg}
            alt="Lì xì Tết background"
            className="absolute inset-0 w-full h-full object-cover"
          />

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

          {/* ── Nội dung chính — overlay trên hình nền ── */}
          <div className="relative z-20 flex flex-col items-center text-center px-8 pt-[52%] pb-6">
            {/* Spacer cho phần trên của hình (bao lì xì, hoa đào, đèn lồng đã có trong ảnh) */}

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
              {/* Viền trang trí góc */}
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
                className="text-2xl font-bold italic mb-5 leading-snug"
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
                    <span className="font-bold text-xl" style={{ color: "#8B6914" }}>
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
                  <p className="text-2xl font-bold mt-1" style={{ color: "#B8860B" }}>
                    26,000,000,000 VND,
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#7A6530" }}>
                    được phân phối bằng FUN Money & Camly Coin.
                  </p>
                </motion.div>
              </div>

              {/* ── Hai nút hành động ── */}
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
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
