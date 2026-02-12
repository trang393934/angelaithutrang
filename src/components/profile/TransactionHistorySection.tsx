import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, ArrowRight, Coins, TrendingUp,
  Download, ExternalLink, Loader2, ChevronDown, RefreshCw, Eye,
  Search, Copy, CheckCircle2, Clock, AlertCircle, Hash,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

interface TransactionHistorySectionProps {
  userId: string;
}

interface UnifiedTransaction {
  id: string;
  type: "internal" | "web3" | "funmoney";
  subType: string;
  amount: number;
  direction: "in" | "out" | "neutral";
  description: string;
  createdAt: string;
  txHash?: string | null;
  status?: string;
  senderName?: string;
  senderAvatar?: string;
  receiverName?: string;
  receiverAvatar?: string;
  tokenType: "CAMLY" | "FUN" | "BSC";
  network: "BSC" | "Internal";
}

interface WalletAssets {
  balance: number;
  lifetimeEarned: number;
  totalWithdrawn: number;
  walletAddress: string | null;
}

interface ProfileInfo {
  display_name: string | null;
  avatar_url: string | null;
}

const TX_TYPE_LABELS: Record<string, string> = {
  chat_reward: "Thưởng chat",
  journal_reward: "Thưởng nhật ký",
  post_reward: "Thưởng bài viết",
  comment_reward: "Thưởng bình luận",
  share_reward: "Thưởng chia sẻ",
  daily_login: "Đăng nhập hàng ngày",
  early_adopter: "Early Adopter",
  admin_adjustment: "Điều chỉnh",
  gift_sent: "Tặng quà",
  gift_received: "Nhận quà",
  spending: "Chi tiêu",
  help_reward: "Thưởng giúp đỡ",
  idea_reward: "Thưởng ý tưởng",
  feedback_reward: "Thưởng phản hồi",
  knowledge_reward: "Thưởng kiến thức",
  bounty_reward: "Thưởng bounty",
  referral_reward: "Thưởng giới thiệu",
  lixi_claim: "🧧 Lì xì Tết",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  CREATE_CONTENT: "Tạo nội dung",
  ENGAGE_SOCIAL: "Tương tác XH",
  DONATE_SUPPORT: "Đóng góp",
  SHARE_CONTENT: "Chia sẻ",
  QUALITY_QUESTION: "Câu hỏi chất lượng",
};

