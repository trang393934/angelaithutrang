import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import angelLogo from "@/assets/angel-ai-logo.png";

interface DonateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonateProjectDialog({ open, onOpenChange }: DonateProjectDialogProps) {
  const { t } = useLanguage();
  const { donateToProject, isLoading } = useCoinGifts();
  const { balance } = useCamlyCoin();
  
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showHearts, setShowHearts] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setMessage("");
    }
  }, [open]);

  const handleDonate = async () => {
    if (!amount) return;

    const numAmount = Number(amount);
    if (numAmount < 100) {
      toast.error(t("donate.minAmount"));
      return;
    }

    if (numAmount > balance) {
      toast.error(t("gift.insufficientBalance"));
      return;
    }

    const result = await donateToProject(numAmount, message);
    
    if (result.success) {
      setShowHearts(true);
      toast.success(result.message);
      setTimeout(() => {
        setShowHearts(false);
        onOpenChange(false);
      }, 2500);
    } else {
      toast.error(result.message);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 50000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Heart className="w-5 h-5 fill-rose-500" />
            {t("donate.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Angel AI Logo & Message */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <img
                src={angelLogo}
                alt="Angel AI"
                className="w-20 h-20 rounded-full mx-auto ring-4 ring-rose-200"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1"
              >
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("donate.description")}
            </p>
          </div>

          {/* Current Balance */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-3 border border-rose-200">
            <div className="text-sm text-rose-600">{t("gift.yourBalance")}</div>
            <div className="text-xl font-bold text-rose-700">
              {balance.toLocaleString()} Camly Coin
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("donate.quickAmount")}</label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  variant={amount === String(qa) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(String(qa))}
                  className={amount === String(qa) ? "bg-rose-500 hover:bg-rose-600" : ""}
                >
                  {qa >= 1000 ? `${qa / 1000}K` : qa}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("gift.amount")}</label>
            <Input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={100}
              max={balance}
            />
            <p className="text-xs text-muted-foreground">{t("gift.minAmountNote")}</p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("donate.messageLabel")}</label>
            <Textarea
              placeholder={t("donate.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleDonate}
            disabled={!amount || isLoading || Number(amount) < 100}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Heart className="w-4 h-4 mr-2 fill-white" />
            )}
            {t("donate.confirm")}
          </Button>

          {/* Thank you note */}
          <p className="text-xs text-center text-muted-foreground">
            {t("donate.thankYou")}
          </p>
        </div>

        {/* Hearts Effect */}
        <AnimatePresence>
          {showHearts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: "50%",
                    y: "100%",
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: `${30 + Math.random() * 40}%`,
                    y: "-20%",
                    scale: 0.5 + Math.random() * 0.5,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 1.5 + Math.random(),
                    ease: "easeOut",
                    delay: Math.random() * 0.3,
                  }}
                  className="absolute"
                >
                  <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
