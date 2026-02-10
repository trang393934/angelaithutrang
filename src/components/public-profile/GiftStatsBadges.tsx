import { motion } from "framer-motion";
import { Gift, Trophy, Heart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGiftStats } from "@/hooks/useGiftStats";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

interface GiftStatsBadgesProps {
  userId: string;
  poplScore?: number;
  lightPoints?: number;
}

export function GiftStatsBadges({ userId, poplScore = 0, lightPoints = 0 }: GiftStatsBadgesProps) {
  const { totalGiven, totalReceived, giftsSentCount, giftsReceivedCount, isTopGiver, isTopReceiver, giverRank, receiverRank, isLoading } = useGiftStats(userId);

  if (isLoading) return null;

  const hasActivity = totalGiven > 0 || totalReceived > 0 || poplScore > 0 || lightPoints > 0;
  if (!hasActivity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="max-w-4xl mx-auto mt-4"
    >
      {/* Top Giver/Receiver Badges */}
      {(isTopGiver || isTopReceiver) && (
        <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
          {isTopGiver && giverRank && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none px-3 py-1 text-xs font-bold shadow-md">
              <Trophy className="w-3 h-3 mr-1" />
              🏆 Top {giverRank} Người Tặng
            </Badge>
          )}
          {isTopReceiver && receiverRank && (
            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none px-3 py-1 text-xs font-bold shadow-md">
              <Heart className="w-3 h-3 mr-1" />
              💖 Top {receiverRank} Được Yêu Thương
            </Badge>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Given */}
        {totalGiven > 0 && (
          <div className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <Gift className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-sm font-bold text-foreground">
              {Math.floor(totalGiven).toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">Đã tặng ({giftsSentCount} lần)</span>
          </div>
        )}

        {/* Total Received */}
        {totalReceived > 0 && (
          <div className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
            <Heart className="w-4 h-4 text-pink-500 mb-1" />
            <span className="text-sm font-bold text-foreground">
              {Math.floor(totalReceived).toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">Được nhận ({giftsReceivedCount} lần)</span>
          </div>
        )}

        {/* PoPL Score */}
        {poplScore > 0 && (
          <div className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <span className="text-lg mb-0.5">🌈</span>
            <span className="text-sm font-bold text-foreground">{poplScore}/100</span>
            <span className="text-[10px] text-muted-foreground">Pure Love Score</span>
          </div>
        )}

        {/* Light Points */}
        {lightPoints > 0 && (
          <div className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-br from-divine-gold/10 to-amber-400/10 border border-divine-gold/20">
            <TrendingUp className="w-4 h-4 text-divine-gold mb-1" />
            <span className="text-sm font-bold text-foreground">
              {lightPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">Light Points</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
