import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Coins, Sparkles, Gift, Wallet, MessageSquare, BookOpen,
  Clock, Share2, Award, TrendingUp, ArrowUpRight, ArrowDownLeft
} from "lucide-react";

interface UserRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  joined_at: string | null;
  post_count: number;
  comment_count: number;
  light_score: number;
  popl_score: number;
  positive_actions: number;
  negative_actions: number;
  camly_balance: number;
  camly_lifetime_earned: number;
  camly_lifetime_spent: number;
  fun_money_received: number;
  gift_internal_sent: number;
  gift_internal_received: number;
  gift_web3_sent: number;
  gift_web3_received: number;
  total_withdrawn: number;
  withdrawal_count: number;
  pplp_action_count: number;
  pplp_minted_count: number;
  wallet_address: string | null;
}

interface RewardBreakdown {
  transaction_type: string;
  total: number;
  count: number;
}

interface RecentTransaction {
  type: string;
  amount: number;
  date: string;
  description: string;
}

const TYPE_LABELS: Record<string, string> = {
  chat_reward: "Chat AI",
  gratitude_reward: "Cảm ơn",
  journal_reward: "Nhật ký",
  engagement_reward: "Tương tác",
  daily_login: "Đăng nhập",
  bounty_reward: "Bounty",
  build_idea: "Ý tưởng",
  content_share: "Chia sẻ",
  knowledge_upload: "Kiến thức",
  feedback_reward: "Feedback",
  vision_reward: "Vision Board",
  community_support: "Hỗ trợ CĐ",
  admin_adjustment: "Admin",
  spending: "Chi tiêu",
  early_adopter: "Early Adopter",
  referral_bonus: "Giới thiệu",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  chat_reward: MessageSquare,
  journal_reward: BookOpen,
  daily_login: Clock,
  content_share: Share2,
};

const formatNum = (n: number) => n.toLocaleString("vi-VN");

