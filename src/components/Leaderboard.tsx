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
import { RainbowTitle } from "@/components/leaderboard/RainbowTitle";
import { LeaderboardFloatingEffects } from "@/components/leaderboard/LeaderboardEffects";

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
      <Card className="bg-white/30 backdrop-blur-sm border-white/40 shadow-lg animate-pulse">
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
    <Card className="bg-white/30 backdrop-blur-sm border-white/40 shadow-lg overflow-hidden relative">
      {/* Floating effects in the main card */}
      <LeaderboardFloatingEffects />

      <CardContent className="p-3 md:p-4 relative z-10">
        {/* Compact Header with Logo and Rainbow Title */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* Logo with Glow Effect */}
          <motion.div
            className="relative"
            animate={{ 
              boxShadow: [
                "0 0 15px rgba(255,215,0,0.3)",
                "0 0 25px rgba(255,215,0,0.5)",
                "0 0 15px rgba(255,215,0,0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(255,215,0,0.4)]">
              <img src={angelLogo} alt="Angel AI" className="w-full h-full rounded-full object-cover" />
            </div>
            
            {/* Sparkle Effects */}
            <motion.div
              className="absolute -top-0.5 -right-0.5"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
            </motion.div>
          </motion.div>

          {/* Rainbow 3D Title */}
          <RainbowTitle text={t("leaderboard.topRanking")} />
        </div>

        {/* Compact Stats Bar */}
        <div className="flex items-center justify-center gap-3 mb-3 p-2 rounded-lg bg-gradient-to-r from-amber-100/50 via-yellow-50 to-amber-100/50 border border-amber-200/50">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <Users className="w-3 h-3 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground leading-tight">{t("leaderboard.members")}</p>
              <p className="text-sm font-bold text-primary-deep">{stats.total_users.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-amber-300/50" />
          
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
              <Coins className="w-3 h-3 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground leading-tight">{t("leaderboard.camlyCoin")}</p>
              <p className="text-sm font-bold text-amber-600">{stats.total_coins_distributed.toLocaleString()}</p>
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
                  {t("leaderboard.collapse")}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  {t("leaderboard.viewMore")} ({allUsers.length - 5} {t("common.people")})
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
            {t("leaderboard.viewCommunity")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default Leaderboard;
