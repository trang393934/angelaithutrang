import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, UserPlus, UserCheck, UserX, MessageCircle, Loader2, Clock, Users, Award, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendship } from "@/hooks/useFriendship";
import { PostCard } from "@/components/community/PostCard";
import { useCommunityPosts, CommunityPost, CommunityComment } from "@/hooks/useCommunityPosts";
import angelAvatar from "@/assets/angel-avatar.png";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";

interface UserProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState({ posts: 0, friends: 0, coins: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const { friendshipStatus, isLoading: friendshipLoading, sendFriendRequest, acceptFriendRequest, cancelFriendRequest, unfriend } = useFriendship(userId);
  const { toggleLike, sharePost, addComment, fetchComments, editPost, deletePost } = useCommunityPosts();

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        // If no profile exists, create a placeholder with user_id
        if (profileData) {
          setProfile(profileData);
        } else {
          // Create placeholder profile for anonymous/unregistered users
          setProfile({
            user_id: userId,
            display_name: null,
            avatar_url: null,
            bio: null,
            created_at: new Date().toISOString(),
          });
        }

        // Fetch user's posts
        const { data: postsData } = await supabase
          .from("community_posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (postsData) {
          // Enrich posts with user info
          const enrichedPosts = postsData.map((post) => ({
            ...post,
            user_display_name: profileData?.display_name || "Người dùng",
            user_avatar_url: profileData?.avatar_url || null,
            is_liked_by_me: false,
            is_shared_by_me: false,
          }));
          setUserPosts(enrichedPosts);
        }

        // Fetch stats
        const { count: postsCount } = await supabase
          .from("community_posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        const { count: friendsCount } = await supabase
          .from("friendships")
          .select("*", { count: "exact", head: true })
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

        const { data: balanceData } = await supabase
          .from("camly_coin_balances")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        setStats({
          posts: postsCount || 0,
          friends: friendsCount || 0,
          coins: balanceData?.balance || 0,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Check if current user has liked/shared posts
  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!user || userPosts.length === 0) return;

      const postIds = userPosts.map((p) => p.id);

      const { data: likesData } = await supabase
        .from("community_post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      const { data: sharesData } = await supabase
        .from("community_shares")
        .select("post_id")
        .eq("sharer_id", user.id)
        .in("post_id", postIds);

      const likedPosts = new Set((likesData || []).map((l) => l.post_id));
      const sharedPosts = new Set((sharesData || []).map((s) => s.post_id));

      setUserPosts((prev) =>
        prev.map((p) => ({
          ...p,
          is_liked_by_me: likedPosts.has(p.id),
          is_shared_by_me: sharedPosts.has(p.id),
        }))
      );
    };

    checkUserInteractions();
  }, [user, userPosts.length]);

  const renderFriendButton = () => {
    if (isOwnProfile) {
      return (
        <Link to="/profile">
          <Button variant="outline">Chỉnh sửa trang cá nhân</Button>
        </Link>
      );
    }

    if (friendshipLoading) {
      return (
        <Button disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Đang tải...
        </Button>
      );
    }

    if (!friendshipStatus) {
      return (
        <Button onClick={() => sendFriendRequest(userId!)} className="bg-sapphire-gradient">
          <UserPlus className="w-4 h-4 mr-2" />
          Kết bạn
        </Button>
      );
    }

    if (friendshipStatus.status === "pending") {
      if (friendshipStatus.requester_id === user?.id) {
        return (
          <Button variant="outline" onClick={() => cancelFriendRequest(friendshipStatus.id)}>
            <Clock className="w-4 h-4 mr-2" />
            Đã gửi lời mời
          </Button>
        );
      } else {
        return (
          <div className="flex gap-2">
            <Button onClick={() => acceptFriendRequest(friendshipStatus.id)} className="bg-green-600 hover:bg-green-700">
              <UserCheck className="w-4 h-4 mr-2" />
              Chấp nhận
            </Button>
            <Button variant="outline" onClick={() => cancelFriendRequest(friendshipStatus.id)}>
              <UserX className="w-4 h-4 mr-2" />
              Từ chối
            </Button>
          </div>
        );
      }
    }

    if (friendshipStatus.status === "accepted") {
      return (
        <div className="flex gap-2">
          <Button variant="outline" className="text-green-600 border-green-600">
            <UserCheck className="w-4 h-4 mr-2" />
            Bạn bè
          </Button>
          <Link to={`/messages/${userId}`}>
            <Button className="bg-sapphire-gradient">
              <MessageCircle className="w-4 h-4 mr-2" />
              Nhắn tin
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <Button onClick={() => sendFriendRequest(userId!)} className="bg-sapphire-gradient">
        <UserPlus className="w-4 h-4 mr-2" />
        Kết bạn
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Profile will always exist now (either from DB or placeholder)
  // This fallback is for edge cases only
  if (!profile && !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background flex flex-col items-center justify-center">
        <p className="text-lg text-foreground-muted mb-4">Không tìm thấy người dùng</p>
        <Link to="/community">
          <Button>Quay lại cộng đồng</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-pure/90 backdrop-blur-lg border-b border-primary-pale shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/community" className="p-2 rounded-full hover:bg-primary-pale transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Link>
            <h1 className="font-serif text-xl font-semibold text-primary-deep">
              Trang cá nhân
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Profile Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-12">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || angelAvatar} alt={profile.display_name || "User"} />
                <AvatarFallback className="text-2xl">{profile.display_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {profile?.display_name || "Người dùng ẩn danh"}
                </h2>
                {profile?.bio && <p className="text-foreground-muted mt-1">{profile.bio}</p>}
                
                {/* Show User ID for admin management */}
                <p className="text-xs text-foreground-muted/60 mt-1 font-mono break-all">
                  ID: {userId}
                </p>
                
                <p className="text-sm text-foreground-muted mt-2">
                  Tham gia {profile?.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: vi }) : "gần đây"}
                </p>
              </div>

              <div className="w-full sm:w-auto">{renderFriendButton()}</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary/10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                  <FileText className="w-5 h-5" />
                  {stats.posts}
                </div>
                <p className="text-sm text-foreground-muted">Bài viết</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                  <Users className="w-5 h-5" />
                  {stats.friends}
                </div>
                <p className="text-sm text-foreground-muted">Bạn bè</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-600">
                  <Award className="w-5 h-5" />
                  {Math.floor(stats.coins).toLocaleString()}
                </div>
                <p className="text-sm text-foreground-muted">Camly Coin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <Tabs defaultValue="posts">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Bài viết</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {userPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <p className="text-foreground-muted">Chưa có bài viết nào</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard
                      post={post}
                      currentUserId={user?.id}
                      onLike={toggleLike}
                      onShare={sharePost}
                      onComment={addComment}
                      onEdit={isOwnProfile ? editPost : undefined}
                      onDelete={isOwnProfile ? deletePost : undefined}
                      fetchComments={fetchComments}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
