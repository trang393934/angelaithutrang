import { Gift, TrendingUp, Heart, Sparkles, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface RankBadgeProps {
  rank: number;
  type: "giver" | "receiver";
}

function RankBadge({ rank, type }: RankBadgeProps) {
  const isGiver = type === "giver";
  
  if (rank === 1) {
    return (
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
        ${isGiver 
          ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-yellow-900 ring-2 ring-yellow-300' 
          : 'bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 text-white ring-2 ring-rose-300'}`}>
        👑
      </div>
    );
  }
  
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md
      ${isGiver
        ? rank === 2 
          ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700'
          : 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800'
        : rank === 2
          ? 'bg-gradient-to-br from-rose-200 to-rose-400 text-rose-700'
          : 'bg-gradient-to-br from-pink-200 to-pink-400 text-pink-700'
      }`}>
      {rank}
    </div>
  );
}

interface CoinAmountBadgeProps {
  amount: number;
  type: "giver" | "receiver";
}

function CoinAmountBadge({ amount, type }: CoinAmountBadgeProps) {
  const formattedAmount = amount >= 1000 
    ? `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
    : amount.toLocaleString();
    
  const isGiver = type === "giver";
  
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-md font-bold text-sm
      ${isGiver
        ? 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-700 ring-1 ring-amber-300'
        : 'bg-gradient-to-r from-rose-100 to-pink-200 text-rose-600 ring-1 ring-rose-300'
      }`}>
      <img src={camlyCoinLogo} alt="coin" className="w-4 h-4" />
      <span>{formattedAmount}</span>
    </div>
  );
}

export function GiftHonorBoard() {
  const { t } = useLanguage();
  const { topGivers, topReceivers, totalGifted } = useCoinGifts();

  const isEmpty = topGivers.length === 0 && topReceivers.length === 0;

  return (
    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl border-2 border-amber-300 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 py-3 relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -right-4 -top-4 opacity-30"
        >
          <Sparkles className="w-20 h-20 text-white" />
        </motion.div>
        <div className="flex items-center gap-2 relative">
          <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg drop-shadow-sm">{t("gift.honorTitle")}</h3>
        </div>
        <div className="flex items-center gap-1.5 mt-1 relative">
          <img src={camlyCoinLogo} alt="coin" className="w-4 h-4" />
          <p className="text-sm text-white font-semibold drop-shadow-sm">
            {totalGifted.toLocaleString()} Camly Coin {t("gift.totalGifted")}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {isEmpty ? (
          <div className="text-center py-6">
            <Gift className="w-10 h-10 text-amber-300 mx-auto mb-2" />
            <p className="text-sm text-amber-600 font-medium">{t("gift.emptyState")}</p>
            <p className="text-xs text-amber-500 mt-1">{t("gift.beFirstGiver")}</p>
          </div>
        ) : (
          <>
            {/* Top Givers */}
            {topGivers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-amber-700">{t("gift.topGivers")}</span>
                </div>
                <div className="space-y-2.5">
                  {topGivers.slice(0, 3).map((giver, index) => (
                    <Link
                      key={giver.user_id}
                      to={`/user/${giver.user_id}`}
                      className="flex items-center gap-3 hover:bg-amber-100/70 rounded-xl p-2 transition-all duration-200 hover:shadow-md group"
                    >
                      <RankBadge rank={index + 1} type="giver" />
                      <Avatar className={`ring-2 shadow-md ${index === 0 ? 'h-10 w-10 ring-amber-400' : 'h-9 w-9 ring-amber-300'}`}>
                        <AvatarImage src={giver.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-200 to-yellow-300 text-amber-800 font-bold">
                          {giver.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`flex-1 font-semibold truncate group-hover:text-amber-700 transition-colors
                        ${index === 0 ? 'text-base text-amber-800' : 'text-sm text-gray-700'}`}>
                        {giver.display_name || "Ẩn danh"}
                      </span>
                      <CoinAmountBadge amount={giver.total_given} type="giver" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {topGivers.length > 0 && topReceivers.length > 0 && (
              <div className="border-t border-dashed border-amber-200" />
            )}

            {/* Top Receivers */}
            {topReceivers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md">
                    <Heart className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                  <span className="font-bold text-rose-600">{t("gift.topReceivers")}</span>
                </div>
                <div className="space-y-2.5">
                  {topReceivers.slice(0, 3).map((receiver, index) => (
                    <Link
                      key={receiver.user_id}
                      to={`/user/${receiver.user_id}`}
                      className="flex items-center gap-3 hover:bg-rose-100/70 rounded-xl p-2 transition-all duration-200 hover:shadow-md group"
                    >
                      <RankBadge rank={index + 1} type="receiver" />
                      <Avatar className={`ring-2 shadow-md ${index === 0 ? 'h-10 w-10 ring-rose-400' : 'h-9 w-9 ring-rose-300'}`}>
                        <AvatarImage src={receiver.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-rose-200 to-pink-300 text-rose-700 font-bold">
                          {receiver.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`flex-1 font-semibold truncate group-hover:text-rose-600 transition-colors
                        ${index === 0 ? 'text-base text-rose-700' : 'text-sm text-gray-700'}`}>
                        {receiver.display_name || "Ẩn danh"}
                      </span>
                      <CoinAmountBadge amount={receiver.total_received} type="receiver" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}