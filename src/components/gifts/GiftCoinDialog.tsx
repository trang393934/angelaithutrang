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
import { Gift, Search, Loader2, Sparkles, User, Wallet, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import { useWeb3Transfer } from "@/hooks/useWeb3Transfer";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { TipCelebrationReceipt } from "./TipCelebrationReceipt";
import { CryptoTransferTab } from "./CryptoTransferTab";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";

interface TipReceiptData {
  receipt_public_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  receiver_id: string;
  receiver_name: string;
  receiver_avatar?: string | null;
  amount: number;
  message?: string | null;
  tx_hash?: string | null;
  created_at?: string;
}

interface GiftCoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUser?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  contextType?: string;
  contextId?: string;
}

interface UserSearchResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function GiftCoinDialog({ open, onOpenChange, preselectedUser, contextType, contextId }: GiftCoinDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { sendGift, isLoading } = useCoinGifts();
  const { balance } = useCamlyCoin();
  const {
    isTransferring,
    camlyCoinBalance,
    funMoneyBalance,
    fetchCamlyBalance,
    fetchFunMoneyBalance,
    transferCamly,
    transferFunMoney,
    isConnected,
    address,
    hasWallet,
    connect,
  } = useWeb3Transfer();

  const [selfGiftWarning, setSelfGiftWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<"internal" | "camly_web3" | "fun_money">("internal");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<TipReceiptData | null>(null);

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
    }
  }, [open, preselectedUser]);

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

    if (user?.id === selectedUser.user_id) {
      setSelfGiftWarning(true);
      return;
    }

    const numAmount = Number(amount);
    if (numAmount < 100) {
      toast.error(t("gift.minAmount"));
      return;
    }

    if (numAmount > balance) {
      toast.error(t("gift.insufficientBalance"));
      return;
    }

    try {
      const result = await sendGift(selectedUser.user_id, numAmount, message, contextType, contextId);

      if (result.success) {
        setCelebrationData({
          receipt_public_id: result.data?.receipt_public_id || "",
          sender_id: user?.id || "",
          sender_name: result.data?.sender_name || "Bạn",
          sender_avatar: result.data?.sender_avatar,
          receiver_id: selectedUser.user_id,
          receiver_name: selectedUser.display_name || "Người nhận",
          receiver_avatar: selectedUser.avatar_url,
          amount: numAmount,
          message: message || null,
        });
        onOpenChange(false);
        setShowCelebration(true);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("[GiftCoin] Send gift error:", error);
      toast.error("Lỗi gửi thưởng. Vui lòng thử lại.");
    }
  };

  // Shared handler for crypto transfer success
  const handleCryptoSuccess = async (
    result: { txHash?: string },
    recipientUser: UserSearchResult | null,
    targetAddress: string,
    transferAmount: number,
    tokenSymbol: string
  ) => {
    let senderName = "Bạn";
    let senderAvatar: string | null = null;
    try {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (senderProfile) {
        senderName = senderProfile.display_name || "Bạn";
        senderAvatar = senderProfile.avatar_url;
      }
    } catch (e) {
      console.warn("[Web3 Gift] Could not fetch sender profile:", e);
    }

    setCelebrationData({
      receipt_public_id: "",
      sender_id: user!.id,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      receiver_id: recipientUser?.user_id || "",
      receiver_name: recipientUser?.display_name || `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
      receiver_avatar: recipientUser?.avatar_url || null,
      amount: transferAmount,
      message: `[Web3] ${tokenSymbol} transfer`,
      tx_hash: result.txHash || null,
    });
    onOpenChange(false);
    setShowCelebration(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Gift className="w-5 h-5" />
              {t("gift.title")}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="internal" className="flex items-center gap-1 text-xs px-2 py-2">
                <img src={camlyCoinLogo} alt="" className="w-4 h-4 rounded-full" />
                <span className="hidden sm:inline">Camly</span>
                <span className="sm:hidden">Camly</span>
              </TabsTrigger>
              <TabsTrigger value="camly_web3" className="flex items-center gap-1 text-xs px-2 py-2">
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CAMLY Web3</span>
                <span className="sm:hidden">Web3</span>
              </TabsTrigger>
              <TabsTrigger value="fun_money" className="flex items-center gap-1 text-xs px-2 py-2">
                <img src={funMoneyLogo} alt="" className="w-4 h-4" />
                <span className="hidden sm:inline">FUN Money</span>
                <span className="sm:hidden">FUN</span>
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
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser.user_id}
                          className="w-full p-2 flex items-center gap-3 hover:bg-accent text-left"
                          onClick={() => {
                            setSelfGiftWarning(false);
                            setSelectedUser(searchUser);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={searchUser.avatar_url || ""} />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{searchUser.display_name || "Người dùng"}</span>
                          {searchUser.user_id === user?.id && (
                            <span className="text-xs text-muted-foreground ml-auto">(Bạn)</span>
                          )}
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

              {/* Self-Gift Warning */}
              <AnimatePresence>
                {selfGiftWarning && selectedUser?.user_id === user?.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-rose-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-rose-700 mb-1">
                          Yêu thương bản thân là tuyệt vời! 💕
                        </p>
                        <p className="text-sm text-rose-600">
                          Nhưng món quà sẽ ý nghĩa hơn khi chia sẻ với người khác. Hãy chọn một người bạn để lan tỏa yêu thương nhé!
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-rose-200 text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        setSelfGiftWarning(false);
                        setSelectedUser(null);
                      }}
                    >
                      Chọn người nhận khác
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

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

            {/* CAMLY Web3 Transfer Tab */}
            <TabsContent value="camly_web3" className="mt-4">
              <CryptoTransferTab
                tokenType="camly"
                tokenSymbol="CAMLY"
                tokenBalance={camlyCoinBalance}
                isConnected={isConnected}
                isTransferring={isTransferring}
                address={address}
                hasWallet={hasWallet}
                explorerUrl="https://bscscan.com"
                accentColor="orange"
                onConnect={connect}
                onTransfer={transferCamly}
                onFetchBalance={fetchCamlyBalance}
                onSuccess={(result, recipientUser, targetAddress, transferAmount) =>
                  handleCryptoSuccess(result, recipientUser, targetAddress, transferAmount, "CAMLY")
                }
              />
            </TabsContent>

            {/* FUN Money Transfer Tab */}
            <TabsContent value="fun_money" className="mt-4">
              <CryptoTransferTab
                tokenType="fun"
                tokenSymbol="FUN"
                tokenBalance={funMoneyBalance}
                isConnected={isConnected}
                isTransferring={isTransferring}
                address={address}
                hasWallet={hasWallet}
                explorerUrl="https://testnet.bscscan.com"
                accentColor="violet"
                onConnect={connect}
                onTransfer={transferFunMoney}
                onFetchBalance={fetchFunMoneyBalance}
                onSuccess={(result, recipientUser, targetAddress, transferAmount) =>
                  handleCryptoSuccess(result, recipientUser, targetAddress, transferAmount, "FUN")
                }
              />
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

      {/* Celebration Receipt Overlay */}
      <TipCelebrationReceipt
        open={showCelebration}
        onOpenChange={setShowCelebration}
        data={celebrationData}
      />
    </>
  );
}