interface Props {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ user, open, onOpenChange }: Props) {
  const [rewardBreakdown, setRewardBreakdown] = useState<RewardBreakdown[]>([]);
  const [recentTx, setRecentTx] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadDetails(user.user_id);
    }
  }, [user, open]);

  const loadDetails = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch reward breakdown by type
      const { data: txData } = await supabase
        .from("camly_coin_transactions")
        .select("transaction_type, amount")
        .eq("user_id", userId)
        .gt("amount", 0);

      const breakdown: Record<string, { total: number; count: number }> = {};
      (txData || []).forEach((tx: any) => {
        const t = tx.transaction_type;
        if (!breakdown[t]) breakdown[t] = { total: 0, count: 0 };
        breakdown[t].total += Number(tx.amount);
        breakdown[t].count += 1;
      });

      setRewardBreakdown(
        Object.entries(breakdown)
          .map(([k, v]) => ({ transaction_type: k, ...v }))
          .sort((a, b) => b.total - a.total)
      );

      // Fetch recent transactions (gifts + withdrawals)
      const recent: RecentTransaction[] = [];

      const { data: gifts } = await supabase
        .from("coin_gifts")
        .select("amount, created_at, gift_type, sender_id, receiver_id, message")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(10);

      (gifts || []).forEach((g: any) => {
        const isSender = g.sender_id === userId;
        recent.push({
          type: isSender ? "Gửi tặng" : "Nhận tặng",
          amount: isSender ? -g.amount : g.amount,
          date: g.created_at,
          description: `${g.gift_type === "web3" ? "Web3" : "Nội bộ"}${g.message ? ` - ${g.message}` : ""}`,
        });
      });

      const { data: wds } = await supabase
        .from("coin_withdrawals")
        .select("amount, created_at, status, wallet_address")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      (wds || []).forEach((w: any) => {
        recent.push({
          type: "Rút tiền",
          amount: -w.amount,
          date: w.created_at,
          description: `${w.status} → ${w.wallet_address?.slice(0, 6)}...`,
        });
      });

      recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTx(recent.slice(0, 15));
    } catch (err) {
      console.error("Error loading user details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar_url || ""} />
              <AvatarFallback className="bg-primary-pale text-primary text-lg">
                {(user.display_name || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{user.display_name || "Ẩn danh"}</DialogTitle>
              <DialogDescription className="text-xs">
                {user.handle ? `@${user.handle} · ` : ""}
                Tham gia {user.joined_at ? new Date(user.joined_at).toLocaleDateString("vi-VN") : "N/A"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          <div className="px-6 pb-6 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Card className="border-amber-500/20">
                <CardContent className="p-3 text-center">
                  <Coins className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  <p className="text-sm font-bold">{formatNum(user.camly_balance)}</p>
                  <p className="text-[10px] text-foreground-muted">Số dư</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/20">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <p className="text-sm font-bold">{formatNum(user.camly_lifetime_earned)}</p>
                  <p className="text-[10px] text-foreground-muted">Tổng kiếm</p>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardContent className="p-3 text-center">
                  <Sparkles className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <p className="text-sm font-bold">{formatNum(user.light_score)}</p>
                  <p className="text-[10px] text-foreground-muted">Điểm Ánh sáng</p>
                </CardContent>
              </Card>
              <Card className="border-rose-500/20">
                <CardContent className="p-3 text-center">
                  <Wallet className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                  <p className="text-sm font-bold">{formatNum(user.total_withdrawn)}</p>
                  <p className="text-[10px] text-foreground-muted">Đã rút</p>
                </CardContent>
              </Card>
            </div>

            {/* Info summary */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">PoPL Score</span>
                <span className="font-medium">{user.popl_score.toFixed(1)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Bài viết / BL</span>
                <span className="font-medium">{user.post_count} / {user.comment_count}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">FUN Money</span>
                <span className="font-medium">{formatNum(user.fun_money_received)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">PPLP Actions</span>
                <span className="font-medium">{user.pplp_action_count} ({user.pplp_minted_count} minted)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Tặng nội bộ</span>
                <span className="font-medium">
                  <span className="text-green-600">↑{formatNum(user.gift_internal_sent)}</span>
                  {" / "}
                  <span className="text-blue-600">↓{formatNum(user.gift_internal_received)}</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Tặng Web3</span>
                <span className="font-medium">
                  <span className="text-green-600">↑{formatNum(user.gift_web3_sent)}</span>
                  {" / "}
                  <span className="text-blue-600">↓{formatNum(user.gift_web3_received)}</span>
                </span>
              </div>
              {user.wallet_address && (
                <div className="flex justify-between py-1 border-b border-border/50 col-span-2">
                  <span className="text-foreground-muted">Ví BSC</span>
                  <span className="font-mono text-[10px]">{user.wallet_address}</span>
                </div>
              )}
            </div>

            <Tabs defaultValue="rewards" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="rewards" className="text-xs">Phân tích thưởng</TabsTrigger>
                <TabsTrigger value="history" className="text-xs">Lịch sử giao dịch</TabsTrigger>
              </TabsList>

              <TabsContent value="rewards" className="mt-3 space-y-1">
                {loading ? (
                  <p className="text-xs text-foreground-muted text-center py-4">Đang tải...</p>
                ) : rewardBreakdown.length === 0 ? (
                  <p className="text-xs text-foreground-muted text-center py-4">Chưa có dữ liệu thưởng</p>
                ) : (
                  rewardBreakdown.map(r => {
                    const Icon = TYPE_ICONS[r.transaction_type] || Award;
                    return (
                      <div key={r.transaction_type} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs flex-1">{TYPE_LABELS[r.transaction_type] || r.transaction_type}</span>
                        <span className="text-xs text-foreground-muted">{r.count} lần</span>
                        <span className="text-xs font-semibold text-amber-600 min-w-[60px] text-right">
                          {formatNum(r.total)}
                        </span>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-3 space-y-1">
                {loading ? (
                  <p className="text-xs text-foreground-muted text-center py-4">Đang tải...</p>
                ) : recentTx.length === 0 ? (
                  <p className="text-xs text-foreground-muted text-center py-4">Chưa có giao dịch</p>
                ) : (
                  recentTx.map((tx, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50">
                      {tx.amount > 0 ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-600 shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{tx.type}</p>
                        <p className="text-[10px] text-foreground-muted truncate">{tx.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold ${tx.amount > 0 ? "text-green-600" : "text-rose-600"}`}>
                          {tx.amount > 0 ? "+" : ""}{formatNum(tx.amount)}
                        </p>
                        <p className="text-[10px] text-foreground-muted">
                          {new Date(tx.date).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
