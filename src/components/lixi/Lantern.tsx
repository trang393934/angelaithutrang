import { motion } from "framer-motion";

interface LanternProps {
  x: string;
  y: string;
  size: number;
  delay: number;
}

export function Lantern({ x, y, size, delay }: LanternProps) {
  return (
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
        <div className="mx-auto" style={{ width: 2, height: size * 0.3, background: "#8B4513" }} />
        <div
          className="rounded-lg relative overflow-hidden mx-auto"
          style={{
            width: size,
            height: size * 1.3,
            background: "linear-gradient(180deg, #e32636 0%, #cc0000 40%, #b30000 100%)",
            boxShadow: "0 0 12px rgba(255,50,50,0.5), inset 0 0 8px rgba(255,200,100,0.3)",
          }}
        >
          <div className="absolute top-1/4 inset-x-0 h-px" style={{ background: "#ffd700" }} />
          <div className="absolute top-1/2 inset-x-0 h-px" style={{ background: "#ffd700" }} />
          <div className="absolute top-3/4 inset-x-0 h-px" style={{ background: "#ffd700" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-300/20 to-transparent" />
        </div>
        <div className="mx-auto" style={{ width: size * 0.3, height: size * 0.4, borderBottom: `${size * 0.4}px solid #ffd700`, borderLeft: "3px solid transparent", borderRight: "3px solid transparent", borderTop: 0 }} />
      </motion.div>
    </motion.div>
  );
}
