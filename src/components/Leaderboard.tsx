import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronDown, ChevronUp, Sparkles, Coins, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import angelLogo from "@/assets/angel-ai-logo.png";
import { TopRankingHero } from "@/components/leaderboard/TopRankingHero";
import { RankingRow } from "@/components/leaderboard/RankingRow";

export function Leaderboard() {
  const { topUsers, stats, isLoading, allUsers } = useLeaderboard();
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Show all users when expanded
  const displayUsers = showAll ? allUsers : topUsers.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-primary/10 shadow-xl animate-pulse">
        <CardContent className="p-6">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6" />
          <div className="flex justify-center gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-full" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50 border-amber-200/50 shadow-xl overflow-hidden">
      <CardContent className="p-4 md:p-6">
        {/* Header with Logo and Title */}
        <div className="flex flex-col items-center mb-4">
          {/* Logo with Glow Effect */}
          <motion.div
            className="relative mb-3"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(255,215,0,0.3)",
                "0 0 40px rgba(255,215,0,0.6)",
                "0 0 20px rgba(255,215,0,0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-400 p-1 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img src={angelLogo} alt="Angel AI" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              </div>
            </div>
            
            {/* Sparkle Effects */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </motion.div>
          </motion.div>

          {/* Title with Golden Shimmer */}
          <h2 className="text-xl md:text-2xl font-bold tracking-wider uppercase relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
              TOP RANKING
            </span>
            <motion.span
              className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            >
              TOP RANKING
            </motion.span>
          </h2>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-100/50 via-yellow-50 to-amber-100/50 border border-amber-200/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Tổng thành viên</p>
              <p className="text-base md:text-lg font-bold text-primary-deep">{stats.total_users.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="w-px h-10 bg-amber-300/50" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Tổng Camly Coin</p>
              <p className="text-base md:text-lg font-bold text-amber-600">{stats.total_coins_distributed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Hero Zone - Top 5 Trophy Display */}
        {topUsers.length > 0 ? (
          <TopRankingHero topUsers={topUsers} />
        ) : (
          <div className="text-center py-6 text-foreground-muted">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-300" />
            <p className="text-sm">{t("common.noData")}</p>
          </div>
        )}

        {/* Ranking List - Only show when expanded (users beyond top 5) */}
        {showAll && allUsers.length > 5 && (
          <div className="space-y-2 mt-4">
            {allUsers.slice(5).map(user => (
              <RankingRow
                key={user.user_id}
                user={user}
                isCurrentUser={user.user_id === currentUserId}
              />
            ))}
          </div>
        )}

        {/* View All Button - only show if there are users beyond top 5 */}
        {allUsers.length > 5 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-primary hover:text-primary-deep hover:bg-amber-50"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Xem thêm ({allUsers.length - 5} người)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Link to Community */}
        <Link to="/community" className="block mt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Xem Cộng Đồng
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default Leaderboard;
