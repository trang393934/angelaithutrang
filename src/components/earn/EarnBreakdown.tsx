import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  BookOpen, 
  Calendar, 
  Award, 
  Trophy,
  Share2,
  Lightbulb,
  Eye,
  Upload,
  MessageSquare,
  Users,
  Settings,
  Heart,
  PenSquare,
  MessageCircleHeart,
  Sparkles
} from "lucide-react";

interface CoinBreakdown {
  transaction_type: string;
  total_amount: number;
  count: number;
}

const TRANSACTION_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  // Chat & Journaling
  chat_reward: { 
    label: "Hỏi đáp với Angel", 
    icon: <MessageCircle className="h-5 w-5" />, 
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" 
  },
  journal_reward: { 
    label: "Nhật ký biết ơn", 
    icon: <BookOpen className="h-5 w-5" />, 
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" 
  },
  gratitude_reward: { 
    label: "Lời biết ơn", 
    icon: <BookOpen className="h-5 w-5" />, 
    color: "bg-green-100 text-green-600 dark:bg-green-900/30" 
  },
  
  // Daily & Streak
  daily_login: { 
    label: "Đăng nhập hàng ngày", 
    icon: <Calendar className="h-5 w-5" />, 
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" 
  },
  
  // Community Activities
  engagement_reward: { 
    label: "Tương tác cộng đồng (10 likes)", 
    icon: <Heart className="h-5 w-5" />, 
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30" 
  },
  community_support: { 
    label: "Đăng bài cộng đồng", 
    icon: <PenSquare className="h-5 w-5" />, 
    color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30" 
  },
  content_share: { 
    label: "Chia sẻ bài viết", 
    icon: <Share2 className="h-5 w-5" />, 
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30" 
  },
  
  // Contributions
  bounty_reward: { 
    label: "Nhiệm vụ Bounty", 
    icon: <Trophy className="h-5 w-5" />, 
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" 
  },
  build_idea: { 
    label: "Đóng góp ý tưởng", 
    icon: <Lightbulb className="h-5 w-5" />, 
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" 
  },
  vision_reward: { 
    label: "Vision Board", 
    icon: <Eye className="h-5 w-5" />, 
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" 
  },
  knowledge_upload: { 
    label: "Đóng góp kiến thức", 
    icon: <Upload className="h-5 w-5" />, 
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30" 
  },
  feedback_reward: { 
    label: "Góp ý phản hồi", 
    icon: <MessageSquare className="h-5 w-5" />, 
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30" 
  },
  
  // Referral & Challenges
  referral_bonus: { 
    label: "Giới thiệu bạn bè", 
    icon: <Users className="h-5 w-5" />, 
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30" 
  },
  challenge_reward: { 
    label: "Hoàn thành thử thách", 
    icon: <Sparkles className="h-5 w-5" />, 
    color: "bg-red-100 text-red-600 dark:bg-red-900/30" 
  },
  
  // Admin
  admin_adjustment: { 
    label: "Điều chỉnh Admin", 
    icon: <Settings className="h-5 w-5" />, 
    color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30" 
  },
};

export function EarnBreakdown() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [breakdown, setBreakdown] = useState<CoinBreakdown[]>([]);
  const [earlyAdopterBonus, setEarlyAdopterBonus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBreakdown = async () => {
      if (!user) return;

      try {
        // Fetch coin breakdown by transaction type
        const { data: transactions, error } = await supabase
          .from('camly_coin_transactions')
          .select('transaction_type, amount')
          .eq('user_id', user.id)
          .gt('amount', 0); // Only positive amounts (earnings)

        if (error) {
          console.error('Error fetching breakdown:', error);
          return;
        }

        // Aggregate by transaction type
        const aggregated: Record<string, { total_amount: number; count: number }> = {};
        
        transactions?.forEach(tx => {
          if (!aggregated[tx.transaction_type]) {
            aggregated[tx.transaction_type] = { total_amount: 0, count: 0 };
          }
          aggregated[tx.transaction_type].total_amount += Number(tx.amount);
          aggregated[tx.transaction_type].count += 1;
        });

        const breakdownData: CoinBreakdown[] = Object.entries(aggregated)
          .map(([type, data]) => ({
            transaction_type: type,
            total_amount: data.total_amount,
            count: data.count
          }))
          .sort((a, b) => b.total_amount - a.total_amount);

        setBreakdown(breakdownData);

        // Fetch early adopter bonus separately
        const { data: earlyAdopterData } = await supabase
          .from('early_adopter_rewards')
          .select('is_rewarded, reward_amount')
          .eq('user_id', user.id)
          .single();

        if (earlyAdopterData?.is_rewarded) {
          setEarlyAdopterBonus(earlyAdopterData.reward_amount);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBreakdown();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalFromActivities = breakdown.reduce((sum, item) => sum + item.total_amount, 0);
  const grandTotal = totalFromActivities;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Chi tiết nguồn Camly Coin đã kiếm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Early Adopter Bonus - Special highlight */}
        {earlyAdopterBonus > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  🎉 Thưởng Early Adopter
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                  Top 100 người dùng đầu tiên
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-amber-600 dark:text-amber-400">
                +{earlyAdopterBonus.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Activity breakdown */}
        {breakdown.length === 0 && !earlyAdopterBonus ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có hoạt động nào</p>
            <p className="text-sm">Bắt đầu tham gia để kiếm Camly Coin!</p>
          </div>
        ) : (
          breakdown.map((item) => {
            const config = TRANSACTION_TYPE_CONFIG[item.transaction_type] || {
              label: item.transaction_type,
              icon: <Trophy className="h-5 w-5" />,
              color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30"
            };

            return (
              <div
                key={item.transaction_type}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} lần nhận thưởng
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{item.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Total summary */}
        {(breakdown.length > 0 || earlyAdopterBonus > 0) && (
          <div className="pt-3 mt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">Tổng cộng</span>
              <span className="text-xl font-bold text-primary">
                {(grandTotal + earlyAdopterBonus).toLocaleString()} Camly
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
