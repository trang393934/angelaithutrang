import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWithdrawalNotify } from '@/hooks/useWithdrawalNotify';
import camlyCoinLogo from '@/assets/camly-coin-logo.png';

const FallingCoin = ({ delay, left }: { delay: number; left: number }) => (
  <motion.div
    className="absolute w-6 h-6 z-10"
    style={{ left: `${left}%` }}
    initial={{ y: -50, opacity: 0, rotate: 0 }}
    animate={{
      y: ['0%', '120vh'],
      opacity: [0, 1, 1, 0],
      rotate: [0, 360, 720],
    }}
    transition={{
      duration: 3,
      delay,
      ease: 'easeIn',
    }}
  >
    <img src={camlyCoinLogo} alt="" className="w-full h-full" />
  </motion.div>
);

const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 1.5,
      delay,
      repeat: Infinity,
      repeatDelay: 1,
    }}
  >
    <Sparkles className="w-4 h-4 text-yellow-300" />
  </motion.div>
);

export const WithdrawalCelebration = () => {
  const { pendingCelebration, audioUrl, markAsCelebrated } = useWithdrawalNotify();
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  

  // Open dialog when there's a pending celebration
  useEffect(() => {
    if (pendingCelebration) {
      setIsOpen(true);
    }
  }, [pendingCelebration]);

  // Play audio when dialog opens
  useEffect(() => {
    if (isOpen && audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.volume = 0.7;
      audio.play().catch(console.error);

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [isOpen, audioUrl]);

  // No auto-close — popup stays until user manually closes

  const handleClose = () => {
    setIsOpen(false);
    markAsCelebrated();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openBscScan = () => {
    if (pendingCelebration?.tx_hash) {
      window.open(
        `https://bscscan.com/tx/${pendingCelebration.tx_hash}`,
        '_blank'
      );
    }
  };

  if (!pendingCelebration) return null;

  // Generate falling coins
  const fallingCoins = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    left: Math.random() * 100,
  }));

  // Generate sparkles
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative rounded-2xl p-6 shadow-2xl overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 30%, transparent 50%, rgba(255,255,255,0.15) 70%, transparent 100%), linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 30%, #ffec8b 45%, #ffd700 55%, #daa520 70%, #b8860b 85%, #cd950c 100%)`,
              }}
            >
              {/* Falling coins animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {fallingCoins.map((coin) => (
                  <FallingCoin key={coin.id} delay={coin.delay} left={coin.left} />
                ))}
              </div>

              {/* Sparkles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {sparkles.map((sparkle) => (
                  <Sparkle
                    key={sparkle.id}
                    delay={sparkle.delay}
                    x={sparkle.x}
                    y={sparkle.y}
                  />
                ))}
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-20 p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                {/* Spinning coin logo */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-yellow-300/50 blur-xl rounded-full" />
                  <img
                    src={camlyCoinLogo}
                    alt="Camly Coin"
                    className="w-20 h-20 relative z-10 drop-shadow-lg"
                  />
                </motion.div>

                {/* Celebration text */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
                    🎉 Chúc mừng bạn đã chuyển thành công! 🎉
                  </h2>
                  <p className="text-white/90 mt-1">
                    Camly Coin đã về ví của bạn!
                  </p>
                </motion.div>

                {/* Amount display */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-amber-300 rounded-xl px-6 py-4 shadow-lg"
                >
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                    +{formatAmount(pendingCelebration.amount)} CAMLY
                  </p>
                </motion.div>

                {/* Wallet address */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-white/80 text-sm"
                >
                  Ví: {shortenAddress(pendingCelebration.wallet_address)}
                </motion.p>

                {/* BSCScan link */}
                {pendingCelebration.tx_hash && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    onClick={openBscScan}
                    className="flex items-center gap-2 text-white/90 hover:text-white underline underline-offset-2 text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem giao dịch trên BSCScan
                  </motion.button>
                )}

                {/* Close button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="pt-2"
                >
                  <Button
                    onClick={handleClose}
                    className="bg-white hover:bg-white/90 text-amber-700 font-semibold px-8 py-2 rounded-full shadow-lg"
                  >
                    ✨ Tuyệt vời! ✨
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
