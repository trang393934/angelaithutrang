import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, ArrowRight, ExternalLink, Copy, Loader2, ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

const USDT_LOGO = "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040";
const BNB_LOGO = "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040";

function getTokenDisplay(giftType?: string) {
  if (!giftType) return { logo: camlyCoinLogo, label: "Camly Coin" };
  if (giftType === "web3_FUN" || giftType === "fun_money") return { logo: funMoneyLogo, label: "FUN Money" };
  if (giftType === "web3_CAMLY" || giftType === "camly_web3") return { logo: camlyCoinLogo, label: "CAMLY" };
  if (giftType === "web3_USDT" || giftType === "usdt") return { logo: USDT_LOGO, label: "USDT" };
  if (giftType === "web3_BNB" || giftType === "bnb") return { logo: BNB_LOGO, label: "BNB" };
  if (giftType === "web3_BTC" || giftType === "bitcoin") return { logo: bitcoinLogo, label: "BTC" };
  if (giftType.startsWith("web3")) return { logo: camlyCoinLogo, label: "CAMLY" };
  return { logo: camlyCoinLogo, label: "Camly Coin" };
}

// Firework burst
const FireworkBurst = ({ delay, x, y }: { delay: number; x: number; y: number }) => {
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#FF9FF3", "#54A0FF", "#FFEAA7"];
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 40 + Math.random() * 30;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ left: `${x}%`, top: `${y}%`, backgroundColor: colors[i % colors.length] }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], x: [0, Math.cos(angle) * dist], y: [0, Math.sin(angle) * dist], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: delay + i * 0.03, ease: "easeOut", repeat: Infinity, repeatDelay: 2 }}
          />
        );
      })}
    </>
  );
};

const FallingCoin = ({ delay, left, size, logo }: { delay: number; left: number; size: number; logo: string }) => (
  <motion.div
    className="absolute z-10"
    style={{ left: `${left}%`, width: size, height: size }}
    initial={{ y: -60, opacity: 0, rotate: 0 }}
    animate={{ y: ["0%", "130vh"], opacity: [0, 1, 1, 1, 0], rotate: [0, 360, 720, 1080], x: [0, Math.random() > 0.5 ? 15 : -15] }}
    transition={{ duration: 3.5 + Math.random() * 2, delay, ease: "easeIn", repeat: Infinity, repeatDelay: 0.5 }}
  >
    <img src={logo} alt="" className="w-full h-full drop-shadow-md rounded-full" />
  </motion.div>
);

const FloatingSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div className="absolute" style={{ left: `${x}%`, top: `${y}%` }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.8, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 0.8 }}>
    <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
  </motion.div>
);

interface ReceiptData {
  id: string;
  receipt_public_id: string;
  sender: { user_id: string; display_name: string | null; avatar_url: string | null; wallet_address?: string | null };
  receiver: { user_id: string; display_name: string | null; avatar_url: string | null; wallet_address?: string | null };
  amount: number;
  message: string | null;
  gift_type: string;
  tx_hash: string | null;
  context_type: string;
  context_id: string | null;
  post: { id: string; content_preview: string } | null;
  created_at: string;
  explorer_url: string | null;
}

