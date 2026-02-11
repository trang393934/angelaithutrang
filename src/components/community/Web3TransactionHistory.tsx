import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Wallet, ArrowUpRight, ChevronDown, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import { toast } from "sonner";

const TOKEN_INFO: Record<string, { symbol: string; logo: string }> = {
  CAMLY: { symbol: "CAMLY", logo: "" }, // will use camlyCoinLogo
  USDT: { symbol: "USDT", logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
  USDC: { symbol: "USDC", logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
  BNB: { symbol: "BNB", logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  FUN: { symbol: "FUN", logo: "" }, // will use camlyCoinLogo as fallback
};

function getTokenFromGiftType(giftType: string, message?: string | null): { symbol: string; logo: string } {
  if (giftType?.startsWith("web3_")) {
    const symbol = giftType.replace("web3_", "").toUpperCase();
    return TOKEN_INFO[symbol] || { symbol, logo: "" };
  }
  // Fallback: try to detect from message for old records
  if (message) {
    const msgUpper = message.toUpperCase();
    if (msgUpper.includes("USDT")) return TOKEN_INFO.USDT;
    if (msgUpper.includes("USDC")) return TOKEN_INFO.USDC;
    if (msgUpper.includes("BNB")) return TOKEN_INFO.BNB;
    if (msgUpper.includes("FUN MONEY") || msgUpper.includes("FUN ")) return TOKEN_INFO.FUN;
  }
  return TOKEN_INFO.CAMLY;
}

interface Web3Transaction {
  id: string;
  source: "gift" | "donation";
  sender_id: string;
  sender_name: string | null;
  sender_avatar: string | null;
  receiver_id: string | null;
  receiver_name: string | null;
  amount: number;
  message: string | null;
  tx_hash: string;
  created_at: string;
  gift_type: string;
}

function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  return (
    <button onClick={handleCopy} className="p-0.5 hover:bg-blue-100 rounded transition-colors">
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 text-blue-400 hover:text-blue-600" />
      )}
    </button>
  );
}

function Web3TxRow({ tx }: { tx: Web3Transaction }) {
  const { currentLanguage } = useLanguage();
  const locale = currentLanguage === "vi" ? vi : enUS;
  const tokenInfo = getTokenFromGiftType(tx.gift_type, tx.message);
  const tokenLogo = tokenInfo.logo || camlyCoinLogo;
  const tokenSymbol = tokenInfo.symbol;
  const timeAgo = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 border border-blue-100 rounded-xl p-3 hover:shadow-md transition-all hover:border-blue-200"
    >
      {/* Row 1: Sender → Receiver */}
      <div className="flex items-center gap-1.5 flex-wrap text-sm">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-3 h-3 text-white" />
        </div>

        <Link
          to={`/user/${tx.sender_id}`}
          className="font-semibold text-blue-700 truncate max-w-[120px] hover:underline"
        >
          {tx.sender_name || "Ẩn danh"}
        </Link>

        <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />

        {tx.receiver_id ? (
          <Link
            to={`/user/${tx.receiver_id}`}
            className="font-semibold text-blue-700 truncate max-w-[120px] hover:underline"
          >
            {tx.receiver_name || "Ẩn danh"}
          </Link>
        ) : (
          <span className="font-semibold text-rose-600">Angel AI</span>
        )}

        <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium ml-auto">
          {tx.source === "gift" ? "Thưởng" : "Tặng dự án"}
        </span>
      </div>

      {/* Row 2: Amount + Coin type */}
      <div className="flex items-center gap-2 mt-2">
        <img src={tokenLogo} alt={tokenSymbol} className="w-4 h-4 rounded-full" />
        <span className="font-bold text-blue-700 text-base">
          {tx.amount.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
          {tokenSymbol}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
      </div>

      {/* Row 3: TX Hash */}
      <div className="flex items-center gap-1.5 mt-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
        <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">TX Hash:</span>
        <a
          href={`https://bscscan.com/tx/${tx.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-mono truncate"
        >
          {shortenHash(tx.tx_hash)}
        </a>
        <CopyButton text={tx.tx_hash} />
        <a
          href={`https://bscscan.com/tx/${tx.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-700 font-medium"
        >
          <ExternalLink className="w-3 h-3" />
          BSCScan
        </a>
      </div>

      {/* Row 4: Message (if any) */}
      {tx.message && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic pl-1">
          "{tx.message}"
        </p>
      )}
    </motion.div>
  );
}

