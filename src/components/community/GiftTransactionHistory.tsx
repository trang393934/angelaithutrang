import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Heart, Gift, Wallet, ChevronRight, ChevronDown, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface GiftTransaction {
  id: string;
  type: "gift" | "donation";
  direction: "sent" | "received" | "donated";
  sender_id: string;
  sender_name: string | null;
  sender_avatar: string | null;
  receiver_id: string | null;
  receiver_name: string | null;
  receiver_avatar: string | null;
  amount: number;
  message: string | null;
  created_at: string;
  tx_hash?: string | null;
  donation_type?: string | null;
}

function TransactionRow({ tx, compact = false, currentUserId }: { tx: GiftTransaction; compact?: boolean; currentUserId: string }) {
  const { currentLanguage } = useLanguage();
  const locale = currentLanguage === "vi" ? vi : enUS;
  const timeAgo = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale });

  const isGift = tx.type === "gift";
  const isSent = tx.direction === "sent";
  const isDonated = tx.direction === "donated";
  const truncatedMessage = tx.message && tx.message.length > 60 
    ? tx.message.slice(0, 60) + "..." 
    : tx.message;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-2.5 rounded-xl transition-all hover:shadow-sm ${compact ? 'p-2' : 'p-2.5'} ${
        isDonated
          ? 'hover:bg-rose-50/70'
          : isSent
            ? 'hover:bg-orange-50/70'
            : 'hover:bg-green-50/70'
      }`}
    >
      {/* Icon */}
      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isDonated
          ? 'bg-gradient-to-br from-rose-400 to-pink-500'
          : isSent
            ? 'bg-gradient-to-br from-orange-400 to-amber-500'
            : 'bg-gradient-to-br from-green-400 to-emerald-500'
      }`}>
        {isDonated ? (
          <Heart className="w-3.5 h-3.5 text-white fill-white" />
        ) : isSent ? (
          <ArrowUpRight className="w-3.5 h-3.5 text-white" />
        ) : (
          <ArrowDownLeft className="w-3.5 h-3.5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap text-sm">
          {isGift ? (
            isSent ? (
              <>
                <span className="font-semibold text-orange-600">Bạn</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <Link 
                  to={`/user/${tx.receiver_id}`} 
                  className="font-semibold text-orange-700 truncate max-w-[120px] hover:underline"
                >
                  {tx.receiver_name || "Ẩn danh"}
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to={`/user/${tx.sender_id}`} 
                  className="font-semibold text-green-700 truncate max-w-[120px] hover:underline"
                >
                  {tx.sender_name || "Ẩn danh"}
                </Link>
                <ArrowDownLeft className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="font-semibold text-green-600">Bạn</span>
              </>
            )
          ) : (
            <>
              <span className="font-semibold text-rose-600">Bạn</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="font-semibold text-rose-600 truncate">Angel AI</span>
            </>
          )}

          {tx.donation_type === "web3" || tx.donation_type === "manual" ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded-full">
              <Wallet className="w-2.5 h-2.5" />
              Web3
            </span>
          ) : null}
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <img src={camlyCoinLogo} alt="coin" className="w-3.5 h-3.5 rounded-full" />
          <span className={`font-bold text-sm ${
            isDonated ? 'text-rose-500' : isSent ? 'text-orange-600' : 'text-green-600'
          }`}>
            {isSent || isDonated ? '-' : '+'}{tx.amount.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground">• {timeAgo}</span>
        </div>

        {/* Message */}
        {truncatedMessage && !compact && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic">
            "{truncatedMessage}"
          </p>
        )}

        {/* TX Hash link */}
        {tx.tx_hash && (
          <a 
            href={`https://bscscan.com/tx/${tx.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5"
          >
            <Wallet className="w-2.5 h-2.5" />
            BSCScan
          </a>
        )}
      </div>
    </motion.div>
  );
}

export function GiftTransactionHistory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState<"all" | "gifts" | "donations">("all");
  const [expanded, setExpanded] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch gifts where user is sender OR receiver (using .or filter)
      const { data: gifts } = await supabase
        .from("coin_gifts")
        .select("id, sender_id, receiver_id, amount, message, created_at, tx_hash, gift_type")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch donations by this user only
      const { data: donations } = await supabase
        .from("project_donations")
        .select("id, donor_id, amount, message, created_at, donation_type, tx_hash, status")
        .eq("donor_id", user.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(100);

      // Gather all unique user IDs for profile lookup
      const userIds = new Set<string>();
      gifts?.forEach(g => {
        userIds.add(g.sender_id);
        userIds.add(g.receiver_id);
      });
      donations?.forEach(d => userIds.add(d.donor_id));

      // Fetch all profiles at once
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Build unified transaction list
      const allTx: GiftTransaction[] = [];

      gifts?.forEach(g => {
        const sender = profileMap.get(g.sender_id);
        const receiver = profileMap.get(g.receiver_id);
        const isSender = g.sender_id === user.id;
        allTx.push({
          id: g.id,
          type: "gift",
          direction: isSender ? "sent" : "received",
          sender_id: g.sender_id,
          sender_name: sender?.display_name || null,
          sender_avatar: sender?.avatar_url || null,
          receiver_id: g.receiver_id,
          receiver_name: receiver?.display_name || null,
          receiver_avatar: receiver?.avatar_url || null,
          amount: g.amount,
          message: g.message,
          created_at: g.created_at,
          tx_hash: g.tx_hash || null,
          donation_type: g.gift_type === "web3" ? "web3" : null,
        });
      });

      donations?.forEach(d => {
        const donor = profileMap.get(d.donor_id);
        allTx.push({
          id: d.id,
          type: "donation",
          direction: "donated",
          sender_id: d.donor_id,
          sender_name: donor?.display_name || null,
          sender_avatar: donor?.avatar_url || null,
          receiver_id: null,
          receiver_name: "Angel AI",
          receiver_avatar: null,
          amount: d.amount,
          message: d.message,
          created_at: d.created_at,
          tx_hash: d.tx_hash,
          donation_type: d.donation_type,
        });
      });

      // Sort by newest first
      allTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTx);
    } catch (error) {
      console.error("Error fetching gift transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("gift_tx_history")
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_gifts" }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "project_donations" }, () => fetchTransactions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions]);

  const previewTransactions = transactions.slice(0, 5);
  const giftOnly = transactions.filter(t => t.type === "gift");
  const donationOnly = transactions.filter(t => t.type === "donation");
  const sentOnly = transactions.filter(t => t.direction === "sent");
  const receivedOnly = transactions.filter(t => t.direction === "received");
  const dialogList = dialogTab === "gifts" ? giftOnly : dialogTab === "donations" ? donationOnly : transactions;

  const totalSentAmount = sentOnly.reduce((sum, t) => sum + t.amount, 0);
  const totalReceivedAmount = receivedOnly.reduce((sum, t) => sum + t.amount, 0);
  const totalDonationAmount = donationOnly.reduce((sum, t) => sum + t.amount, 0);

  // Not logged in
  if (!user) {
    return (
      <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 p-6 text-center">
        <LogIn className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Đăng nhập để xem lịch sử giao dịch của bạn</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 p-4 animate-pulse">
        <div className="h-6 bg-amber-200/50 rounded w-2/3 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-amber-100/50 rounded-lg" />
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
          className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-4 py-3 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-white text-sm drop-shadow-sm">
              📜 Giao Dịch Của Bạn
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
              {/* Stats summary */}
              <div className="px-4 pt-3 pb-1 flex gap-2">
                <div className="flex-1 bg-green-100/60 rounded-lg px-2.5 py-1.5 text-center">
                  <p className="text-[10px] text-green-600 font-medium">Đã nhận</p>
                  <div className="flex items-center justify-center gap-1">
                    <img src={camlyCoinLogo} alt="coin" className="w-3 h-3 rounded-full" />
                    <span className="text-xs font-bold text-green-700">+{totalReceivedAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex-1 bg-orange-100/60 rounded-lg px-2.5 py-1.5 text-center">
                  <p className="text-[10px] text-orange-600 font-medium">Đã gửi</p>
                  <div className="flex items-center justify-center gap-1">
                    <img src={camlyCoinLogo} alt="coin" className="w-3 h-3 rounded-full" />
                    <span className="text-xs font-bold text-orange-700">-{totalSentAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex-1 bg-rose-100/60 rounded-lg px-2.5 py-1.5 text-center">
                  <p className="text-[10px] text-rose-600 font-medium">Donate</p>
                  <div className="flex items-center justify-center gap-1">
                    <img src={camlyCoinLogo} alt="coin" className="w-3 h-3 rounded-full" />
                    <span className="text-xs font-bold text-rose-600">-{totalDonationAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Recent transactions */}
              <div className="px-3 py-2 space-y-0.5">
                {previewTransactions.length === 0 ? (
                  <div className="text-center py-4">
                    <Gift className="w-8 h-8 text-amber-300 mx-auto mb-1" />
                    <p className="text-xs text-amber-600">Bạn chưa có giao dịch thưởng/tặng nào</p>
                  </div>
                ) : (
                  previewTransactions.map(tx => (
                    <TransactionRow key={tx.id} tx={tx} compact currentUserId={user.id} />
                  ))
                )}
              </div>

              {/* View All */}
              {transactions.length > 5 && (
                <div className="px-4 pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllDialog(true)}
                    className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                  >
                    Xem tất cả {transactions.length} giao dịch
                    <ChevronRight className="w-4 h-4 ml-1" />
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
          <DialogHeader className="px-4 pt-4 pb-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500">
            <DialogTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5" />
              📜 Giao Dịch Của Bạn
            </DialogTitle>
            <div className="flex gap-3 mt-1">
              <div className="flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3 text-white/80" />
                <span className="text-xs text-white/90 font-medium">
                  Nhận: +{totalReceivedAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-white/80" />
                <span className="text-xs text-white/90 font-medium">
                  Gửi: -{totalSentAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-white/80 fill-white/80" />
                <span className="text-xs text-white/90 font-medium">
                  Donate: -{totalDonationAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-3">
            {/* Tabs filter */}
            <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as any)}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  Tất cả ({transactions.length})
                </TabsTrigger>
                <TabsTrigger value="gifts" className="text-xs gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  Thưởng ({giftOnly.length})
                </TabsTrigger>
                <TabsTrigger value="donations" className="text-xs gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  Donate ({donationOnly.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Refresh */}
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchTransactions}
                className="text-xs text-muted-foreground h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Làm mới
              </Button>
            </div>

            {/* Transaction list */}
            <ScrollArea className="h-[55vh]">
              <div className="space-y-1 pr-3">
                {dialogList.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  dialogList.map(tx => (
                    <TransactionRow key={tx.id} tx={tx} currentUserId={user.id} />
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

export default GiftTransactionHistory;
