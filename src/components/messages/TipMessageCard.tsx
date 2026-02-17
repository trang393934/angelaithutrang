import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import angelAvatar from "@/assets/angel-avatar.png";

interface TipMessageCardProps {
  content: string;
  tipGiftId?: string | null;
  receiptPublicId?: string | null;
}

interface GiftDetails {
  amount: number;
  message: string | null;
  receipt_public_id: string | null;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  sender_avatar: string | null;
  receiver_name: string;
  receiver_avatar: string | null;
}

// Lightweight firework for message card (fewer particles to avoid lag)
const MiniFireworkBurst = ({ delay, x, y }: { delay: number; x: number; y: number }) => {
  const colors = ["#FFD700", "#FF6B6B", "#FF69B4", "#FFA500", "#4ECDC4"];
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 20 + Math.random() * 15;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: 3,
              height: 3,
              backgroundColor: colors[i % colors.length],
              boxShadow: `0 0 4px ${colors[i % colors.length]}`,
            }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 0],
              x: [0, Math.cos(angle) * dist],
              y: [0, Math.sin(angle) * dist],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1, delay: delay + i * 0.03, ease: "easeOut", repeat: Infinity, repeatDelay: 2.5 }}
          />
        );
      })}
    </>
  );
};

const MiniSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
    transition={{ duration: 1.2, delay, repeat: Infinity, repeatDelay: 1.5 }}
  >
    <Sparkles className="w-3 h-3 text-yellow-400 drop-shadow-md" />
  </motion.div>
);

export function TipMessageCard({ content, tipGiftId, receiptPublicId }: TipMessageCardProps) {
  const [giftDetails, setGiftDetails] = useState<GiftDetails | null>(null);

  useEffect(() => {
    if (!tipGiftId) return;

    const fetchGiftDetails = async () => {
      const { data: gift } = await supabase
        .from("coin_gifts")
        .select("amount, message, receipt_public_id, sender_id, receiver_id")
        .eq("id", tipGiftId)
        .maybeSingle();

      if (!gift) return;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", [gift.sender_id, gift.receiver_id]);

      const senderProfile = profiles?.find(p => p.user_id === gift.sender_id);
      const receiverProfile = profiles?.find(p => p.user_id === gift.receiver_id);

      setGiftDetails({
        amount: gift.amount,
        message: gift.message,
        receipt_public_id: gift.receipt_public_id,
        sender_id: gift.sender_id,
        receiver_id: gift.receiver_id,
        sender_name: senderProfile?.display_name || "Ẩn danh",
        sender_avatar: senderProfile?.avatar_url || null,
        receiver_name: receiverProfile?.display_name || "Ẩn danh",
        receiver_avatar: receiverProfile?.avatar_url || null,
      });
    };

    fetchGiftDetails();
  }, [tipGiftId]);

  const finalReceiptId = giftDetails?.receipt_public_id || receiptPublicId;
  const formatAmount = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);

  // Firework + sparkle data for celebration card
  const fireworks = [
    { id: 0, delay: 0, x: 15, y: 20 },
    { id: 1, delay: 0.8, x: 85, y: 15 },
    { id: 2, delay: 1.6, x: 50, y: 10 },
  ];
  const sparkles = [
    { id: 0, delay: 0.3, x: 8, y: 50 },
    { id: 1, delay: 1.0, x: 92, y: 40 },
    { id: 2, delay: 1.5, x: 20, y: 85 },
    { id: 3, delay: 0.7, x: 75, y: 80 },
    { id: 4, delay: 2.0, x: 50, y: 60 },
  ];

  // Enhanced celebration card when gift details are available
  if (giftDetails) {
    return (
      <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3 max-w-[320px] shadow-sm overflow-hidden">
        {/* Firework effects */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {fireworks.map((fw) => (
            <MiniFireworkBurst key={`fw-${fw.id}`} delay={fw.delay} x={fw.x} y={fw.y} />
          ))}
          {sparkles.map((s) => (
            <MiniSparkle key={`sp-${s.id}`} delay={s.delay} x={s.x} y={s.y} />
          ))}
        </div>

        {/* Header with gift icon */}
        <div className="flex items-center gap-2 justify-center relative z-10">
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Gift className="w-4 h-4 text-white" />
          </motion.div>
          <span className="text-sm font-bold text-amber-700">🎉 Chúc mừng!</span>
          <img src={camlyCoinLogo} alt="coin" className="w-5 h-5 rounded-full" />
        </div>

        {/* Sender -> Receiver */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <Link to={`/user/${giftDetails.sender_id}`} className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80">
            <Avatar className="h-8 w-8 ring-2 ring-amber-300">
              <AvatarImage src={giftDetails.sender_avatar || angelAvatar} />
              <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                {giftDetails.sender_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[10px] text-amber-600">Người tặng</p>
              <p className="font-semibold text-xs truncate text-foreground">{giftDetails.sender_name}</p>
            </div>
          </Link>

          <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />

          <Link to={`/user/${giftDetails.receiver_id}`} className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-[10px] text-rose-500">Người nhận</p>
              <p className="font-semibold text-xs truncate text-foreground">{giftDetails.receiver_name}</p>
            </div>
            <Avatar className="h-8 w-8 ring-2 ring-rose-300">
              <AvatarImage src={giftDetails.receiver_avatar || angelAvatar} />
              <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                {giftDetails.receiver_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-2 text-center border border-amber-200/60 relative z-10">
          <div className="flex items-center justify-center gap-1.5">
            <img src={camlyCoinLogo} alt="coin" className="w-5 h-5 rounded-full" />
            <span className="text-xl font-bold text-amber-700">{formatAmount(giftDetails.amount)}</span>
            <span className="text-xs text-amber-600 font-medium">Camly Coin</span>
          </div>
        </div>

        {/* Message */}
        {giftDetails.message && (
          <div className="bg-white/80 rounded-lg p-2 border border-amber-100 relative z-10">
            <p className="text-xs text-muted-foreground mb-0.5">Lời nhắn</p>
            <p className="text-sm text-foreground italic">"{giftDetails.message}"</p>
          </div>
        )}

        {/* Receipt button */}
        {finalReceiptId && (
          <Link to={`/receipt/${finalReceiptId}`} className="relative z-10 block">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Xem biên nhận
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Fallback: simple card (no gift details loaded yet or no tipGiftId)
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 space-y-2 max-w-[280px]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
          <Gift className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-amber-700">Tặng thưởng</span>
        <img src={camlyCoinLogo} alt="coin" className="w-5 h-5 ml-auto rounded-full" />
      </div>

      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>

      {finalReceiptId && (
        <Link to={`/receipt/${finalReceiptId}`}>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 mt-1"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Xem biên nhận
          </Button>
        </Link>
      )}
    </div>
  );
}
