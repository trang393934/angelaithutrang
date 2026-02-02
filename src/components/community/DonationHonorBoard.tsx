import { Heart, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function DonationHonorBoard() {
  const { t } = useLanguage();
  const { topDonors, totalDonated } = useCoinGifts();

  const isEmpty = topDonors.length === 0;

  return (
    <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 rounded-xl border-2 border-rose-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-400 to-pink-400 px-4 py-3 relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -right-4 -top-4 opacity-20"
        >
          <Sparkles className="w-20 h-20 text-white" />
        </motion.div>
        <div className="flex items-center gap-2 relative">
          <Heart className="w-5 h-5 text-white fill-white" />
          <h3 className="font-bold text-white">{t("donate.honorTitle")}</h3>
        </div>
        <p className="text-xs text-white/80 mt-0.5 relative">
          {totalDonated.toLocaleString()} Camly Coin {t("donate.totalDonated")}
        </p>
      </div>

      <div className="p-3">
        {isEmpty ? (
          <div className="text-center py-6">
            <Heart className="w-10 h-10 text-rose-300 mx-auto mb-2" />
            <p className="text-sm text-rose-600 font-medium">{t("donate.emptyState")}</p>
            <p className="text-xs text-rose-500 mt-1">{t("donate.beFirstDonor")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topDonors.slice(0, 5).map((donor, index) => (
              <Link
                key={donor.user_id}
                to={`/user/${donor.user_id}`}
                className="flex items-center gap-2 hover:bg-rose-100/50 rounded-lg p-1.5 transition-colors"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' : 
                    index === 2 ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-orange-800' :
                    'bg-rose-200 text-rose-700'}`}>
                  {index === 0 ? '👑' : index + 1}
                </span>
                <Avatar className="h-8 w-8 ring-2 ring-rose-200">
                  <AvatarImage src={donor.avatar_url || ""} />
                  <AvatarFallback className="bg-rose-200 text-rose-700 text-xs">
                    {donor.display_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium truncate">
                  {donor.display_name || "Mạnh thường quân"}
                </span>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                  <span className="text-xs font-bold text-rose-600">
                    {donor.total_donated >= 1000 
                      ? `${(donor.total_donated / 1000).toFixed(1)}K` 
                      : donor.total_donated}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Appreciation message */}
        <div className="mt-3 pt-3 border-t border-rose-200">
          <p className="text-xs text-center text-rose-500 italic">
            ✨ {t("donate.appreciationMessage")} ✨
          </p>
        </div>
      </div>
    </div>
  );
}
