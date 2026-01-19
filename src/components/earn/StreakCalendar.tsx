import { useDailyLogin } from "@/hooks/useDailyLogin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Flame, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function StreakCalendar() {
  const { streakCount, loginHistory, isLoading } = useDailyLogin();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(28)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 28 days
  const today = new Date();
  const days = [...Array(28)].map((_, i) => subDays(today, 27 - i));

  // Convert login history to Set for quick lookup
  const loginDates = new Set(
    loginHistory.map(l => format(parseISO(l.login_date), "yyyy-MM-dd"))
  );

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Calendar className="h-5 w-5" />
            <span>Lịch đăng nhập</span>
          </div>
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Flame className="h-5 w-5" />
            <span className="text-xl font-bold">{streakCount}</span>
            <span className="text-sm font-normal text-muted-foreground">ngày</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isLoggedIn = loginDates.has(dateStr);
            const isToday = isSameDay(day, today);
            const isFuture = day > today;

            return (
              <div
                key={index}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xs transition-all",
                  isLoggedIn && "bg-green-500 text-white",
                  !isLoggedIn && isToday && "bg-amber-200 dark:bg-amber-800 ring-2 ring-amber-500",
                  !isLoggedIn && !isToday && !isFuture && "bg-muted/50 text-muted-foreground",
                  isFuture && "bg-muted/20 text-muted-foreground/50"
                )}
                title={format(day, "dd/MM/yyyy", { locale: vi })}
              >
                {isLoggedIn ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{format(day, "d")}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Đã đăng nhập</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800 ring-1 ring-amber-500" />
            <span>Hôm nay</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted/50" />
            <span>Chưa đăng nhập</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
