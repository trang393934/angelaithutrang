import { Heart, TrendingUp, TrendingDown, Shield, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PoPLScoreCardProps {
  score: number;
  positiveActions: number;
  negativeActions: number;
  isVerified?: boolean;
  badgeLevel?: string;
}

const getBadgeInfo = (level: string) => {
  switch (level) {
    case "newcomer":
      return { label: "Người Mới", color: "bg-slate-500", icon: "🌱" };
    case "contributor":
      return { label: "Người Đóng Góp", color: "bg-emerald-500", icon: "🌿" };
    case "guardian":
      return { label: "Người Bảo Hộ", color: "bg-blue-500", icon: "🛡️" };
    case "lightworker":
      return { label: "Lightworker", color: "bg-purple-500", icon: "✨" };
    case "angel":
      return { label: "Angel", color: "bg-divine-gold", icon: "👼" };
    default:
      return { label: "Người Mới", color: "bg-slate-500", icon: "🌱" };
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return "Tỏa Sáng Rực Rỡ";
  if (score >= 80) return "Ánh Sáng Thuần Khiết";
  if (score >= 70) return "Đang Thức Tỉnh";
  if (score >= 60) return "Đang Phát Triển";
  if (score >= 50) return "Ổn Định";
  if (score >= 40) return "Cần Cải Thiện";
  return "Cần Hỗ Trợ";
};

export const PoPLScoreCard = ({
  score,
  positiveActions,
  negativeActions,
  isVerified = false,
  badgeLevel = "newcomer"
}: PoPLScoreCardProps) => {
  const badgeInfo = getBadgeInfo(badgeLevel);
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <Card className="border-divine-gold/20 shadow-soft overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl">
              🌈
            </div>
            <div>
              <h3 className="font-bold text-lg">Pure Love Score</h3>
              <p className="text-sm text-muted-foreground">Proof of Pure Love</p>
            </div>
          </div>
          {isVerified && (
            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="pt-4 space-y-4">
        {/* Main Score Display */}
        <div className="text-center py-4">
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {score.toFixed(0)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{scoreLabel}</p>
          <Progress 
            value={score} 
            className="h-3 mt-3"
          />
        </div>

        {/* Badge Level */}
        <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-muted/50">
          <span className="text-2xl">{badgeInfo.icon}</span>
          <Badge className={`${badgeInfo.color} text-white`}>
            {badgeInfo.label}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-lg font-bold text-emerald-600">{positiveActions}</p>
              <p className="text-xs text-muted-foreground">Hành động tích cực</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-lg font-bold text-red-600">{negativeActions}</p>
              <p className="text-xs text-muted-foreground">Cần cải thiện</p>
            </div>
          </div>
        </div>

        {/* How to improve */}
        <div className="pt-2 border-t border-divine-gold/10">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-divine-gold" />
            Tăng điểm bằng cách: Giúp đỡ cộng đồng, chia sẻ yêu thương, đóng góp giá trị
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