export function Web3TransactionHistory() {
  const [transactions, setTransactions] = useState<Web3Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showAllDialog, setShowAllDialog] = useState(false);

  const fetchWeb3Transactions = useCallback(async () => {
    try {
      // Fetch Web3 gifts (coin_gifts with tx_hash)
      const { data: gifts } = await supabase
        .from("coin_gifts")
        .select("id, sender_id, receiver_id, amount, message, created_at, tx_hash, gift_type")
        .not("tx_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch Web3 donations (project_donations with tx_hash)
      const { data: donations } = await supabase
        .from("project_donations")
        .select("id, donor_id, amount, message, created_at, tx_hash, donation_type, status")
        .not("tx_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      // Gather user IDs
      const userIds = new Set<string>();
      gifts?.forEach(g => {
        userIds.add(g.sender_id);
        userIds.add(g.receiver_id);
      });
      donations?.forEach(d => userIds.add(d.donor_id));

      // Fetch profiles
      interface ProfileInfo {
        user_id: string;
        display_name: string | null;
        avatar_url: string | null;
      }

      let profilesList: ProfileInfo[] = [];
      if (userIds.size > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", Array.from(userIds));
        profilesList = (data as ProfileInfo[]) || [];
      }

      const profileMap = new Map<string, ProfileInfo>(
        profilesList.map(p => [p.user_id, p])
      );

      const allTx: Web3Transaction[] = [];

      gifts?.forEach(g => {
        const txHash = (g as any).tx_hash as string | null;
        if (!txHash) return;
        const sender = profileMap.get(g.sender_id);
        const receiver = profileMap.get(g.receiver_id);
        allTx.push({
          id: g.id,
          source: "gift",
          sender_id: g.sender_id,
          sender_name: sender?.display_name || null,
          sender_avatar: sender?.avatar_url || null,
          receiver_id: g.receiver_id,
          receiver_name: receiver?.display_name || null,
          amount: g.amount,
          message: g.message,
          tx_hash: txHash,
          created_at: g.created_at,
          gift_type: g.gift_type || "web3",
        });
      });

      donations?.forEach(d => {
        if (!d.tx_hash) return;
        const donor = profileMap.get(d.donor_id);
        allTx.push({
          id: d.id,
          source: "donation",
          sender_id: d.donor_id,
          sender_name: donor?.display_name || null,
          sender_avatar: donor?.avatar_url || null,
          receiver_id: null,
          receiver_name: "Angel AI",
          amount: d.amount,
          message: d.message,
          tx_hash: d.tx_hash,
          created_at: d.created_at,
          gift_type: (d as any).donation_type || "web3",
        });
      });

      allTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTx);
    } catch (error) {
      console.error("Error fetching Web3 transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeb3Transactions();
  }, [fetchWeb3Transactions]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("web3_tx_history")
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_gifts" }, () => fetchWeb3Transactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "project_donations" }, () => fetchWeb3Transactions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchWeb3Transactions]);

  const previewTx = transactions.slice(0, 3);
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 p-4 animate-pulse">
        <div className="h-6 bg-blue-200/50 rounded w-2/3 mb-3" />
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-blue-100/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 overflow-hidden shadow-lg">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 py-3 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-white text-sm drop-shadow-sm">
              🔗 Giao Dịch Web3 On-Chain
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80 font-medium">
              {transactions.length} giao dịch
            </span>
            <ChevronDown className={`w-4 h-4 text-white transition-transform ${expanded ? '' : '-rotate-90'}`} />
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Stats */}
              <div className="px-4 pt-3 pb-1">
                <div className="bg-blue-100/60 rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-blue-600 font-medium">Tổng giao dịch Web3</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <img src={camlyCoinLogo} alt="Token" className="w-4 h-4 rounded-full" />
                      <span className="text-sm font-bold text-blue-700">{totalAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-blue-500 font-medium">tokens</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-blue-600 font-medium">Mạng lưới</p>
                    <p className="text-xs font-bold text-blue-700">BSC Mainnet</p>
                  </div>
                </div>
              </div>

              {/* Preview transactions */}
              <div className="px-3 py-2 space-y-2">
                {previewTx.length === 0 ? (
                  <div className="text-center py-6">
                    <Wallet className="w-10 h-10 text-blue-200 mx-auto mb-2" />
                    <p className="text-xs text-blue-500 font-medium">Chưa có giao dịch Web3 nào</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Thưởng/Tặng qua ví Web3 (CAMLY Token) để thấy giao dịch on-chain tại đây
                    </p>
                  </div>
                ) : (
                  previewTx.map(tx => (
                    <Web3TxRow key={tx.id} tx={tx} />
                  ))
                )}
              </div>

              {/* View all */}
              {transactions.length > 3 && (
                <div className="px-4 pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllDialog(true)}
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  >
                    Xem tất cả {transactions.length} giao dịch Web3
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full History Dialog */}
      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            <DialogTitle className="text-white flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              🔗 Lịch Sử Giao Dịch Web3
            </DialogTitle>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1">
                <img src={camlyCoinLogo} alt="Token" className="w-3.5 h-3.5 rounded-full" />
                <span className="text-xs text-white/90 font-medium">
                  Tổng: {totalAmount.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/70">
                  {transactions.length} giao dịch
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-3">
            {/* Refresh */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchWeb3Transactions}
                className="text-xs text-muted-foreground h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Làm mới
              </Button>
            </div>

            {/* Transaction list */}
            <ScrollArea className="h-[60vh]">
              <div className="space-y-2 pr-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Chưa có giao dịch Web3</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sử dụng tính năng "Chuyển Crypto" để thưởng/tặng CAMLY Token on-chain
                    </p>
                  </div>
                ) : (
                  transactions.map(tx => (
                    <Web3TxRow key={tx.id} tx={tx} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Web3TransactionHistory;
