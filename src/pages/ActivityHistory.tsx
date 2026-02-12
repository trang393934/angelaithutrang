import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, RefreshCw, Download, Search, Gift, Heart, Wallet,
  ArrowUpRight, ArrowDownLeft, Copy, ExternalLink, Check,
  Clock, TrendingUp, Activity, CheckCircle2, Loader2,
  ArrowLeft, Users, User, Send, Inbox, Filter, Sparkles,
  ShieldCheck, Building2
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
import { useAuth } from "@/hooks/useAuth";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";
import angelAiLogo from "@/assets/angel-ai-golden-logo.png";
import { GiftCelebrationModal, type CelebrationData } from "@/components/gifts/GiftCelebrationModal";

const USDT_LOGO = "https://cryptologos.cc/logos/tether-usdt-logo.png?v=040";
const BNB_LOGO = "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=040";

const TREASURY_WALLET = "0x416336c3b7ACAe89F47EAD2707412f20DA159ac8";
const TREASURY_SENDER_ID = "ANGEL_AI_TREASURY";

function getTokenDisplay(giftType: string | null): { logo: string; symbol: string } {
  switch (giftType) {
    case "web3_FUN": return { logo: funMoneyLogo, symbol: "FUN" };
    case "web3_USDT": return { logo: USDT_LOGO, symbol: "USDT" };
    case "web3_BNB": return { logo: BNB_LOGO, symbol: "BNB" };
    case "web3_BTC": return { logo: bitcoinLogo, symbol: "BTC" };
    default: return { logo: camlyCoinLogo, symbol: "CAMLY" };
  }
}

