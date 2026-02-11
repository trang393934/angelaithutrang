import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, User, Wallet, Sparkles, ExternalLink, MessageCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import type { TransferResult, TokenType } from "@/hooks/useWeb3Transfer";

interface UserSearchResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const MESSAGE_TEMPLATES = [
  "Chúc mừng bạn! 🎉",
  "Cảm ơn bạn rất nhiều! 💚",
  "Yêu thương gửi bạn! 💕",
  "Tặng bạn món quà nhỏ! 🎁",
  "FUN cùng nhau! 🌟",
];

interface CryptoTransferTabProps {
  tokenType: TokenType;
  tokenSymbol: string;
  tokenBalance: string;
  isConnected: boolean;
  isTransferring: boolean;
  address: string | undefined;
  hasWallet: boolean;
  explorerUrl: string;
  accentColor: string;
  onConnect: () => Promise<void>;
  onTransfer: (toAddress: string, amount: number) => Promise<TransferResult>;
  onFetchBalance: () => void;
  onSuccess: (result: TransferResult, recipientUser: UserSearchResult | null, targetAddress: string, amount: number, message?: string) => void;
}

export function CryptoTransferTab({
  tokenType,
  tokenSymbol,
  tokenBalance,
  isConnected,
  isTransferring,
  address,
  hasWallet,
  explorerUrl,
  accentColor,
  onConnect,
  onTransfer,
  onFetchBalance,
  onSuccess,
}: CryptoTransferTabProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [cryptoRecipient, setCryptoRecipient] = useState<"address" | "profile">("address");
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState("");

  const [cryptoSelectedUser, setCryptoSelectedUser] = useState<UserSearchResult | null>(null);
  const [cryptoSearchQuery, setCryptoSearchQuery] = useState("");
  const [cryptoSearchResults, setCryptoSearchResults] = useState<UserSearchResult[]>([]);
  const [isCryptoSearching, setIsCryptoSearching] = useState(false);
  const [walletLookupError, setWalletLookupError] = useState<string | null>(null);

  // Wallet address → user lookup
  const [walletOwner, setWalletOwner] = useState<UserSearchResult | null>(null);
  const [isLookingUpWallet, setIsLookingUpWallet] = useState(false);

  // Look up wallet owner when address is pasted/typed (address mode only)
  useEffect(() => {
    if (cryptoRecipient !== "address") {
      setWalletOwner(null);
      return;
    }
    const addr = walletAddress.trim();
    if (!addr || addr.length !== 42 || !addr.startsWith("0x")) {
      setWalletOwner(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsLookingUpWallet(true);
      setWalletOwner(null);
      try {
        const { data } = await supabase
          .from("user_wallet_addresses")
          .select("user_id")
          .eq("wallet_address", addr)
          .maybeSingle();

        if (data?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .eq("user_id", data.user_id)
            .maybeSingle();
          if (profile) {
            setWalletOwner(profile);
          }
        } else {
          // Fallback: check coin_withdrawals
          const { data: wd } = await supabase
            .from("coin_withdrawals")
            .select("user_id")
            .eq("wallet_address", addr)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (wd?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("user_id, display_name, avatar_url")
              .eq("user_id", wd.user_id)
              .maybeSingle();
            if (profile) setWalletOwner(profile);
          }
        }
      } catch (err) {
        console.error("Wallet owner lookup error:", err);
      } finally {
        setIsLookingUpWallet(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [walletAddress, cryptoRecipient]);

  useEffect(() => {
    if (isConnected) {
      onFetchBalance();
    }
  }, [isConnected, onFetchBalance]);

  useEffect(() => {
    if (cryptoSearchQuery.length < 2) {
      setCryptoSearchResults([]);
      return;
    }
    const debounce = setTimeout(async () => {
      setIsCryptoSearching(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .ilike("display_name", `%${cryptoSearchQuery}%`)
          .limit(10);
        if (data) setCryptoSearchResults(data);
      } catch (err) {
        console.error("Crypto search error:", err);
      } finally {
        setIsCryptoSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [cryptoSearchQuery]);

  const handleSelectCryptoUser = async (selectedProfile: UserSearchResult) => {
    setCryptoSelectedUser(selectedProfile);
    setCryptoSearchQuery("");
    setCryptoSearchResults([]);
    setWalletLookupError(null);
    setWalletAddress("");

    try {
      // 1. Primary: check user_wallet_addresses
      const { data, error } = await supabase
        .from("user_wallet_addresses")
        .select("wallet_address")
        .eq("user_id", selectedProfile.user_id)
        .maybeSingle();

      if (error) throw error;

      if (data?.wallet_address) {
        setWalletAddress(data.wallet_address);
        return;
      }

      // 2. Fallback: check coin_withdrawals for a known wallet
      const { data: withdrawal } = await supabase
        .from("coin_withdrawals")
        .select("wallet_address")
        .eq("user_id", selectedProfile.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (withdrawal?.wallet_address) {
        setWalletAddress(withdrawal.wallet_address);
        // Auto-save to user_wallet_addresses for future lookups
        await supabase
          .from("user_wallet_addresses")
          .upsert({ user_id: selectedProfile.user_id, wallet_address: withdrawal.wallet_address }, { onConflict: "user_id" })
          .then(() => console.log("[Wallet] Backfilled from withdrawals"));
        return;
      }

      // 3. Fallback: check coin_gifts for a known tx_hash sender address
      const { data: gift } = await supabase
        .from("coin_gifts")
        .select("tx_hash")
        .eq("sender_id", selectedProfile.user_id)
        .not("tx_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (gift?.tx_hash) {
        // User has done Web3 transfers but wallet not saved - show helpful message
        setWalletLookupError("Người này đã giao dịch Web3 nhưng chưa lưu địa chỉ ví. Hãy nhập địa chỉ ví trực tiếp.");
        setCryptoRecipient("address");
        return;
      }

      setWalletLookupError("Người này chưa đăng ký ví Web3");
    } catch (err) {
      console.error("Wallet lookup error:", err);
      setWalletLookupError("Không thể tìm địa chỉ ví");
    }
  };

  const handleTransfer = async () => {
    const numAmount = Number(cryptoAmount);
    if (numAmount <= 0) {
      toast.error(t("crypto.invalidAmount"));
      return;
    }

    if (!walletAddress || walletAddress.length !== 42) {
      toast.error(t("crypto.invalidAddress"));
      return;
    }

    try {
      const result = await onTransfer(walletAddress, numAmount);

      if (result.success) {
        setLastTxHash(result.txHash || null);
        toast.success(result.message);
        onFetchBalance();

        const receiverUser = cryptoSelectedUser || walletOwner;
        const receiverUserId = receiverUser?.user_id || null;
        const giftRecord = {
          sender_id: user!.id,
          receiver_id: receiverUserId || user!.id,
          amount: numAmount,
          message: giftMessage || `[Web3] ${tokenSymbol} transfer to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          tx_hash: result.txHash || null,
          gift_type: "web3",
        };

        const { error: dbError } = await supabase.from("coin_gifts").insert(giftRecord);
        if (dbError) {
          console.error(`[Web3 Gift ${tokenSymbol}] DB insert failed:`, dbError.message);
          setTimeout(async () => {
            const { error: retryError } = await supabase.from("coin_gifts").insert(giftRecord);
            if (retryError) {
              console.error(`[Web3 Gift ${tokenSymbol}] Retry failed:`, retryError.message);
            }
          }, 2000);
        }

        onSuccess(result, receiverUser, walletAddress, numAmount, giftMessage || undefined);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error(`[Web3 Gift ${tokenSymbol}] Transfer error:`, error);
      toast.error("Lỗi kết nối ví. Vui lòng mở MetaMask và thử lại.");
    }
  };

  const gradientFrom = accentColor === "violet" ? "from-violet-50" : "from-orange-50";
  const gradientTo = accentColor === "violet" ? "to-purple-50" : "to-amber-50";
  const borderColor = accentColor === "violet" ? "border-violet-200" : "border-orange-200";
  const textColor = accentColor === "violet" ? "text-violet-600" : "text-orange-600";
  const textBold = accentColor === "violet" ? "text-violet-700" : "text-orange-700";
  const btnGradient = accentColor === "violet"
    ? "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600";
  const ringColor = accentColor === "violet" ? "ring-violet-300" : "ring-orange-300";
  const activeBtn = accentColor === "violet" ? "bg-violet-500" : "bg-orange-500";

  if (!isConnected) {
    return (
      <div className="text-center py-6 space-y-4">
        <Wallet className="w-12 h-12 mx-auto text-primary" />
        <p className="text-muted-foreground">{t("crypto.connectToTransfer")}</p>
        <Button
          onClick={async () => {
            const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
            if (inIframe) {
              toast.info(
                <div className="space-y-2">
                  <p className="font-medium">Không thể kết nối ví trong preview</p>
                  <p className="text-sm text-muted-foreground">
                    Vui lòng mở ứng dụng trong tab mới để kết nối MetaMask.
                  </p>
                  <button
                    onClick={() => window.open("https://angelaithutrang.lovable.app", "_blank")}
                    className="text-xs underline text-primary hover:text-primary/80"
                  >
                    Mở trong tab mới →
                  </button>
                </div>,
                { duration: 8000 }
              );
              return;
            }
            try {
              await onConnect();
            } catch (err: any) {
              console.warn("[CryptoTransferTab] Connect error:", err?.message);
              toast.error("Không thể kết nối ví. Vui lòng mở MetaMask và thử lại.");
            }
          }}
          className={btnGradient}
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Info */}
      <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-lg p-3 border ${borderColor}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className={`text-sm ${textColor}`}>Số dư {tokenSymbol}</div>
            <div className={`text-xl font-bold ${textBold}`}>
              {Number(tokenBalance).toLocaleString()} {tokenSymbol}
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
            className={cryptoRecipient === "address" ? activeBtn : ""}
          >
            {t("crypto.walletAddress")}
          </Button>
          <Button
            variant={cryptoRecipient === "profile" ? "default" : "outline"}
            size="sm"
            onClick={() => setCryptoRecipient("profile")}
            className={cryptoRecipient === "profile" ? activeBtn : ""}
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
          {/* Wallet owner lookup result */}
          {isLookingUpWallet && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang tìm chủ ví...
            </div>
          )}
          {walletOwner && !isLookingUpWallet && (
            <div className="flex items-center gap-3 p-2.5 bg-accent/60 rounded-lg border border-border/50">
              <Avatar className="h-9 w-9 ring-2 ring-primary/30">
                <AvatarImage src={walletOwner.avatar_url || ""} className="object-cover" />
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{walletOwner.display_name || "Người dùng"}</div>
                <div className="text-xs text-muted-foreground">Chủ sở hữu ví này</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            </div>
          )}
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
                <Avatar className={`h-10 w-10 ring-2 ${ringColor}`}>
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
        <label className="text-sm font-medium">Số lượng {tokenSymbol}</label>
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

      {/* Message Input with Templates */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          Lời nhắn
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {MESSAGE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl}
              type="button"
              onClick={() => setGiftMessage(tmpl)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                giftMessage === tmpl
                  ? `${activeBtn} text-white border-transparent`
                  : "border-border hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tmpl}
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Hoặc nhập lời nhắn tùy chọn..."
          value={giftMessage}
          onChange={(e) => setGiftMessage(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Transfer Button */}
      <Button
        onClick={handleTransfer}
        disabled={isTransferring || !cryptoAmount || !walletAddress}
        className={`w-full ${btnGradient}`}
      >
        {isTransferring ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Wallet className="w-4 h-4 mr-2" />
        )}
        Chuyển {tokenSymbol}
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
            href={`${explorerUrl}/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Xem trên BscScan
          </a>
        </div>
      )}
    </div>
  );
}
