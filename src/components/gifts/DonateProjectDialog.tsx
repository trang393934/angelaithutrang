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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Loader2, Wallet, ExternalLink, Copy, Check } from "lucide-react";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useWeb3Transfer, TREASURY_WALLET_ADDRESS } from "@/hooks/useWeb3Transfer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import angelLogo from "@/assets/angel-ai-logo.png";

interface DonateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonateProjectDialog({ open, onOpenChange }: DonateProjectDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { donateToProject, isLoading } = useCoinGifts();
  const { balance } = useCamlyCoin();
  const {
    isTransferring,
    camlyCoinBalance,
    fetchCamlyBalance,
    donateCamlyToProject,
    isConnected,
    address,
    hasWallet,
    connect,
  } = useWeb3Transfer();
  
  const [activeTab, setActiveTab] = useState<"internal" | "crypto">("internal");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showHearts, setShowHearts] = useState(false);
  
  // Crypto states
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  // Manual transfer states
  const [addressCopied, setAddressCopied] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualTxHash, setManualTxHash] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setMessage("");
      setCryptoAmount("");
      setLastTxHash(null);
      setAddressCopied(false);
      setManualAmount("");
      setManualTxHash("");
    }
  }, [open]);

  // Fetch crypto balance when connected
  useEffect(() => {
    if (isConnected && activeTab === "crypto") {
      fetchCamlyBalance();
    }
  }, [isConnected, activeTab, fetchCamlyBalance]);

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

  const handleCryptoDonate = async () => {
    const numAmount = Number(cryptoAmount);
    if (numAmount <= 0) {
      toast.error(t("crypto.invalidAmount"));
      return;
    }

    try {
      const result = await donateCamlyToProject(numAmount);
      
      if (result.success) {
        setShowHearts(true);
        setLastTxHash(result.txHash || null);
        toast.success(result.message);
        fetchCamlyBalance();
        setTimeout(() => {
          setShowHearts(false);
          onOpenChange(false);
        }, 3000);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("[DonateProject] Crypto donate error:", error);
      toast.error("Lỗi kết nối ví. Vui lòng mở MetaMask và thử lại.");
    }
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(TREASURY_WALLET_ADDRESS);
    setAddressCopied(true);
    toast.success(t("crypto.addressCopied"));
    setTimeout(() => setAddressCopied(false), 3000);
  };

  const handleManualDonate = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    
    const numAmount = Number(manualAmount);
    if (numAmount <= 0) {
      toast.error(t("crypto.invalidAmount"));
      return;
    }

    setIsSubmittingManual(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("process-manual-donation", {
        body: { amount: numAmount, txHash: manualTxHash || null, message: message || null },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        setShowHearts(true);
        toast.success(t("crypto.manualDonateSuccess"));
        setTimeout(() => {
          setShowHearts(false);
          onOpenChange(false);
        }, 2500);
      } else {
        toast.error(response.data?.message || "Failed to record donation");
      }
    } catch (error: any) {
      console.error("Manual donation error:", error);
      toast.error(error.message || "Failed to process donation");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 50000];
  const cryptoQuickAmounts = [100, 500, 1000, 5000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Heart className="w-5 h-5 fill-rose-500" />
            {t("donate.title")}
          </DialogTitle>
        </DialogHeader>

        {/* Angel AI Logo & Message */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <img
              src={angelLogo}
              alt="Angel AI"
              className="w-16 h-16 rounded-full mx-auto ring-4 ring-rose-200"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1"
            >
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            </motion.div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("donate.description")}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "internal" | "crypto")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Camly Coin</span>
              <span className="sm:hidden">Coin</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">{t("crypto.transferTab")}</span>
              <span className="sm:hidden">Crypto</span>
            </TabsTrigger>
          </TabsList>

          {/* Internal Donation Tab */}
          <TabsContent value="internal" className="space-y-4 mt-4">
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
          </TabsContent>

          {/* Crypto Donation Tab */}
          <TabsContent value="crypto" className="space-y-4 mt-4">
            {/* Treasury Address - Always visible */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-amber-700">{t("crypto.treasuryAddress")}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAddress}
                  className="h-7 text-xs border-amber-300 hover:bg-amber-100"
                >
                  {addressCopied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-green-600" />
                      {t("crypto.addressCopied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      {t("crypto.copyAddress")}
                    </>
                  )}
                </Button>
              </div>
              <div className="font-mono text-xs break-all bg-white/60 p-2 rounded border border-amber-200">
                {TREASURY_WALLET_ADDRESS}
              </div>
            </div>

            {isConnected ? (
              <>
                {/* Wallet Info */}
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-3 border border-rose-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-rose-600">{t("crypto.walletBalance")}</div>
                      <div className="text-xl font-bold text-rose-700">
                        {Number(camlyCoinBalance).toLocaleString()} CAMLY
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("donate.quickAmount")}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {cryptoQuickAmounts.map((qa) => (
                      <Button
                        key={qa}
                        variant={cryptoAmount === String(qa) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCryptoAmount(String(qa))}
                        className={cryptoAmount === String(qa) ? "bg-rose-500 hover:bg-rose-600" : ""}
                      >
                        {qa >= 1000 ? `${qa / 1000}K` : qa}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("crypto.amount")}</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("crypto.gasNote")}
                  </p>
                </div>

                {/* Donate Button */}
                <Button
                  onClick={handleCryptoDonate}
                  disabled={isTransferring || !cryptoAmount}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                >
                  {isTransferring ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Heart className="w-4 h-4 mr-2 fill-white" />
                  )}
                  {t("crypto.confirmDonate")}
                </Button>

                {/* Transaction Link */}
                {lastTxHash && (
                  <a
                    href={`https://bscscan.com/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-rose-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("crypto.viewOnBscScan")}
                  </a>
                )}
              </>
            ) : (
              <>
                {/* Connect Wallet Option */}
                <div className="text-center py-4 space-y-3">
                  <Wallet className="w-10 h-10 mx-auto text-rose-500" />
                  <p className="text-sm text-muted-foreground">{t("crypto.connectToDonate")}</p>
                  <Button 
                    onClick={async () => {
                      try {
                        await connect();
                      } catch (err: any) {
                        console.warn("[DonateProject] Connect error:", err?.message);
                        toast.error("Không thể kết nối ví. Vui lòng mở MetaMask và thử lại.");
                      }
                    }} 
                    className="bg-gradient-to-r from-rose-500 to-pink-500"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {t("crypto.connectWallet")}
                  </Button>
                  {!hasWallet && (
                    <p className="text-xs text-muted-foreground">
                      {t("crypto.installMetaMask")}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted-foreground/20" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-muted-foreground">
                      {t("crypto.orManualTransfer")}
                    </span>
                  </div>
                </div>

                {/* Manual Transfer Section */}
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    {t("crypto.manualTransferDesc")}
                  </p>
                  
                  {addressCopied && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-sm font-medium text-rose-600">
                        {t("crypto.afterTransfer")}
                      </p>
                      
                      {/* Amount Input */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">{t("crypto.amount")}</label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          min={1}
                        />
                      </div>

                      {/* TX Hash Input */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">{t("crypto.txHash")}</label>
                        <Input
                          type="text"
                          placeholder="0x..."
                          value={manualTxHash}
                          onChange={(e) => setManualTxHash(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("crypto.txHashOptional")}
                        </p>
                      </div>

                      {/* Confirm Button */}
                      <Button
                        onClick={handleManualDonate}
                        disabled={isSubmittingManual || !manualAmount || Number(manualAmount) <= 0}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                      >
                        {isSubmittingManual ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Heart className="w-4 h-4 mr-2 fill-white" />
                        )}
                        {t("crypto.confirmManualDonate")}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {/* Thank you note */}
            <p className="text-xs text-center text-muted-foreground">
              {t("donate.thankYou")}
            </p>
          </TabsContent>
        </Tabs>

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
