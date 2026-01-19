import { Coins, TrendingUp, MessageCircle, BookOpen, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCamlyCoin } from "@/hooks/useCamlyCoin";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

export function CamlyCoinDisplay() {
  const { balance, lifetimeEarned, isLoading, dailyStatus, recentTransactions } = useCamlyCoin();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-amber-200/50 animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-amber-100/50 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const questionsProgress = dailyStatus 
    ? ((dailyStatus.questionsRewarded / 10) * 100) 
    : 0;

  const journalsProgress = dailyStatus 
    ? ((dailyStatus.journalsRewarded / 3) * 100) 
    : 0;

  return (
    <Card className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/60 border-amber-200/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <img src={camlyCoinLogo} alt="Camly Coin" className="w-6 h-6" />
          Camly Coin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance */}
        <div className="flex items-center justify-between bg-white/60 rounded-xl p-4 border border-amber-200/30">
          <div>
            <p className="text-sm text-amber-700/70">Số dư hiện tại</p>
            <p className="text-2xl font-bold text-amber-900 flex items-center gap-1">
              <Coins className="w-5 h-5 text-amber-600" />
              {balance.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-600/60">Tổng tích lũy</p>
            <p className="text-sm font-medium text-amber-700 flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4" />
              {lifetimeEarned.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Daily Status */}
        {dailyStatus && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Tiến độ hôm nay
            </h4>
            
            {/* Questions Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-700">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Câu hỏi thưởng
                </span>
                <span className="text-amber-600">
                  {dailyStatus.questionsRewarded}/10 (còn {dailyStatus.questionsRemaining})
                </span>
              </div>
              <Progress value={questionsProgress} className="h-2 bg-amber-100" />
            </div>

            {/* Journals Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-700">
                  <BookOpen className="w-3.5 h-3.5" />
                  Nhật ký tối
                </span>
                <span className="text-amber-600">
                  {dailyStatus.journalsRewarded}/3 (còn {dailyStatus.journalsRemaining})
                </span>
              </div>
              <Progress value={journalsProgress} className="h-2 bg-amber-100" />
              {!dailyStatus.canWriteJournal && (
                <p className="text-xs text-amber-600/70 italic">
                  🌙 Mở sau 20:00 (8 giờ tối)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-800">Lịch sử gần đây</h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-xs bg-white/40 rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-800 truncate">
                      {tx.description || getTransactionTypeLabel(tx.transaction_type)}
                    </p>
                    <p className="text-amber-600/60">
                      {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    chat_reward: "Thưởng chat",
    gratitude_reward: "Biết ơn",
    journal_reward: "Nhật ký",
    engagement_reward: "Tương tác",
    referral_bonus: "Giới thiệu",
    challenge_reward: "Thử thách",
    spending: "Chi tiêu",
    admin_adjustment: "Điều chỉnh",
  };
  return labels[type] || type;
}

export default CamlyCoinDisplay;
