import { motion } from "framer-motion";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiXiReceiptCardProps {
  camlyAmount: number;
  funAmount: number;
  txHash: string;
  bscscanUrl: string;
}

export function LiXiReceiptCard({
  camlyAmount,
  funAmount,
  txHash,
  bscscanUrl,
}: LiXiReceiptCardProps) {
  const shortHash = txHash
    ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}`
    : "";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-2xl overflow-hidden max-w-xs"
    >
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-400 p-4 text-white">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-6 h-6 text-white" />
          <span className="font-bold text-lg">Lì Xì Tết 2026</span>
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

        {/* Tx Hash */}
        <div className="bg-white/10 rounded-lg p-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-white/70 mb-1">
            <span>📋</span>
            <span>Biên nhận giao dịch</span>
          </div>
          <code className="text-white/90 font-mono text-[11px] break-all">
            {shortHash}
          </code>
        </div>

        {/* BscScan Button */}
        <Button
          onClick={() => window.open(bscscanUrl, "_blank")}
          className="w-full bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl border border-white/30"
          size="sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Xem trên BscScan
        </Button>
      </div>
    </motion.div>
  );
}
