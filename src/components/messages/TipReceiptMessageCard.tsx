import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";
import angelAvatar from "@/assets/angel-avatar.png";

const USDT_LOGO = "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040";
const BNB_LOGO = "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040";

function getTokenLogo(tokenType?: string) {
  switch (tokenType) {
    case "fun_money": return { logo: funMoneyLogo, label: "FUN Money" };
    case "camly_web3": return { logo: camlyCoinLogo, label: "CAMLY" };
    case "usdt": return { logo: USDT_LOGO, label: "USDT" };
    case "bnb": return { logo: BNB_LOGO, label: "BNB" };
    case "bitcoin": return { logo: bitcoinLogo, label: "BTC" };
    default: return { logo: camlyCoinLogo, label: "Camly Coin" };
  }
}

interface TipReceiptMessageCardProps {
  metadata: {
    amount?: number;
    token_type?: string;
    token_symbol?: string;
    sender_name?: string;
    receiver_name?: string;
    sender_avatar?: string | null;
    receiver_avatar?: string | null;
    tx_hash?: string | null;
    receipt_public_id?: string | null;
    explorer_url?: string | null;
    message?: string | null;
    created_at?: string | null;
  };
}

export function TipReceiptMessageCard({ metadata }: TipReceiptMessageCardProps) {
  const token = getTokenLogo(metadata.token_type);
  const formatAmount = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3 max-w-[320px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 justify-center">
        <motion.div
          className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FileText className="w-3.5 h-3.5 text-white" />
        </motion.div>
        <span className="text-sm font-bold text-amber-700">Biên nhận tặng thưởng</span>
        <img src={token.logo} alt={token.label} className="w-5 h-5 rounded-full" />
      </div>

      {/* Sender → Receiver */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Avatar className="h-8 w-8 ring-2 ring-amber-300">
            <AvatarImage src={metadata.sender_avatar || angelAvatar} />
            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
              {metadata.sender_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] text-amber-600">Người tặng</p>
            <p className="font-semibold text-xs truncate">{metadata.sender_name || "Ẩn danh"}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-[10px] text-rose-500">Người nhận</p>
            <p className="font-semibold text-xs truncate">{metadata.receiver_name || "Ẩn danh"}</p>
          </div>
          <Avatar className="h-8 w-8 ring-2 ring-rose-300">
            <AvatarImage src={metadata.receiver_avatar || angelAvatar} />
            <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
              {metadata.receiver_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-2 text-center border border-amber-200/60">
        <div className="flex items-center justify-center gap-1.5">
          <img src={token.logo} alt="coin" className="w-5 h-5 rounded-full" />
          <span className="text-xl font-bold text-amber-700">{formatAmount(metadata.amount || 0)}</span>
          <span className="text-xs text-amber-600 font-medium">{metadata.token_symbol || token.label}</span>
        </div>
      </div>

      {/* Message */}
      {metadata.message && (
        <div className="bg-white/80 rounded-lg p-2 border border-amber-100">
          <p className="text-sm italic text-muted-foreground">"{metadata.message}"</p>
        </div>
      )}

      {/* Time */}
      {metadata.created_at && (
        <p className="text-[10px] text-amber-500 text-center">
          {new Date(metadata.created_at).toLocaleString("vi-VN")}
        </p>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-1.5">
        {metadata.receipt_public_id && (
          <Link to={`/receipt/${metadata.receipt_public_id}`}>
            <Button variant="outline" size="sm" className="w-full border-amber-300 text-amber-700 hover:bg-amber-100">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Xem biên nhận
            </Button>
          </Link>
        )}
        {metadata.tx_hash && metadata.explorer_url && (
          <a href={`${metadata.explorer_url}/tx/${metadata.tx_hash}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Xem trên BscScan
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