export default function Receipt() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptId) return;
    fetchReceipt();
  }, [receiptId]);

  const fetchReceipt = async () => {
    try {
      const response = await supabase.functions.invoke("get-tip-receipt", {
        body: { receipt_id: receiptId },
      });
      if (response.error || response.data?.error) {
        setError(response.data?.error || "Không tìm thấy biên nhận");
        return;
      }
      setReceipt(response.data.receipt);
    } catch (err) {
      setError("Lỗi tải biên nhận");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép link biên nhận!");
  };

  const handleCopyWallet = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Đã sao chép địa chỉ ví!");
  };

  const truncateWallet = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatAmount = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Gift className="w-12 h-12 text-amber-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">{error || "Biên nhận không tồn tại"}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tokenDisplay = getTokenDisplay(receipt.gift_type);

  // Effects data
  const fireworks = Array.from({ length: 5 }, (_, i) => ({
    id: i, delay: i * 0.6 + Math.random() * 0.3, x: 10 + Math.random() * 80, y: 10 + Math.random() * 40,
  }));
  const fallingCoins = Array.from({ length: 15 }, (_, i) => ({
    id: i, delay: Math.random() * 3, left: Math.random() * 100, size: 14 + Math.random() * 14,
  }));
  const sparkles = Array.from({ length: 10 }, (_, i) => ({
    id: i, delay: Math.random() * 2, x: Math.random() * 100, y: Math.random() * 100,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50/30 py-8 px-4 relative overflow-hidden">
      {/* Celebration effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {fireworks.map((fw) => (
          <FireworkBurst key={`fw-${fw.id}`} delay={fw.delay} x={fw.x} y={fw.y} />
        ))}
        {fallingCoins.map((coin) => (
          <FallingCoin key={`coin-${coin.id}`} delay={coin.delay} left={coin.left} size={coin.size} logo={tokenDisplay.logo} />
        ))}
        {sparkles.map((s) => (
          <FloatingSparkle key={`s-${s.id}`} delay={s.delay} x={s.x} y={s.y} />
        ))}
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <Card className="border-2 border-amber-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 text-center" style={{
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%), linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 35%, #ffec8b 50%, #ffd700 65%, #daa520 85%, #b8860b 100%)`,
          }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="w-6 h-6 text-amber-900" />
              <h1 className="text-xl font-bold text-amber-900 drop-shadow-sm">🎉 Biên Nhận Tặng Thưởng 🎉</h1>
            </div>
            <p className="text-amber-800/80 text-sm">Angel AI • Lan tỏa yêu thương</p>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Sender -> Receiver */}
            <div className="flex items-center justify-between gap-3">
              <Link to={getProfilePath(receipt.sender.user_id)} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80">
                <Avatar className="h-14 w-14 ring-2 ring-amber-300 shadow-md">
                  <AvatarImage src={receipt.sender.avatar_url || ""} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-lg">{receipt.sender.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-xs text-amber-600">Người tặng</p>
                  <p className="font-semibold text-sm text-gray-800 truncate max-w-[120px]">{receipt.sender.display_name || "Ẩn danh"}</p>
                  {receipt.sender.wallet_address && (
                    <button onClick={() => handleCopyWallet(receipt.sender.wallet_address!)} className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-amber-600 mx-auto mt-0.5">
                      <span className="font-mono">{truncateWallet(receipt.sender.wallet_address)}</span>
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </Link>

              <div className="flex flex-col items-center shrink-0">
                <ArrowRight className="w-6 h-6 text-amber-400" />
                <img src={tokenDisplay.logo} alt="coin" className="w-8 h-8 mt-1 rounded-full" />
              </div>

              <Link to={getProfilePath(receipt.receiver.user_id)} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80">
                <Avatar className="h-14 w-14 ring-2 ring-rose-300 shadow-md">
                  <AvatarImage src={receipt.receiver.avatar_url || ""} />
                  <AvatarFallback className="bg-rose-100 text-rose-700 text-lg">{receipt.receiver.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-xs text-rose-500">Người nhận</p>
                  <p className="font-semibold text-sm text-gray-800 truncate max-w-[120px]">{receipt.receiver.display_name || "Ẩn danh"}</p>
                  {receipt.receiver.wallet_address && (
                    <button onClick={() => handleCopyWallet(receipt.receiver.wallet_address!)} className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-rose-500 mx-auto mt-0.5">
                      <span className="font-mono">{truncateWallet(receipt.receiver.wallet_address)}</span>
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </Link>
            </div>

            {/* Amount - dynamic token */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 text-center border border-amber-200">
              <div className="flex items-center justify-center gap-2">
                <img src={tokenDisplay.logo} alt="coin" className="w-8 h-8 rounded-full" />
                <span className="text-3xl font-bold text-amber-700">{formatAmount(receipt.amount)}</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">{tokenDisplay.label}</p>
            </div>

            {/* Message */}
            {receipt.message && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Lời nhắn</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{receipt.message}"</p>
              </div>
            )}

            {/* Post link */}
            {receipt.post && (
              <Link to={`/community`} className="block bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
                <p className="text-xs text-blue-500 font-medium mb-1">Tặng trên bài viết</p>
                <p className="text-sm text-blue-700 line-clamp-2">{receipt.post.content_preview}</p>
              </Link>
            )}

            {/* TX Hash */}
            {receipt.tx_hash && (
              <a
                href={receipt.explorer_url || `https://bscscan.com/tx/${receipt.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-600 hover:bg-orange-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">Xem giao dịch trên BscScan</span>
              </a>
            )}

            {/* Time */}
            <p className="text-center text-xs text-gray-400">
              {new Date(receipt.created_at).toLocaleString("vi-VN")}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 border-amber-300 text-amber-700">
                <Copy className="w-4 h-4 mr-2" />
                Sao chép link
              </Button>
              <Link to="/" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
