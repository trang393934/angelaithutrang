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

const ConfettiPiece = ({ delay, left, color }: { delay: number; left: number; color: string }) => (
  <motion.div
    className="absolute w-2 h-3 rounded-sm"
    style={{ left: `${left}%`, backgroundColor: color }}
    initial={{ y: -20, opacity: 0, rotate: 0, scale: 0 }}
    animate={{
      y: ["0%", "100vh"],
      opacity: [0, 1, 1, 0],
      rotate: [0, 360, 720, 1080],
      scale: [0, 1, 1, 0.5],
    }}
    transition={{
      duration: 3,
      delay,
      ease: "easeOut",
    }}
  />
);

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
];

export function TipCelebrationReceipt({ open, onOpenChange, data }: TipCelebrationReceiptProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && data) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3500);
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

  const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.5,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Confetti */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                {confettiPieces.map((piece) => (
                  <ConfettiPiece key={piece.id} delay={piece.delay} left={piece.left} color={piece.color} />
                ))}
              </div>
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
