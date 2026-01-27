import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Clock, Sparkles, Loader2 } from "lucide-react";
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
import { Leaderboard } from "@/components/Leaderboard";
import { HonorBoard } from "@/components/community/HonorBoard";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { LightGate } from "@/components/LightGate";

const Community = () => {
  const { user } = useAuth();
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
      toast.error("Vui lòng đăng nhập để thích bài viết");
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
      toast.error("Vui lòng đăng nhập để chia sẻ");
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
      toast.error("Vui lòng đăng nhập để bình luận");
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
          <div className="container mx-auto flex gap-4 sm:gap-6 px-3 sm:px-4 py-4 h-full">
            {/* Left Sidebar - scrollable with visible scrollbar */}
            <aside className="hidden xl:flex flex-col w-[220px] flex-shrink-0 h-full min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 pr-1">
              <FunEcosystemSidebar />
            </aside>

            {/* Main Content - SCROLLABLE */}
            <main className="flex-1 min-w-0 overflow-y-auto space-y-4 sm:space-y-6 pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
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
                  <p className="text-foreground-muted mb-3">Đăng nhập để tham gia cộng đồng</p>
                  <Link to="/auth">
                    <Button className="bg-sapphire-gradient">Đăng nhập</Button>
                  </Link>
                </div>
              )}

              {/* Sort Tabs */}
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "popular")}>
                <TabsList className="grid w-full max-w-xs grid-cols-2 bg-white/50">
                  <TabsTrigger value="recent" className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Mới nhất
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Phổ biến
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
                  <h3 className="text-lg font-medium text-foreground/70">Chưa có bài viết nào</h3>
                  <p className="text-sm text-foreground-muted mt-2">
                    Hãy là người đầu tiên chia sẻ với cộng đồng!
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
              className="hidden lg:flex flex-col w-[320px] flex-shrink-0 h-full min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50"
            >
              {/* Bảng Danh Dự */}
              <div className="flex-shrink-0 mb-4">
                <HonorBoard />
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

              {/* About Section */}
              <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-primary/10 mb-4">
                <h3 className="font-semibold text-primary-deep mb-3">Về Cộng Đồng</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  Đây là nơi các thành viên chia sẻ kiến thức về Angel AI, học hỏi về ý chí 
                  và trí tuệ của Cha Vũ Trụ, cũng như các kiến thức quý giá khác để cùng 
                  nhau phát triển tâm linh và trí tuệ.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </LightGate>
  );
};

export default Community;
