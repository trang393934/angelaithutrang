import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, UserPlus, UserCheck, MessageCircle, Loader2, Clock, 
  FileText, ShieldAlert, Ban, AlertTriangle, Camera, 
  Pencil, Calendar, MoreHorizontal, ThumbsUp,
  Globe, Heart, Maximize2, Gift,
  Star, History, Settings, Lock, CheckCircle, Coins, Copy, Check, Diamond
} from "lucide-react";
import { useUserCamlyCoin } from "@/hooks/useUserCamlyCoin";
import { usePoPLScore } from "@/hooks/usePoPLScore";
import { useFUNMoneyStats } from "@/hooks/useFUNMoneyStats";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import funProfileLogo from "@/assets/fun-profile-logo.png";
import funPlayLogo from "@/assets/fun-play-logo.png";
import { ProfileImageLightbox } from "@/components/profile/ProfileImageLightbox";
import { Button } from "@/components/ui/button";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriendship } from "@/hooks/useFriendship";
import { PostCard } from "@/components/community/PostCard";
import { useCommunityPosts, CommunityPost } from "@/hooks/useCommunityPosts";
import angelAvatar from "@/assets/angel-avatar.png";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { SignupPromptDialog } from "@/components/SignupPromptDialog";
import { WalletAddressDisplay } from "@/components/profile/WalletAddressDisplay";
import { SocialLinksDisplay } from "@/components/public-profile/SocialLinksDisplay";
import { ProfileMoreMenu } from "@/components/public-profile/ProfileMoreMenu";
import { Facebook, Youtube, MessageCircle as TelegramIcon } from "lucide-react";

// ─── Platform Meta (for orbital) ─────────────────────────────────────────────
const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode; bg: string; color: string }> = {
  fun_profile: {
    label: "Fun Profile",
    icon: <img src={funProfileLogo} className="w-4 h-4 object-contain" alt="Fun Profile" />,
    bg: "#1a2e1a",
    color: "#ffd700",
  },
  fun_play: {
    label: "Fun Play",
    icon: <img src={funPlayLogo} className="w-4 h-4 object-contain" alt="Fun Play" />,
    bg: "#0a1a3a",
    color: "#ffd700",
  },
  facebook: {
    label: "Facebook",
    icon: <Facebook className="w-4 h-4" />,
    bg: "#1877F2",
    color: "#fff",
  },
  youtube: {
    label: "YouTube",
    icon: <Youtube className="w-4 h-4" />,
    bg: "#FF0000",
    color: "#fff",
  },
  twitter: {
    label: "X (Twitter)",
    icon: <span className="text-xs font-black leading-none">𝕏</span>,
    bg: "#14171A",
    color: "#fff",
  },
  telegram: {
    label: "Telegram",
    icon: <TelegramIcon className="w-4 h-4" />,
    bg: "#26A5E4",
    color: "#fff",
  },
  tiktok: {
    label: "TikTok",
    icon: <span className="text-xs font-black leading-none">TK</span>,
    bg: "#010101",
    color: "#fff",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <span className="text-xs font-black leading-none">in</span>,
    bg: "#0A66C2",
    color: "#fff",
  },
  zalo: {
    label: "Zalo",
    icon: <span className="text-xs font-black leading-none">Z</span>,
    bg: "#0068FF",
    color: "#fff",
  },
};

