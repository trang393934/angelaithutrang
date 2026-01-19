import { useExtendedRewardStatus } from "@/hooks/useExtendedRewardStatus";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
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
  linkTo?: string;
  completedText: string;
  remainingText: string;
  goToText: string;
}

function EarnActivity({ icon, title, description, rewarded, max, rewardPerAction, color, linkTo, completedText, remainingText, goToText }: EarnActivityProps) {
  const remaining = Math.max(0, max - rewarded);
  const progress = max > 0 ? (rewarded / max) * 100 : 0;
  const isComplete = remaining === 0;

  const IconWrapper = linkTo ? (
    <Link 
      to={linkTo}
      className={cn(
        "p-2 rounded-lg cursor-pointer transition-all hover:scale-110 hover:shadow-md",
        isComplete ? "bg-green-100 dark:bg-green-900/30" : color
      )}
      title={`${goToText} ${title}`}
    >
      {icon}
    </Link>
  ) : (
    <div className={cn(
      "p-2 rounded-lg",
      isComplete ? "bg-green-100 dark:bg-green-900/30" : color
    )}>
      {icon}
    </div>
  );

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      isComplete 
        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
        : "bg-card hover:shadow-md"
    )}>
      <div className="flex items-start gap-3">
        {IconWrapper}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
              isComplete 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              {isComplete ? completedText : `${remaining} ${remainingText}`}
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
  const { t } = useLanguage();

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
      title: t("earn.activity.dailyLogin"),
      description: t("earn.activity.dailyLoginDesc"),
      rewarded: status.loginsRewarded,
      max: 1,
      rewardPerAction: "100-1000 coin",
      color: "bg-blue-100 dark:bg-blue-900/30",
      linkTo: undefined,
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-purple-600" />,
      title: t("earn.activity.questions"),
      description: t("earn.activity.questionsDesc"),
      rewarded: status.questionsRewarded,
      max: 10,
      rewardPerAction: "1000-5000 coin",
      color: "bg-purple-100 dark:bg-purple-900/30",
      linkTo: "/chat",
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
    {
      icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
      title: t("earn.activity.journal"),
      description: t("earn.activity.journalDesc"),
      rewarded: status.journalsRewarded,
      max: 3,
      rewardPerAction: "5000-9000 coin",
      color: "bg-emerald-100 dark:bg-emerald-900/30",
      linkTo: "/profile",
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
    {
      icon: <Share2 className="h-5 w-5 text-pink-600" />,
      title: t("earn.activity.share"),
      description: t("earn.activity.shareDesc"),
      rewarded: status.sharesRewarded,
      max: 5,
      rewardPerAction: "500 coin",
      color: "bg-pink-100 dark:bg-pink-900/30",
      linkTo: "/chat",
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-orange-600" />,
      title: t("earn.activity.feedback"),
      description: t("earn.activity.feedbackDesc"),
      rewarded: status.feedbacksRewarded,
      max: 2,
      rewardPerAction: "2000 coin",
      color: "bg-orange-100 dark:bg-orange-900/30",
      linkTo: "/feedback",
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
    {
      icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
      title: t("earn.activity.ideas"),
      description: t("earn.activity.ideasDesc"),
      rewarded: status.ideasSubmitted,
      max: 2,
      rewardPerAction: "1000 coin",
      color: "bg-yellow-100 dark:bg-yellow-900/30",
      linkTo: "/ideas",
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
    {
      icon: <Upload className="h-5 w-5 text-cyan-600" />,
      title: t("earn.activity.upload"),
      description: t("earn.activity.uploadDesc"),
      rewarded: status.knowledgeUploads,
      max: 2,
      rewardPerAction: "2000 coin",
      color: "bg-cyan-100 dark:bg-cyan-900/30",
      linkTo: "/knowledge",
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
    {
      icon: <Users className="h-5 w-5 text-indigo-600" />,
      title: t("earn.activity.community"),
      description: t("earn.activity.communityDesc"),
      rewarded: status.communityHelpsRewarded,
      max: 5,
      rewardPerAction: "300 coin",
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      linkTo: "/community",
      completedText: t("earn.completed"),
      remainingText: t("earn.remaining"),
      goToText: t("common.goTo"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold">{t("earn.progressTitle")}</h2>
        </div>
        <div className="flex items-center gap-2">
          <img src={camlyCoinLogo} alt="Camly Coin" className="w-6 h-6" />
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {status.totalCoinsToday.toLocaleString()}
          </span>
        </div>
      </div>
        
      {status.currentStreak > 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <Flame className="h-4 w-4" />
          <span>Streak: {status.currentStreak} {t("earn.streakDays")}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {activities.map((activity, index) => (
          <EarnActivity key={index} {...activity} />
        ))}
      </div>
    </div>
  );
}