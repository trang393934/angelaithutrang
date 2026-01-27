import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import angelLogo from "@/assets/angel-ai-logo.png";
import { AvatarBadge } from "@/components/leaderboard/AvatarBadge";
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

  // Get top 5 users for the hero zone
  const top5 = topUsers.slice(0, 5);
  const displayUsers = showAll ? allUsers.slice(0, 20) : topUsers.slice(0, 5);

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
    <Card className="bg-gradient-to-b from-white via-amber-50/30 to-white border-amber-200/50 shadow-xl overflow-hidden">
      <CardContent className="p-4 md:p-6">
        {/* Header with Logo and Title */}
        <div className="flex flex-col items-center mb-6">
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-400 p-1 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img src={angelLogo} alt="Angel AI" className="w-12 h-12 object-contain" />
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
            <motion.div
              className="absolute -bottom-1 -left-1"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </motion.div>
          </motion.div>

          {/* Title with Golden Shimmer */}
          <h2 className="text-xl md:text-2xl font-bold tracking-wider uppercase relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
              TOP RANKING
            </span>
            <motion.span
              className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              TOP RANKING
            </motion.span>
          </h2>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-foreground-muted">
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>{stats.total_users} người tham gia</span>
            </div>
          </div>
        </div>

        {/* Hero Zone - Top 5 Pyramid Layout */}
        {top5.length >= 5 ? (
          <div className="flex flex-col items-center mb-6">
            {/* Row 1: Rank 2 and 3 */}
            <div className="flex justify-center gap-8 md:gap-12 mb-1">
              <AvatarBadge rank={2} user={top5[1]} size="md" />
              <AvatarBadge rank={3} user={top5[2]} size="md" />
            </div>

            {/* Row 2: Rank 1 (Center, Largest) */}
            <div className="flex justify-center -mt-2 mb-1">
              <AvatarBadge rank={1} user={top5[0]} size="lg" crown />
            </div>

            {/* Row 3: Rank 4 and 5 */}
            <div className="flex justify-center gap-10 md:gap-16 -mt-2">
              <AvatarBadge rank={4} user={top5[3]} size="sm" />
              <AvatarBadge rank={5} user={top5[4]} size="sm" />
            </div>
          </div>
        ) : top5.length > 0 ? (
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            {top5.map((user, index) => (
              <AvatarBadge
                key={user.user_id}
                rank={index + 1}
                user={user}
                size={index === 0 ? "lg" : "md"}
                crown={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-foreground-muted">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-300" />
            <p className="text-sm">{t("common.noData")}</p>
          </div>
        )}

        {/* Ranking List */}
        {displayUsers.length > 0 && (
          <div className="space-y-2">
            {displayUsers.map(user => (
              <RankingRow
                key={user.user_id}
                user={user}
                isCurrentUser={user.user_id === currentUserId}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
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
                  Xem tất cả ({allUsers.length} người)
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
