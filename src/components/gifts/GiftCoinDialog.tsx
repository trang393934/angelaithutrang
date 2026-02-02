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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Search, Loader2, Sparkles, User, Wallet, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useWeb3Transfer } from "@/hooks/useWeb3Transfer";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface GiftCoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUser?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface UserSearchResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function GiftCoinDialog({ open, onOpenChange, preselectedUser }: GiftCoinDialogProps) {
  const { t } = useLanguage();
  const { sendGift, isLoading } = useCoinGifts();
  const { balance } = useCamlyCoin();
  const { 
    isTransferring, 
    camlyCoinBalance, 
    fetchCamlyBalance, 
    transferCamly, 
    isConnected, 
    address, 
    hasWallet, 
    connect 
  } = useWeb3Transfer();
  
  const [activeTab, setActiveTab] = useState<"internal" | "crypto">("internal");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Crypto tab states
  const [cryptoRecipient, setCryptoRecipient] = useState<"address" | "profile">("address");
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedUser) {
      setSelectedUser({
        user_id: preselectedUser.id,
        display_name: preselectedUser.display_name,
        avatar_url: preselectedUser.avatar_url,
      });
    }
  }, [preselectedUser]);

  useEffect(() => {
    if (!open) {
      if (!preselectedUser) {
        setSelectedUser(null);
      }
      setAmount("");
      setMessage("");
      setSearchQuery("");
      setSearchResults([]);
      setCryptoAmount("");
      setWalletAddress("");
      setLastTxHash(null);
    }
  }, [open, preselectedUser]);

  // Fetch crypto balance when connected
  useEffect(() => {
    if (isConnected && activeTab === "crypto") {
      fetchCamlyBalance();
    }
  }, [isConnected, activeTab, fetchCamlyBalance]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${query}%`)
        .limit(5);

      if (!error && data) {
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSendGift = async () => {
    if (!selectedUser || !amount) return;

    const numAmount = Number(amount);
    if (numAmount < 100) {
      toast.error(t("gift.minAmount"));
      return;
    }

    if (numAmount > balance) {
      toast.error(t("gift.insufficientBalance"));
      return;
    }

    const result = await sendGift(selectedUser.user_id, numAmount, message);
    
    if (result.success) {
      setShowConfetti(true);
      toast.success(result.message);
      setTimeout(() => {
        setShowConfetti(false);
        onOpenChange(false);
      }, 2000);
    } else {
      toast.error(result.message);
    }
  };

  const handleCryptoTransfer = async () => {
    const numAmount = Number(cryptoAmount);
    if (numAmount <= 0) {
      toast.error(t("crypto.invalidAmount"));
      return;
    }

    let targetAddress = walletAddress;

    // If using profile selection, we need the user's linked wallet
    // For now, we require direct wallet address
    if (!targetAddress || targetAddress.length !== 42) {
      toast.error(t("crypto.invalidAddress"));
      return;
    }

    const result = await transferCamly(targetAddress, numAmount);
    
    if (result.success) {
      setShowConfetti(true);
      setLastTxHash(result.txHash || null);
      toast.success(result.message);
      fetchCamlyBalance();
      setTimeout(() => {
        setShowConfetti(false);
        onOpenChange(false);
      }, 3000);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Gift className="w-5 h-5" />
            {t("gift.title")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "internal" | "crypto")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Camly Coin</span>
              <span className="sm:hidden">Coin</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">{t("crypto.transferTab")}</span>
              <span className="sm:hidden">Crypto</span>
            </TabsTrigger>
          </TabsList>

          {/* Internal Camly Coin Tab */}
          <TabsContent value="internal" className="space-y-4 mt-4">
            {/* Current Balance */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-200">
              <div className="text-sm text-amber-600">{t("gift.yourBalance")}</div>
              <div className="text-xl font-bold text-amber-700">
                {balance.toLocaleString()} Camly Coin
              </div>
            </div>

            {/* User Search / Selection */}
            {!selectedUser ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("gift.searchUser")}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("gift.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.user_id}
                        className="w-full p-2 flex items-center gap-3 hover:bg-accent text-left"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.display_name || "Người dùng"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("gift.recipient")}</label>
                <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                  <Avatar className="h-10 w-10 ring-2 ring-amber-300">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{selectedUser.display_name || "Người dùng"}</div>
                  </div>
                  {!preselectedUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                    >
                      {t("common.change")}
                    </Button>
                  )}
                </div>
              </div>
            )}

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
              <label className="text-sm font-medium">{t("gift.message")}</label>
              <Textarea
                placeholder={t("gift.messagePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSendGift}
              disabled={!selectedUser || !amount || isLoading || Number(amount) < 100}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              {t("gift.confirm")}
            </Button>
          </TabsContent>

          {/* Crypto Transfer Tab */}
          <TabsContent value="crypto" className="space-y-4 mt-4">
            {!isConnected ? (
              <div className="text-center py-6 space-y-4">
                <Wallet className="w-12 h-12 mx-auto text-amber-500" />
                <p className="text-muted-foreground">{t("crypto.connectToTransfer")}</p>
                <Button 
                  onClick={connect} 
                  className="bg-gradient-to-r from-amber-500 to-orange-500"
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
            ) : (
              <>
                {/* Wallet Info */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-orange-600">{t("crypto.walletBalance")}</div>
                      <div className="text-xl font-bold text-orange-700">
                        {Number(camlyCoinBalance).toLocaleString()} CAMLY
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                  </div>
                </div>

                {/* Recipient Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("crypto.recipientType")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={cryptoRecipient === "address" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCryptoRecipient("address")}
                      className={cryptoRecipient === "address" ? "bg-orange-500" : ""}
                    >
                      {t("crypto.walletAddress")}
                    </Button>
                    <Button
                      variant={cryptoRecipient === "profile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCryptoRecipient("profile")}
                      className={cryptoRecipient === "profile" ? "bg-orange-500" : ""}
                    >
                      {t("crypto.fromProfile")}
                    </Button>
                  </div>
                </div>

                {/* Wallet Address Input */}
                {cryptoRecipient === "address" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("crypto.recipientAddress")}</label>
                    <Input
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("gift.searchUser")}</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t("gift.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("crypto.profileNeedWallet")}
                    </p>
                  </div>
                )}

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

                {/* Transfer Button */}
                <Button
                  onClick={handleCryptoTransfer}
                  disabled={isTransferring || !cryptoAmount || (cryptoRecipient === "address" && !walletAddress)}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  {isTransferring ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Wallet className="w-4 h-4 mr-2" />
                  )}
                  {t("crypto.confirmTransfer")}
                </Button>

                {/* Transaction Link */}
                {lastTxHash && (
                  <a
                    href={`https://bscscan.com/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-orange-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("crypto.viewOnBscScan")}
                  </a>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Confetti Effect */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: "50%",
                    y: "50%",
                    scale: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: 1,
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                  className="absolute"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
