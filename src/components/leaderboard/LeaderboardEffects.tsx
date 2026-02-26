import { motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";

// Floating coin that drifts across the screen
export function FloatingCoin({ delay, logo, startX }: { delay: number; logo: string; startX: number }) {
  const duration = 4 + Math.random() * 3;
  const swayAmount = 30 + Math.random() * 40;

  return (
    <motion.div
      className="absolute pointer-events-none z-[1]"
      style={{ left: `${startX}%`, top: "-5%" }}
      animate={{
        y: ["0%", "110%"],
        x: [0, swayAmount, -swayAmount, swayAmount / 2, 0],
        rotate: [0, 360],
      }}
      transition={{
        y: { duration, repeat: Infinity, delay, ease: "linear" },
        x: { duration: duration * 0.8, repeat: Infinity, delay, ease: "easeInOut" },
        rotate: { duration: duration * 0.6, repeat: Infinity, delay, ease: "linear" },
      }}
    >
      <motion.img
        src={logo}
        alt=""
        className="w-5 h-5 md:w-6 md:h-6 rounded-full drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
        animate={{ scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 1.5, repeat: Infinity, delay }}
      />
    </motion.div>
  );
}

// Cherry blossom / apricot blossom petal
export function FloatingPetal({ delay, startX, type }: { delay: number; startX: number; type: "cherry" | "apricot" }) {
  const duration = 5 + Math.random() * 4;
  const size = 8 + Math.random() * 10;
  const swayAmount = 40 + Math.random() * 60;

  // Cherry = pink, Apricot = yellow-gold
  const colors = type === "cherry"
    ? { bg: "rgba(255,182,193,0.85)", shadow: "rgba(255,105,180,0.5)" }
    : { bg: "rgba(255,223,100,0.85)", shadow: "rgba(255,193,7,0.5)" };

  return (
    <motion.div
      className="absolute pointer-events-none z-[1]"
      style={{ left: `${startX}%`, top: "-3%" }}
      animate={{
        y: ["0%", "115%"],
        x: [0, swayAmount, -swayAmount * 0.7, swayAmount * 0.5, -swayAmount * 0.3],
        rotate: [0, 180, 360, 540, 720],
      }}
      transition={{
        y: { duration, repeat: Infinity, delay, ease: "linear" },
        x: { duration: duration * 1.2, repeat: Infinity, delay, ease: "easeInOut" },
        rotate: { duration: duration * 0.9, repeat: Infinity, delay, ease: "linear" },
      }}
    >
      {/* Petal shape using CSS */}
      <div
        style={{
          width: `${size}px`,
          height: `${size * 0.7}px`,
          backgroundColor: colors.bg,
          borderRadius: "50% 0 50% 0",
          boxShadow: `0 0 6px ${colors.shadow}`,
          transform: "rotate(45deg)",
        }}
      />
    </motion.div>
  );
}

// Container of all floating effects for the leaderboard
export function LeaderboardFloatingEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Camly Coins */}
      {[...Array(4)].map((_, i) => (
        <FloatingCoin
          key={`camly-${i}`}
          delay={i * 1.2}
          logo={camlyCoinLogo}
          startX={5 + i * 25}
        />
      ))}

      {/* Floating FUN Money Coins */}
      {[...Array(3)].map((_, i) => (
        <FloatingCoin
          key={`fun-${i}`}
          delay={0.6 + i * 1.5}
          logo={funMoneyLogo}
          startX={15 + i * 30}
        />
      ))}

      {/* Cherry Blossoms (hoa đào) */}
      {[...Array(6)].map((_, i) => (
        <FloatingPetal
          key={`cherry-${i}`}
          delay={i * 0.9}
          startX={Math.random() * 90 + 5}
          type="cherry"
        />
      ))}

      {/* Apricot Blossoms (hoa mai) */}
      {[...Array(5)].map((_, i) => (
        <FloatingPetal
          key={`apricot-${i}`}
          delay={0.4 + i * 1.1}
          startX={Math.random() * 90 + 5}
          type="apricot"
        />
      ))}
    </div>
  );
}
