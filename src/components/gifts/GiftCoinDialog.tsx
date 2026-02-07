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
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { TipCelebrationReceipt } from "./TipCelebrationReceipt";

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
    fetchCamlyBalance, 
    transferCamly, 
    isConnected, 
    address, 
    hasWallet, 
    connect 
  } = useWeb3Transfer();
  
  const [selfGiftWarning, setSelfGiftWarning] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"internal" | "crypto">("internal");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<TipReceiptData | null>(null);
  
  // Crypto tab states
  const [cryptoRecipient, setCryptoRecipient] = useState<"address" | "profile">("address");
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  // Profile-based crypto recipient
  const [cryptoSelectedUser, setCryptoSelectedUser] = useState<UserSearchResult | null>(null);
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState("");
  const [cryptoSearchResults, setCryptoSearchResults] = useState<UserSearchResult[]>([]);
  const [isCryptoSearching, setIsCryptoSearching] = useState(false);
  const [walletLookupError, setWalletLookupError] = useState<string | null>(null);

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
      setCryptoSelectedUser(null);
      setCryptoSearchQuery("");
      setCryptoSearchResults([]);
      setWalletLookupError(null);
    }
  }, [open, preselectedUser]);

  // Fetch crypto balance when connected
  useEffect(() => {
    if (isConnected && activeTab === "crypto") {
      fetchCamlyBalance();
    }
  }, [isConnected, activeTab, fetchCamlyBalance]);

  // Crypto user search with debounce
  useEffect(() => {
    if (cryptoSearchQuery.length < 2) {
      setCryptoSearchResults([]);
      return;
    }
    const debounce = setTimeout(async () => {
      setIsCryptoSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .ilike("display_name", `%${cryptoSearchQuery}%`)
          .limit(10);
        if (error) {
          console.error("Crypto profile search error:", error);
        }
        if (data) setCryptoSearchResults(data);
      } catch (err) {
        console.error("Crypto search error:", err);
      } finally {
        setIsCryptoSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [cryptoSearchQuery]);

  // Lookup wallet address when a crypto profile user is selected
  const handleSelectCryptoUser = async (selectedProfile: UserSearchResult) => {
    setCryptoSelectedUser(selectedProfile);
    setCryptoSearchQuery("");
    setCryptoSearchResults([]);
    setWalletLookupError(null);
    setWalletAddress("");

    try {
      const { data, error } = await supabase
        .from("user_wallet_addresses")
        .select("wallet_address")
        .eq("user_id", selectedProfile.user_id)
        .maybeSingle();

      if (error) throw error;

      if (data?.wallet_address) {
        setWalletAddress(data.wallet_address);
      } else {
        setWalletLookupError("Người này chưa đăng ký ví Web3");
      }
    } catch (err) {
      console.error("Wallet lookup error:", err);
      setWalletLookupError("Không thể tìm địa chỉ ví");
    }
  };

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

    // Check if user is trying to gift themselves
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
        // Show celebration receipt instead of just confetti
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

    try {
      const result = await transferCamly(targetAddress, numAmount);
      
      if (result.success) {
        setShowConfetti(true);
        setLastTxHash(result.txHash || null);
        toast.success(result.message);
        fetchCamlyBalance();

        // Save Web3 gift to database for transaction history
        const receiverUserId = cryptoSelectedUser?.user_id || null;
        const giftRecord = {
          sender_id: user!.id,
          receiver_id: receiverUserId || user!.id,
          amount: numAmount,
          message: `[Web3] CAMLY transfer to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
          tx_hash: result.txHash || null,
          gift_type: "web3",
        };

        console.log("[Web3 Gift] Attempting DB insert:", JSON.stringify(giftRecord));

        const { error: dbError } = await supabase.from("coin_gifts").insert(giftRecord);

        if (dbError) {
          console.error("[Web3 Gift] DB insert failed:", dbError.message, dbError.details, dbError.hint);
          // Retry once after 2 seconds — the on-chain TX already succeeded
          setTimeout(async () => {
            console.log("[Web3 Gift] Retrying DB insert...");
            const { error: retryError } = await supabase.from("coin_gifts").insert(giftRecord);
            if (retryError) {
              console.error("[Web3 Gift] Retry also failed:", retryError.message);
              toast.warning("Giao dịch on-chain thành công nhưng chưa lưu được vào lịch sử. TX: " + (result.txHash || "N/A"));
            } else {
              console.log("[Web3 Gift] Retry succeeded!");
            }
          }, 2000);
        } else {
          console.log("[Web3 Gift] DB insert succeeded for TX:", result.txHash);
        }

        setTimeout(() => {
          setShowConfetti(false);
          onOpenChange(false);
        }, 4000);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("[Web3 Gift] Unhandled transfer error:", error);
      toast.error("Lỗi kết nối ví. Vui lòng mở MetaMask và thử lại.");
    }
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

          {/* Crypto Transfer Tab */}
          <TabsContent value="crypto" className="space-y-4 mt-4">
            {!isConnected ? (
              <div className="text-center py-6 space-y-4">
                <Wallet className="w-12 h-12 mx-auto text-amber-500" />
                <p className="text-muted-foreground">{t("crypto.connectToTransfer")}</p>
                <Button 
                  onClick={async () => {
                    try {
                      await connect();
                    } catch (err: any) {
                      console.warn("[GiftCoinDialog] Connect error:", err?.message);
                      toast.error("Không thể kết nối ví. Vui lòng mở MetaMask và thử lại.");
                    }
                  }} 
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
                    {!cryptoSelectedUser ? (
                      <>
                        <label className="text-sm font-medium">{t("gift.searchUser")}</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder={t("gift.searchPlaceholder")}
                            value={cryptoSearchQuery}
                            onChange={(e) => setCryptoSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                          {isCryptoSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{t("crypto.profileNeedWallet")}</p>
                        {cryptoSearchResults.length > 0 ? (
                          <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                            {cryptoSearchResults.map((searchUser) => (
                              <button
                                key={searchUser.user_id}
                                className="w-full p-2 flex items-center gap-3 hover:bg-accent text-left"
                                onClick={() => handleSelectCryptoUser(searchUser)}
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
                        ) : (
                          cryptoSearchQuery.length >= 2 && !isCryptoSearching && (
                            <p className="text-xs text-center text-muted-foreground py-3">
                              Không tìm thấy người dùng "{cryptoSearchQuery}"
                            </p>
                          )
                        )}
                      </>
                    ) : (
                      <>
                        <label className="text-sm font-medium">{t("crypto.recipientType")}</label>
                        <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                          <Avatar className="h-10 w-10 ring-2 ring-orange-300">
                            <AvatarImage src={cryptoSelectedUser.avatar_url || ""} />
                            <AvatarFallback>
                              <User className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{cryptoSelectedUser.display_name || "Người dùng"}</div>
                            {walletAddress ? (
                              <div className="text-xs text-muted-foreground truncate">
                                {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
                              </div>
                            ) : walletLookupError ? (
                              <div className="text-xs text-destructive">{walletLookupError}</div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Đang tìm ví...
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCryptoSelectedUser(null);
                              setWalletAddress("");
                              setWalletLookupError(null);
                            }}
                          >
                            {t("common.change")}
                          </Button>
                        </div>
                      </>
                    )}
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
                  disabled={isTransferring || !cryptoAmount || !walletAddress}
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                      <Sparkles className="w-4 h-4" />
                      Chúc mừng bạn đã chuyển thành công!
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                        {lastTxHash}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(lastTxHash);
                          toast.success("Đã sao chép mã giao dịch!");
                        }}
                      >
                        📋
                      </Button>
                    </div>
                    <a
                      href={`https://bscscan.com/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-orange-600 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t("crypto.viewOnBscScan")}
                    </a>
                  </div>
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
    
    {/* Celebration Receipt Overlay */}
    <TipCelebrationReceipt
      open={showCelebration}
      onOpenChange={setShowCelebration}
      data={celebrationData}
    />
    </>
  );
}

