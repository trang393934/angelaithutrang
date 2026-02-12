import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, ExternalLink, Copy, Sparkles, ArrowRight, Download, Share2, MessageCircle, FileText, Image, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";
import { CelebrationThemeSelector, getThemeBackground } from "./CelebrationThemeSelector";
import { CelebrationAudioPlayer } from "./CelebrationAudioPlayer";

export interface CelebrationData {
  receipt_public_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  sender_wallet?: string | null;
  receiver_id: string;
  receiver_name: string;
  receiver_avatar?: string | null;
  receiver_wallet?: string | null;
  amount: number;
  message?: string | null;
  tx_hash?: string | null;
  created_at?: string;
  tokenType?: "internal" | "camly_web3" | "fun_money" | "usdt" | "usdc" | "bnb" | "bitcoin";
  tokenSymbol?: string;
  explorerUrl?: string;
  chain?: string;
}

interface GiftCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CelebrationData | null;
  onPostToProfile?: (data: CelebrationData, themeId: string) => void;
  onSendMessage?: (data: CelebrationData) => void;
}

const USDT_LOGO = "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040";
const BNB_LOGO = "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040";

function getTokenDisplay(tokenType?: string) {
  switch (tokenType) {
    case "fun_money":
      return { logo: funMoneyLogo, label: "FUN Money", explorer: "https://testnet.bscscan.com" };
    case "camly_web3":
      return { logo: camlyCoinLogo, label: "CAMLY", explorer: "https://bscscan.com" };
    case "usdt":
      return { logo: USDT_LOGO, label: "USDT", explorer: "https://bscscan.com" };
    case "bnb":
      return { logo: BNB_LOGO, label: "BNB", explorer: "https://bscscan.com" };
    case "bitcoin":
      return { logo: bitcoinLogo, label: "BTC", explorer: "https://bscscan.com" };
    default:
      return { logo: camlyCoinLogo, label: "Camly Coin", explorer: "" };
  }
}

// Firework burst particles
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
            style={{
              left: `${x}%`,
              top: `${y}%`,
              backgroundColor: colors[i % colors.length],
            }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              x: [0, Math.cos(angle) * dist],
              y: [0, Math.sin(angle) * dist],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.2, delay: delay + i * 0.03, ease: "easeOut" }}
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
    animate={{
      y: ["0%", "130vh"],
      opacity: [0, 1, 1, 1, 0],
      rotate: [0, 360, 720, 1080],
      x: [0, Math.random() > 0.5 ? 15 : -15],
    }}
    transition={{ duration: 3.5 + Math.random() * 2, delay, ease: "easeIn" }}
  >
    <img src={logo} alt="" className="w-full h-full drop-shadow-md rounded-full" />
  </motion.div>
);

const FloatingSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.8, 0], opacity: [0, 1, 0] }}
    transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 0.8 }}
  >
    <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
  </motion.div>
);

