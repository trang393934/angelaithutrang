import { useState } from "react";
import { Gift, TrendingUp, Heart, Sparkles, ChevronRight, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCoinGifts } from "@/hooks/useCoinGifts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { motion } from "framer-motion";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface RankBadgeProps {
  rank: number;
  type: "giver" | "receiver";
  size?: "sm" | "md";
}

function RankBadge({ rank, type, size = "md" }: RankBadgeProps) {
  const isGiver = type === "giver";
  const isSm = size === "sm";
  
  if (rank === 1) {
    return (
      <div className={`rounded-full flex items-center justify-center font-bold shadow-lg
        ${isSm ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm'}
        ${isGiver 
          ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-yellow-900 ring-2 ring-yellow-300' 
          : 'bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 text-white ring-2 ring-rose-300'}`}>
        👑
      </div>
    );
  }
  
  if (rank === 2) {
    return (
      <div className={`rounded-full flex items-center justify-center font-bold shadow-md
        ${isSm ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'}
        ${isGiver
          ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700'
          : 'bg-gradient-to-br from-rose-200 to-rose-400 text-rose-700'
        }`}>
        {rank}
      </div>
    );
  }
  
  if (rank === 3) {
    return (
      <div className={`rounded-full flex items-center justify-center font-bold shadow-md
        ${isSm ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'}
        ${isGiver
          ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800'
          : 'bg-gradient-to-br from-pink-200 to-pink-400 text-pink-700'
        }`}>
        {rank}
      </div>
    );
  }
  
  return (
    <div className={`rounded-full flex items-center justify-center font-bold
      ${isSm ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'}
      ${isGiver
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-600'
      }`}>
      {rank}
    </div>
  );
}

interface CoinAmountBadgeProps {
  amount: number;
  type: "giver" | "receiver";
  size?: "sm" | "md";
}

function CoinAmountBadge({ amount, type, size = "md" }: CoinAmountBadgeProps) {
  const formattedAmount = amount >= 1000 
    ? `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
    : amount.toLocaleString();
    
  const isGiver = type === "giver";
  const isSm = size === "sm";
  
  return (
    <div className={`flex items-center gap-1 rounded-full shadow-md font-bold
      ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
      ${isGiver
        ? 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-700 ring-1 ring-amber-300'
        : 'bg-gradient-to-r from-rose-100 to-pink-200 text-rose-600 ring-1 ring-rose-300'
      }`}>
      <img src={camlyCoinLogo} alt="coin" className={`${isSm ? "w-3 h-3" : "w-4 h-4"} rounded-full`} />
      <span>{formattedAmount}</span>
    </div>
  );
}

export function GiftHonorBoard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { topGivers, topReceivers, allGivers, allReceivers, totalGifted } = useCoinGifts();
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"givers" | "receivers">("givers");
  const [searchQuery, setSearchQuery] = useState("");

  const isEmpty = topGivers.length === 0 && topReceivers.length === 0;

  // Find current user's rank
  const currentUserGiverRank = user ? allGivers.findIndex(g => g.user_id === user.id) + 1 : 0;
  const currentUserReceiverRank = user ? allReceivers.findIndex(r => r.user_id === user.id) + 1 : 0;

  // Filter by search
  const filteredGivers = allGivers.filter(g => 
    g.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredReceivers = allReceivers.filter(r => 
    r.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 overflow-hidden shadow-lg">
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
            <img src={camlyCoinLogo} alt="coin" className="w-4 h-4 rounded-full" />
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
                        to={getProfilePath(giver.user_id)}
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
                        to={getProfilePath(receiver.user_id)}
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

              {/* View All Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllDialog(true)}
                className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-100 mt-2"
              >
                <span>Xem tất cả xếp hạng</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Full Ranking Dialog */}
      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
            <DialogTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {t("gift.honorTitle")}
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
            {user && (
              <div className="flex gap-2 text-xs">
                {currentUserGiverRank > 0 && (
                  <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-amber-600">Bạn xếp hạng tặng</p>
                    <p className="font-bold text-amber-700 text-lg">#{currentUserGiverRank}</p>
                  </div>
                )}
                {currentUserReceiverRank > 0 && (
                  <div className="flex-1 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-rose-600">Bạn xếp hạng nhận</p>
                    <p className="font-bold text-rose-700 text-lg">#{currentUserReceiverRank}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="givers" className="gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Top Người Tặng ({allGivers.length})
                </TabsTrigger>
                <TabsTrigger value="receivers" className="gap-1.5">
                  <Heart className="w-4 h-4" />
                  Top Người Nhận ({allReceivers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="givers" className="mt-3">
                <ScrollArea className="h-[45vh]">
                  <div className="space-y-1.5 pr-3">
                    {filteredGivers.map((giver, index) => {
                      const rank = allGivers.findIndex(g => g.user_id === giver.user_id) + 1;
                      const isCurrentUser = user?.id === giver.user_id;
                      return (
                        <Link
                          key={giver.user_id}
                          to={getProfilePath(giver.user_id)}
                          onClick={() => setShowAllDialog(false)}
                          className={`flex items-center gap-2.5 rounded-lg p-2 transition-all hover:shadow-sm
                            ${isCurrentUser ? 'bg-amber-100 ring-2 ring-amber-400' : 'hover:bg-amber-50'}`}
                        >
                          <RankBadge rank={rank} type="giver" size="sm" />
                          <Avatar className="h-8 w-8 ring-1 ring-amber-200">
                            <AvatarImage src={giver.avatar_url || ""} />
                            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                              {giver.display_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`flex-1 text-sm truncate ${isCurrentUser ? 'font-bold text-amber-800' : 'font-medium'}`}>
                            {giver.display_name || "Ẩn danh"}
                            {isCurrentUser && <span className="ml-1 text-xs text-amber-600">(Bạn)</span>}
                          </span>
                          <CoinAmountBadge amount={giver.total_given} type="giver" size="sm" />
                        </Link>
                      );
                    })}
                    {filteredGivers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Không tìm thấy kết quả</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="receivers" className="mt-3">
                <ScrollArea className="h-[45vh]">
                  <div className="space-y-1.5 pr-3">
                    {filteredReceivers.map((receiver, index) => {
                      const rank = allReceivers.findIndex(r => r.user_id === receiver.user_id) + 1;
                      const isCurrentUser = user?.id === receiver.user_id;
                      return (
                        <Link
                          key={receiver.user_id}
                          to={getProfilePath(receiver.user_id)}
                          onClick={() => setShowAllDialog(false)}
                          className={`flex items-center gap-2.5 rounded-lg p-2 transition-all hover:shadow-sm
                            ${isCurrentUser ? 'bg-rose-100 ring-2 ring-rose-400' : 'hover:bg-rose-50'}`}
                        >
                          <RankBadge rank={rank} type="receiver" size="sm" />
                          <Avatar className="h-8 w-8 ring-1 ring-rose-200">
                            <AvatarImage src={receiver.avatar_url || ""} />
                            <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                              {receiver.display_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`flex-1 text-sm truncate ${isCurrentUser ? 'font-bold text-rose-800' : 'font-medium'}`}>
                            {receiver.display_name || "Ẩn danh"}
                            {isCurrentUser && <span className="ml-1 text-xs text-rose-600">(Bạn)</span>}
                          </span>
                          <CoinAmountBadge amount={receiver.total_received} type="receiver" size="sm" />
                        </Link>
                      );
                    })}
                    {filteredReceivers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Không tìm thấy kết quả</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}