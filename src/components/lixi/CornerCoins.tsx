import { motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-new.png";
import funMoneyCoinLogo from "@/assets/fun-money-coin.png";

export function CornerCoins() {
  return (
    <div className="absolute bottom-2 left-3 z-30 pointer-events-none">
      {/* FUN Money (phía sau, nhỏ hơn) */}
      <motion.div
        className="absolute"
        style={{ bottom: 8, left: 28 }}
        animate={{ y: [0, -4, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-yellow-400/30 blur-lg rounded-full scale-150" />
        <img
          src={funMoneyCoinLogo}
          alt="FUN Money"
          className="w-12 h-12 relative z-10 drop-shadow-lg rounded-full"
          style={{ boxShadow: "0 0 16px rgba(255,215,0,0.5)" }}
        />
      </motion.div>

      {/* Camly Coin (phía trước, lớn hơn) */}
      <motion.div
        className="relative"
        animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      >
        <div className="absolute inset-0 bg-yellow-300/40 blur-xl rounded-full scale-150" />
        <img
          src={camlyCoinLogo}
          alt="Camly Coin"
          className="w-16 h-16 relative z-10 drop-shadow-lg rounded-full"
          style={{ boxShadow: "0 0 20px rgba(255,215,0,0.6)" }}
        />
      </motion.div>
    </div>
  );
}
