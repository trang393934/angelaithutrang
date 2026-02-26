import { motion } from "framer-motion";

const FIREWORK_COLORS = ["#FFD700", "#FF6B6B", "#FF69B4", "#FFFFFF", "#FFA500", "#FF4500"];
const RAY_COUNT = 12;

interface FireworkBurstProps {
  x: number;
  y: number;
  delay: number;
}

export function FireworkBurst({ x, y, delay }: FireworkBurstProps) {
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {Array.from({ length: RAY_COUNT }, (_, i) => {
        const angle = (360 / RAY_COUNT) * i;
        const rad = (angle * Math.PI) / 180;
        const dist = 40 + Math.random() * 30;
        const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: [0, Math.cos(rad) * dist, Math.cos(rad) * dist * 1.2],
              y: [0, Math.sin(rad) * dist, Math.sin(rad) * dist * 1.2 + 15],
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 1, 0],
            }}
            transition={{
              duration: 1.2,
              delay: delay + i * 0.02,
              repeat: 1,
              repeatDelay: 1.5,
              ease: "easeOut",
            }}
          />
        );
      })}
      {/* Center flash */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 8,
          height: 8,
          left: -4,
          top: -4,
          background: "radial-gradient(circle, #fff 0%, #ffd700 50%, transparent 100%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 3, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, delay, repeat: 1, repeatDelay: 1.5 }}
      />
    </div>
  );
}
