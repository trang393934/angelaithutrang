import { useState, useEffect, useRef } from "react";

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
import { AuthActionGuard } from "@/components/AuthActionGuard";
import { BackToTopButton } from "@/components/BackToTopButton";
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
  const mainRef = useRef<HTMLElement>(null);
  const rightSidebarRef = useRef<HTMLElement | null>(null);
  const communityHeaderRef = useRef<HTMLDivElement>(null);

  // Measure community header height dynamically (stories load async)
  useEffect(() => {
    const el = communityHeaderRef.current;
    if (!el) return;

    const updateHeight = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--community-header-h', `${h}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

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
      <div className="h-screen flex flex-col bg-gradient-to-b from-primary-pale via-background to-background relative">
        {/* Tết Background Video - Positioned below community header (toolbar + stories) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed top-0 left-0 right-0 bottom-0 w-full h-full object-cover z-[1] pointer-events-none"
          style={{ opacity: 0.9, clipPath: 'inset(var(--community-header-h, 0px) 0 0 0)' }}
          id="community-bg-video"
        >
          <source src="/videos/tet-background.mp4" type="video/mp4" />
        </video>
        {/* Header - fixed height, above video */}
        <div className="relative z-10" ref={communityHeaderRef}>
          <CommunityHeader />
        </div>

        {/* Content area - fills remaining height, above video */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          <div className="container mx-auto flex gap-2 sm:gap-4 lg:gap-6 px-2 sm:px-3 lg:px-4 py-3 sm:py-4 h-full">
            {/* Left Sidebar - scrollable with visible scrollbar */}
            <aside className="hidden xl:flex flex-col w-[280px] flex-shrink-0 h-full min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 pr-1">
              <FunEcosystemSidebar className="w-full" />
            </aside>

            {/* Main Content - SCROLLABLE */}
            <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden space-y-3 sm:space-y-4 lg:space-y-6 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
              {/* Create Post */}
              <AuthActionGuard message={t("community.loginToJoin")}>
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
                    <Button className="bg-sapphire-gradient">{t("auth.login")}</Button>
                  </div>
                )}
              </AuthActionGuard>

              {/* Gift & Donate Action Buttons */}
              <AuthActionGuard message="Bạn cần đăng nhập để tặng quà">
                <div className="flex gap-2 sm:gap-3 items-center">
                  <motion.div 
                    className="flex-[2] min-w-0"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => user && setShowGiftDialog(true)}
                      className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-white font-semibold px-2 sm:px-4 text-xs sm:text-sm relative overflow-hidden"
                      style={{
                        boxShadow: '0 0 12px 2px hsla(43, 96%, 56%, 0.4), 0 4px 15px -3px hsla(43, 96%, 56%, 0.3), inset 0 1px 0 hsla(0, 0%, 100%, 0.3)',
                      }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/25 pointer-events-none rounded-md" />
                      <Gift className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0 relative z-10" />
                      <span className="truncate relative z-10">{t("gift.title")}</span>
                    </Button>
                  </motion.div>
                  <motion.div 
                    className="flex-1 min-w-0"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => user && setShowDonateDialog(true)}
                      className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-white font-semibold shadow-lg px-2 sm:px-4 text-xs sm:text-sm"
                    >
                      <Heart className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">{t("donate.title")}</span>
                    </Button>
                  </motion.div>
                </div>
              </AuthActionGuard>

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
        {/* Back to Top Button */}
        <BackToTopButton scrollRef={mainRef} />

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
  );
};

export default Community;
