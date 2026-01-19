import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Medal, Crown, Coins, Heart, Users, TrendingUp, ChevronDown, ChevronUp, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import angelAvatar from "@/assets/angel-avatar.png";

const getRankIcon = (rank: number, isCurrentUser: boolean = false) => {
  if (isCurrentUser && rank > 3) {
    return <Star className="w-5 h-5 text-primary fill-primary" />;
  }
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-amber-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-700" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-foreground-muted">#{rank}</span>;
  }
};

const getRankStyle = (rank: number, isCurrentUser: boolean = false) => {
  if (isCurrentUser) {
    return "bg-gradient-to-r from-primary/20 via-divine-gold/20 to-primary/20 border-primary ring-2 ring-primary/30";
  }
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300";
    case 2:
      return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300";
    case 3:
      return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300";
    default:
      return "bg-white/50 border-gray-200";
  }
};

export function Leaderboard() {
  const { topUsers, topQuestions, stats, isLoading, allUsers } = useLeaderboard();
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<"coins" | "questions">("coins");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Find current user's rank
  const currentUserRank = allUsers.find(u => u.user_id === currentUserId);

  const displayUsers = showAll ? allUsers : topUsers.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-primary/10 shadow-lg animate-pulse">
        <CardContent className="p-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-primary/10 shadow-xl overflow-hidden">
      {/* Stats Header */}
      <div className="bg-gradient-to-r from-primary/10 via-divine-gold/10 to-primary/10 px-4 py-3 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-divine-gold" />
            <span className="font-semibold text-primary-deep">{t("leaderboard.title")}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {currentUserRank && (
              <div className="flex items-center gap-1 text-primary font-medium">
                <Star className="w-3.5 h-3.5 fill-primary" />
                <span>#{currentUserRank.rank}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-foreground-muted">
              <Users className="w-3.5 h-3.5" />
              <span>{stats.total_users} {t("common.people")}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-600">
              <Coins className="w-3.5 h-3.5" />
              <span>{stats.total_coins_distributed.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "coins" | "questions")}>
          <TabsList className="grid w-full grid-cols-2 rounded-none bg-gray-50/50 h-10">
            <TabsTrigger value="coins" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-white">
              <Coins className="w-3.5 h-3.5" />
              {t("leaderboard.topCamlyCoin")}
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs flex items-center gap-1.5 data-[state=active]:bg-white">
              <Heart className="w-3.5 h-3.5" />
              {t("leaderboard.topQuestions")}
            </TabsTrigger>
          </TabsList>

          {/* Top Users by Coins */}
          <TabsContent value="coins" className="m-0">
            <div className="divide-y divide-gray-100">
              {displayUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                  <p className="text-sm text-foreground-muted">{t("common.noData")}</p>
                </div>
              ) : (
                displayUsers.map((user) => {
                  const isCurrentUser = user.user_id === currentUserId;
                  return (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-all hover:bg-gray-50 ${getRankStyle(user.rank, isCurrentUser)} border-l-2`}
                    >
                      <div className="flex-shrink-0 w-6">
                        {getRankIcon(user.rank, isCurrentUser)}
                      </div>
                      <Avatar className="w-8 h-8 border border-primary/20">
                        <AvatarImage src={user.avatar_url || angelAvatar} />
                        <AvatarFallback className="text-xs">
                          {user.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary font-semibold' : 'text-foreground'}`}>
                          {user.display_name || t("common.anonymous")}
                          {isCurrentUser && <span className="ml-1 text-xs">({t("common.you")})</span>}
                        </p>
                        {user.lifetime_earned === 0 && (
                          <p className="text-xs text-foreground-muted">{t("common.noActivity")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="text-sm font-semibold">
                          {user.lifetime_earned.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {allUsers.length > 5 && (
              <div className="p-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-xs text-primary hover:text-primary-deep"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      {t("common.collapse")}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      {t("common.viewAll")} ({allUsers.length} {t("common.people")})
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Top Questions */}
          <TabsContent value="questions" className="m-0">
            <div className="divide-y divide-gray-100">
              {topQuestions.length === 0 ? (
                <div className="p-6 text-center">
                  <Heart className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                  <p className="text-sm text-foreground-muted">{t("leaderboard.noQuestions")}</p>
                  <Link to="/community" className="text-xs text-primary hover:underline mt-1 inline-block">
                    {t("leaderboard.viewCommunity")} →
                  </Link>
                </div>
              ) : (
                topQuestions.slice(0, 5).map((question, index) => (
                  <Link
                    key={question.id}
                    to="/community"
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 flex items-center justify-center">
                        {index === 0 ? (
                          <Crown className="w-4 h-4 text-amber-500" />
                        ) : (
                          <span className="text-xs font-bold text-foreground-muted">#{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                          {question.question_text}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={question.user_avatar_url || angelAvatar} />
                            <AvatarFallback className="text-[8px]">
                              {question.user_display_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-foreground-muted">
                            {question.user_display_name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-pink-500">
                        <Heart className="w-4 h-4 fill-pink-500" />
                        <span className="text-sm font-semibold">{question.likes_count}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {topQuestions.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <Link to="/community">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-primary hover:text-primary-deep"
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {t("leaderboard.viewAllQuestions")}
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default Leaderboard;
