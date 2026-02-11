import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, RefreshCw, Download, Search, Gift, Heart, Wallet,
  ArrowUpRight, ArrowDownLeft, Copy, ExternalLink, Check,
  Clock, TrendingUp, Activity, CheckCircle2, Loader2, Filter,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format, isToday, subDays, subMonths } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { toast } from "sonner";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface Transaction {
  id: string;
  type: "gift" | "donation";
  sender_id: string;
  sender_name: string | null;
  sender_avatar: string | null;
  sender_wallet: string | null;
  receiver_id: string | null;
  receiver_name: string | null;
  receiver_avatar: string | null;
  receiver_wallet: string | null;
  amount: number;
  message: string | null;
  created_at: string;
  tx_hash: string | null;
  gift_type: string | null;
  donation_type: string | null;
  receipt_public_id: string | null;
}

function truncateWallet(addr: string | null) {
  if (!addr) return null;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-[#daa520]/30 p-3 sm:p-4 text-center shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-8 h-8 mx-auto mb-1.5 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-[11px] text-[#8B7355] font-medium">{label}</p>
      <p className="text-lg font-bold text-[#3D2800]">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  const { currentLanguage } = useLanguage();
  const locale = currentLanguage === "vi" ? vi : enUS;
  const timeAgo = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale });
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const isGift = tx.type === "gift";
  const isOnchain = tx.tx_hash || tx.gift_type === "web3" || tx.donation_type === "manual";

  const copyWallet = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopiedWallet(addr);
    toast.success("Đã sao chép địa chỉ ví");
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-[#daa520]/20 p-3 sm:p-4 hover:border-[#daa520]/40 transition-all hover:shadow-md group">
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
          isGift 
            ? 'bg-gradient-to-br from-[#daa520] to-[#b8860b]' 
            : 'bg-gradient-to-br from-rose-400 to-pink-500'
        }`}>
          {isGift ? <Gift className="w-4 h-4 text-white" /> : <Heart className="w-4 h-4 text-white fill-white" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Sender -> Receiver */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Link to={`/user/${tx.sender_id}`} className="flex items-center gap-1.5 hover:opacity-80">
              <Avatar className="w-5 h-5">
                <AvatarImage src={tx.sender_avatar || ""} />
                <AvatarFallback className="text-[8px] bg-[#ffd700]/20 text-[#b8860b]">
                  {(tx.sender_name || "?")[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm text-[#3D2800] truncate max-w-[100px]">
                {tx.sender_name || "Ẩn danh"}
              </span>
            </Link>

            {isGift ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#daa520] flex-shrink-0" />
            ) : (
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            )}

            {isGift && tx.receiver_id ? (
              <Link to={`/user/${tx.receiver_id}`} className="flex items-center gap-1.5 hover:opacity-80">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={tx.receiver_avatar || ""} />
                  <AvatarFallback className="text-[8px] bg-[#ffd700]/20 text-[#b8860b]">
                    {(tx.receiver_name || "?")[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm text-[#3D2800] truncate max-w-[100px]">
                  {tx.receiver_name || "Ẩn danh"}
                </span>
              </Link>
            ) : (
              <span className="font-semibold text-sm text-rose-600">Angel AI</span>
            )}
          </div>

          {/* Wallet addresses */}
          {tx.sender_wallet && (
            <div className="flex items-center gap-1 text-[11px] text-[#8B7355] mb-0.5">
              <span className="font-mono">{truncateWallet(tx.sender_wallet)}</span>
              <button onClick={() => copyWallet(tx.sender_wallet!)} className="hover:text-[#b8860b]">
                {copiedWallet === tx.sender_wallet ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isGift 
                ? 'bg-gradient-to-r from-[#ffd700]/20 to-[#daa520]/20 text-[#b8860b] border border-[#daa520]/30' 
                : 'bg-rose-100 text-rose-600 border border-rose-200'
            }`}>
              {isGift ? <Gift className="w-2.5 h-2.5" /> : <Heart className="w-2.5 h-2.5" />}
              {isGift ? "Tặng thưởng" : "Donate"}
            </span>

            {isOnchain && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-gradient-to-r from-[#ffd700]/20 to-[#daa520]/20 text-[#b8860b] border border-[#daa520]/30 px-2 py-0.5 rounded-full font-medium">
                <Wallet className="w-2.5 h-2.5" />
                Onchain
              </span>
            )}

            <span className="text-[10px] text-[#8B7355]">• {timeAgo}</span>

            {tx.tx_hash && (
              <span className="text-[10px] text-[#8B7355]">• BSC</span>
            )}
          </div>

          {/* Amount + TX Hash */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <img src={camlyCoinLogo} alt="CAMLY" className="w-4 h-4 rounded-full" />
              <span className={`font-bold text-base ${isGift ? 'text-[#b8860b]' : 'text-rose-500'}`}>
                {tx.amount.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8B7355] font-medium">CAMLY</span>
            </div>

            <div className="flex items-center gap-1">
              {tx.tx_hash && (
                <a
                  href={`https://bscscan.com/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  TX
                </a>
              )}
              {tx.receipt_public_id && (
                <Link
                  to={`/receipt/${tx.receipt_public_id}`}
                  className="text-[10px] text-[#b8860b] hover:text-[#8B6914] flex items-center gap-0.5 ml-1"
                >
                  <Gift className="w-3 h-3" />
                  Xem Card
                </Link>
              )}
            </div>
          </div>

          {/* Message */}
          {tx.message && (
            <p className="text-xs text-[#8B7355] mt-1.5 line-clamp-2 italic">
              "{tx.message}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const ActivityHistory = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [onchainOnly, setOnchainOnly] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: gifts } = await supabase
        .from("coin_gifts")
        .select("id, sender_id, receiver_id, amount, message, created_at, tx_hash, gift_type, receipt_public_id")
        .order("created_at", { ascending: false })
        .limit(500);

      const { data: donations } = await supabase
        .from("project_donations")
        .select("id, donor_id, amount, message, created_at, donation_type, tx_hash, status")
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(500);

      const userIds = new Set<string>();
      gifts?.forEach(g => { userIds.add(g.sender_id); userIds.add(g.receiver_id); });
      donations?.forEach(d => userIds.add(d.donor_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const allTx: Transaction[] = [];

      gifts?.forEach(g => {
        const sender = profileMap.get(g.sender_id);
        const receiver = profileMap.get(g.receiver_id);
        allTx.push({
          id: g.id, type: "gift",
          sender_id: g.sender_id, sender_name: sender?.display_name || null,
          sender_avatar: sender?.avatar_url || null, sender_wallet: null,
          receiver_id: g.receiver_id, receiver_name: receiver?.display_name || null,
          receiver_avatar: receiver?.avatar_url || null, receiver_wallet: null,
          amount: g.amount, message: g.message, created_at: g.created_at,
          tx_hash: g.tx_hash || null, gift_type: g.gift_type || null,
          donation_type: null, receipt_public_id: g.receipt_public_id || null,
        });
      });

      donations?.forEach(d => {
        const donor = profileMap.get(d.donor_id);
        allTx.push({
          id: d.id, type: "donation",
          sender_id: d.donor_id, sender_name: donor?.display_name || null,
          sender_avatar: donor?.avatar_url || null, sender_wallet: null,
          receiver_id: null, receiver_name: "Angel AI", receiver_avatar: null, receiver_wallet: null,
          amount: d.amount, message: d.message, created_at: d.created_at,
          tx_hash: d.tx_hash, gift_type: null, donation_type: d.donation_type,
          receipt_public_id: null,
        });
      });

      allTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTx);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("activity_history_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_gifts" }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "project_donations" }, () => fetchTransactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions]);

  // Filtered list
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          (tx.sender_name || "").toLowerCase().includes(q) ||
          (tx.receiver_name || "").toLowerCase().includes(q) ||
          (tx.sender_wallet || "").toLowerCase().includes(q) ||
          (tx.tx_hash || "").toLowerCase().includes(q) ||
          (tx.message || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      // Type
      if (typeFilter === "gifts" && tx.type !== "gift") return false;
      if (typeFilter === "donations" && tx.type !== "donation") return false;
      // Time
      if (timeFilter === "today" && !isToday(new Date(tx.created_at))) return false;
      if (timeFilter === "7days" && new Date(tx.created_at) < subDays(new Date(), 7)) return false;
      if (timeFilter === "30days" && new Date(tx.created_at) < subMonths(new Date(), 1)) return false;
      // Onchain
      if (onchainOnly && !tx.tx_hash && tx.gift_type !== "web3" && tx.donation_type !== "manual") return false;
      return true;
    });
  }, [transactions, searchQuery, typeFilter, timeFilter, onchainOnly]);

  // Stats
  const todayCount = transactions.filter(tx => isToday(new Date(tx.created_at))).length;
  const totalValue = transactions.reduce((s, tx) => s + tx.amount, 0);
  const onchainCount = transactions.filter(tx => tx.tx_hash).length;

  // Export CSV
  const exportCSV = () => {
    const headers = ["Thời gian", "Loại", "Người gửi", "Người nhận", "Số lượng", "TX Hash", "Lời nhắn"];
    const rows = filtered.map(tx => [
      format(new Date(tx.created_at), "dd/MM/yyyy HH:mm"),
      tx.type === "gift" ? "Tặng thưởng" : "Donate",
      tx.sender_name || tx.sender_id,
      tx.receiver_name || tx.receiver_id || "Angel AI",
      tx.amount.toString(),
      tx.tx_hash || "",
      (tx.message || "").replace(/"/g, '""'),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `angel-ai-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất dữ liệu CSV");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ffd700]/5 via-white to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#b8860b] via-[#daa520] to-[#b8860b] px-4 sm:px-6 py-5 shadow-lg">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-sm">Lịch Sử Giao Dịch</h1>
                <p className="text-xs text-white/80">Minh bạch • Truy vết Blockchain • Chuẩn Web3</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchTransactions}
                className="text-white hover:bg-white/20 h-8"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportCSV}
                className="text-white hover:bg-white/20 h-8"
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Xuất dữ liệu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 sm:px-6 py-5 space-y-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <StatCard icon={Activity} label="Tổng giao dịch" value={transactions.length} color="bg-gradient-to-br from-[#daa520] to-[#b8860b]" />
          <StatCard icon={TrendingUp} label="Tổng giá trị" value={totalValue} color="bg-gradient-to-br from-[#ffd700] to-[#daa520]" />
          <StatCard icon={Clock} label="Hôm nay" value={todayCount} color="bg-gradient-to-br from-amber-500 to-amber-600" />
          <StatCard icon={CheckCircle2} label="Onchain" value={onchainCount} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          <StatCard icon={Wallet} label="Chờ xử lý" value={transactions.length - onchainCount} color="bg-gradient-to-br from-blue-500 to-blue-600" />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#daa520]/20 p-3 sm:p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b8860b]/60" />
            <Input
              type="text"
              placeholder="Tìm theo tên, địa chỉ ví, mã giao dịch (tx hash)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#daa520]/30 focus:border-[#daa520] focus:ring-[#daa520]/20"
            />
          </div>

          {/* Dropdowns + Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-[#daa520]/30">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="gifts">Tặng thưởng</SelectItem>
                <SelectItem value="donations">Donate</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-[#daa520]/30">
                <SelectValue placeholder="Tất cả thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-[#8B7355] font-medium">Chỉ onchain</label>
              <Switch checked={onchainOnly} onCheckedChange={setOnchainOnly} />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#8B7355]">
            Hiển thị <span className="font-bold text-[#3D2800]">{filtered.length}</span> / {transactions.length} giao dịch
          </p>
        </div>

        {/* Transaction list */}
        {isLoading ? (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#daa520] mb-3" />
            <p className="text-sm text-[#8B7355]">Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#ffd700]/10 flex items-center justify-center mb-3">
              <Gift className="w-7 h-7 text-[#daa520]" />
            </div>
            <p className="text-sm text-[#8B7355]">Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(tx => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ActivityHistory;
