import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDailyLogin } from "@/hooks/useDailyLogin";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Coins, Flame, Calendar, Gift, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface DailyLoginRewardProps {
  onClose?: () => void;
}

export function DailyLoginReward({ onClose }: DailyLoginRewardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { 
    alreadyLoggedIn, 
    streakCount, 
    coinsEarned, 
    isStreakBonus, 
    isLoading, 
    hasProcessed,
    loginHistory,
    getStreakDaysUntilBonus 
  } = useDailyLogin();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Auto-show dialog when login is processed and coins were earned
  useEffect(() => {
    if (hasProcessed && !alreadyLoggedIn && coinsEarned > 0) {
      setIsOpen(true);
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasProcessed, alreadyLoggedIn, coinsEarned]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!user || isLoading) return null;

  // Generate week days for streak display
  const weekDays = [
    t("earn.calendar.mon"),
    t("earn.calendar.tue"),
    t("earn.calendar.wed"),
    t("earn.calendar.thu"),
    t("earn.calendar.fri"),
    t("earn.calendar.sat"),
    t("earn.calendar.sun"),
  ];
  const today = new Date().getDay();
  const currentDayInWeek = today === 0 ? 6 : today - 1; // Convert to Mon=0 format
  
  // Calculate which days in current streak week are completed
  const daysCompleted = streakCount % 7 || (streakCount > 0 ? 7 : 0);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Gift className="h-5 w-5" />
            {t("earn.login.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Celebration animation */}
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <Sparkles
                  key={i}
                  className={cn(
                    "absolute text-amber-400 animate-ping",
                    `left-[${Math.random() * 100}%]`,
                    `top-[${Math.random() * 100}%]`
                  )}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 1}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Coins earned display */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center",
                isStreakBonus 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse" 
                  : "bg-gradient-to-br from-amber-300 to-amber-400"
              )}>
                <img src={camlyCoinLogo} alt="Camly Coin" className="w-16 h-16 rounded-full" />
              </div>
              {isStreakBonus && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                  BONUS!
                </div>
              )}
            </div>
            
            <h3 className={cn(
              "mt-4 text-3xl font-bold",
              isStreakBonus ? "text-orange-600 dark:text-orange-400" : "text-amber-700 dark:text-amber-300"
            )}>
              +{coinsEarned.toLocaleString()} Camly Coin
            </h3>
            
            {isStreakBonus && (
              <p className="text-orange-600 dark:text-orange-400 font-medium mt-1">
                🎉 {t("earn.login.congrats")}
              </p>
            )}
          </div>

          {/* Streak display */}
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-foreground">{t("earn.login.streak")}</span>
              </div>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streakCount} {t("earn.login.days")}
              </span>
            </div>

            {/* Week progress */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const isCompleted = index < daysCompleted;
                const isToday = index === currentDayInWeek;
                const isBonus = index === 6; // Sunday is bonus day
                
                return (
                  <div key={day} className="text-center">
                    <div className={cn(
                      "w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs transition-all",
                      isCompleted && "bg-green-500 text-white",
                      !isCompleted && isToday && "bg-amber-200 dark:bg-amber-800 ring-2 ring-amber-500",
                      !isCompleted && !isToday && "bg-muted text-muted-foreground",
                      isBonus && !isCompleted && "ring-2 ring-orange-400"
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : isBonus ? (
                        <Gift className="h-3 w-3" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] mt-1 block",
                      isToday && "font-bold text-amber-600 dark:text-amber-400"
                    )}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Days until bonus */}
            {getStreakDaysUntilBonus() > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                {getStreakDaysUntilBonus()} {t("earn.login.daysUntilBonus")} <span className="font-bold text-orange-600">1000 Camly Coin</span> {t("earn.login.bonus")}
              </p>
            )}
          </div>

          {/* Reward tiers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("earn.login.rewards")}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <span>{t("earn.login.perDay")} <strong>100</strong></span>
              </div>
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg p-2 flex items-center gap-2">
                <Gift className="h-4 w-4 text-orange-500" />
                <span>{t("earn.login.day7")} <strong>1000</strong></span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleClose} 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {t("earn.login.awesome")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}