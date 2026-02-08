import { motion } from "framer-motion";

// Rainbow 3D sparkling text component
export function RainbowTitle({ text }: { text: string }) {
  return (
    <div className="relative inline-block">
      {/* 3D shadow layers */}
      <span
        className="absolute inset-0 font-black text-lg md:text-xl tracking-wider uppercase whitespace-nowrap select-none"
        style={{
          WebkitTextStroke: "1px rgba(0,0,0,0.15)",
          color: "transparent",
          transform: "translate(2px, 2px)",
          filter: "blur(1px)",
        }}
        aria-hidden
      >
        {text}
      </span>

      {/* Main rainbow text */}
      <motion.span
        className="relative font-black text-lg md:text-xl tracking-wider uppercase whitespace-nowrap"
        style={{
          backgroundImage: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3, #FF0000, #FF7F00, #FFFF00, #00FF00)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(255,215,0,0.4))",
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          letterSpacing: "2px",
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {text}
      </motion.span>

      {/* Shimmer overlay */}
      <motion.span
        className="absolute inset-0 font-black text-lg md:text-xl tracking-wider uppercase whitespace-nowrap pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          letterSpacing: "2px",
        }}
        animate={{
          backgroundPosition: ["-100% 50%", "200% 50%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "easeInOut",
        }}
        aria-hidden
      >
        {text}
      </motion.span>
    </div>
  );
}