// ─── Orbital Icon ─────────────────────────────────────────────────────────────
function OrbitalIcon({
  platform, url, meta, x, y, durationSecs,
}: {
  platform: string; url: string;
  meta: { label: string; icon: React.ReactNode; bg: string; color: string };
  x: number; y: number; durationSecs: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href={url} target="_blank" rel="noopener noreferrer"
            className="absolute flex items-center justify-center rounded-full pointer-events-auto cursor-pointer"
            style={{
              left: x, top: y, width: 36, height: 36,
              background: meta.bg, color: meta.color,
              boxShadow: hovered ? "0 0 16px rgba(251,191,36,0.7), 0 2px 10px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.35)",
              outline: hovered ? "2px solid #fbbf24" : "1.5px solid rgba(251,191,36,0.45)",
              outlineOffset: 1, zIndex: 20,
            }}
            animate={{ rotate: hovered ? 0 : -360 }}
            transition={{ duration: hovered ? 0.2 : durationSecs, repeat: hovered ? 0 : Infinity, ease: "linear" }}
            whileHover={{ scale: 1.25 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
          >
            {meta.icon}
          </motion.a>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-semibold bg-background border border-amber-400/40 text-foreground">
          {meta.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Orbital Social Links ─────────────────────────────────────────────────────
function OrbitalSocialLinks({ socialLinks, orbitRadius = 90, durationSecs = 22 }: {
  socialLinks: Record<string, string>; orbitRadius?: number; durationSecs?: number;
}) {
  const activeLinks = Object.entries(socialLinks).filter(([, url]) => url?.trim());
  if (activeLinks.length === 0) return null;
  const count = activeLinks.length;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
      <div className="absolute rounded-full border border-amber-400/20" style={{ width: orbitRadius * 2, height: orbitRadius * 2 }} />
      <motion.div
        className="absolute"
        style={{ width: orbitRadius * 2, height: orbitRadius * 2, top: "50%", left: "50%", marginTop: -orbitRadius, marginLeft: -orbitRadius }}
        animate={{ rotate: 360 }}
        transition={{ duration: durationSecs, repeat: Infinity, ease: "linear" }}
      >
        {activeLinks.map(([platform, url], i) => {
          const angle = (360 / count) * i;
          const rad = (angle * Math.PI) / 180;
          const x = orbitRadius + orbitRadius * Math.cos(rad) - 18;
          const y = orbitRadius + orbitRadius * Math.sin(rad) - 18;
          const meta = PLATFORM_META[platform];
          if (!meta) return null;
          return <OrbitalIcon key={platform} platform={platform} url={url} meta={meta} x={x} y={y} durationSecs={durationSecs} />;
        })}
      </motion.div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_photo_url: string | null;
  handle: string | null;
  created_at: string;
  social_links: Record<string, string> | null;
}

interface FriendData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

// ─── Diamond Badge icon ───────────────────────────────────────────────────────
function DiamondBadge({ badgeLevel }: { badgeLevel: string }) {
  const icon = badgeLevel === "angel" ? "💎"
    : badgeLevel === "lightworker" ? "✨"
    : badgeLevel === "guardian" ? "🛡️"
    : badgeLevel === "contributor" ? "🌟"
    : "⭐";

  return (
    <div
      className="absolute -top-1 -right-1 z-30 w-8 h-8 rounded-full flex items-center justify-center text-sm"
      style={{
        background: "linear-gradient(135deg, #0a1628, #0d2137)",
        border: "2px solid #22d3ee",
        boxShadow: "0 0 12px rgba(34,211,238,0.6), 0 0 24px rgba(34,211,238,0.2)",
      }}
    >
      {icon}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { balance, lifetimeEarned, lixiReward } = useUserCamlyCoin(userId);
  const naturalLifetimeEarned = lifetimeEarned - lixiReward;
  const { score: poplScore, badgeLevel, positiveActions } = usePoPLScore(userId);
  const funMoneyStats = useFUNMoneyStats(userId);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [stats, setStats] = useState({ posts: 0, friends: 0, coins: 0, likes: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [copied, setCopied] = useState(false);

  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);
  const [coverLightboxOpen, setCoverLightboxOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [healingMessage, setHealingMessage] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const { friendshipStatus, isLoading: friendshipLoading, sendFriendRequest, acceptFriendRequest, cancelFriendRequest } = useFriendship(userId);
  const { toggleLike, sharePost, addComment, fetchComments, editPost, deletePost } = useCommunityPosts();

  const isOwnProfile = user?.id === userId;

  // Active social links for orbital
  const activeSocialLinks = profile?.social_links
    ? Object.fromEntries(Object.entries(profile.social_links).filter(([, v]) => v?.trim()))
    : {};

  // Orbit config
  const orbitRadius = 80;
  const wrapperSize = (orbitRadius + 36) * 2;

  // Copy handle link
  const profileUrl = profile?.handle
    ? `${window.location.origin}/@${profile.handle}`
    : `${window.location.origin}/user/${userId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  // ── Post interaction handlers ─────────────────────────────────────────────
  const handleLike = async (postId: string) => {
    if (!user) { setShowSignupPrompt(true); return { success: false }; }
    const currentPost = userPosts.find(p => p.id === postId);
    if (!currentPost) return { success: false };
    const wasLiked = currentPost.is_liked_by_me;
    setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked_by_me: !wasLiked, likes_count: wasLiked ? Math.max(0, (p.likes_count || 1) - 1) : (p.likes_count || 0) + 1 } : p));
    const result = await toggleLike(postId);
    if (result.success) {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: result.newLikesCount ?? p.likes_count, is_liked_by_me: result.liked ?? !wasLiked, is_rewarded: result.postRewarded || p.is_rewarded } : p));
      if (result.postRewarded) toast.success(result.message, { duration: 5000 });
    } else {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked_by_me: wasLiked, likes_count: currentPost.likes_count } : p));
    }
    return result;
  };

  const handleShare = async (postId: string) => {
    if (!user) { setShowSignupPrompt(true); return { success: false }; }
    const result = await sharePost(postId);
    if (result.success) {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, is_shared_by_me: true, shares_count: (p.shares_count || 0) + 1 } : p));
      toast.success(result.message);
    } else { toast.error(result.message); }
    return result;
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user) { setShowSignupPrompt(true); return { success: false }; }
    const result = await addComment(postId, content);
    if (result.success) {
      setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      toast.success(result.message);
    } else { toast.error(result.message); }
    return result;
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    const result = await editPost(postId, newContent);
    if (result.success) setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newContent } : p));
    return result;
  };

  const handleDeletePost = async (postId: string) => {
    const result = await deletePost(postId);
    if (result.success) setUserPosts(prev => prev.filter(p => p.id !== postId));
    return result;
  };

  // ── Admin check ───────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, [user]);

  // ── Suspend / Ban ─────────────────────────────────────────────────────────
  const handleSuspendUser = async () => {
    if (!userId || !suspendReason.trim()) { toast.error("Vui lòng nhập lý do đình chỉ"); return; }
    setIsSuspending(true);
    try {
      const response = await supabase.functions.invoke("suspend-user", { body: { targetUserId: userId, suspensionType: "temporary", reason: suspendReason, durationDays: parseInt(suspendDuration), healingMessage: healingMessage || undefined } });
      if (response.error) throw response.error;
      toast.success(`Đã đình chỉ người dùng ${suspendDuration} ngày`);
      setSuspendDialogOpen(false); setSuspendReason(""); setHealingMessage("");
    } catch { toast.error("Không thể đình chỉ người dùng"); } finally { setIsSuspending(false); }
  };

  const handleBanUser = async () => {
    if (!userId || !suspendReason.trim()) { toast.error("Vui lòng nhập lý do cấm"); return; }
    setIsSuspending(true);
    try {
      const response = await supabase.functions.invoke("suspend-user", { body: { targetUserId: userId, suspensionType: "permanent", reason: suspendReason, healingMessage: healingMessage || undefined } });
      if (response.error) throw response.error;
      toast.success("Đã cấm người dùng vĩnh viễn");
      setBanDialogOpen(false); setSuspendReason(""); setHealingMessage("");
    } catch { toast.error("Không thể cấm người dùng"); } finally { setIsSuspending(false); }
  };

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
        if (profileData) {
          setProfile({ ...profileData, social_links: (profileData.social_links && typeof profileData.social_links === "object" && !Array.isArray(profileData.social_links)) ? profileData.social_links as Record<string, string> : null });
        } else {
          setProfile({ user_id: userId, display_name: null, avatar_url: null, bio: null, cover_photo_url: null, handle: null, created_at: new Date().toISOString(), social_links: null });
        }

        const { data: postsData } = await supabase.from("community_posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
        if (postsData) {
          setUserPosts(postsData.map(post => ({ ...post, user_display_name: profileData?.display_name || "Người dùng", user_avatar_url: profileData?.avatar_url || null, is_liked_by_me: false, is_shared_by_me: false })));
        }

        const { count: postsCount } = await supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("user_id", userId);
        const { count: friendsCount } = await supabase.from("friendships").select("*", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
        const { data: likesData } = await supabase.from("community_posts").select("likes_count").eq("user_id", userId);
        const totalLikes = likesData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
        const { data: balanceData } = await supabase.from("camly_coin_balances").select("lifetime_earned").eq("user_id", userId).maybeSingle();

        setStats({ posts: postsCount || 0, friends: friendsCount || 0, coins: balanceData?.lifetime_earned || 0, likes: totalLikes });

        const { data: friendshipsData } = await supabase.from("friendships").select("requester_id, addressee_id").eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).limit(9);
        if (friendshipsData && friendshipsData.length > 0) {
          const friendIds = friendshipsData.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
          const { data: friendProfiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", friendIds);
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

  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!user || userPosts.length === 0) return;
      const postIds = userPosts.map(p => p.id);
      const { data: likesData } = await supabase.from("community_post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds);
      const { data: sharesData } = await supabase.from("community_shares").select("post_id").eq("sharer_id", user.id).in("post_id", postIds);
      const likedPosts = new Set((likesData || []).map(l => l.post_id));
      const sharedPosts = new Set((sharesData || []).map(s => s.post_id));
      setUserPosts(prev => prev.map(p => ({ ...p, is_liked_by_me: likedPosts.has(p.id), is_shared_by_me: sharedPosts.has(p.id) })));
    };
    checkUserInteractions();
  }, [user, userPosts.length]);

  // ── Action buttons ────────────────────────────────────────────────────────
  const renderActionButtons = () => {
    if (isOwnProfile) {
      return (
        <Link to="/profile">
          <Button size="sm" style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700)" }} className="text-black font-bold">
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Chỉnh sửa
          </Button>
        </Link>
      );
    }
    if (friendshipLoading) return <Button disabled size="sm" variant="outline"><Loader2 className="w-4 h-4 animate-spin" /></Button>;

    const buttons: React.ReactNode[] = [];
    if (!friendshipStatus) {
      buttons.push(<Button key="add" size="sm" onClick={() => sendFriendRequest(userId!)} style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700)" }} className="text-black font-bold"><UserPlus className="w-3.5 h-3.5 mr-1.5" />Thêm bạn</Button>);
    } else if (friendshipStatus.status === "pending") {
      if (friendshipStatus.requester_id === user?.id) {
        buttons.push(<Button key="pending" size="sm" variant="outline" className="border-amber-600/50 text-amber-400" onClick={() => cancelFriendRequest(friendshipStatus.id)}><Clock className="w-3.5 h-3.5 mr-1.5" />Đã gửi</Button>);
      } else {
        buttons.push(<Button key="accept" size="sm" onClick={() => acceptFriendRequest(friendshipStatus.id)} style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700)" }} className="text-black font-bold"><UserCheck className="w-3.5 h-3.5 mr-1.5" />Xác nhận</Button>);
      }
    } else if (friendshipStatus.status === "accepted") {
      buttons.push(<Button key="friends" size="sm" variant="outline" className="border-amber-600/50 text-amber-400"><UserCheck className="w-3.5 h-3.5 mr-1.5" />Bạn bè</Button>);
    }
    buttons.push(
      <Link key="msg" to={`/messages/${userId}`}><Button size="sm" variant="outline" className="border-amber-600/50 text-amber-300"><MessageCircle className="w-3.5 h-3.5 mr-1.5" />Nhắn tin</Button></Link>,
      <Button key="gift" size="sm" variant="outline" className="border-amber-600/50 text-amber-300" onClick={() => setGiftDialogOpen(true)}><Gift className="w-3.5 h-3.5 mr-1.5" />Tặng</Button>
    );
    return <div className="flex flex-wrap gap-2">{buttons}</div>;
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!profile && !userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "linear-gradient(180deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)" }}>
        <p className="text-lg text-muted-foreground mb-4">Không tìm thấy người dùng</p>
        <Link to="/community"><Button>Quay lại cộng đồng</Button></Link>
      </div>
    );
  }

  // ── Stat items for Bảng Danh Dự ──────────────────────────────────────────
  const honorStats = [
    { icon: "📝", label: "Bài viết", value: stats.posts.toLocaleString() },
    { icon: "👥", label: "Bạn bè", value: stats.friends.toLocaleString() },
    { icon: "❤️", label: "Cảm xúc", value: stats.likes.toLocaleString() },
    { icon: "🎁", label: "Có thể rút", value: Math.floor(balance).toLocaleString() },
    { icon: "⭐", label: "PoPL", value: `${poplScore}/100` },
    { icon: "🧧", label: "Lì xì Tết", value: lixiReward > 0 ? Math.floor(lixiReward).toLocaleString() : "—" },
    { icon: "💰", label: "Tổng thu", value: Math.floor(naturalLifetimeEarned).toLocaleString() },
    { icon: "💎", label: "FUN Money", value: funMoneyStats.totalAmount > 0 ? funMoneyStats.totalAmount.toLocaleString() : "—" },
  ];

  const tabs = [
    { id: "posts", label: "Bài viết" },
    { id: "about", label: "Giới thiệu" },
    { id: "friends", label: "Bạn bè" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)" }}>

      {/* ── Cover Photo ─────────────────────────────────────────────────── */}
      <div className="relative h-[200px] sm:h-[260px] overflow-hidden">
        {profile?.cover_photo_url ? (
          <>
            <img
              src={profile.cover_photo_url}
              alt="Cover"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setCoverLightboxOpen(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060d1a] via-black/20 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-950/30 via-[#0a1628] to-amber-900/20">
            <div className="absolute inset-0 bg-gradient-to-t from-[#060d1a] to-transparent pointer-events-none" />
          </div>
        )}

        {/* Back */}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Edit cover — own profile */}
        {isOwnProfile && (
          <Link to="/profile" className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-sm font-medium text-white transition-colors">
            <Camera className="w-4 h-4" />
            {profile?.cover_photo_url ? "Đổi ảnh bìa" : "Thêm ảnh bìa"}
          </Link>
        )}
      </div>

      {/* ── Profile Header Card ──────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-4">
        <div
          className="rounded-2xl p-4 sm:p-6 -mt-6 relative z-10"
          style={{ background: "rgba(13,33,55,0.92)", border: "1px solid rgba(180,144,30,0.25)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        >
          {/* ── Two-column layout: [Avatar+Orbital] + [Info] ── */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">

            {/* Left: Avatar + Orbital + Diamond */}
            <div
              className="relative flex-shrink-0 flex items-center justify-center self-center sm:self-start"
              style={{ width: wrapperSize, height: wrapperSize, marginTop: -wrapperSize / 2 - 16 }}
            >
              {/* Glow ring */}
              <div className="absolute rounded-full" style={{ width: orbitRadius * 2 + 8, height: orbitRadius * 2 + 8, background: "radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)", boxShadow: "0 0 40px rgba(251,191,36,0.18)" }} />

              {/* Orbital social links */}
              <OrbitalSocialLinks socialLinks={activeSocialLinks} orbitRadius={orbitRadius} durationSecs={22} />

              {/* Avatar */}
              <div className="relative z-20">
                <div
                  className="rounded-full p-[3px] cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700, #ffec8b, #daa520, #b8860b)", boxShadow: "0 0 30px rgba(251,191,36,0.4), 0 0 60px rgba(251,191,36,0.15)" }}
                  onClick={() => profile?.avatar_url && setAvatarLightboxOpen(true)}
                >
                  <Avatar className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] border-[3px] border-[#0a1628]">
                    <AvatarImage src={profile?.avatar_url || angelAvatar} alt={profile?.display_name || "User"} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-amber-900 to-amber-700 text-amber-100">
                      {profile?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Diamond / Badge icon */}
                <DiamondBadge badgeLevel={badgeLevel} />

                {/* Edit avatar */}
                {isOwnProfile && (
                  <Link to="/profile" className="absolute bottom-1 right-1 z-40 p-1.5 bg-[#0a1628] hover:bg-[#0d2137] rounded-full border border-amber-600/40 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 min-w-0 pt-1 sm:pt-2">
              {/* Name + badge level chip */}
              <div className="flex items-start flex-wrap gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
                  {profile?.display_name || "Người dùng ẩn danh"}
                </h1>
                <span className="self-center inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/40 border border-amber-600/40 text-amber-300">
                  {badgeLevel === "angel" ? "👼 Angel"
                    : badgeLevel === "lightworker" ? "✨ Lightworker"
                    : badgeLevel === "guardian" ? "🛡️ Guardian"
                    : badgeLevel === "contributor" ? "🌟 Contributor"
                    : "🌱 Newcomer"}
                </span>
              </div>

              {/* Handle + copy */}
              {profile?.handle && (
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-sm font-semibold text-amber-400">@{profile.handle}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">· angel.fun.rich/{profile.handle}</span>
                  <button onClick={handleCopyLink} className="p-1 rounded hover:bg-amber-400/10 text-muted-foreground hover:text-amber-400 transition-colors">
                    {copied ? <Check className="w-3 h-3 text-amber-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* Wallet */}
              {userId && <WalletAddressDisplay userId={userId} className="mt-1" />}

              {/* Location + ecosystem */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> FUN Ecosystem</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Tham gia {profile?.created_at ? format(new Date(profile.created_at), "MM/yyyy", { locale: vi }) : "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  {positiveActions} hành động tốt
                </span>
              </div>

              {/* Friends avatars */}
              {friends.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2">
                    {friends.slice(0, 6).map(friend => (
                      <Link key={friend.user_id} to={`/user/${friend.user_id}`}>
                        <Avatar className="w-7 h-7 border-2 border-[#0a1628] hover:z-10 transition-transform hover:scale-110">
                          <AvatarImage src={friend.avatar_url || angelAvatar} className="object-cover" />
                          <AvatarFallback className="text-xs">{friend.display_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{stats.friends} bạn bè</span>
                </div>
              )}

              {/* Bio */}
              {profile?.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md">{profile.bio}</p>
              )}

              {/* Action buttons */}
              <div className="mt-3">
                {renderActionButtons()}
              </div>
            </div>

            {/* Bảng Danh Dự — top right on large screens */}
            <div
              className="w-full sm:w-auto sm:min-w-[220px] rounded-xl p-3 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0d3320, #1a4a2e)", border: "1px solid rgba(180,144,30,0.4)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <img src={funProfileLogo} className="w-5 h-5 object-contain" alt="" />
                <span className="text-xs font-extrabold tracking-widest text-amber-300 uppercase">Bảng Danh Dự</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {honorStats.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "rgba(10,46,24,0.8)", border: "1px solid rgba(180,144,30,0.3)" }}>
                    <span className="text-xs text-amber-400/80">{s.icon} {s.label}</span>
                    <span className="text-xs font-bold text-white ml-1">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Admin ID ── */}
          {isAdmin && <p className="text-xs text-muted-foreground mt-2 font-mono">User ID: {userId}</p>}

          <Separator className="my-4 bg-amber-900/30" />

          {/* ── Navigation Tabs + More menu ── */}
          <div className="flex items-center justify-between">
            <div className="flex gap-0.5 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-amber-400 border-b-[3px] border-amber-400 rounded-b-none bg-amber-400/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* "..." nút 3 chấm bên phải */}
            <ProfileMoreMenu
              userId={userId || ""}
              displayName={profile?.display_name ?? null}
              handle={profile?.handle ?? null}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:items-start">

          {/* ── Left Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">

            {/* Intro Card */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(13,33,55,0.85)", border: "1px solid rgba(180,144,30,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <h3 className="text-base font-bold text-foreground mb-3">Giới thiệu</h3>
              {profile?.bio && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{profile.bio}</p>}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Globe className="w-4 h-4 flex-shrink-0 text-amber-400/70" />
                  <span>FUN Ecosystem · Angel AI Community</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-amber-400/70" />
                  <span>Tham gia {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy", { locale: vi }) : "gần đây"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Star className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>PoPL Score: <strong className="text-amber-400">{poplScore}/100</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <ThumbsUp className="w-4 h-4 flex-shrink-0 text-amber-400/70" />
                  <span><strong className="text-foreground">{stats.likes}</strong> lượt thích</span>
                </div>
              </div>

              {/* Camly Coin */}
              <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2.5" style={{ background: "rgba(180,144,30,0.08)", border: "1px solid rgba(180,144,30,0.25)" }}>
                <img src={camlyCoinLogo} alt="CAMLY" className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Số dư · Tổng tích lũy</p>
                  <p className="text-sm font-bold text-amber-400">{Math.floor(balance).toLocaleString()} · {Math.floor(naturalLifetimeEarned).toLocaleString()} <span className="text-xs font-normal text-amber-400/70">CAMLY</span></p>
                </div>
              </div>

              {lixiReward > 0 && (
                <div className="mt-2 p-2.5 rounded-xl flex items-center gap-2.5" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
                  <span className="text-xl">🧧</span>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Lì xì Tết</p>
                    <p className="text-sm font-bold text-red-400">{Math.floor(lixiReward).toLocaleString()} <span className="text-xs font-normal">CAMLY</span></p>
                  </div>
                </div>
              )}

              {/* FUN Money */}
              {!funMoneyStats.isLoading && funMoneyStats.totalAmount > 0 && (
                <div className="mt-2 p-2.5 rounded-xl flex items-center gap-2.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <img src={funMoneyLogo} alt="FUN" className="w-7 h-7 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">FUN Money (On-chain)</p>
                    <p className="text-sm font-bold text-emerald-400">{funMoneyStats.totalAmount.toLocaleString()} <span className="text-xs font-normal">FUN</span></p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="mt-3">
                <SocialLinksDisplay socialLinks={profile?.social_links ?? null} avatarUrl={profile?.avatar_url} />
              </div>

              {/* Own profile links */}
              {isOwnProfile && (
                <div className="space-y-2 mt-3 pt-3 border-t border-amber-900/30">
                  <Link to="/activity-history" className="flex items-center justify-between text-sm text-muted-foreground hover:text-amber-400 transition-colors">
                    <span className="flex items-center gap-2"><History className="w-4 h-4" />Lịch sử hoạt động</span>
                    <span>→</span>
                  </Link>
                  <Link to="/profile" className="flex items-center justify-between text-sm text-muted-foreground hover:text-amber-400 transition-colors">
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4" />Chỉnh sửa chi tiết</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Actions */}
            {isAdmin && !isOwnProfile && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(13,33,55,0.85)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <h3 className="text-base font-bold text-destructive flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-5 h-5" />Quản lý người dùng
                </h3>
                <div className="space-y-2">
                  <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-amber-600 border-amber-600 hover:bg-amber-50/10">
                        <ShieldAlert className="w-4 h-4 mr-2" />Suspend User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600"><ShieldAlert className="w-5 h-5" />Đình chỉ tạm thời</DialogTitle>
                        <DialogDescription>Đình chỉ người dùng này trong một khoảng thời gian.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Thời gian đình chỉ</Label>
                          <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["1","3","7","14","30"].map(d => <SelectItem key={d} value={d}>{d} ngày</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Lý do *</Label>
                          <Textarea placeholder="Nhập lý do..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Thông điệp chữa lành</Label>
                          <Textarea placeholder="Thông điệp yêu thương..." value={healingMessage} onChange={e => setHealingMessage(e.target.value)} rows={2} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSuspendUser} disabled={isSuspending || !suspendReason.trim()} className="bg-amber-600 hover:bg-amber-700">
                          {isSuspending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Xác nhận
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/10">
                        <Ban className="w-4 h-4 mr-2" />Ban vĩnh viễn
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />Cấm vĩnh viễn</DialogTitle>
                        <DialogDescription className="text-destructive/80">⚠️ Hành động này không thể hoàn tác!</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <p className="text-sm text-destructive font-medium">Cấm: {profile?.display_name || "Người dùng ẩn danh"}</p>
                          <p className="text-xs text-destructive/70 font-mono mt-1">ID: {userId}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Lý do *</Label>
                          <Textarea placeholder="Nhập lý do..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Thông điệp tạm biệt</Label>
                          <Textarea placeholder="Thông điệp yêu thương..." value={healingMessage} onChange={e => setHealingMessage(e.target.value)} rows={2} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleBanUser} disabled={isSuspending || !suspendReason.trim()} variant="destructive">
                          {isSuspending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Cấm vĩnh viễn
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            {/* Friends Preview */}
            <div className="rounded-2xl p-4" style={{ background: "rgba(13,33,55,0.85)", border: "1px solid rgba(180,144,30,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">Bạn bè</h3>
                  <p className="text-xs text-muted-foreground">{stats.friends} bạn bè</p>
                </div>
                {stats.friends > 9 && (
                  <button onClick={() => setActiveTab("friends")} className="text-amber-400 hover:underline text-xs">Xem tất cả</button>
                )}
              </div>
              {friends.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">Chưa có bạn bè</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {friends.slice(0, 9).map(friend => (
                    <Link key={friend.user_id} to={`/user/${friend.user_id}`} className="group">
                      <div className="aspect-square rounded-xl overflow-hidden border border-amber-900/30">
                        <img src={friend.avatar_url || angelAvatar} alt={friend.display_name || "User"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground mt-1 truncate group-hover:text-amber-400 transition-colors">{friend.display_name || "Người dùng"}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Posts / About / Friends ───────────────────────────── */}
          <div className="space-y-4">
            {activeTab === "posts" && (
              <>
                {userPosts.length === 0 ? (
                  <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(13,33,55,0.85)", border: "1px solid rgba(180,144,30,0.2)" }}>
                    <FileText className="w-14 h-14 text-amber-400/20 mx-auto mb-3" />
                    <p className="text-muted-foreground">Chưa có bài viết nào</p>
                    {isOwnProfile && (
                      <Link to="/community" className="mt-4 inline-block">
                        <Button style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700)" }} className="text-black font-bold mt-4">Đăng bài đầu tiên</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post, index) => (
                      <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <PostCard post={post} currentUserId={user?.id} onLike={handleLike} onShare={handleShare} onComment={handleComment} onEdit={isOwnProfile ? handleEditPost : undefined} onDelete={isOwnProfile ? handleDeletePost : undefined} fetchComments={fetchComments} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "about" && (
              <div className="rounded-2xl p-6 space-y-5" style={{ background: "rgba(13,33,55,0.85)", border: "1px solid rgba(180,144,30,0.2)" }}>
                <h3 className="text-xl font-bold text-foreground">Giới thiệu</h3>
                {profile?.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold mb-1">Tiểu sử</p>
                    <p className="text-[15px] text-foreground">{profile.bio}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Tài chính & Thành tích</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {honorStats.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(10,46,24,0.5)", border: "1px solid rgba(180,144,30,0.25)" }}>
                        <span className="text-sm text-amber-400/80">{s.icon} {s.label}</span>
                        <span className="text-sm font-bold text-white">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "friends" && (
              <div className="rounded-2xl p-6" style={{ background: "rgba(13,33,55,0.85)", border: "1px solid rgba(180,144,30,0.2)" }}>
                <h3 className="text-xl font-bold text-foreground mb-4">Bạn bè · {stats.friends}</h3>
                {friends.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Chưa có bạn bè nào</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {friends.map(friend => (
                      <Link key={friend.user_id} to={`/user/${friend.user_id}`} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-400/5 transition-colors border border-amber-900/20">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={friend.avatar_url || angelAvatar} className="object-cover" />
                          <AvatarFallback className="text-sm">{friend.display_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium text-foreground group-hover:text-amber-400 transition-colors truncate">{friend.display_name || "Người dùng"}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightboxes ────────────────────────────────────────────────────── */}
      {profile?.avatar_url && (
        <ProfileImageLightbox isOpen={avatarLightboxOpen} onClose={() => setAvatarLightboxOpen(false)} imageUrl={profile.avatar_url} type="avatar" alt={profile.display_name || "User"} />
      )}
      {profile?.cover_photo_url && (
        <ProfileImageLightbox isOpen={coverLightboxOpen} onClose={() => setCoverLightboxOpen(false)} imageUrl={profile.cover_photo_url} type="cover" alt={profile.display_name || "User"} />
      )}

      {/* ── Gift Dialog ───────────────────────────────────────────────────── */}
      {userId && (
        <GiftCoinDialog
          open={giftDialogOpen}
          onOpenChange={setGiftDialogOpen}
          preselectedUser={userId ? { id: userId, display_name: profile?.display_name ?? null, avatar_url: profile?.avatar_url ?? null } : undefined}
        />
      )}

      {/* ── Signup Prompt ─────────────────────────────────────────────────── */}
      <SignupPromptDialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt} />
    </div>
  );
};

export default UserProfile;
