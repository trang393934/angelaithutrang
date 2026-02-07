import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Clock, Sparkles, Loader2, Trophy, Gift, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { CollapsibleCreatePost } from "@/components/community/CollapsibleCreatePost";
import { PostCard } from "@/components/community/PostCard";
import { RewardRulesCard } from "@/components/community/RewardRulesCard";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { FunEcosystemSidebar } from "@/components/community/FunEcosystemSidebar";
import { SuggestedFriendsCard } from "@/components/community/SuggestedFriendsCard";
import { CirclesSidebar } from "@/components/community/CirclesSidebar";
import { Leaderboard } from "@/components/Leaderboard";
import { HonorBoard } from "@/components/community/HonorBoard";
import { CommunityGuidelinesCard } from "@/components/community/CommunityGuidelinesCard";
import { GiftHonorBoard } from "@/components/community/GiftHonorBoard";
import { DonationHonorBoard } from "@/components/community/DonationHonorBoard";
import { GiftTransactionHistory } from "@/components/community/GiftTransactionHistory";
import { Web3TransactionHistory } from "@/components/community/Web3TransactionHistory";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";
import { DonateProjectDialog } from "@/components/gifts/DonateProjectDialog";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { LightGate } from "@/components/LightGate";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";

const Community = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const {
    posts,
    isLoading,
    dailyLimits,
    sortBy,
    setSortBy,
    createPost,
    toggleLike,
    sharePost,
    addComment,
    fetchComments,
    editPost,
    deletePost,
  } = useCommunityPosts();

  const [userProfile, setUserProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [showMobileLeaderboard, setShowMobileLeaderboard] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const rightSidebarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserProfile(data);
    };
    fetchProfile();
  }, [user]);

  // Ensure the right sidebar starts at the top so HonorBoard is always visible
  useEffect(() => {
    rightSidebarRef.current?.scrollTo({ top: 0 });
  }, []);

  const handleCreatePost = async (content: string, imageUrls?: string[]) => {
    const result = await createPost(content, imageUrls);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    return result;
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error(t("community.loginToLike"));
      return { success: false };
    }
    const result = await toggleLike(postId);
    if (result.postRewarded) {
      toast.success(result.message, { duration: 5000 });
    }
    return result;
  };

  const handleShare = async (postId: string) => {
    if (!user) {
      toast.error(t("community.loginToShare"));
      return { success: false };
    }
    const result = await sharePost(postId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    return result;
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user) {
      toast.error(t("community.loginToComment"));
      return { success: false };
    }
    const result = await addComment(postId, content);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    return result;
  };

  return (
    <LightGate>
      <div className="h-screen flex flex-col bg-gradient-to-b from-primary-pale via-background to-background">
        {/* Header - fixed height */}
        <CommunityHeader />

        {/* Content area - fills remaining height */}
        <div className="flex-1 flex overflow-hidden">
          <div className="container mx-auto flex gap-2 sm:gap-4 lg:gap-6 px-2 sm:px-3 lg:px-4 py-3 sm:py-4 h-full">
            {/* Left Sidebar - scrollable with visible scrollbar */}
            <aside className="hidden xl:flex flex-col w-[280px] flex-shrink-0 h-full min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 pr-1">
              <FunEcosystemSidebar className="w-full" />
            </aside>

            {/* Main Content - SCROLLABLE */}
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden space-y-3 sm:space-y-4 lg:space-y-6 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
              {/* Create Post */}
              {user ? (
                <CollapsibleCreatePost
                  userAvatar={userProfile?.avatar_url}
                  userName={userProfile?.display_name || "Bạn"}
                  onSubmit={handleCreatePost}
                />
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-primary/10">
                  <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                  <p className="text-foreground-muted mb-3">{t("community.loginToJoin")}</p>
                  <Link to="/auth">
                    <Button className="bg-sapphire-gradient">{t("auth.login")}</Button>
                  </Link>
                </div>
              )}

              {/* Gift & Donate Action Buttons */}
              {user && (
                <div className="flex gap-2 sm:gap-3">
                  <motion.div 
                    className="flex-1 min-w-0"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setShowGiftDialog(true)}
                      className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold shadow-lg px-2 sm:px-4 text-xs sm:text-sm"
                    >
                      <Gift className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">{t("gift.title")}</span>
                    </Button>
                  </motion.div>
                  <motion.div 
                    className="flex-1 min-w-0"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setShowDonateDialog(true)}
                      className="w-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white font-semibold shadow-lg px-2 sm:px-4 text-xs sm:text-sm"
                    >
                      <Heart className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">{t("donate.title")}</span>
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Mobile Leaderboard Button */}
              {isMobile && (
                <Sheet open={showMobileLeaderboard} onOpenChange={setShowMobileLeaderboard}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 flex items-center justify-center gap-2 text-xs sm:text-sm py-2"
                    >
                      <Trophy className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t("community.leaderboard")}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] overflow-y-auto px-3 sm:px-6">
                    <SheetHeader>
                      <SheetTitle className="text-center text-amber-600 flex items-center justify-center gap-2 text-sm sm:text-base">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="truncate">{t("community.leaderboardStats")}</span>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 pb-6">
                      <HonorBoard />
                      <GiftHonorBoard />
                      <DonationHonorBoard />
                      <GiftTransactionHistory />
                      <Web3TransactionHistory />
                      <Leaderboard />
                      <SuggestedFriendsCard />
                      <RewardRulesCard dailyLimits={dailyLimits} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Sort Tabs */}
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "popular")}>
                <TabsList className="grid w-full max-w-[280px] sm:max-w-xs grid-cols-2 bg-white/50">
                  <TabsTrigger value="recent" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{t("community.sortRecent")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{t("community.sortPopular")}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Posts List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-primary/10">
                  <Users className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground/70">{t("community.noPosts")}</h3>
                  <p className="text-sm text-foreground-muted mt-2">
                    {t("community.beFirstToShare")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PostCard
                        post={post}
                        currentUserId={user?.id}
                        onLike={handleLike}
                        onShare={handleShare}
                        onComment={handleComment}
                        onEdit={editPost}
                        onDelete={deletePost}
                        fetchComments={fetchComments}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </main>

            {/* Right Sidebar - flexbox layout with pinned HonorBoard */}
            <aside
              ref={rightSidebarRef}
              className="hidden lg:flex flex-col w-[280px] xl:w-[320px] flex-shrink-0 h-full min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50"
            >
            {/* Bảng Danh Dự */}
            <div className="flex-shrink-0 mb-4">
              <HonorBoard />
            </div>

            {/* Nội Quy Cộng Đồng - ngay dưới Bảng Danh Dự */}
            <div className="flex-shrink-0 mb-4">
              <CommunityGuidelinesCard />
            </div>

            {/* Bảng Vinh Danh Tặng Quà - MỚI */}
            <div className="flex-shrink-0 mb-4">
              <GiftHonorBoard />
            </div>

            {/* Bảng Vinh Danh Mạnh Thường Quân - MỚI */}
            <div className="flex-shrink-0 mb-4">
              <DonationHonorBoard />
            </div>

            {/* Lịch Sử Giao Dịch Quà */}
            <div className="flex-shrink-0 mb-4">
              <GiftTransactionHistory />
            </div>

            {/* Giao Dịch Web3 On-Chain */}
            <div className="flex-shrink-0 mb-4">
              <Web3TransactionHistory />
            </div>

            <div className="flex-shrink-0 mb-4">
              <CirclesSidebar maxVisible={3} />
            </div>

            {/* Gợi ý kết bạn */}
            <div className="flex-shrink-0 mb-4">
              <SuggestedFriendsCard />
            </div>

            {/* Bảng Xếp Hạng */}
            <div className="flex-shrink-0 mb-4">
              <Leaderboard />
            </div>
            
            {/* Quy tắc thưởng */}
            <div className="flex-shrink-0 mb-4">
              <RewardRulesCard dailyLimits={dailyLimits} />
            </div>
            </aside>
          </div>
        </div>

        {/* Gift & Donate Dialogs */}
        <GiftCoinDialog 
          open={showGiftDialog} 
          onOpenChange={setShowGiftDialog} 
        />
        <DonateProjectDialog 
          open={showDonateDialog} 
          onOpenChange={setShowDonateDialog} 
        />
      </div>
    </LightGate>
  );
};

export default Community;