export function TransactionHistorySection({ userId }: TransactionHistorySectionProps) {
  const [walletAssets, setWalletAssets] = useState<WalletAssets | null>(null);
  const [internalTxs, setInternalTxs] = useState<UnifiedTransaction[]>([]);
  const [web3Txs, setWeb3Txs] = useState<UnifiedTransaction[]>([]);
  const [funMoneyTxs, setFunMoneyTxs] = useState<UnifiedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);

  // New state
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [profilesCache, setProfilesCache] = useState<Record<string, ProfileInfo>>({});

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (timeFilter) {
      case "today": {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { fromDate: start.toISOString(), toDate: undefined };
      }
      case "7d": {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return { fromDate: start.toISOString(), toDate: undefined };
      }
      case "30d": {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        return { fromDate: start.toISOString(), toDate: undefined };
      }
      case "custom":
        return {
          fromDate: customDateFrom ? new Date(customDateFrom).toISOString() : undefined,
          toDate: customDateTo ? new Date(customDateTo + "T23:59:59").toISOString() : undefined,
        };
      default:
        return { fromDate: undefined, toDate: undefined };
    }
  }, [timeFilter, customDateFrom, customDateTo]);

  const fetchWalletAssets = useCallback(async () => {
    const [balanceRes, walletRes, withdrawRes] = await Promise.all([
      supabase.from("camly_coin_balances").select("balance, lifetime_earned").eq("user_id", userId).maybeSingle(),
      supabase.from("user_wallet_addresses").select("wallet_address").eq("user_id", userId).maybeSingle(),
      supabase.from("coin_withdrawals").select("amount").eq("user_id", userId).eq("status", "completed"),
    ]);
    const totalWithdrawn = (withdrawRes.data || []).reduce((s, w) => s + w.amount, 0);
    setWalletAssets({
      balance: balanceRes.data?.balance || 0,
      lifetimeEarned: balanceRes.data?.lifetime_earned || 0,
      totalWithdrawn,
      walletAddress: walletRes.data?.wallet_address || null,
    });
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    const { fromDate, toDate } = getDateRange();

    let internalQuery = supabase
      .from("camly_coin_transactions")
      .select("id, amount, transaction_type, description, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromDate) internalQuery = internalQuery.gte("created_at", fromDate);
    if (toDate) internalQuery = internalQuery.lte("created_at", toDate);

    let giftsSentQuery = supabase
      .from("coin_gifts")
      .select("id, amount, message, created_at, tx_hash, receiver_id")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (fromDate) giftsSentQuery = giftsSentQuery.gte("created_at", fromDate);
    if (toDate) giftsSentQuery = giftsSentQuery.lte("created_at", toDate);

    let giftsReceivedQuery = supabase
      .from("coin_gifts")
      .select("id, amount, message, created_at, tx_hash, sender_id")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (fromDate) giftsReceivedQuery = giftsReceivedQuery.gte("created_at", fromDate);
    if (toDate) giftsReceivedQuery = giftsReceivedQuery.lte("created_at", toDate);

    let withdrawQuery = supabase
      .from("coin_withdrawals")
      .select("id, amount, status, created_at, tx_hash, wallet_address")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (fromDate) withdrawQuery = withdrawQuery.gte("created_at", fromDate);
    if (toDate) withdrawQuery = withdrawQuery.lte("created_at", toDate);

    let pplpQuery = supabase
      .from("pplp_actions")
      .select("id, action_type, status, created_at, minted_at, metadata")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromDate) pplpQuery = pplpQuery.gte("created_at", fromDate);
    if (toDate) pplpQuery = pplpQuery.lte("created_at", toDate);

    const [internalRes, giftsSentRes, giftsReceivedRes, withdrawRes, pplpRes] = await Promise.all([
      internalQuery, giftsSentQuery, giftsReceivedQuery, withdrawQuery, pplpQuery,
    ]);

    // Fetch profiles for gift participants
    const profileIds = new Set<string>();
    (giftsSentRes.data || []).forEach(g => profileIds.add(g.receiver_id));
    (giftsReceivedRes.data || []).forEach(g => profileIds.add(g.sender_id));
    const uniqueIds = Array.from(profileIds).filter(Boolean);

    if (uniqueIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", uniqueIds);
      const cache: Record<string, ProfileInfo> = {};
      (profilesData || []).forEach(p => {
        cache[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });
      setProfilesCache(cache);
    }

    // Fetch pplp scores
    const pplpActionIds = (pplpRes.data || []).map(a => a.id);
    const scoresMap: Record<string, number> = {};
    if (pplpActionIds.length > 0) {
      const { data: scoresData } = await supabase
        .from("pplp_scores")
        .select("action_id, final_reward, decision")
        .in("action_id", pplpActionIds);
      (scoresData || []).forEach(s => { scoresMap[s.action_id] = s.final_reward; });
    }

    // Map internal
    const internal: UnifiedTransaction[] = (internalRes.data || []).map(tx => {
      const meta = tx.metadata as Record<string, unknown> | null;
      const isLixi = (tx.transaction_type as string) === 'lixi_claim';
      return {
        id: tx.id,
        type: isLixi ? "web3" as const : "internal" as const,
        subType: tx.transaction_type,
        amount: Math.abs(tx.amount),
        direction: tx.amount >= 0 ? "in" as const : "out" as const,
        description: tx.description || TX_TYPE_LABELS[tx.transaction_type] || tx.transaction_type,
        createdAt: tx.created_at,
        txHash: isLixi && meta ? (meta.tx_hash as string) : undefined,
        tokenType: "CAMLY" as const,
        network: isLixi ? "BSC" as const : "Internal" as const,
      };
    });

    // Map web3 gifts
    const web3Sent: UnifiedTransaction[] = (giftsSentRes.data || [])
      .filter(g => g.tx_hash)
      .map(g => ({
        id: `gift-sent-${g.id}`,
        type: "web3" as const,
        subType: "gift_sent",
        amount: g.amount,
        direction: "out" as const,
        description: g.message || "Tặng quà Web3",
        createdAt: g.created_at,
        txHash: g.tx_hash,
        receiverName: profilesCache[g.receiver_id]?.display_name || undefined,
        receiverAvatar: profilesCache[g.receiver_id]?.avatar_url || undefined,
        tokenType: "CAMLY" as const,
        network: "BSC" as const,
      }));

    const web3Received: UnifiedTransaction[] = (giftsReceivedRes.data || [])
      .filter(g => g.tx_hash)
      .map(g => ({
        id: `gift-recv-${g.id}`,
        type: "web3" as const,
        subType: "gift_received",
        amount: g.amount,
        direction: "in" as const,
        description: g.message || "Nhận quà Web3",
        createdAt: g.created_at,
        txHash: g.tx_hash,
        senderName: profilesCache[g.sender_id]?.display_name || undefined,
        senderAvatar: profilesCache[g.sender_id]?.avatar_url || undefined,
        tokenType: "CAMLY" as const,
        network: "BSC" as const,
      }));

    const web3Withdrawals: UnifiedTransaction[] = (withdrawRes.data || []).map(w => ({
      id: `withdraw-${w.id}`,
      type: "web3" as const,
      subType: "withdrawal",
      amount: w.amount,
      direction: "out" as const,
      description: `Rút về ví ${w.wallet_address?.slice(0, 6)}...${w.wallet_address?.slice(-4)}`,
      createdAt: w.created_at,
      txHash: w.tx_hash,
      status: w.status,
      tokenType: "CAMLY" as const,
      network: "BSC" as const,
    }));

    // Map FUN Money
    const funMoney: UnifiedTransaction[] = (pplpRes.data || []).map(a => ({
      id: `pplp-${a.id}`,
      type: "funmoney" as const,
      subType: a.action_type,
      amount: scoresMap[a.id] || 0,
      direction: "in" as const,
      description: ACTION_TYPE_LABELS[a.action_type] || a.action_type,
      createdAt: a.created_at,
      status: a.status,
      tokenType: "FUN" as const,
      network: "Internal" as const,
    }));

    setInternalTxs(internal);
    setWeb3Txs([...web3Sent, ...web3Received, ...web3Withdrawals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setFunMoneyTxs(funMoney);
    setIsLoading(false);
  }, [userId, getDateRange]);

  useEffect(() => { fetchWalletAssets(); }, [fetchWalletAssets]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Update profiles in web3 txs after cache updates
  useEffect(() => {
    if (Object.keys(profilesCache).length === 0) return;
    setWeb3Txs(prev => prev.map(tx => {
      const updated = { ...tx };
      if (tx.subType === "gift_sent") {
        const receiverId = tx.id.replace("gift-sent-", "");
        // profiles are already embedded during fetch
      }
      return updated;
    }));
  }, [profilesCache]);

  const allTxs = useMemo(() => {
    let base: UnifiedTransaction[];
    switch (tokenFilter) {
      case "internal": base = internalTxs; break;
      case "web3": base = web3Txs; break;
      case "funmoney": base = funMoneyTxs; break;
      default: base = [...internalTxs, ...web3Txs, ...funMoneyTxs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    // Client-side search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(tx =>
        tx.description.toLowerCase().includes(q) ||
        tx.txHash?.toLowerCase().includes(q) ||
        tx.senderName?.toLowerCase().includes(q) ||
        tx.receiverName?.toLowerCase().includes(q) ||
        tx.subType.toLowerCase().includes(q)
      );
    }
    return base;
  }, [tokenFilter, internalTxs, web3Txs, funMoneyTxs, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const all = [...internalTxs, ...web3Txs, ...funMoneyTxs];
    const todayCount = all.filter(t => t.createdAt.slice(0, 10) === today).length;
    const successCount = all.filter(t => !t.status || t.status === "completed" || t.status === "minted").length;
    const pendingCount = all.filter(t => t.status === "pending").length;
    const sent = allTxs.filter(t => t.direction === "out");
    const received = allTxs.filter(t => t.direction === "in");
    return {
      total: allTxs.length,
      totalAll: all.length,
      totalValue: allTxs.reduce((s, t) => s + t.amount, 0),
      todayCount,
      successCount,
      pendingCount,
      sentCount: sent.length,
      sentAmount: sent.reduce((s, t) => s + t.amount, 0),
      receivedCount: received.length,
      receivedAmount: received.reduce((s, t) => s + t.amount, 0),
    };
  }, [allTxs, internalTxs, web3Txs, funMoneyTxs]);

  const visibleTxs = allTxs.slice(0, visibleCount);

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatNumber = (n: number) => n.toLocaleString("vi-VN");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  const handleRefresh = () => {
    setVisibleCount(20);
    fetchWalletAssets();
    fetchTransactions();
    toast.success("Đã làm mới dữ liệu");
  };

  const handleViewAll = () => {
    setVisibleCount(allTxs.length);
  };

  const handleExportCSV = () => {
    if (allTxs.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    const headers = ["Ngày", "Loại", "Mô tả", "Số lượng", "Hướng", "TX Hash", "Trạng thái", "Token", "Mạng"];
    const rows = allTxs.map(tx => [
      format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm"),
      TX_TYPE_LABELS[tx.subType] || ACTION_TYPE_LABELS[tx.subType] || tx.subType,
      tx.description,
      tx.amount.toString(),
      tx.direction === "in" ? "Nhận" : "Chuyển",
      tx.txHash || "",
      tx.status || "completed",
      tx.tokenType,
      tx.network,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `angel-ai-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất file CSV");
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === "completed" || status === "minted") {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-700 border border-green-500/20">
          <CheckCircle2 className="w-2.5 h-2.5" /> Thành công
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#daa520]/10 text-[#b8860b] border border-[#daa520]/20">
          <Clock className="w-2.5 h-2.5" /> Chờ xử lý
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
        <AlertCircle className="w-2.5 h-2.5" /> {status}
      </span>
    );
  };

  const getTypeBadge = (tx: UnifiedTransaction) => {
    const styles = {
      internal: "bg-[#daa520]/10 text-[#b8860b] border-[#daa520]/30",
      web3: "bg-[#daa520]/15 text-[#8B6914] border-[#b8860b]/30",
      funmoney: "bg-[#ffd700]/10 text-[#8B6914] border-[#ffd700]/30",
    };
    const labels = { internal: "Nội bộ", web3: "Onchain", funmoney: "FUN Money" };
    return (
      <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border ${styles[tx.type]}`}>
        {labels[tx.type]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="section-title-gold text-base sm:text-lg">
            <TrendingUp className="w-5 h-5 mr-2" />
            Lịch Sử Giao Dịch Ánh Sáng
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Giao dịch Ánh Sáng liên quan đến ví của bạn (Tặng thưởng, Ủng hộ, Rút thưởng)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh} className="h-8 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> Làm mới
          </Button>
          <Button size="sm" variant="outline" onClick={handleViewAll} className="h-8 text-xs">
            <Eye className="w-3 h-3 mr-1" /> Xem tất cả
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="h-8 text-xs">
            <Download className="w-3 h-3 mr-1" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* ===== Wallet Assets Card ===== */}
      {walletAssets && (
        <Card className="border-[#daa520]/30 shadow-soft overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#b8860b]/10 via-[#daa520]/5 to-[#ffd700]/10 pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <CardTitle className="flex items-center gap-2 text-lg text-[#3D2800]">
              <Wallet className="w-5 h-5 text-[#b8860b]" />
              Tài Sản Ví Cá Nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Số dư Camly</p>
                <p className="text-lg font-bold text-[#b8860b] flex items-center gap-1">
                  <Coins className="w-4 h-4 text-[#daa520]" />
                  {formatNumber(walletAssets.balance)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tổng đã kiếm</p>
                <p className="text-lg font-bold text-green-600">{formatNumber(walletAssets.lifetimeEarned)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tổng đã rút</p>
                <p className="text-lg font-bold text-orange-500">{formatNumber(walletAssets.totalWithdrawn)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ví BSC</p>
                {walletAssets.walletAddress ? (
                  <button
                    onClick={() => copyToClipboard(walletAssets.walletAddress!)}
                    className="text-sm font-mono text-[#b8860b] hover:underline flex items-center gap-1"
                  >
                    {shortenAddress(walletAssets.walletAddress)}
                    <Copy className="w-3 h-3" />
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Chưa liên kết</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== 5 Stats Cards ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Tổng giao dịch", value: formatNumber(stats.totalAll), icon: Hash, color: "text-[#b8860b]" },
          { label: "Tổng giá trị", value: formatNumber(stats.totalValue), icon: Coins, color: "text-[#daa520]", suffix: "CAMLY" },
          { label: "Hôm nay", value: formatNumber(stats.todayCount), icon: TrendingUp, color: "text-[#b8860b]" },
          { label: "Thành công", value: formatNumber(stats.successCount), icon: CheckCircle2, color: "text-green-600" },
          { label: "Chờ xử lý", value: formatNumber(stats.pendingCount), icon: Clock, color: "text-[#daa520]" },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#daa520]/20 bg-gradient-to-br from-[#ffd700]/5 to-transparent p-3 text-center"
          >
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            {s.suffix && <p className="text-[10px] text-muted-foreground">{s.suffix}</p>}
          </div>
        ))}
      </div>

      {/* ===== Search + Filters ===== */}
      <Card className="border-[#daa520]/20">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mô tả, ví, tx hash..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs border-[#daa520]/30 focus:border-[#daa520]"
              />
            </div>
            <Select value={tokenFilter} onValueChange={v => { setTokenFilter(v); setVisibleCount(20); }}>
              <SelectTrigger className="w-full sm:w-36 h-8 text-xs border-[#daa520]/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả token</SelectItem>
                <SelectItem value="internal">Camly Coin</SelectItem>
                <SelectItem value="web3">Web3 / Onchain</SelectItem>
                <SelectItem value="funmoney">FUN Money</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={v => { setTimeFilter(v); setVisibleCount(20); }}>
              <SelectTrigger className="w-full sm:w-36 h-8 text-xs border-[#daa520]/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="7d">7 ngày qua</SelectItem>
                <SelectItem value="30d">30 ngày qua</SelectItem>
                <SelectItem value="custom">Tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {timeFilter === "custom" && (
            <div className="flex gap-2 mt-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Từ ngày</label>
                <Input type="date" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)} className="h-7 w-36 text-xs border-[#daa520]/30" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Đến ngày</label>
                <Input type="date" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)} className="h-7 w-36 text-xs border-[#daa520]/30" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Transaction List ===== */}
      <Card className="border-[#daa520]/20">
        <CardContent className="py-3 px-4">
          {/* Counter */}
          <p className="text-xs text-muted-foreground mb-3">
            Hiển thị <span className="font-semibold text-[#b8860b]">{visibleTxs.length}</span> / <span className="font-semibold">{allTxs.length}</span> giao dịch Ánh Sáng
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#daa520]" />
              <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
            </div>
          ) : visibleTxs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Chưa có giao dịch nào
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {visibleTxs.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#daa520]/15 hover:border-[#daa520]/40 hover:shadow-[0_0_12px_-4px_rgba(218,165,32,0.2)] transition-all bg-gradient-to-r from-[#ffd700]/[0.02] to-transparent"
                  >
                    {/* Direction Icon / Avatar */}
                    <div className="shrink-0">
                      {tx.senderAvatar || tx.receiverAvatar ? (
                        <Avatar className="w-8 h-8 border border-[#daa520]/30">
                          <AvatarImage src={tx.direction === "in" ? tx.senderAvatar || "" : tx.receiverAvatar || ""} />
                          <AvatarFallback className="bg-[#daa520]/10 text-[#b8860b] text-xs">
                            {tx.direction === "in" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.direction === "in" ? "bg-green-500/10 text-green-600" : "bg-[#daa520]/10 text-[#b8860b]"
                        }`}>
                          {tx.direction === "in" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tx.senderName && tx.direction === "in" && (
                          <span className="text-xs font-medium text-[#3D2800]">{tx.senderName}</span>
                        )}
                        {(tx.senderName || tx.receiverName) && (
                          <ArrowRight className="w-3 h-3 text-[#daa520]" />
                        )}
                        {tx.receiverName && tx.direction === "out" && (
                          <span className="text-xs font-medium text-[#3D2800]">{tx.receiverName}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate text-foreground">{tx.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.createdAt), "dd/MM/yy HH:mm", { locale: vi })}
                        </span>
                        {getTypeBadge(tx)}
                        {tx.status && getStatusBadge(tx.status)}
                        {tx.network === "BSC" && (
                          <span className="inline-flex items-center text-[9px] px-1 py-0 rounded bg-[#daa520]/10 text-[#b8860b] border border-[#daa520]/20">
                            BSC
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount + TX */}
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${tx.direction === "in" ? "text-green-600" : "text-[#b8860b]"}`}>
                        {tx.direction === "in" ? "+" : "-"}{formatNumber(tx.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{tx.tokenType}</p>
                      {tx.txHash && (
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <button
                            onClick={() => copyToClipboard(tx.txHash!)}
                            className="text-[10px] text-[#b8860b] hover:text-[#daa520]"
                            title="Sao chép TX Hash"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                          <a
                            href={`https://bscscan.com/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#b8860b] hover:text-[#daa520] inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> tx
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {visibleCount < allTxs.length && (
                <div className="flex justify-center pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisibleCount(v => v + 20)}
                    className="text-xs text-[#b8860b] hover:text-[#daa520]"
                  >
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Xem thêm ({allTxs.length - visibleCount} còn lại)
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