export function GiftCelebrationModal({ open, onOpenChange, data, onPostToProfile, onSendMessage }: GiftCelebrationModalProps) {
  const [showEffects, setShowEffects] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("congratulations");
  const [selectedBackground, setSelectedBackground] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState("rich-1");
  const [isPostingProfile, setIsPostingProfile] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && data) {
      setShowEffects(true);
      const timer = setTimeout(() => setShowEffects(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [open, data]);

  if (!data) return null;

  const tokenDisplay = getTokenDisplay(data.tokenType);
  const explorerBase = data.explorerUrl || tokenDisplay.explorer;
  const formatAmount = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount);
  const displayMessage = data.message?.replace(/^\[Web3\]\s*\S+\s*transfer.*$/i, "").trim() || null;
  const displayTime = data.created_at ? new Date(data.created_at).toLocaleString("vi-VN") : new Date().toLocaleString("vi-VN");
  const chain = data.chain || "BSC";

  const bgStyle = customImage
    ? { backgroundImage: `url(${customImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%), ${getThemeBackground(selectedTheme, selectedBackground)}` };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  const handleSaveImage = async () => {
    try {
      const { default: html2canvas } = await import("html2canvas");
      if (!cardRef.current) return;
      const canvas = await html2canvas(cardRef.current, { useCORS: true, scale: 2 });
      const link = document.createElement("a");
      link.download = `angel-ai-celebration-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Đã lưu hình ảnh!");
    } catch (e) {
      toast.error("Không thể lưu hình ảnh");
    }
  };

  const handleShareLink = () => {
    const url = data.receipt_public_id
      ? `${window.location.origin}/receipt/${data.receipt_public_id}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép link chia sẻ!");
  };

  // Fireworks data
  const fireworks = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    delay: i * 0.6 + Math.random() * 0.3,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 40,
  }));

  const fallingCoins = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    left: Math.random() * 100,
    size: 14 + Math.random() * 14,
  }));

  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden max-h-[90vh] overflow-y-auto">
        <motion.div
          ref={cardRef}
          data-celebration-card
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative rounded-2xl p-5 shadow-2xl overflow-hidden"
          style={bgStyle}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20 pointer-events-none" />

          {/* Effects Layer */}
          <AnimatePresence>
            {showEffects && (
              <>
                {/* Fireworks */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {fireworks.map((fw) => (
                    <FireworkBurst key={`fw-${fw.id}`} delay={fw.delay} x={fw.x} y={fw.y} />
                  ))}
                </div>
                {/* Falling Coins - mix Camly + FUN */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                  {fallingCoins.map((coin) => (
                    <FallingCoin
                      key={`coin-${coin.id}`}
                      delay={coin.delay}
                      left={coin.left}
                      size={coin.size}
                      logo={coin.id % 2 === 0 ? camlyCoinLogo : funMoneyLogo}
                    />
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

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Card content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-3">
            {/* Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 2, repeat: 2, ease: "linear" }}
                className="relative inline-block"
              >
                <div className="absolute inset-0 bg-yellow-300/50 blur-xl rounded-full" />
                <img src={tokenDisplay.logo} alt={tokenDisplay.label} className="w-14 h-14 relative z-10 drop-shadow-lg rounded-full" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-bold text-white drop-shadow-md"
            >
              🎉 CHÚC MỪNG TẶNG THƯỞNG THÀNH CÔNG 🎉
            </motion.h2>

            {/* Receipt Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg text-left space-y-3"
            >
              {/* Sender */}
              <div className="flex items-center gap-2">
                <Link to={`/user/${data.sender_id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
                  <Avatar className="h-9 w-9 ring-2 ring-amber-300">
                    <AvatarImage src={data.sender_avatar || ""} />
                    <AvatarFallback className="bg-amber-100 text-amber-700">{data.sender_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[10px] text-amber-600">Người tặng</p>
                    <p className="font-semibold text-xs truncate text-gray-800">{data.sender_name}</p>
                  </div>
                </Link>
                {data.sender_wallet && (
                  <button onClick={() => copyText(data.sender_wallet!, "ví")} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 shrink-0">
                    {data.sender_wallet.slice(0, 6)}...{data.sender_wallet.slice(-4)}
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Amount arrow */}
              <div className="flex items-center justify-center gap-2 py-1">
                <div className="h-px flex-1 bg-amber-200" />
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
                  <img src={tokenDisplay.logo} alt="" className="w-5 h-5 rounded-full" />
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-lg font-bold text-amber-700">{formatAmount(data.amount)}</span>
                  <span className="text-[10px] text-amber-600 font-medium">{tokenDisplay.label}</span>
                </div>
                <div className="h-px flex-1 bg-amber-200" />
              </div>

              {/* Receiver */}
              <div className="flex items-center gap-2">
                <Link to={`/user/${data.receiver_id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
                  <Avatar className="h-9 w-9 ring-2 ring-rose-300">
                    <AvatarImage src={data.receiver_avatar || ""} />
                    <AvatarFallback className="bg-rose-100 text-rose-700">{data.receiver_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[10px] text-rose-500">Người nhận</p>
                    <p className="font-semibold text-xs truncate text-gray-800">{data.receiver_name}</p>
                  </div>
                </Link>
                {data.receiver_wallet && (
                  <button onClick={() => copyText(data.receiver_wallet!, "ví")} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 shrink-0">
                    {data.receiver_wallet.slice(0, 6)}...{data.receiver_wallet.slice(-4)}
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Message */}
              {displayMessage && (
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <p className="text-[10px] text-gray-500 mb-0.5">Lời nhắn</p>
                  <p className="text-xs text-gray-700 italic">"{displayMessage}"</p>
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>⏰ {displayTime}</span>
                <span>⛓️ {chain}</span>
              </div>

              {/* TX Hash */}
              {data.tx_hash && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-500 truncate">
                      {data.tx_hash.slice(0, 10)}...{data.tx_hash.slice(-8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => copyText(data.tx_hash!, "Tx Hash")} className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                    {explorerBase && (
                      <a href={`${explorerBase}/tx/${data.tx_hash}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <ExternalLink className="w-3 h-3 text-orange-500" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Theme Selector */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full bg-white/30 backdrop-blur rounded-xl p-3 space-y-3"
            >
              <CelebrationThemeSelector
                selectedTheme={selectedTheme}
                selectedBackground={selectedBackground}
                customImage={customImage}
                onThemeChange={setSelectedTheme}
                onBackgroundChange={setSelectedBackground}
                onCustomImage={setCustomImage}
              />
              <CelebrationAudioPlayer
                selectedTrack={selectedTrack}
                onTrackChange={setSelectedTrack}
                autoPlay={open}
              />
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full grid grid-cols-2 gap-2"
            >
              <Button
                onClick={handleSaveImage}
                variant="outline"
                size="sm"
                className="bg-white/80 border-white/50 text-amber-900 hover:bg-white/90 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Lưu ảnh
              </Button>
              <Button
                onClick={handleShareLink}
                variant="outline"
                size="sm"
                className="bg-white/80 border-white/50 text-amber-900 hover:bg-white/90 text-xs"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Chia sẻ
              </Button>
              {data.tx_hash && (
                <Button
                  onClick={() => copyText(data.tx_hash!, "Tx Hash")}
                  variant="outline"
                  size="sm"
                  className="bg-white/80 border-white/50 text-amber-900 hover:bg-white/90 text-xs"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Tx Hash
                </Button>
              )}
              {onPostToProfile && (
                <Button
                  onClick={async () => {
                    setIsPostingProfile(true);
                    try {
                      await onPostToProfile(data, selectedTheme);
                    } finally {
                      setIsPostingProfile(false);
                    }
                  }}
                  disabled={isPostingProfile}
                  size="sm"
                  className="btn-golden-3d !text-black font-bold text-xs"
                >
                  {isPostingProfile ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Image className="w-3.5 h-3.5 mr-1" />}
                  {isPostingProfile ? "Đang đăng..." : "Đăng Profile"}
                </Button>
              )}
              {onSendMessage && (
                <Button
                  onClick={async () => {
                    setIsSendingMessage(true);
                    try {
                      await onSendMessage(data);
                    } finally {
                      setIsSendingMessage(false);
                    }
                  }}
                  disabled={isSendingMessage}
                  size="sm"
                  className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs col-span-2"
                >
                  {isSendingMessage ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5 mr-1" />}
                  {isSendingMessage ? "Đang gửi..." : "Gửi tin nhắn cho người nhận"}
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                className="col-span-2 bg-amber-900/80 hover:bg-amber-900 text-white font-semibold text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Đóng
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
