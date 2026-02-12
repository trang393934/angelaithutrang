import { AnimatePresence, motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-new.png";
import funMoneyCoinLogo from "@/assets/fun-money-coin.png";

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
  "#FF9A9E", "#A18CD1", "#FBC2EB", "#84FAB0", "#F6D365",
];

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

export function LiXiEffects({ showEffects }: { showEffects: boolean }) {
  return (
    <AnimatePresence>
      {showEffects && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            {confettiPieces.map((p) => (
              <motion.div
                key={`c-${p.id}`}
                className="absolute rounded-sm pointer-events-none"
                style={{ left: `${p.left}%`, backgroundColor: p.color, width: p.size, height: p.size * 1.5 }}
                initial={{ y: -30, opacity: 0, rotate: 0, scale: 0 }}
                animate={{
                  y: ["0%", "120vh"],
                  opacity: [0, 1, 1, 1, 0],
                  rotate: [0, 360, 720, 1080, 1440],
                  scale: [0, 1.2, 1, 0.8, 0.3],
                  x: [0, Math.random() > 0.5 ? 30 : -30, Math.random() > 0.5 ? -20 : 20],
                }}
                transition={{ duration: 4 + Math.random() * 2, delay: p.delay, ease: "easeOut" }}
              />
            ))}
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            {fallingCoins.map((c) => (
              <motion.div
                key={`fc-${c.id}`}
                className="absolute z-10 pointer-events-none"
                style={{ left: `${c.left}%`, width: c.size, height: c.size }}
                initial={{ y: -60, opacity: 0, rotate: 0 }}
                animate={{
                  y: ["0%", "130vh"],
                  opacity: [0, 1, 1, 1, 0],
                  rotate: [0, 360, 720, 1080],
                  x: [0, Math.random() > 0.5 ? 15 : -15],
                }}
                transition={{ duration: 3.5 + Math.random() * 2, delay: c.delay, ease: "easeIn" }}
              >
                <img src={c.isCamly ? camlyCoinLogo : funMoneyCoinLogo} alt="" className="w-full h-full drop-shadow-md rounded-full" />
              </motion.div>
            ))}
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
            {petals.map((p) => (
              <motion.div
                key={`pt-${p.id}`}
                className="absolute pointer-events-none z-30"
                style={{
                  left: `${p.startX}%`,
                  width: p.size,
                  height: p.size,
                  borderRadius: "50% 0 50% 50%",
                  background: "linear-gradient(135deg, #ffb7c5 0%, #ff69b4 40%, #ff1493 100%)",
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
                transition={{ duration: 5 + Math.random() * 3, delay: p.delay, ease: "easeOut" }}
              />
            ))}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
