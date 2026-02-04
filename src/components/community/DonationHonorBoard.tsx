import { Heart, Sparkles, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface DonorRankBadgeProps {
  rank: number;
}

function DonorRankBadge({ rank }: DonorRankBadgeProps) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold shadow-lg
        bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-yellow-900 ring-2 ring-yellow-300">
        👑
      </div>
    );
  }
  
  if (rank === 2) {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md
        bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 text-gray-700 ring-1 ring-gray-300">
        {rank}
      </div>
    );
  }
  
  if (rank === 3) {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md
        bg-gradient-to-br from-amber-200 via-orange-300 to-amber-400 text-orange-800 ring-1 ring-orange-300">
        {rank}
      </div>
    );
  }
  
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm
      bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700">
      {rank}
    </div>
  );
}

interface DonorAmountBadgeProps {
  amount: number;
}

function DonorAmountBadge({ amount }: DonorAmountBadgeProps) {
  const formattedAmount = amount >= 1000 
    ? `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
    : amount.toLocaleString();
  
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-md font-bold text-sm
      bg-gradient-to-r from-rose-100 via-pink-100 to-rose-200 text-rose-600 ring-1 ring-rose-300">
      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
      <span>{formattedAmount}</span>
    </div>
  );
}

export function DonationHonorBoard() {
  const { t } = useLanguage();
  const { topDonors, totalDonated } = useCoinGifts();

  const isEmpty = topDonors.length === 0;

  return (
    <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 rounded-xl border-2 border-rose-300 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-4 py-3 relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -right-4 -top-4 opacity-30"
        >
          <Sparkles className="w-20 h-20 text-white" />
        </motion.div>
        <div className="flex items-center gap-2 relative">
          <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <h3 className="font-bold text-white text-lg drop-shadow-sm">{t("donate.honorTitle")}</h3>
        </div>
        <div className="flex items-center gap-1.5 mt-1 relative">
          <img src={camlyCoinLogo} alt="coin" className="w-4 h-4" />
          <p className="text-sm text-white font-semibold drop-shadow-sm">
            {totalDonated.toLocaleString()} Camly Coin {t("donate.totalDonated")}
          </p>
        </div>
      </div>

      <div className="p-4">
        {isEmpty ? (
          <div className="text-center py-6">
            <Heart className="w-10 h-10 text-rose-300 mx-auto mb-2" />
            <p className="text-sm text-rose-600 font-medium">{t("donate.emptyState")}</p>
            <p className="text-xs text-rose-500 mt-1">{t("donate.beFirstDonor")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topDonors.slice(0, 5).map((donor, index) => (
              <Link
                key={donor.user_id}
                to={`/user/${donor.user_id}`}
                className="flex items-center gap-3 hover:bg-rose-100/70 rounded-xl p-2.5 transition-all duration-200 hover:shadow-md group"
              >
                <DonorRankBadge rank={index + 1} />
                <Avatar className={`ring-2 shadow-md ${
                  index === 0 ? 'h-11 w-11 ring-rose-400' : 
                  index <= 2 ? 'h-10 w-10 ring-rose-300' : 
                  'h-9 w-9 ring-rose-200'
                }`}>
                  <AvatarImage src={donor.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-rose-200 to-pink-300 text-rose-700 font-bold">
                    {donor.display_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className={`flex-1 font-semibold truncate group-hover:text-rose-600 transition-colors
                  ${index === 0 ? 'text-base text-rose-700' : 
                    index <= 2 ? 'text-sm text-gray-700' : 
                    'text-sm text-gray-600'}`}>
                  {donor.display_name || "Mạnh thường quân"}
                </span>
                <DonorAmountBadge amount={donor.total_donated} />
              </Link>
            ))}
          </div>
        )}

        {/* Appreciation message */}
        <div className="mt-4 pt-3 border-t border-dashed border-rose-200">
          <p className="text-xs text-center text-rose-500 italic font-medium">
            ✨ {t("donate.appreciationMessage")} ✨
          </p>
        </div>
      </div>
    </div>
  );
}