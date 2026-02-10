import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, Filter, Coins, TrendingUp, Send, Download, ExternalLink, Loader2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

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
}

interface WalletAssets {
  balance: number;
  lifetimeEarned: number;
  totalWithdrawn: number;
  walletAddress: string | null;
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [visibleCount, setVisibleCount] = useState(20);

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

    // Build date filters
    const fromDate = dateFrom ? new Date(dateFrom).toISOString() : undefined;
    const toDate = dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined;

    // 1. Internal transactions
    let internalQuery = supabase
      .from("camly_coin_transactions")
      .select("id, amount, transaction_type, description, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (fromDate) internalQuery = internalQuery.gte("created_at", fromDate);
    if (toDate) internalQuery = internalQuery.lte("created_at", toDate);

    // 2. Coin gifts (sent + received)
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

    // 3. Withdrawals
    let withdrawQuery = supabase
      .from("coin_withdrawals")
      .select("id, amount, status, created_at, tx_hash, wallet_address")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (fromDate) withdrawQuery = withdrawQuery.gte("created_at", fromDate);
    if (toDate) withdrawQuery = withdrawQuery.lte("created_at", toDate);

    // 4. PPLP actions + scores
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

    // Fetch scores for pplp actions
    const pplpActionIds = (pplpRes.data || []).map(a => a.id);
    let scoresMap: Record<string, number> = {};
    if (pplpActionIds.length > 0) {
      const { data: scoresData } = await supabase
        .from("pplp_scores")
        .select("action_id, final_reward, decision")
        .in("action_id", pplpActionIds);
      (scoresData || []).forEach(s => { scoresMap[s.action_id] = s.final_reward; });
    }

    // Map internal
    const internal: UnifiedTransaction[] = (internalRes.data || []).map(tx => ({
      id: tx.id,
      type: "internal" as const,
      subType: tx.transaction_type,
      amount: Math.abs(tx.amount),
      direction: tx.amount >= 0 ? "in" as const : "out" as const,
      description: tx.description || TX_TYPE_LABELS[tx.transaction_type] || tx.transaction_type,
      createdAt: tx.created_at,
    }));

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
    }));

    setInternalTxs(internal);
    setWeb3Txs([...web3Sent, ...web3Received, ...web3Withdrawals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setFunMoneyTxs(funMoney);
    setIsLoading(false);
  }, [userId, dateFrom, dateTo]);

  useEffect(() => { fetchWalletAssets(); }, [fetchWalletAssets]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const currentTxs = useMemo(() => {
    switch (activeTab) {
      case "internal": return internalTxs;
      case "web3": return web3Txs;
      case "funmoney": return funMoneyTxs;
      default: return [...internalTxs, ...web3Txs, ...funMoneyTxs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }, [activeTab, internalTxs, web3Txs, funMoneyTxs]);

  const stats = useMemo(() => {
    const sent = currentTxs.filter(t => t.direction === "out");
    const received = currentTxs.filter(t => t.direction === "in");
    return {
      sentCount: sent.length,
      receivedCount: received.length,
      sentAmount: sent.reduce((s, t) => s + t.amount, 0),
      receivedAmount: received.reduce((s, t) => s + t.amount, 0),
      total: currentTxs.reduce((s, t) => s + t.amount, 0),
    };
  }, [currentTxs]);

  const visibleTxs = currentTxs.slice(0, visibleCount);

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatNumber = (n: number) => n.toLocaleString("vi-VN");

  const handleFilter = () => {
    setVisibleCount(20);
    fetchTransactions();
  };

  const handleClearFilter = () => {
    setDateFrom("");
    setDateTo("");
    setVisibleCount(20);
  };

  return (
    <div className="space-y-4">
      {/* Wallet Assets Card */}
      {walletAssets && (
        <Card className="border-primary/20 shadow-soft overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="w-5 h-5 text-primary" />
              Tài Sản Ví Cá Nhân
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Số dư Camly</p>
                <p className="text-lg font-bold text-primary">{formatNumber(walletAssets.balance)}</p>
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
                  <p className="text-sm font-mono text-muted-foreground">{shortenAddress(walletAssets.walletAddress)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Chưa liên kết</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Lịch Sử Giao Dịch
          </CardTitle>

          {/* Date Filter */}
          <div className="flex flex-wrap items-end gap-2 mt-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Từ ngày</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Đến ngày</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
            </div>
            <Button size="sm" variant="outline" onClick={handleFilter} className="h-8">
              <Filter className="w-3 h-3 mr-1" /> Lọc
            </Button>
            {(dateFrom || dateTo) && (
              <Button size="sm" variant="ghost" onClick={handleClearFilter} className="h-8 text-xs">Xoá lọc</Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setVisibleCount(20); }}>
            <TabsList className="w-full grid grid-cols-4 mb-3">
              <TabsTrigger value="all" className="text-xs">Tất cả</TabsTrigger>
              <TabsTrigger value="internal" className="text-xs">Nội bộ</TabsTrigger>
              <TabsTrigger value="web3" className="text-xs">Web3</TabsTrigger>
              <TabsTrigger value="funmoney" className="text-xs">FUN Money</TabsTrigger>
            </TabsList>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-muted/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <ArrowDownLeft className="w-3 h-3" />
                  <span className="text-xs font-medium">Nhận</span>
                </div>
                <p className="text-sm font-bold">{stats.receivedCount} lượt</p>
                <p className="text-xs text-muted-foreground">{formatNumber(stats.receivedAmount)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-xs font-medium">Chuyển</span>
                </div>
                <p className="text-sm font-bold">{stats.sentCount} lượt</p>
                <p className="text-xs text-muted-foreground">{formatNumber(stats.sentAmount)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary">
                  <Coins className="w-3 h-3" />
                  <span className="text-xs font-medium">Tổng</span>
                </div>
                <p className="text-sm font-bold">{currentTxs.length}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(stats.total)}</p>
              </div>
            </div>

            {/* Transaction List - shared across all tabs */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
              </div>
            ) : visibleTxs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Chưa có giao dịch nào
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {visibleTxs.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        tx.direction === "in" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-500"
                      }`}>
                        {tx.direction === "in" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(tx.createdAt), "dd/MM/yy HH:mm", { locale: vi })}</span>
                          {tx.type === "internal" && <Badge variant="secondary" className="text-[10px] px-1 py-0">Nội bộ</Badge>}
                          {tx.type === "web3" && <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-500/50 text-blue-600">Web3</Badge>}
                          {tx.type === "funmoney" && <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/50 text-purple-600">FUN</Badge>}
                          {tx.status && tx.status !== "completed" && tx.status !== "minted" && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{tx.status}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${tx.direction === "in" ? "text-green-600" : "text-orange-500"}`}>
                          {tx.direction === "in" ? "+" : "-"}{formatNumber(tx.amount)}
                        </p>
                        {tx.txHash && (
                          <a
                            href={`https://bscscan.com/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 hover:underline inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> tx
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {visibleCount < currentTxs.length && (
                  <div className="flex justify-center pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleCount(v => v + 20)}
                      className="text-xs"
                    >
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Xem thêm ({currentTxs.length - visibleCount} còn lại)
                    </Button>
                  </div>
                )}
              </ScrollArea>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
