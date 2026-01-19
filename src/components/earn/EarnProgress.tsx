import { useExtendedRewardStatus } from "@/hooks/useExtendedRewardStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Coins, 
  MessageCircle, 
  BookOpen, 
  Share2, 
  MessageSquare, 
  Lightbulb, 
  Users, 
  Upload,
  LogIn,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface EarnActivityProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  rewarded: number;
  max: number;
  rewardPerAction: string;
  color: string;
}

function EarnActivity({ icon, title, description, rewarded, max, rewardPerAction, color }: EarnActivityProps) {
  const remaining = Math.max(0, max - rewarded);
  const progress = max > 0 ? (rewarded / max) * 100 : 0;
  const isComplete = remaining === 0;

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      isComplete 
        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
        : "bg-card hover:shadow-md"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isComplete ? "bg-green-100 dark:bg-green-900/30" : color
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
              isComplete 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              {isComplete ? "Hoàn thành" : `Còn ${remaining} lượt`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          <div className="mt-2 space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{rewarded}/{max}</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{rewardPerAction}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EarnProgress() {
  const status = useExtendedRewardStatus();

  if (status.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activities: EarnActivityProps[] = [
    {
      icon: <LogIn className="h-5 w-5 text-blue-600" />,
      title: "Đăng nhập hàng ngày",
      description: "Đăng nhập mỗi ngày để nhận thưởng, streak 7 ngày = 1000 coin bonus",
      rewarded: status.loginsRewarded,
      max: 1,
      rewardPerAction: "100-1000 coin",
      color: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-purple-600" />,
      title: "Câu hỏi chất lượng",
      description: "Đặt câu hỏi có ý nghĩa và sâu sắc",
      rewarded: status.questionsRewarded,
      max: 10,
      rewardPerAction: "1000-5000 coin/câu",
      color: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
      title: "Nhật ký biết ơn",
      description: "Viết nhật ký sau 8 giờ tối (>50 ký tự)",
      rewarded: status.journalsRewarded,
      max: 3,
      rewardPerAction: "5000-9000 coin/bài",
      color: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      icon: <Share2 className="h-5 w-5 text-pink-600" />,
      title: "Chia sẻ nội dung",
      description: "Chia sẻ lên mạng xã hội",
      rewarded: status.sharesRewarded,
      max: 3,
      rewardPerAction: "1000 coin/lần",
      color: "bg-pink-100 dark:bg-pink-900/30",
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-orange-600" />,
      title: "Phản hồi hữu ích",
      description: "Gửi phản hồi chi tiết (>100 ký tự)",
      rewarded: status.feedbacksRewarded,
      max: 2,
      rewardPerAction: "2000 coin/lần",
      color: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
      title: "Đóng góp ý tưởng",
      description: "Gửi ý tưởng xây dựng app",
      rewarded: status.ideasSubmitted,
      max: 2,
      rewardPerAction: "1000 coin khi duyệt",
      color: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      icon: <Upload className="h-5 w-5 text-cyan-600" />,
      title: "Tải lên kiến thức",
      description: "Đóng góp tài liệu vào kho kiến thức",
      rewarded: status.knowledgeUploads,
      max: 2,
      rewardPerAction: "2000 coin khi duyệt",
      color: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    {
      icon: <Users className="h-5 w-5 text-indigo-600" />,
      title: "Hỗ trợ cộng đồng",
      description: "Giúp đỡ thành viên khác",
      rewarded: status.communityHelpsRewarded,
      max: 5,
      rewardPerAction: "300 coin/lần",
      color: "bg-indigo-100 dark:bg-indigo-900/30",
    },
  ];

  return (
    <Card className="border-amber-200/50 dark:border-amber-800/50 mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600" />
            <span>Tích lũy ánh sáng hôm nay</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={camlyCoinLogo} alt="Camly Coin" className="w-6 h-6" />
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {status.totalCoinsToday.toLocaleString()}
            </span>
          </div>
        </CardTitle>
        
        {status.currentStreak > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 mt-1">
            <Flame className="h-4 w-4" />
            <span>Streak: {status.currentStreak} ngày liên tiếp</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {activities.map((activity, index) => (
            <EarnActivity key={index} {...activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
