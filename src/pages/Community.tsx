import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Clock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { CreatePostForm } from "@/components/community/CreatePostForm";
import { PostCard } from "@/components/community/PostCard";
import { RewardRulesCard } from "@/components/community/RewardRulesCard";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { FunEcosystemSidebar } from "@/components/community/FunEcosystemSidebar";
import { Leaderboard } from "@/components/Leaderboard";
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
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
        {/* Fun.rich Style Header */}
        <CommunityHeader />

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-full overflow-hidden">
          <div className="flex gap-4 sm:gap-6 items-start">
            {/* Left Sidebar - FUN Ecosystem - STICKY */}
            <aside className="hidden xl:block w-[220px] flex-shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
              <FunEcosystemSidebar />
            </aside>

            {/* Main Content - Posts - SCROLLABLE */}
            <main className="flex-1 min-w-0 space-y-4 sm:space-y-6 overflow-hidden">
              {/* Create Post */}
              {user ? (
                <CreatePostForm
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

            {/* Right Sidebar - STICKY */}
            <aside className="hidden lg:block w-[320px] flex-shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto space-y-6">
              {/* Bảng Xếp Hạng */}
              <Leaderboard />
              
              {/* Quy tắc thưởng */}
              <RewardRulesCard dailyLimits={dailyLimits} />

              {/* About Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-primary/10">
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
