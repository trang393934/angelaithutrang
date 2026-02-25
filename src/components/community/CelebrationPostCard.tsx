import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Sparkles, Volume2, VolumeX } from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

const USDT_LOGO = "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040";
const BNB_LOGO = "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040";

function getTokenDisplay(tokenType?: string) {
  switch (tokenType) {
    case "fun_money": return { logo: funMoneyLogo, label: "FUN Money" };
    case "camly_web3": return { logo: camlyCoinLogo, label: "CAMLY" };
    case "usdt": return { logo: USDT_LOGO, label: "USDT" };
    case "bnb": return { logo: BNB_LOGO, label: "BNB" };
    case "bitcoin": return { logo: bitcoinLogo, label: "BTC" };
    default: return { logo: camlyCoinLogo, label: "Camly Coin" };
  }
}

// Mini firework for celebration post
const MiniFirework = ({ delay, x, y }: { delay: number; x: number; y: number }) => {
  const colors = ["#FFD700", "#FF6B6B", "#FF69B4", "#FFA500", "#4ECDC4"];
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 18 + Math.random() * 12;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`, top: `${y}%`, width: 3, height: 3,
              backgroundColor: colors[i % colors.length],
              boxShadow: `0 0 4px ${colors[i % colors.length]}`,
            }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0], x: [0, Math.cos(angle) * dist], y: [0, Math.sin(angle) * dist], opacity: [0, 1, 0] }}
            transition={{ duration: 1, delay: delay + i * 0.03, ease: "easeOut", repeat: Infinity, repeatDelay: 3 }}
          />
        );
      })}
    </>
  );
};

const MiniSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div className="absolute" style={{ left: `${x}%`, top: `${y}%` }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.2, delay, repeat: Infinity, repeatDelay: 2 }}>
    <Sparkles className="w-3 h-3 text-yellow-400 drop-shadow-md" />
  </motion.div>
);

interface CelebrationPostCardProps {
  meta: {
    amount?: number;
    token_type?: string;
    token_symbol?: string;
    sender_name?: string;
    sender_avatar?: string | null;
    receiver_id?: string;
    receiver_name?: string;
    receiver_avatar?: string | null;
    tx_hash?: string | null;
    receipt_public_id?: string | null;
    explorer_url?: string | null;
    message?: string | null;
    created_at?: string | null;
  };
}

const fireworks = [
  { id: 0, delay: 0, x: 10, y: 20 },
  { id: 1, delay: 0.9, x: 90, y: 15 },
  { id: 2, delay: 1.8, x: 50, y: 8 },
];
const sparkles = [
  { id: 0, delay: 0.3, x: 5, y: 50 },
  { id: 1, delay: 1.0, x: 95, y: 40 },
  { id: 2, delay: 1.5, x: 15, y: 85 },
  { id: 3, delay: 0.7, x: 80, y: 80 },
  { id: 4, delay: 2.0, x: 50, y: 60 },
];

export function CelebrationPostCard({ meta }: CelebrationPostCardProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const token = getTokenDisplay(meta.token_type);
  const formatAmount = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  const explorerBase = meta.explorer_url || "https://bscscan.com";

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/rich-1.mp3");
      audioRef.current.loop = false;
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (isPlayingAudio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="mb-3 relative rounded-2xl overflow-hidden p-4 space-y-3"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%), linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 35%, #ffec8b 50%, #ffd700 65%, #daa520 85%, #b8860b 100%)`,
      }}
    >
      {/* Effects */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {fireworks.map(fw => <MiniFirework key={`fw-${fw.id}`} delay={fw.delay} x={fw.x} y={fw.y} />)}
        {sparkles.map(s => <MiniSparkle key={`sp-${s.id}`} delay={s.delay} x={s.x} y={s.y} />)}
      </div>

      {/* Spinning coin header */}
      <div className="flex items-center justify-center gap-2 relative z-10">
        <motion.div animate={{ rotateY: 360 }} transition={{ duration: 2, repeat: 2, ease: "linear" }}>
          <img src={token.logo} alt={token.label} className="w-10 h-10 drop-shadow-lg rounded-full" />
        </motion.div>
        <span className="text-sm font-bold text-amber-900 drop-shadow-sm">🎉 Chúc mừng! 🎉</span>
        <button onClick={toggleAudio} className="p-1.5 rounded-full bg-amber-900/15 hover:bg-amber-900/25 transition-colors">
          {isPlayingAudio ? <VolumeX className="w-4 h-4 text-amber-900" /> : <Volume2 className="w-4 h-4 text-amber-900" />}
        </button>
      </div>

      {/* Receipt card content */}
      <div className="relative z-10 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg space-y-3">
        {/* Sender → Receiver */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Avatar className="h-9 w-9 ring-2 ring-amber-300">
              <AvatarImage src={meta.sender_avatar || angelAvatar} />
              <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">{meta.sender_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[10px] text-amber-600">Người tặng</p>
              <p className="font-semibold text-xs truncate text-gray-800">{meta.sender_name || "Ẩn danh"}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-[10px] text-rose-500">Người nhận</p>
              <p className="font-semibold text-xs truncate text-gray-800">{meta.receiver_name || "Ẩn danh"}</p>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-rose-300">
              <AvatarImage src={meta.receiver_avatar || angelAvatar} />
              <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">{meta.receiver_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-2.5 text-center border border-amber-200">
          <div className="flex items-center justify-center gap-2">
            <img src={token.logo} alt="coin" className="w-5 h-5 rounded-full" />
            <span className="text-xl font-bold text-amber-700">{formatAmount(meta.amount || 0)}</span>
            <span className="text-xs text-amber-600 font-medium">{meta.token_symbol || token.label}</span>
          </div>
        </div>

        {/* Message */}
        {meta.message && (
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
            <p className="text-xs text-gray-700 italic">"{meta.message}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {meta.receipt_public_id && (
            <Link to={`/receipt/${meta.receipt_public_id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Xem biên nhận
              </Button>
            </Link>
          )}
          {meta.tx_hash && (
            <a href={`${explorerBase}/tx/${meta.tx_hash}`} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full text-orange-600 hover:bg-orange-50 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                BscScan
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
