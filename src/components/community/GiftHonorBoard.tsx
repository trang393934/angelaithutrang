import { Gift, TrendingUp, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

export function GiftHonorBoard() {
  const { t } = useLanguage();
  const { topGivers, topReceivers, totalGifted } = useCoinGifts();

  if (topGivers.length === 0 && topReceivers.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl border-2 border-amber-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-white" />
          <h3 className="font-bold text-white">{t("gift.honorTitle")}</h3>
        </div>
        <p className="text-xs text-white/80 mt-0.5">
          {totalGifted.toLocaleString()} Camly Coin {t("gift.totalGifted")}
        </p>
      </div>

      <div className="p-3 space-y-4">
        {/* Top Givers */}
        {topGivers.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 mb-2">
              <TrendingUp className="w-4 h-4" />
              {t("gift.topGivers")}
            </div>
            <div className="space-y-2">
              {topGivers.slice(0, 3).map((giver, index) => (
                <Link
                  key={giver.user_id}
                  to={`/user/${giver.user_id}`}
                  className="flex items-center gap-2 hover:bg-amber-100/50 rounded-lg p-1.5 transition-colors"
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                      index === 1 ? 'bg-gray-300 text-gray-700' : 
                      'bg-amber-200 text-amber-700'}`}>
                    {index + 1}
                  </span>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={giver.avatar_url || ""} />
                    <AvatarFallback className="bg-amber-200 text-amber-700 text-xs">
                      {giver.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium truncate">
                    {giver.display_name || "Ẩn danh"}
                  </span>
                  <span className="text-xs font-semibold text-amber-600">
                    {giver.total_given >= 1000 
                      ? `${(giver.total_given / 1000).toFixed(1)}K` 
                      : giver.total_given}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top Receivers */}
        {topReceivers.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 mb-2">
              <Heart className="w-4 h-4" />
              {t("gift.topReceivers")}
            </div>
            <div className="space-y-2">
              {topReceivers.slice(0, 3).map((receiver, index) => (
                <Link
                  key={receiver.user_id}
                  to={`/user/${receiver.user_id}`}
                  className="flex items-center gap-2 hover:bg-rose-100/50 rounded-lg p-1.5 transition-colors"
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-rose-400 text-white' : 
                      index === 1 ? 'bg-rose-300 text-rose-800' : 
                      'bg-rose-200 text-rose-700'}`}>
                    {index + 1}
                  </span>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={receiver.avatar_url || ""} />
                    <AvatarFallback className="bg-rose-200 text-rose-700 text-xs">
                      {receiver.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium truncate">
                    {receiver.display_name || "Ẩn danh"}
                  </span>
                  <span className="text-xs font-semibold text-rose-500">
                    {receiver.total_received >= 1000 
                      ? `${(receiver.total_received / 1000).toFixed(1)}K` 
                      : receiver.total_received}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
