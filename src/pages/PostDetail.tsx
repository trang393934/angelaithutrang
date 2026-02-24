import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/community/PostCard";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SignupPromptDialog } from "@/components/SignupPromptDialog";
import angelAvatar from "@/assets/angel-avatar.png";

const PostDetail = () => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleLike, sharePost, addComment, fetchComments, editPost, deletePost } = useCommunityPosts();
  
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  useEffect(() => {
    if (!username || !slug) return;

    const fetchPost = async () => {
      setIsLoading(true);
      // Join community_posts with profiles by handle + slug
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("handle", username)
        .maybeSingle();

      if (!profileData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data: postData } = await supabase
        .from("community_posts")
        .select("*")
        .eq("user_id", profileData.user_id)
        .eq("slug", slug)
        .maybeSingle();

      if (!postData) {
        // Fallback: check slug_history for old slugs → redirect
        const { data: historyData } = await supabase
          .from("slug_history")
          .select("new_slug")
          .eq("user_id", profileData.user_id)
          .eq("content_type", "post")
          .eq("old_slug", slug)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (historyData?.new_slug) {
          navigate(`/${username}/post/${historyData.new_slug}`, { replace: true });
          return;
        }

        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // Fetch user profile for display
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, handle")
        .eq("user_id", postData.user_id)
        .maybeSingle();

      // Check if liked by current user
      let isLikedByMe = false;
      if (user) {
        const { data: like } = await supabase
          .from("community_post_likes")
          .select("id")
          .eq("post_id", postData.id)
          .eq("user_id", user.id)
          .maybeSingle();
        isLikedByMe = !!like;
      }

      setPost({
        ...postData,
        user_display_name: profile?.display_name || "Người dùng",
        user_avatar_url: profile?.avatar_url,
        user_handle: profile?.handle,
        is_liked_by_me: isLikedByMe,
      });
      setIsLoading(false);

      // Update meta tags for SEO
      document.title = `${profile?.display_name || username} - Bài viết | FUN Ecosystem`;
    };

    fetchPost();
  }, [username, slug, user]);

  const handleLike = async (postId: string) => {
    if (!user) { setShowSignupPrompt(true); return { success: false }; }
    const result = await toggleLike(postId);
    if (result.success) {
      setPost((prev: any) => prev ? {
        ...prev,
        likes_count: result.newLikesCount ?? prev.likes_count,
        is_liked_by_me: result.liked ?? !prev.is_liked_by_me,
      } : prev);
    }
    return result;
  };

  const handleShare = async (postId: string) => {
    if (!user) { setShowSignupPrompt(true); return { success: false }; }
    const result = await sharePost(postId);
    if (result.success) {
      setPost((prev: any) => prev ? { ...prev, shares_count: (prev.shares_count || 0) + 1 } : prev);
      toast.success(result.message);
    }
    return result;
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user) { setShowSignupPrompt(true); return { success: false }; }
    const result = await addComment(postId, content);
    if (result.success) {
      setPost((prev: any) => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev);
      toast.success(result.message);
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Không tìm thấy bài viết</h1>
          <p className="text-muted-foreground">Bài viết này không tồn tại hoặc đã bị xóa.</p>
          <Link to="/community">
            <Button><ArrowLeft className="w-4 h-4 mr-2" /> Về cộng đồng</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Link to={`/${username}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Về trang {post.user_display_name}
        </Link>

        <PostCard
          post={post}
          currentUserId={user?.id}
          onLike={handleLike}
          onShare={handleShare}
          onComment={handleComment}
          onEdit={user?.id === post.user_id ? (id, content) => editPost(id, content) : undefined}
          onDelete={user?.id === post.user_id ? (id) => deletePost(id) : undefined}
          fetchComments={fetchComments}
        />
      </main>
      <SignupPromptDialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt} />
    </div>
  );
};

export default PostDetail;
