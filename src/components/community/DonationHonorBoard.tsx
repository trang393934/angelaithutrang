import { useState } from "react";
import { Heart, Sparkles, ChevronRight, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface DonorRankBadgeProps {
  rank: number;
  size?: "sm" | "md";
}

function DonorRankBadge({ rank, size = "md" }: DonorRankBadgeProps) {
  const isSm = size === "sm";
  
  if (rank === 1) {
    return (
      <div className={`rounded-full flex items-center justify-center font-bold shadow-lg
        ${isSm ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-base'}
        bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-yellow-900 ring-2 ring-yellow-300`}>
        👑
      </div>
    );
  }
  
  if (rank === 2) {
    return (
      <div className={`rounded-full flex items-center justify-center font-bold shadow-md
        ${isSm ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-sm'}
        bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 text-gray-700 ring-1 ring-gray-300`}>
        {rank}
      </div>
    );
  }
  
  if (rank === 3) {
    return (
      <div className={`rounded-full flex items-center justify-center font-bold shadow-md
        ${isSm ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-sm'}
        bg-gradient-to-br from-amber-200 via-orange-300 to-amber-400 text-orange-800 ring-1 ring-orange-300`}>
        {rank}
      </div>
    );
  }
  
  return (
    <div className={`rounded-full flex items-center justify-center font-bold
      ${isSm ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'}
      bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700`}>
      {rank}
    </div>
  );
}

interface DonorAmountBadgeProps {
  amount: number;
  size?: "sm" | "md";
}

function DonorAmountBadge({ amount, size = "md" }: DonorAmountBadgeProps) {
  const formattedAmount = amount >= 1000 
    ? `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
    : amount.toLocaleString();
  
  const isSm = size === "sm";
  
  return (
    <div className={`flex items-center gap-1 rounded-full shadow-md font-bold
      ${isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm'}
      bg-gradient-to-r from-rose-100 via-pink-100 to-rose-200 text-rose-600 ring-1 ring-rose-300`}>
      <Heart className={`fill-rose-500 text-rose-500 ${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      <span>{formattedAmount}</span>
    </div>
  );
}

export function DonationHonorBoard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { topDonors, allDonors, totalDonated } = useCoinGifts();
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isEmpty = topDonors.length === 0;

  // Find current user's rank
  const currentUserRank = user ? allDonors.findIndex(d => d.user_id === user.id) + 1 : 0;

  // Filter by search
  const filteredDonors = allDonors.filter(d => 
    d.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 overflow-hidden shadow-lg">
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
            <img src={camlyCoinLogo} alt="coin" className="w-4 h-4 rounded-full" />
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
                 to={getProfilePath(donor.user_id)}
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

              {/* View All Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllDialog(true)}
                className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-100 mt-2"
              >
                <span>Xem tất cả xếp hạng</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
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

      {/* Full Ranking Dialog */}
      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2 bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500">
            <DialogTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 fill-white" />
              {t("donate.honorTitle")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Your Rank Badge */}
            {user && currentUserRank > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-center">
                <p className="text-sm text-rose-600">Thứ hạng của bạn</p>
                <p className="font-bold text-rose-700 text-2xl">#{currentUserRank}</p>
                <p className="text-xs text-rose-500 mt-1">trong số {allDonors.length} mạnh thường quân</p>
              </div>
            )}

            {/* Donor List */}
            <ScrollArea className="h-[50vh]">
              <div className="space-y-1.5 pr-3">
                {filteredDonors.map((donor) => {
                  const rank = allDonors.findIndex(d => d.user_id === donor.user_id) + 1;
                  const isCurrentUser = user?.id === donor.user_id;
                  return (
                    <Link
                      key={donor.user_id}
                      to={`/user/${donor.user_id}`}
                      onClick={() => setShowAllDialog(false)}
                      className={`flex items-center gap-2.5 rounded-lg p-2 transition-all hover:shadow-sm
                        ${isCurrentUser ? 'bg-rose-100 ring-2 ring-rose-400' : 'hover:bg-rose-50'}`}
                    >
                      <DonorRankBadge rank={rank} size="sm" />
                      <Avatar className="h-8 w-8 ring-1 ring-rose-200">
                        <AvatarImage src={donor.avatar_url || ""} />
                        <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                          {donor.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`flex-1 text-sm truncate ${isCurrentUser ? 'font-bold text-rose-800' : 'font-medium'}`}>
                        {donor.display_name || "Mạnh thường quân"}
                        {isCurrentUser && <span className="ml-1 text-xs text-rose-600">(Bạn)</span>}
                      </span>
                      <DonorAmountBadge amount={donor.total_donated} size="sm" />
                    </Link>
                  );
                })}
                {filteredDonors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Không tìm thấy kết quả</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}