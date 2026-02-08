import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, ExternalLink, Copy, Sparkles, Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface TipReceiptData {
  receipt_public_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  receiver_id: string;
  receiver_name: string;
  receiver_avatar?: string | null;
  amount: number;
  message?: string | null;
  tx_hash?: string | null;
  created_at?: string;
}

interface TipCelebrationReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TipReceiptData | null;
}

const ConfettiPiece = ({ delay, left, color, size }: { delay: number; left: number; color: string; size: number }) => (
  <motion.div
    className="absolute rounded-sm"
    style={{ left: `${left}%`, backgroundColor: color, width: size, height: size * 1.5 }}
    initial={{ y: -30, opacity: 0, rotate: 0, scale: 0 }}
    animate={{
      y: ["0%", "120vh"],
      opacity: [0, 1, 1, 1, 0],
      rotate: [0, 360, 720, 1080, 1440],
      scale: [0, 1.2, 1, 0.8, 0.3],
      x: [0, Math.random() > 0.5 ? 30 : -30, Math.random() > 0.5 ? -20 : 20],
    }}
    transition={{
      duration: 4 + Math.random() * 2,
      delay,
      ease: "easeOut",
    }}
  />
);

const FallingCoin = ({ delay, left, size }: { delay: number; left: number; size: number }) => (
  <motion.div
    className="absolute z-10"
    style={{ left: `${left}%`, width: size, height: size }}
    initial={{ y: -60, opacity: 0, rotate: 0 }}
    animate={{
      y: ["0%", "130vh"],
      opacity: [0, 1, 1, 1, 0],
      rotate: [0, 360, 720, 1080],
      x: [0, Math.random() > 0.5 ? 15 : -15],
    }}
    transition={{
      duration: 3.5 + Math.random() * 2,
      delay,
      ease: "easeIn",
    }}
  >
    <img src={camlyCoinLogo} alt="" className="w-full h-full drop-shadow-md" />
  </motion.div>
);

const FloatingSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1.8, 0],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 1.5,
      delay,
      repeat: Infinity,
      repeatDelay: 0.8,
    }}
  >
    <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
  </motion.div>
);

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
  "#FF9A9E", "#A18CD1", "#FBC2EB", "#84FAB0", "#F6D365",
];

export function TipCelebrationReceipt({ open, onOpenChange, data }: TipCelebrationReceiptProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && data) {
      setShowConfetti(true);
      // Keep effects running for 8 seconds
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [open, data]);

  if (!data) return null;

  const receiptUrl = `${window.location.origin}/receipt/${data.receipt_public_id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(receiptUrl);
    toast.success("Đã sao chép link biên nhận!");
  };

  const formatAmount = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

  // 80 confetti pieces for richer effect
  const confettiPieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
  }));

  // 30 falling Camly coins
  const fallingCoins = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3.5,
    left: Math.random() * 100,
    size: 16 + Math.random() * 16,
  }));

  // 15 sparkles
  const sparkles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative rounded-2xl p-6 shadow-2xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 30%, transparent 50%, rgba(255,255,255,0.04) 70%, transparent 100%), linear-gradient(135deg, #1a1a1a 0%, #2a2520 15%, #1c1c1c 30%, #252018 50%, #1c1c1c 70%, #2a2520 85%, #1a1a1a 100%)`,
          }}
        >
          {/* Confetti + Falling Coins + Sparkles */}
          <AnimatePresence>
            {showConfetti && (
              <>
                {/* Confetti pieces */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {confettiPieces.map((piece) => (
                    <ConfettiPiece key={`c-${piece.id}`} delay={piece.delay} left={piece.left} color={piece.color} size={piece.size} />
                  ))}
                </div>
                {/* Falling Camly coins */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {fallingCoins.map((coin) => (
                    <FallingCoin key={`coin-${coin.id}`} delay={coin.delay} left={coin.left} size={coin.size} />
                  ))}
                </div>
                {/* Sparkles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {sparkles.map((s) => (
                    <FloatingSparkle key={`s-${s.id}`} delay={s.delay} x={s.x} y={s.y} />
                  ))}
                </div>
              </>
            )}
          </AnimatePresence>

          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />

          {/* Close */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            {/* Spinning coin */}
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 2, repeat: 2, ease: "linear" }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-300/50 blur-xl rounded-full" />
                <img src={camlyCoinLogo} alt="Camly Coin" className="w-16 h-16 relative z-10 drop-shadow-lg" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-white"
            >
              🎉 Chúc mừng bạn đã chuyển thành công! 🎉
            </motion.h2>

            {/* Receipt Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg text-left space-y-3"
            >
              {/* Sender -> Receiver */}
              <div className="flex items-center justify-between gap-2">
                <Link to={`/user/${data.sender_id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
                  <Avatar className="h-10 w-10 ring-2 ring-amber-300">
                    <AvatarImage src={data.sender_avatar || ""} />
                    <AvatarFallback className="bg-amber-100 text-amber-700">{data.sender_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs text-amber-600">Người tặng</p>
                    <p className="font-semibold text-sm truncate text-gray-800">{data.sender_name || "Ẩn danh"}</p>
                  </div>
                </Link>

                <ArrowRight className="w-5 h-5 text-amber-500 shrink-0" />

                <Link to={`/user/${data.receiver_id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 justify-end">
                  <div className="min-w-0 text-right">
                    <p className="text-xs text-rose-500">Người nhận</p>
                    <p className="font-semibold text-sm truncate text-gray-800">{data.receiver_name || "Ẩn danh"}</p>
                  </div>
                  <Avatar className="h-10 w-10 ring-2 ring-rose-300">
                    <AvatarImage src={data.receiver_avatar || ""} />
                    <AvatarFallback className="bg-rose-100 text-rose-700">{data.receiver_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                </Link>
              </div>

              {/* Amount */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 text-center border border-amber-200">
                <div className="flex items-center justify-center gap-2">
                  <img src={camlyCoinLogo} alt="coin" className="w-6 h-6" />
                  <span className="text-2xl font-bold text-amber-700">{formatAmount(data.amount)}</span>
                  <span className="text-sm text-amber-600 font-medium">Camly Coin</span>
                </div>
              </div>

              {/* Message */}
              {data.message && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Lời nhắn</p>
                  <p className="text-sm text-gray-700 italic">"{data.message}"</p>
                </div>
              )}

              {/* Time */}
              <p className="text-xs text-gray-400 text-center">
                {data.created_at ? new Date(data.created_at).toLocaleString("vi-VN") : new Date().toLocaleString("vi-VN")}
              </p>

              {/* TX Hash */}
              {data.tx_hash && (
                <a
                  href={`https://bscscan.com/tx/${data.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-orange-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Xem trên BscScan
                </a>
              )}
            </motion.div>

            {/* Actions */}
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Copy className="w-4 h-4 mr-2" />
                Sao chép link
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-white hover:bg-white/90 text-amber-700 font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Đóng
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
