import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFUNMoneyStats } from "@/hooks/useFUNMoneyStats";
import { Link } from "react-router-dom";
import { Coins, CheckCircle, Lock, ArrowRight } from "lucide-react";
import funMoneyLogo from "@/assets/fun-money-logo.png";

interface FUNMoneyStatsBannerProps {
  userId?: string;
}

export function FUNMoneyStatsBanner({ userId }: FUNMoneyStatsBannerProps) {
  const { t } = useLanguage();
  const { totalMinted, totalSigned, totalPending, totalAmount, isLoading } =
    useFUNMoneyStats(userId);

  const statItems = [
    {
      label: t("earn.funMoney.minted"),
      value: totalMinted,
      icon: Coins,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    },
    {
      label: t("earn.funMoney.signed"),
      value: totalSigned,
      icon: CheckCircle,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      label: t("earn.funMoney.pending"),
      value: totalPending,
      icon: Lock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-amber-600 to-orange-700 text-white border-0 overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={funMoneyLogo}
              alt="FUN Money"
              className="w-10 h-10 rounded-full"
            />
            <h3 className="text-lg font-bold">
              {t("earn.funMoney.title")}
            </h3>
          </div>
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Link to="/mint">
              {t("earn.funMoney.viewDetails")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Total */}
        <div className="mb-5">
          <p className="text-white/70 text-sm mb-1">
            {t("earn.funMoney.total")}
          </p>
          {isLoading ? (
            <Skeleton className="h-9 w-40 bg-white/20" />
          ) : (
            <p className="text-3xl font-bold">
              {totalAmount.toLocaleString()} FUN
            </p>
          )}
        </div>

        {/* Stats Grid */}
        {totalAmount === 0 && !isLoading ? (
          <p className="text-white/80 text-sm">
            {t("earn.funMoney.emptyMessage")}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-white/10 p-3 text-center"
              >
                <div
                  className={`w-8 h-8 mx-auto rounded-full ${item.bgColor} flex items-center justify-center mb-2`}
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-white/70 text-xs mb-1">{item.label}</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-16 mx-auto bg-white/20" />
                ) : (
                  <p className="font-bold text-sm">
                    {item.value.toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
