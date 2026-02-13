import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiXiMessageCardProps {
  camlyAmount: number;
  funAmount: number;
  notificationId: string | null;
  onOpenLiXi?: (notificationId: string) => void;
}

export function LiXiMessageCard({
  camlyAmount,
  funAmount,
  notificationId,
  onOpenLiXi,
}: LiXiMessageCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-2xl overflow-hidden max-w-xs"
    >
      <div className="bg-gradient-to-br from-red-600 via-red-500 to-amber-500 p-4 text-white">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🧧</span>
          <span className="font-bold text-lg">Lì Xì Tết</span>
        </div>

        {/* Amount */}
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mb-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-yellow-200">💰</span>
            <span className="font-bold text-xl">
              {camlyAmount.toLocaleString("vi-VN")} Camly Coin
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span>📊</span>
            <span>
              Dựa trên {funAmount.toLocaleString("vi-VN")} FUN Money
            </span>
          </div>
        </div>

        {/* Deadline */}
        <p className="text-xs text-white/70 mb-3">
          ⏰ Áp dụng đến 08/02/2026
        </p>

        {/* CTA Button */}
        {notificationId && onOpenLiXi && (
          <Button
            onClick={() => onOpenLiXi(notificationId)}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-red-800 font-bold rounded-xl"
            size="sm"
          >
            <Gift className="w-4 h-4 mr-2" />
            Xem Lì Xì
          </Button>
        )}
      </div>
    </motion.div>
  );
}
