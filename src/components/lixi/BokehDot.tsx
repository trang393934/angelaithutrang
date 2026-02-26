import { motion } from "framer-motion";

interface BokehDotProps {
  delay: number;
  x: number;
  y: number;
  size: number;
}

export function BokehDot({ delay, x, y, size }: BokehDotProps) {
  return (
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
}