interface Transaction {
  id: string;
  type: "gift" | "donation" | "treasury_reward" | "treasury_lixi";
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

const isTreasuryTx = (tx: Transaction) => tx.type === "treasury_reward" || tx.type === "treasury_lixi";

function TransactionItem({ tx, onViewCard }: { tx: Transaction; onViewCard?: (tx: Transaction) => void }) {
  const { currentLanguage } = useLanguage();
  const locale = currentLanguage === "vi" ? vi : enUS;
  const timeAgo = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale });
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const isGift = tx.type === "gift";
  const isTreasury = isTreasuryTx(tx);
  const isOnchain = tx.tx_hash || tx.gift_type === "web3" || tx.donation_type === "manual" || isTreasury;

  const copyWallet = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopiedWallet(addr);
    toast.success("Đã sao chép địa chỉ ví");
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const typeLabel = isTreasury
    ? (tx.type === "treasury_lixi" ? "Lì xì" : "Trả thưởng")
    : isGift ? "Tặng thưởng" : "Donate";

  const typeIcon = isTreasury
    ? <Building2 className="w-2.5 h-2.5" />
    : isGift ? <Gift className="w-2.5 h-2.5" /> : <Heart className="w-2.5 h-2.5" />;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-[#daa520]/20 p-3 sm:p-4 hover:border-[#daa520]/40 transition-all hover:shadow-md group">
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
          isTreasury
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
            : isGift 
              ? 'bg-gradient-to-br from-[#daa520] to-[#b8860b]' 
              : 'bg-gradient-to-br from-rose-400 to-pink-500'
        }`}>
          {isTreasury ? <Building2 className="w-4 h-4 text-white" /> : isGift ? <Gift className="w-4 h-4 text-white" /> : <Heart className="w-4 h-4 text-white fill-white" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Sender -> Receiver */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <div className="flex flex-col">
              {isTreasury ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={angelAiLogo} />
                    <AvatarFallback className="text-[8px] bg-emerald-100 text-emerald-700">AI</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm text-[#3D2800]">Angel AI Treasury</span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Verified
                  </span>
                </div>
              ) : (
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
              )}
              {tx.sender_wallet && (
                <div className="flex items-center gap-1 text-[10px] text-[#8B7355] ml-6.5 mt-0.5">
                  <span className="font-mono">{truncateWallet(tx.sender_wallet)}</span>
                  <button onClick={() => copyWallet(tx.sender_wallet!)} className="hover:text-[#b8860b]">
                    {copiedWallet === tx.sender_wallet ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
              )}
            </div>

            <ArrowUpRight className={`w-3.5 h-3.5 flex-shrink-0 ${isTreasury ? 'text-emerald-500' : isGift ? 'text-[#daa520]' : 'text-rose-500'}`} />

            {(isGift || isTreasury) && tx.receiver_id ? (
              <div className="flex flex-col">
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
                {tx.receiver_wallet && (
                  <div className="flex items-center gap-1 text-[10px] text-[#8B7355] ml-6.5 mt-0.5">
                    <span className="font-mono">{truncateWallet(tx.receiver_wallet)}</span>
                    <button onClick={() => copyWallet(tx.receiver_wallet!)} className="hover:text-[#b8860b]">
                      {copiedWallet === tx.receiver_wallet ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                )}
              </div>
            ) : !isTreasury ? (
              <span className="font-semibold text-sm text-rose-600">Angel AI</span>
            ) : null}
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isTreasury
                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-300'
                : isGift 
                  ? 'bg-gradient-to-r from-[#ffd700]/20 to-[#daa520]/20 text-[#b8860b] border border-[#daa520]/30' 
                  : 'bg-rose-100 text-rose-600 border border-rose-200'
            }`}>
              {typeIcon}
              {typeLabel}
            </span>

            {isOnchain && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-gradient-to-r from-[#ffd700]/20 to-[#daa520]/20 text-[#b8860b] border border-[#daa520]/30 px-2 py-0.5 rounded-full font-medium">
                <Wallet className="w-2.5 h-2.5" />
                Onchain
              </span>
            )}

            {isTreasury && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Thành công
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
              <img src={getTokenDisplay(tx.gift_type).logo} alt={getTokenDisplay(tx.gift_type).symbol} className="w-4 h-4 rounded-full" />
              <span className={`font-bold text-base ${isTreasury ? 'text-emerald-600' : isGift ? 'text-[#b8860b]' : 'text-rose-500'}`}>
                {tx.amount.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8B7355] font-medium">{getTokenDisplay(tx.gift_type).symbol}</span>
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
                  Biên nhận
                </Link>
              )}
              {tx.type === "gift" && onViewCard && (
                <button
                  onClick={() => onViewCard(tx)}
                  className="text-[10px] text-[#b8860b] hover:text-[#8B6914] flex items-center gap-0.5 ml-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  Xem Card
                </button>
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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [onchainOnly, setOnchainOnly] = useState(false);
  const [tokenFilter, setTokenFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"all" | "personal">("all");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const handleViewCard = (tx: Transaction) => {
    setCelebrationData({
      receipt_public_id: tx.receipt_public_id || "",
      sender_id: tx.sender_id,
      sender_name: tx.sender_name || "Ẩn danh",
      sender_avatar: tx.sender_avatar,
      sender_wallet: tx.sender_wallet,
      receiver_id: tx.receiver_id || "",
      receiver_name: tx.receiver_name || "Ẩn danh",
      receiver_avatar: tx.receiver_avatar,
      receiver_wallet: tx.receiver_wallet,
      amount: tx.amount,
      message: tx.message,
      tx_hash: tx.tx_hash,
      created_at: tx.created_at,
      tokenType: tx.gift_type === "web3" ? "camly_web3" : "internal",
    });
    setShowCelebration(true);
  };

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch gifts, donations, withdrawals, lixi in parallel
      const [giftsRes, donationsRes, withdrawalsRes, lixiRes] = await Promise.all([
        supabase
          .from("coin_gifts")
          .select("id, sender_id, receiver_id, amount, message, created_at, tx_hash, gift_type, receipt_public_id")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("project_donations")
          .select("id, donor_id, amount, message, created_at, donation_type, tx_hash, status")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("coin_withdrawals")
          .select("id, user_id, amount, wallet_address, tx_hash, created_at")
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("lixi_claims")
          .select("id, user_id, camly_amount, wallet_address, tx_hash, claimed_at")
          .eq("status", "completed")
          .order("claimed_at", { ascending: false })
          .limit(500),
      ]);

      const gifts = giftsRes.data;
      const donations = donationsRes.data;
      const withdrawals = withdrawalsRes.data;
      const lixiClaims = lixiRes.data;

      const userIds = new Set<string>();
      gifts?.forEach(g => { userIds.add(g.sender_id); userIds.add(g.receiver_id); });
      donations?.forEach(d => userIds.add(d.donor_id));
      withdrawals?.forEach(w => userIds.add(w.user_id));
      lixiClaims?.forEach(l => userIds.add(l.user_id));

      const userIdArr = Array.from(userIds);

      const [{ data: profiles }, { data: wallets }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIdArr),
        supabase.from("user_wallet_addresses").select("user_id, wallet_address").in("user_id", userIdArr),
      ]);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const walletMap = new Map(wallets?.map((w: any) => [w.user_id, w.wallet_address]) || []);

      const allTx: Transaction[] = [];

      gifts?.forEach(g => {
        const sender = profileMap.get(g.sender_id);
        const receiver = profileMap.get(g.receiver_id);
        allTx.push({
          id: g.id, type: "gift",
          sender_id: g.sender_id, sender_name: sender?.display_name || null,
          sender_avatar: sender?.avatar_url || null, sender_wallet: walletMap.get(g.sender_id) || null,
          receiver_id: g.receiver_id, receiver_name: receiver?.display_name || null,
          receiver_avatar: receiver?.avatar_url || null, receiver_wallet: walletMap.get(g.receiver_id) || null,
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
          sender_avatar: donor?.avatar_url || null, sender_wallet: walletMap.get(d.donor_id) || null,
          receiver_id: null, receiver_name: "Angel AI", receiver_avatar: null, receiver_wallet: null,
          amount: d.amount, message: d.message, created_at: d.created_at,
          tx_hash: d.tx_hash, gift_type: null, donation_type: d.donation_type,
          receipt_public_id: null,
        });
      });

      // Treasury rewards (withdrawals)
      withdrawals?.forEach(w => {
        const receiver = profileMap.get(w.user_id);
        allTx.push({
          id: `wd_${w.id}`, type: "treasury_reward",
          sender_id: TREASURY_SENDER_ID, sender_name: "Angel AI Treasury",
          sender_avatar: angelAiLogo, sender_wallet: TREASURY_WALLET,
          receiver_id: w.user_id, receiver_name: receiver?.display_name || null,
          receiver_avatar: receiver?.avatar_url || null, receiver_wallet: w.wallet_address || walletMap.get(w.user_id) || null,
          amount: w.amount, message: "Trả thưởng CAMLY từ Angel AI Treasury",
          created_at: w.created_at, tx_hash: w.tx_hash || null,
          gift_type: null, donation_type: null, receipt_public_id: null,
        });
      });

      // Treasury lixi
      lixiClaims?.forEach(l => {
        const receiver = profileMap.get(l.user_id);
        allTx.push({
          id: `lx_${l.id}`, type: "treasury_lixi",
          sender_id: TREASURY_SENDER_ID, sender_name: "Angel AI Treasury",
          sender_avatar: angelAiLogo, sender_wallet: TREASURY_WALLET,
          receiver_id: l.user_id, receiver_name: receiver?.display_name || null,
          receiver_avatar: receiver?.avatar_url || null, receiver_wallet: l.wallet_address || walletMap.get(l.user_id) || null,
          amount: l.camly_amount, message: "🧧 Lì xì Tết từ Angel AI Treasury",
          created_at: l.claimed_at, tx_hash: l.tx_hash || null,
          gift_type: null, donation_type: null, receipt_public_id: null,
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
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_withdrawals" }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "lixi_claims" }, () => fetchTransactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions]);

  // View-filtered base (all vs personal)
  const viewFiltered = useMemo(() => {
    if (viewMode === "personal" && user) {
      return transactions.filter(tx => tx.sender_id === user.id || tx.receiver_id === user.id);
    }
    return transactions;
  }, [transactions, viewMode, user]);

  // Filtered list
  const filtered = useMemo(() => {
    return viewFiltered.filter(tx => {
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
      if (typeFilter === "gifts" && tx.type !== "gift") return false;
      if (typeFilter === "donations" && tx.type !== "donation") return false;
      if (typeFilter === "treasury_reward" && tx.type !== "treasury_reward") return false;
      if (typeFilter === "treasury_lixi" && tx.type !== "treasury_lixi") return false;
      if (timeFilter === "today" && !isToday(new Date(tx.created_at))) return false;
      if (timeFilter === "7days" && new Date(tx.created_at) < subDays(new Date(), 7)) return false;
      if (timeFilter === "30days" && new Date(tx.created_at) < subMonths(new Date(), 1)) return false;
      if (onchainOnly && !tx.tx_hash && tx.gift_type !== "web3" && tx.donation_type !== "manual" && !isTreasuryTx(tx)) return false;
      // Token filter
      if (tokenFilter !== "all") {
        const gt = tx.gift_type || "";
        // Treasury transactions are always CAMLY
        if (isTreasuryTx(tx)) {
          if (tokenFilter !== "camly") return false;
        } else {
          if (tokenFilter === "camly" && !["", "internal", "web3", "web3_CAMLY"].includes(gt)) return false;
          if (tokenFilter === "fun" && gt !== "web3_FUN") return false;
          if (tokenFilter === "usdt" && gt !== "web3_USDT") return false;
          if (tokenFilter === "bnb" && gt !== "web3_BNB") return false;
          if (tokenFilter === "btc" && gt !== "web3_BTC") return false;
        }
      }
      // Status filter
      if (statusFilter === "confirmed" && !tx.tx_hash && !isTreasuryTx(tx)) return false;
      if (statusFilter === "pending" && (tx.tx_hash || isTreasuryTx(tx))) return false;
      return true;
    });
  }, [viewFiltered, searchQuery, typeFilter, timeFilter, onchainOnly, tokenFilter, statusFilter]);

  // Stats based on viewFiltered
  const stats = useMemo(() => {
    const data = viewFiltered;
    const totalCount = data.length;
    const sentCount = user ? data.filter(tx => tx.sender_id === user.id).length : data.filter(tx => tx.type === "gift").length;
    const receivedCount = user ? data.filter(tx => tx.receiver_id === user.id).length : data.length - sentCount;
    const onchainCount = data.filter(tx => tx.tx_hash).length;
    const totalCamly = data.reduce((s, tx) => s + tx.amount, 0);
    const totalDonate = data.filter(tx => tx.type === "donation").reduce((s, tx) => s + tx.amount, 0);
    const totalGift = data.filter(tx => tx.type === "gift").reduce((s, tx) => s + tx.amount, 0);
    const todayValue = data.filter(tx => isToday(new Date(tx.created_at))).reduce((s, tx) => s + tx.amount, 0);
    const treasuryCount = data.filter(tx => isTreasuryTx(tx)).length;
    return { totalCount, sentCount, receivedCount, onchainCount, totalCamly, totalDonate, totalGift, todayValue, treasuryCount };
  }, [viewFiltered, user]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["Thời gian", "Loại", "Người gửi", "Người nhận", "Số lượng", "TX Hash", "Lời nhắn"];
    const rows = filtered.map(tx => [
      format(new Date(tx.created_at), "dd/MM/yyyy HH:mm"),
      tx.type === "gift" ? "Tặng thưởng" : tx.type === "donation" ? "Donate" : tx.type === "treasury_lixi" ? "Lì xì" : "Trả thưởng",
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
              <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
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
        {/* View Mode Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === "all"
                ? "bg-gradient-to-r from-[#daa520] to-[#b8860b] text-white shadow-md"
                : "bg-white/80 text-[#8B7355] border border-[#daa520]/30 hover:border-[#daa520]/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Tất cả
          </button>
          <button
            onClick={() => setViewMode("personal")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewMode === "personal"
                ? "bg-gradient-to-r from-[#daa520] to-[#b8860b] text-white shadow-md"
                : "bg-white/80 text-[#8B7355] border border-[#daa520]/30 hover:border-[#daa520]/50"
            }`}
          >
            <User className="w-4 h-4" />
            Cá nhân
          </button>
        </div>

        {/* Personal mode login prompt */}
        {viewMode === "personal" && !user && (
          <div className="bg-[#ffd700]/10 border border-[#daa520]/30 rounded-xl p-4 text-center">
            <p className="text-sm text-[#8B7355]">Vui lòng <Link to="/auth" className="text-[#b8860b] font-semibold underline">đăng nhập</Link> để xem giao dịch cá nhân.</p>
          </div>
        )}

        {/* Stat Cards - Row 1: Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <StatCard icon={Activity} label="Tổng giao dịch" value={stats.totalCount} color="bg-gradient-to-br from-[#daa520] to-[#b8860b]" />
          <StatCard icon={Send} label="Tổng gửi" value={stats.sentCount} color="bg-gradient-to-br from-amber-500 to-amber-600" />
          <StatCard icon={Inbox} label="Tổng nhận" value={stats.receivedCount} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          <StatCard icon={CheckCircle2} label="Onchain" value={stats.onchainCount} color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatCard icon={Building2} label="Treasury" value={stats.treasuryCount} color="bg-gradient-to-br from-teal-500 to-emerald-600" />
        </div>

        {/* Stat Cards - Row 2: Token values */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCard icon={TrendingUp} label="Tổng CAMLY" value={stats.totalCamly} color="bg-gradient-to-br from-[#ffd700] to-[#daa520]" />
          <StatCard icon={Heart} label="Tổng Donate" value={stats.totalDonate} color="bg-gradient-to-br from-rose-400 to-pink-500" />
          <StatCard icon={Gift} label="Tổng Tặng" value={stats.totalGift} color="bg-gradient-to-br from-[#b8860b] to-[#8B6914]" />
          <StatCard icon={Clock} label="Hôm nay" value={stats.todayValue} color="bg-gradient-to-br from-violet-500 to-purple-600" />
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 backdrop-blur-sm rounded-xl border border-[#daa520]/30 p-3 sm:p-4 space-y-3 shadow-sm">
          {/* Filter header */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#daa520] to-[#b8860b] flex items-center justify-center">
              <Filter className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-sm font-bold text-[#8B6914]">Bộ lọc & Tìm kiếm</h3>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b8860b]/60" />
            <Input
              type="text"
              placeholder="Tìm theo tên, địa chỉ ví, mã giao dịch (tx hash)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#daa520]/40 focus:border-[#daa520] focus:ring-[#daa520]/20 bg-white"
            />
          </div>

          {/* Dropdowns row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Token filter */}
            <Select value={tokenFilter} onValueChange={setTokenFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs border-[#daa520]/40 text-[#8B6914] bg-white font-medium">
                <SelectValue placeholder="Tất cả token" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#daa520]/30 z-50">
                <SelectItem value="all">Tất cả token</SelectItem>
                <SelectItem value="camly">
                  <span className="flex items-center gap-1.5"><img src={camlyCoinLogo} className="w-3.5 h-3.5 rounded-full" /> CAMLY</span>
                </SelectItem>
                <SelectItem value="fun">
                  <span className="flex items-center gap-1.5"><img src={funMoneyLogo} className="w-3.5 h-3.5 rounded-full" /> FUN Money</span>
                </SelectItem>
                <SelectItem value="usdt">
                  <span className="flex items-center gap-1.5"><img src={USDT_LOGO} className="w-3.5 h-3.5 rounded-full" /> USDT</span>
                </SelectItem>
                <SelectItem value="bnb">
                  <span className="flex items-center gap-1.5"><img src={BNB_LOGO} className="w-3.5 h-3.5 rounded-full" /> BNB</span>
                </SelectItem>
                <SelectItem value="btc">
                  <span className="flex items-center gap-1.5"><img src={bitcoinLogo} className="w-3.5 h-3.5 rounded-full" /> BTC</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs border-[#daa520]/40 text-[#8B6914] bg-white font-medium">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#daa520]/30 z-50">
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="gifts">Tặng thưởng</SelectItem>
                <SelectItem value="donations">Donate</SelectItem>
                <SelectItem value="treasury_reward">Trả thưởng</SelectItem>
                <SelectItem value="treasury_lixi">Lì xì</SelectItem>
              </SelectContent>
            </Select>

            {/* Time filter */}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-[#daa520]/40 text-[#8B6914] bg-white font-medium">
                <SelectValue placeholder="Tất cả thời gian" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#daa520]/30 z-50">
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-[#daa520]/40 text-[#8B6914] bg-white font-medium">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#daa520]/30 z-50">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="confirmed">✅ Đã xác nhận</SelectItem>
                <SelectItem value="pending">⏳ Đang chờ</SelectItem>
              </SelectContent>
            </Select>

            {/* Onchain toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-[#8B7355] font-medium">Chỉ onchain</label>
              <Switch 
                checked={onchainOnly} 
                onCheckedChange={setOnchainOnly}
                className="data-[state=checked]:bg-[#daa520]"
              />
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
              <TransactionItem key={tx.id} tx={tx} onViewCard={handleViewCard} />
            ))}
          </div>
        )}
      </main>

      {/* Celebration Modal */}
      <GiftCelebrationModal
        open={showCelebration}
        onOpenChange={setShowCelebration}
        data={celebrationData}
      />
    </div>
  );
};

export default ActivityHistory;
