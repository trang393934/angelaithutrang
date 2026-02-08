import { useEarlyAdopterReward } from "@/hooks/useEarlyAdopterReward";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Star, CheckCircle2, MessageCircle, Gift, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

export function EarlyAdopterProgress() {
  const { status, isLoading } = useEarlyAdopterReward();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const { isRewarded, validQuestionsCount, userRank, rewardAmount } = status;
  const questionsRequired = 10;
  const maxUsers = 100;
  const progress = Math.min((validQuestionsCount / questionsRequired) * 100, 100);
  const questionsRemaining = Math.max(questionsRequired - validQuestionsCount, 0);

  // Already rewarded
  if (isRewarded) {
    return (
      <Card className="border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            {t("earlyAdopter.completed")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-amber-500" />
              <span>{t("earlyAdopter.yourRank")}: <strong className="text-foreground">#{userRank}</strong> / {maxUsers}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <img src={camlyCoinLogo} alt="Camly Coin" className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-sm text-muted-foreground">{t("earlyAdopter.rewardReceived")}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                +{rewardAmount.toLocaleString()} Camly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not eligible (rank > 100)
  if (userRank > maxUsers) {
    return (
      <Card className="border border-muted bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Crown className="h-5 w-5" />
            {t("earlyAdopter.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("earlyAdopter.notEligible")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // In progress
  return (
    <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 dark:bg-amber-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-200/30 dark:bg-orange-700/20 rounded-full" />
      
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Crown className="h-5 w-5" />
            {t("earlyAdopter.title")}
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
            <Star className="h-3 w-3 mr-1" />
            #{userRank} / {maxUsers}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative">
        <p className="text-sm text-muted-foreground">
          {t("earlyAdopter.description")}
        </p>
        
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-amber-600" />
              {t("earlyAdopter.questionsProgress")}
            </span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {validQuestionsCount} / {questionsRequired}
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className={`h-3 bg-amber-100 dark:bg-amber-900/50 ${
              progress >= 100 ? 'animate-pulse [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-500' : ''
            }`}
          />
          
          {questionsRemaining > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("earlyAdopter.questionsRemaining").replace("{count}", String(questionsRemaining))}
            </p>
          )}
        </div>

        {/* Reward Preview */}
        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
          <div className="relative">
            <img src={camlyCoinLogo} alt="Camly Coin" className="w-10 h-10 rounded-full" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{t("earlyAdopter.reward")}</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {rewardAmount.toLocaleString()} Camly
            </p>
          </div>
          <Gift className="h-6 w-6 text-amber-500" />
        </div>

        {/* CTA */}
        <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
          <Link to="/chat">
            {t("earlyAdopter.askNow")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
