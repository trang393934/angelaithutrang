import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, UserPlus, UserCheck, UserX, MessageCircle, Loader2, Clock, 
  Users, Award, FileText, ShieldAlert, Ban, AlertTriangle, Camera, 
  Pencil, MapPin, Calendar, MoreHorizontal, ThumbsUp, Share2, 
  ImageIcon, Smile, Globe, Briefcase, GraduationCap, Heart, Maximize2, Gift
} from "lucide-react";
import { ProfileImageLightbox } from "@/components/profile/ProfileImageLightbox";
import { Button } from "@/components/ui/button";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendship } from "@/hooks/useFriendship";
import { PostCard } from "@/components/community/PostCard";
import { useCommunityPosts, CommunityPost } from "@/hooks/useCommunityPosts";
import angelAvatar from "@/assets/angel-avatar.png";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface UserProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_photo_url: string | null;
  created_at: string;
}

interface FriendData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [stats, setStats] = useState({ posts: 0, friends: 0, coins: 0, likes: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
  // Lightbox state
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);
  const [coverLightboxOpen, setCoverLightboxOpen] = useState(false);
  
  // Suspension dialog state
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [healingMessage, setHealingMessage] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  
  // Gift dialog state
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);

  const { friendshipStatus, isLoading: friendshipLoading, sendFriendRequest, acceptFriendRequest, cancelFriendRequest, unfriend } = useFriendship(userId);
  const { toggleLike, sharePost, addComment, fetchComments, editPost, deletePost } = useCommunityPosts();

  const isOwnProfile = user?.id === userId;

  // Wrapper functions to update local userPosts state after interactions
  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return { success: false };
    }
    const result = await toggleLike(postId);
    if (result.success) {
      // Update local userPosts state
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked_by_me: !p.is_liked_by_me,
                likes_count: p.is_liked_by_me 
                  ? Math.max(0, (p.likes_count || 1) - 1) 
                  : (p.likes_count || 0) + 1,
              }
            : p
        )
      );
      if (result.postRewarded) {
        toast.success(result.message, { duration: 5000 });
      }
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
      // Update local userPosts state
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_shared_by_me: true,
                shares_count: (p.shares_count || 0) + 1,
              }
            : p
        )
      );
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
      // Update local userPosts state
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments_count: (p.comments_count || 0) + 1,
              }
            : p
        )
      );
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    return result;
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    const result = await editPost(postId, newContent);
    if (result.success) {
      setUserPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, content: newContent } : p
        )
      );
    }
    return result;
  };

  const handleDeletePost = async (postId: string) => {
    const result = await deletePost(postId);
    if (result.success) {
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    }
    return result;
  };

  // Check if current user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!data);
    };
    
    checkAdminRole();
  }, [user]);

  // Handle suspend user
  const handleSuspendUser = async () => {
    if (!userId || !suspendReason.trim()) {
      toast.error("Vui lòng nhập lý do đình chỉ");
      return;
    }

    setIsSuspending(true);
    try {
      const response = await supabase.functions.invoke("suspend-user", {
        body: {
          targetUserId: userId,
          suspensionType: "temporary",
          reason: suspendReason,
          durationDays: parseInt(suspendDuration),
          healingMessage: healingMessage || undefined,
        },
      });

      if (response.error) throw response.error;

      toast.success(`Đã đình chỉ người dùng ${suspendDuration} ngày`);
      setSuspendDialogOpen(false);
      setSuspendReason("");
      setHealingMessage("");
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Không thể đình chỉ người dùng");
    } finally {
      setIsSuspending(false);
    }
  };

  // Handle ban user (permanent)
  const handleBanUser = async () => {
    if (!userId || !suspendReason.trim()) {
      toast.error("Vui lòng nhập lý do cấm");
      return;
    }

    setIsSuspending(true);
    try {
      const response = await supabase.functions.invoke("suspend-user", {
        body: {
          targetUserId: userId,
          suspensionType: "permanent",
          reason: suspendReason,
          healingMessage: healingMessage || undefined,
        },
      });

      if (response.error) throw response.error;

      toast.success("Đã cấm người dùng vĩnh viễn");
      setBanDialogOpen(false);
      setSuspendReason("");
      setHealingMessage("");
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Không thể cấm người dùng");
    } finally {
      setIsSuspending(false);
    }
  };

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

        if (profileData) {
          setProfile(profileData);
        } else {
          setProfile({
            user_id: userId,
            display_name: null,
            avatar_url: null,
            bio: null,
            cover_photo_url: null,
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
          .select("lifetime_earned")
          .eq("user_id", userId)
          .maybeSingle();

        // Get total likes received
        const { data: likesData } = await supabase
          .from("community_posts")
          .select("likes_count")
          .eq("user_id", userId);
        
        const totalLikes = likesData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

        setStats({
          posts: postsCount || 0,
          friends: friendsCount || 0,
          coins: balanceData?.lifetime_earned || 0,
          likes: totalLikes,
        });

        // Fetch friends list (first 9 for display)
        const { data: friendshipsData } = await supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .limit(9);

        if (friendshipsData && friendshipsData.length > 0) {
          const friendIds = friendshipsData.map(f => 
            f.requester_id === userId ? f.addressee_id : f.requester_id
          );

          const { data: friendProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", friendIds);

          setFriends(friendProfiles || []);
        }

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

  // Render friendship action buttons (Facebook-style)
  const renderActionButtons = () => {
    if (isOwnProfile) {
      return (
        <div className="flex flex-wrap gap-2">
          <Link to="/profile">
            <Button className="bg-primary hover:bg-primary/90">
              <Pencil className="w-4 h-4 mr-2" />
              Chỉnh sửa trang cá nhân
            </Button>
          </Link>
        </div>
      );
    }

    if (friendshipLoading) {
      return (
        <Button disabled className="bg-muted">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        </Button>
      );
    }

    const buttons = [];

    // Friend button
    if (!friendshipStatus) {
      buttons.push(
        <Button key="add" onClick={() => sendFriendRequest(userId!)} className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm bạn bè
        </Button>
      );
    } else if (friendshipStatus.status === "pending") {
      if (friendshipStatus.requester_id === user?.id) {
        buttons.push(
          <Button key="pending" variant="secondary" onClick={() => cancelFriendRequest(friendshipStatus.id)}>
            <Clock className="w-4 h-4 mr-2" />
            Đã gửi lời mời
          </Button>
        );
      } else {
        buttons.push(
          <Button key="accept" onClick={() => acceptFriendRequest(friendshipStatus.id)} className="bg-primary hover:bg-primary/90">
            <UserCheck className="w-4 h-4 mr-2" />
            Xác nhận
          </Button>,
          <Button key="reject" variant="secondary" onClick={() => cancelFriendRequest(friendshipStatus.id)}>
            Xóa lời mời
          </Button>
        );
      }
    } else if (friendshipStatus.status === "accepted") {
      buttons.push(
        <Button key="friends" variant="secondary">
          <UserCheck className="w-4 h-4 mr-2" />
          Bạn bè
        </Button>
      );
    }

    // Message button
    buttons.push(
      <Link key="message" to={`/messages/${userId}`}>
        <Button variant="secondary">
          <MessageCircle className="w-4 h-4 mr-2" />
          {t("userProfile.message")}
        </Button>
      </Link>
    );

    // Gift button
    buttons.push(
      <Button 
        key="gift" 
        variant="secondary"
        onClick={() => setGiftDialogOpen(true)}
        className="bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 text-amber-700 border-amber-300"
      >
        <Gift className="w-4 h-4 mr-2" />
        {t("gift.title")}
      </Button>
    );

    return <div className="flex flex-wrap gap-2">{buttons}</div>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile && !userId) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center">
        <p className="text-lg text-foreground-muted mb-4">Không tìm thấy người dùng</p>
        <Link to="/community">
          <Button>Quay lại cộng đồng</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Cover Photo Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-[1100px] mx-auto">
          {/* Cover Image */}
          <div className="relative h-[200px] sm:h-[300px] md:h-[350px] rounded-b-lg overflow-hidden group">
            {profile?.cover_photo_url ? (
              <>
                <img 
                  src={profile.cover_photo_url} 
                  alt="Cover photo" 
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                  onClick={() => setCoverLightboxOpen(true)}
                />
                {/* Hover overlay for cover */}
                <div 
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                  onClick={() => setCoverLightboxOpen(true)}
                >
                  <div className="bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Xem ảnh bìa</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
              </>
            )}
            
            {/* Overlay for better text visibility on cover photo */}
            {profile?.cover_photo_url && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
            )}
            
            {/* Back button */}
            <button 
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 p-2 bg-black/30 hover:bg-black/40 rounded-full transition-colors z-10"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {isOwnProfile && (
              <Link 
                to="/profile"
                className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium transition-colors z-10"
              >
                <Camera className="w-4 h-4" />
                {profile?.cover_photo_url ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa'}
              </Link>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="px-4 pb-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-[85px] md:-mt-[40px]">
              {/* Avatar */}
              <div className="relative group">
                <div 
                  className="cursor-pointer"
                  onClick={() => profile?.avatar_url && setAvatarLightboxOpen(true)}
                >
                  <Avatar className="w-[168px] h-[168px] border-4 border-white shadow-xl ring-4 ring-white transition-transform duration-300 group-hover:scale-[1.02]">
                    <AvatarImage src={profile?.avatar_url || angelAvatar} alt={profile?.display_name || "User"} />
                    <AvatarFallback className="text-5xl bg-gradient-to-br from-primary to-primary/70 text-white">
                      {profile?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {/* Avatar hover overlay */}
                  {profile?.avatar_url && (
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <Link 
                    to="/profile"
                    className="absolute bottom-2 right-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors z-10"
                  >
                    <Camera className="w-5 h-5 text-gray-700" />
                  </Link>
                )}
              </div>

              {/* Name and Stats */}
              <div className="flex-1 md:pb-4">
                <h1 className="text-[32px] font-bold text-gray-900 leading-tight">
                  {profile?.display_name || "Người dùng ẩn danh"}
                </h1>
                <p className="text-[15px] text-gray-500 font-medium mt-1">
                  {stats.friends} bạn bè
                </p>
                
                {/* Friend avatars preview */}
                {friends.length > 0 && (
                  <div className="flex -space-x-2 mt-2">
                    {friends.slice(0, 8).map((friend, index) => (
                      <Link key={friend.user_id} to={`/user/${friend.user_id}`}>
                        <Avatar className="w-8 h-8 border-2 border-white hover:z-10 transition-transform hover:scale-110">
                          <AvatarImage src={friend.avatar_url || angelAvatar} />
                          <AvatarFallback className="text-xs">{friend.display_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="md:pb-4">
                {renderActionButtons()}
              </div>
            </div>

            {/* Admin ID display */}
            {isAdmin && (
              <p className="text-xs text-gray-400 mt-2 font-mono">
                User ID: {userId}
              </p>
            )}

            <Separator className="my-4" />

            {/* Navigation Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 -mb-[1px]">
              {[
                { id: "posts", label: "Bài viết" },
                { id: "about", label: "Giới thiệu" },
                { id: "friends", label: "Bạn bè" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-4 text-[15px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary border-b-[3px] border-primary bg-transparent rounded-b-none"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1100px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 lg:items-start">
          {/* Left Sidebar - Intro */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            {/* Intro Card */}
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-gray-900">Giới thiệu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.bio && (
                  <p className="text-[15px] text-gray-700 text-center">{profile.bio}</p>
                )}
                
                {!profile?.bio && isOwnProfile && (
                  <Link to="/profile">
                    <Button variant="secondary" className="w-full">
                      Thêm tiểu sử
                    </Button>
                  </Link>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-[15px] text-gray-700">
                    <Award className="w-5 h-5 text-gray-500" />
                    <span><strong>{Math.floor(stats.coins).toLocaleString()}</strong> Camly Coin</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px] text-gray-700">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span><strong>{stats.posts}</strong> bài viết</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px] text-gray-700">
                    <ThumbsUp className="w-5 h-5 text-gray-500" />
                    <span><strong>{stats.likes}</strong> lượt thích nhận được</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px] text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span>Tham gia {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy", { locale: vi }) : "gần đây"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px] text-gray-700">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <span>Angel AI Community</span>
                  </div>
                </div>

                {isOwnProfile && (
                  <Link to="/profile" className="block">
                    <Button variant="secondary" className="w-full mt-4">
                      Chỉnh sửa chi tiết
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Admin Actions Card */}
            {isAdmin && !isOwnProfile && (
              <Card className="rounded-lg shadow-sm border-destructive/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    Quản lý người dùng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-amber-600 border-amber-600 hover:bg-amber-50">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Suspend User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                          <ShieldAlert className="w-5 h-5" />
                          Đình chỉ tạm thời
                        </DialogTitle>
                        <DialogDescription>
                          Đình chỉ người dùng này trong một khoảng thời gian.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Thời gian đình chỉ</Label>
                          <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn thời gian" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 ngày</SelectItem>
                              <SelectItem value="3">3 ngày</SelectItem>
                              <SelectItem value="7">7 ngày</SelectItem>
                              <SelectItem value="14">14 ngày</SelectItem>
                              <SelectItem value="30">30 ngày</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Lý do đình chỉ *</Label>
                          <Textarea
                            placeholder="Nhập lý do đình chỉ..."
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Thông điệp chữa lành</Label>
                          <Textarea
                            placeholder="Thông điệp yêu thương..."
                            value={healingMessage}
                            onChange={(e) => setHealingMessage(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>Hủy</Button>
                        <Button 
                          onClick={handleSuspendUser} 
                          disabled={isSuspending || !suspendReason.trim()}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {isSuspending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Xác nhận
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/10">
                        <Ban className="w-4 h-4 mr-2" />
                        Ban vĩnh viễn
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-5 h-5" />
                          Cấm vĩnh viễn
                        </DialogTitle>
                        <DialogDescription className="text-destructive/80">
                          ⚠️ Hành động này không thể hoàn tác!
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <p className="text-sm text-destructive font-medium">
                            Cấm: {profile?.display_name || "Người dùng ẩn danh"}
                          </p>
                          <p className="text-xs text-destructive/70 font-mono mt-1">ID: {userId}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Lý do cấm *</Label>
                          <Textarea
                            placeholder="Nhập lý do cấm..."
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Thông điệp tạm biệt</Label>
                          <Textarea
                            placeholder="Thông điệp yêu thương..."
                            value={healingMessage}
                            onChange={(e) => setHealingMessage(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Hủy</Button>
                        <Button 
                          onClick={handleBanUser} 
                          disabled={isSuspending || !suspendReason.trim()}
                          variant="destructive"
                        >
                          {isSuspending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Cấm vĩnh viễn
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {/* Friends Preview Card */}
            <Card className="rounded-lg shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Bạn bè</CardTitle>
                    <p className="text-[13px] text-gray-500">{stats.friends} bạn bè</p>
                  </div>
                  {stats.friends > 9 && (
                    <button 
                      onClick={() => setActiveTab("friends")}
                      className="text-primary hover:underline text-[15px]"
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Chưa có bạn bè</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {friends.slice(0, 9).map((friend) => (
                      <Link 
                        key={friend.user_id} 
                        to={`/user/${friend.user_id}`}
                        className="group"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={friend.avatar_url || angelAvatar} 
                            alt={friend.display_name || "User"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-[13px] font-medium text-gray-900 mt-1 truncate group-hover:underline">
                          {friend.display_name || "Người dùng"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Posts */}
          <div className="space-y-4">
            {activeTab === "posts" && (
              <>
                {userPosts.length === 0 ? (
                  <Card className="rounded-lg shadow-sm p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Chưa có bài viết nào</p>
                    {isOwnProfile && (
                      <Link to="/community" className="mt-4 inline-block">
                        <Button className="mt-4">Đăng bài viết đầu tiên</Button>
                      </Link>
                    )}
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
                          onLike={handleLike}
                          onShare={handleShare}
                          onComment={handleComment}
                          onEdit={isOwnProfile ? handleEditPost : undefined}
                          onDelete={isOwnProfile ? handleDeletePost : undefined}
                          fetchComments={fetchComments}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "about" && (
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Giới thiệu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile?.bio && (
                    <div className="space-y-2">
                      <h3 className="text-[17px] font-semibold text-gray-900">Tiểu sử</h3>
                      <p className="text-[15px] text-gray-700">{profile.bio}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <h3 className="text-[17px] font-semibold text-gray-900">Thông tin cơ bản</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[15px] text-gray-700">
                        <Award className="w-5 h-5 text-gray-500" />
                        <span><strong>{Math.floor(stats.coins).toLocaleString()}</strong> Camly Coin</span>
                      </div>
                      <div className="flex items-center gap-3 text-[15px] text-gray-700">
                        <Users className="w-5 h-5 text-gray-500" />
                        <span><strong>{stats.friends}</strong> bạn bè</span>
                      </div>
                      <div className="flex items-center gap-3 text-[15px] text-gray-700">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span><strong>{stats.posts}</strong> bài viết</span>
                      </div>
                      <div className="flex items-center gap-3 text-[15px] text-gray-700">
                        <ThumbsUp className="w-5 h-5 text-gray-500" />
                        <span><strong>{stats.likes}</strong> lượt thích nhận được</span>
                      </div>
                      <div className="flex items-center gap-3 text-[15px] text-gray-700">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span>
                          Tham gia {profile?.created_at 
                            ? format(new Date(profile.created_at), "dd MMMM yyyy", { locale: vi }) 
                            : "gần đây"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "friends" && (
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Bạn bè</CardTitle>
                  <p className="text-[15px] text-gray-500">{stats.friends} bạn bè</p>
                </CardHeader>
                <CardContent>
                  {friends.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Chưa có bạn bè</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {friends.map((friend) => (
                        <Link 
                          key={friend.user_id} 
                          to={`/user/${friend.user_id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={friend.avatar_url || angelAvatar} />
                            <AvatarFallback>{friend.display_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {friend.display_name || "Người dùng"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {/* Avatar Lightbox */}
      {profile?.avatar_url && (
        <ProfileImageLightbox
          imageUrl={profile.avatar_url}
          alt={profile?.display_name || "Avatar"}
          isOpen={avatarLightboxOpen}
          onClose={() => setAvatarLightboxOpen(false)}
          type="avatar"
        />
      )}

      {/* Cover Lightbox */}
      {profile?.cover_photo_url && (
        <ProfileImageLightbox
          imageUrl={profile.cover_photo_url}
          alt="Cover photo"
          isOpen={coverLightboxOpen}
          onClose={() => setCoverLightboxOpen(false)}
          type="cover"
        />
      )}

      {/* Gift Coin Dialog */}
      {userId && profile && (
        <GiftCoinDialog
          open={giftDialogOpen}
          onOpenChange={setGiftDialogOpen}
          preselectedUser={{
            id: userId,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }}
        />
      )}
    </div>
  );
};

export default UserProfile;
