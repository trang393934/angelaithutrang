import { Award, Heart, Share2, MessageCircle, Coins, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RewardRulesCardProps {
  dailyLimits?: {
    postsRewarded: number;
    postsRemaining: number;
    commentsRewarded: number;
    commentsRemaining: number;
    sharesRewarded: number;
    sharesRemaining: number;
  } | null;
}

export function RewardRulesCard({ dailyLimits }: RewardRulesCardProps) {
  const rules = [
    {
      icon: Heart,
      title: "5+ Likes",
      reward: "3,000 Camly Coin",
      description: "Bài viết/ảnh đạt 5 lượt thích",
      limit: dailyLimits ? `${dailyLimits.postsRemaining}/3 bài còn lại` : "3 bài/ngày",
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      icon: Share2,
      title: "Chia sẻ",
      reward: "500 Camly Coin x2",
      description: "Cả tác giả và người chia sẻ đều nhận",
      limit: dailyLimits ? `${dailyLimits.sharesRemaining}/5 lượt còn lại` : "5 lượt/ngày",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: MessageCircle,
      title: "Bình luận",
      reward: "500 Camly Coin",
      description: "Tối thiểu 50 ký tự",
      limit: dailyLimits ? `${dailyLimits.commentsRemaining}/5 lượt còn lại` : "5 lượt/ngày",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary-deep">
          <Award className="w-5 h-5 text-amber-500" />
          Quy tắc thưởng Camly Coin
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-foreground-muted" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Tham gia tích cực để nhận Camly Coin. Giới hạn thưởng được reset mỗi ngày.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg ${rule.bgColor}`}
            >
              <div className={`p-2 rounded-full bg-white shadow-sm`}>
                <rule.icon className={`w-4 h-4 ${rule.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{rule.title}</span>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">{rule.reward}</span>
                  </div>
                </div>
                <p className="text-xs text-foreground-muted">{rule.description}</p>
                <p className="text-xs text-primary font-medium mt-0.5">{rule.limit}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
