import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ValentineVideoBackground } from "@/components/ValentineVideoBackground";
import { MusicThemeSelector } from "@/components/MusicThemeSelector";
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
import angelAiGoldenLogo from "@/assets/angel-ai-golden-logo.png";
import funPlayLogo from "@/assets/fun-play-logo.png";
import goldDiamondBadge from "@/assets/gold-diamond-badge.png";
import funProfileLogo from "@/assets/fun-profile-logo.png";
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
import { CoverPositionEditor } from "@/components/profile/CoverPositionEditor";

// ─── Platform Meta (for orbital) ─────────────────────────────────────────────
const PLATFORM_META: Record<string, { label: string; logoUrl: string; bg: string; color: string }> = {
  fun_profile: {
    label: "Fun Profile",
    logoUrl: funProfileLogo,
    bg: "#b8860b",
    color: "#ffd700",
  },
  fun_play: {
    label: "Fun Play",
    logoUrl: funPlayLogo,
    bg: "#0a1a3a",
    color: "#ffd700",
  },
  facebook: {
    label: "Facebook",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/240px-2023_Facebook_icon.svg.png",
    bg: "#1877F2",
    color: "#fff",
  },
  youtube: {
    label: "YouTube",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/240px-YouTube_full-color_icon_%282017%29.svg.png",
    bg: "#FF0000",
    color: "#fff",
  },
  twitter: {
    label: "X (Twitter)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/240px-X_logo_2023.svg.png",
    bg: "#14171A",
    color: "#fff",
  },
  telegram: {
    label: "Telegram",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/240px-Telegram_logo.svg.png",
    bg: "#26A5E4",
    color: "#fff",
  },
  tiktok: {
    label: "TikTok",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/240px-TikTok_logo.svg.png",
    bg: "#010101",
    color: "#fff",
  },
  linkedin: {
    label: "LinkedIn",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/240px-LinkedIn_logo_initials.png",
    bg: "#0A66C2",
    color: "#fff",
  },
  zalo: {
    label: "Zalo",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/240px-Icon_of_Zalo.svg.png",
    bg: "#0068FF",
    color: "#fff",
  },
};

// ─── Orbital Icon — shows user avatar with platform brand border ──────────────
function OrbitalIcon({
  platform, url, meta, x, y, durationSecs, userAvatarUrl,
}: {
  platform: string; url: string;
  meta: { label: string; logoUrl: string; bg: string; color: string };
  x: number; y: number; durationSecs: number;
  userAvatarUrl?: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href={url} target="_blank" rel="noopener noreferrer"
            className="absolute rounded-full pointer-events-auto cursor-pointer overflow-hidden flex items-center justify-center"
            style={{
              left: x, top: y, width: 36, height: 36,
              background: meta.bg,
              boxShadow: hovered
                ? `0 0 18px ${meta.bg}dd, 0 2px 10px rgba(0,0,0,0.4)`
                : `0 0 8px ${meta.bg}88, 0 2px 6px rgba(0,0,0,0.3)`,
              border: `2.5px solid ${meta.bg}`,
              outline: hovered ? `2px solid ${meta.bg}` : "none",
              outlineOffset: 2,
              zIndex: 20,
            }}
            animate={{ rotate: hovered ? 0 : -360 }}
            transition={{ duration: hovered ? 0.2 : durationSecs, repeat: hovered ? 0 : Infinity, ease: "linear" }}
            whileHover={{ scale: 1.3 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={meta.label}
                className="w-full h-full object-cover"
                style={{ display: "block" }}
              />
            ) : (
              <img
                src={meta.logoUrl}
                alt={meta.label}
                className="w-5 h-5 object-contain"
                style={{ display: "block" }}
              />
            )}
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
function OrbitalSocialLinks({ socialLinks, orbitRadius = 90, durationSecs = 22, userAvatarUrl }: {
  socialLinks: Record<string, string>; orbitRadius?: number; durationSecs?: number;
  userAvatarUrl?: string | null;
}) {
  const activeLinks = Object.entries(socialLinks).filter(([, url]) => url?.trim());
  if (activeLinks.length === 0) return null;
  const count = activeLinks.length;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
      <div className="absolute rounded-full border border-amber-400/25" style={{ width: orbitRadius * 2, height: orbitRadius * 2 }} />
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
          return <OrbitalIcon key={platform} platform={platform} url={url} meta={meta} x={x} y={y} durationSecs={durationSecs} userAvatarUrl={userAvatarUrl} />;
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
  cover_position?: number | null;
  handle: string | null;
  created_at: string;
  social_links: Record<string, string> | null;
}

interface FriendData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

// ─── Diamond Badge icon — top-center, gold diamond image ───────────────
function DiamondBadge() {
  return (
    <div
      className="absolute z-30 flex items-center justify-center"
      style={{
        width: 42, height: 42,
        top: -22, left: "50%",
        transform: "translateX(-50%)",
        filter: "drop-shadow(0 0 6px rgba(255,215,0,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
      }}
    >
      <img
        src={goldDiamondBadge}
        alt="Gold Diamond Badge"
        className="w-full h-full object-contain"
      />
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
  const tongThu = balance + lixiReward;
  const { score: poplScore, badgeLevel, positiveActions } = usePoPLScore(userId);
  const funMoneyStats = useFUNMoneyStats(userId);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
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
  const [coverBrightness, setCoverBrightness] = useState<"light" | "dark" | "unknown">("unknown");

  // Suspension status for this user
  const [suspensionInfo, setSuspensionInfo] = useState<{ isSuspended: boolean; isPermanent: boolean; reason: string | null } | null>(null);

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

  // ── Save cover photo display position ────────────────────────────────────
  const handleSaveCoverPosition = async (position: number) => {
    if (!userId) return;
    await supabase.from("profiles").update({ cover_position: position } as any).eq("user_id", userId);
    setProfile(prev => prev ? { ...prev, cover_position: position } : prev);
  };


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
      const isIndefinite = suspendDuration === "0";
      const response = await supabase.functions.invoke("suspend-user", { body: { targetUserId: userId, suspensionType: isIndefinite ? "permanent" : "temporary", reason: suspendReason, durationDays: isIndefinite ? undefined : parseInt(suspendDuration), healingMessage: healingMessage || undefined } });
      if (response.error) throw response.error;
      toast.success(isIndefinite ? "Đã đình chỉ người dùng vô thời hạn" : `Đã đình chỉ người dùng ${suspendDuration} ngày`);
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

  // ── Analyse cover image brightness (Canvas API) ──────────────────────────
  useEffect(() => {
    if (!profile?.cover_photo_url) {
      setCoverBrightness("unknown");
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Sample a small region (top-right) where the board sits
        const sampleW = 300;
        const sampleH = 120;
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Draw the right portion of the image (where honor board overlays)
        const srcX = img.naturalWidth > sampleW ? img.naturalWidth - sampleW : 0;
        ctx.drawImage(img, srcX, 0, sampleW, sampleH, 0, 0, sampleW, sampleH);
        const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
        let totalBrightness = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          // Perceived brightness (ITU-R BT.709)
          totalBrightness += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        const avg = totalBrightness / pixels;
        setCoverBrightness(avg > 140 ? "light" : "dark");
      } catch {
        setCoverBrightness("unknown");
      }
    };
    img.onerror = () => setCoverBrightness("unknown");
    img.src = profile.cover_photo_url;
  }, [profile?.cover_photo_url]);

  // ── Fetch suspension status ────────────────────────────────────────────
  useEffect(() => {
    const fetchSuspension = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("user_suspensions")
        .select("reason, suspended_until")
        .eq("user_id", userId)
        .is("lifted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const isPermanent = !data.suspended_until || new Date(data.suspended_until) > new Date("2099-01-01");
        setSuspensionInfo({ isSuspended: true, isPermanent, reason: data.reason });
      } else {
        setSuspensionInfo({ isSuspended: false, isPermanent: false, reason: null });
      }
    };
    fetchSuspension();
  }, [userId]);

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
    // Own profile: edit button is shown in wallet row — return null here
    if (isOwnProfile) return null;

    if (friendshipLoading) return <Button disabled size="sm" variant="outline"><Loader2 className="w-4 h-4 animate-spin" /></Button>;

    const buttons: React.ReactNode[] = [];
    if (!friendshipStatus) {
      buttons.push(<Button key="add" size="sm" onClick={() => sendFriendRequest(userId!)} style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700)" }} className="text-black font-bold"><UserPlus className="w-3.5 h-3.5 mr-1.5" />Thêm bạn</Button>);
    } else if (friendshipStatus.status === "pending") {
      if (friendshipStatus.requester_id === user?.id) {
        buttons.push(<Button key="pending" size="sm" variant="outline" className="border-amber-500 text-amber-600" onClick={() => cancelFriendRequest(friendshipStatus.id)}><Clock className="w-3.5 h-3.5 mr-1.5" />Đã gửi</Button>);
      } else {
        buttons.push(<Button key="accept" size="sm" onClick={() => acceptFriendRequest(friendshipStatus.id)} style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700)" }} className="text-black font-bold"><UserCheck className="w-3.5 h-3.5 mr-1.5" />Xác nhận</Button>);
      }
    } else if (friendshipStatus.status === "accepted") {
      buttons.push(<Button key="friends" size="sm" variant="outline" className="border-amber-500 text-amber-600"><UserCheck className="w-3.5 h-3.5 mr-1.5" />Bạn bè</Button>);
    }
    buttons.push(
      <Link key="msg" to={`/messages/${userId}`}><Button size="sm" variant="outline" className="border-amber-500 text-amber-600"><MessageCircle className="w-3.5 h-3.5 mr-1.5" />Nhắn tin</Button></Link>,
      <Button key="gift" size="sm" variant="outline" className="border-amber-500 text-amber-600" onClick={() => setGiftDialogOpen(true)}><Gift className="w-3.5 h-3.5 mr-1.5" />Tặng</Button>
    );
    return <div className="flex flex-wrap gap-2">{buttons}</div>;
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!profile && !userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5]">
        <p className="text-lg text-gray-500 mb-4">Không tìm thấy người dùng</p>
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
    { icon: "💰", label: "Tổng thu", value: Math.floor(tongThu).toLocaleString() },
    { icon: "💎", label: "FUN Money", value: funMoneyStats.totalAmount > 0 ? funMoneyStats.totalAmount.toLocaleString() : "—" },
  ];

  const tabs = [
    { id: "posts", label: "Bài viết" },
    { id: "about", label: "Giới thiệu" },
    { id: "friends", label: "Bạn bè" },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: "#f0f2f5" }}>

      {/* ── Video Background ─────────────────────────────────────────────── */}
      <ValentineVideoBackground />

      {/* ── Music selector floating button ───────────────────────────────── */}
      <MusicThemeSelector variant="floating" />

      {/* ── Overlay for readability — REMOVED (no overlay on video bg) ── */}

      {/* ── Header (same as homepage) ────────────────────────────────────── */}
      <div className="relative z-[50]">
        <Header />
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="relative z-[2] pt-4">

        {/* ── White Card (cover + profile info together) ───────────────── */}
        <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-2xl shadow-sm overflow-visible relative z-10">

            {/* ── Cover Photo (rounded top, contained inside white card) ── */}
            <div className="relative h-[190px] sm:h-[230px] rounded-t-2xl overflow-hidden">
              {profile?.cover_photo_url ? (
                <>
                  <img
                    src={profile.cover_photo_url}
                    alt="Cover"
                    className="w-full h-full object-cover cursor-pointer"
                    style={{ objectPosition: `center ${profile.cover_position ?? 50}%` }}
                    onClick={() => setCoverLightboxOpen(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-teal-50 to-amber-50" />
              )}

              {/* Cover buttons — own profile */}
              {isOwnProfile && (
                <div className="absolute bottom-3 right-4 z-10 flex items-center gap-2">
                  {/* Nút Đổi/Thêm ảnh bìa — bên trong có tuỳ chọn điều chỉnh vị trí */}
                  <div className="relative group">
                    <Link to="/profile" className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-sm font-medium text-white transition-colors">
                      <Camera className="w-4 h-4" />
                      {profile?.cover_photo_url ? "Đổi ảnh bìa" : "Thêm ảnh bìa"}
                    </Link>
                    {profile?.cover_photo_url && (
                      <button
                        onClick={() => setCoverEditorOpen(true)}
                        className="absolute bottom-full right-0 mb-1 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-xs font-medium text-white transition-all opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto translate-y-1 group-hover:translate-y-0 duration-200"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Điều chỉnh vị trí
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Suspension badge removed from cover overlay — now shown below cover */}

              {/* ── Bảng Danh Dự — top-right overlay on cover (adaptive color) ── */}
              {(() => {
                // Adaptive theme based on cover brightness
                const isDark = coverBrightness === "dark";
                const isLight = coverBrightness === "light";
                // Dark cover → use white/light glass card so text is readable
                // Light cover → use dark/amber opaque card so text pops
                const boardBg = isDark
                  ? "rgba(255,255,255,0.92)"
                  : isLight
                  ? "rgba(20,10,0,0.72)"
                  : "rgba(255,255,255,0.18)";
                const boardBorder = isDark ? "2px solid #b8860b" : isLight ? "2px solid #ffd700" : "2px solid #b8860b";
                const boardShadow = isDark
                  ? "0 0 22px rgba(218,165,32,0.5), 0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)"
                  : isLight
                  ? "0 0 22px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,215,0,0.15)"
                  : "0 0 22px rgba(218,165,32,0.45), 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)";
                const pillBg = isDark
                  ? "linear-gradient(135deg, rgba(255,236,139,0.5), rgba(255,215,0,0.30), rgba(218,165,32,0.40))"
                  : isLight
                  ? "linear-gradient(135deg, rgba(180,130,0,0.3), rgba(255,215,0,0.15), rgba(218,165,32,0.20))"
                  : "linear-gradient(135deg, rgba(255,236,139,0.35), rgba(255,215,0,0.20), rgba(218,165,32,0.28))";
                const pillBorder = isDark ? "1.5px solid #b8860b" : isLight ? "1.5px solid rgba(255,215,0,0.7)" : "1.5px solid #b8860b";
                const labelColor = isDark ? "#5c3800" : isLight ? "#ffd700" : "#7a4e00";
                const valueColor = isDark ? "#b8860b" : isLight ? "#ffec8b" : "#b8860b";

                return (
                  <div
                    className="absolute right-3 top-2.5 z-20 hidden sm:block w-[268px] rounded-xl p-2.5 transition-all duration-500"
                    style={{
                      background: boardBg,
                      backdropFilter: "blur(14px)",
                      WebkitBackdropFilter: "blur(14px)",
                      border: boardBorder,
                      boxShadow: boardShadow,
                    }}
                  >
                    {/* Header: logo + title centered + avatar */}
                    <div className="flex items-center justify-between mb-2">
                      <img src={angelAiGoldenLogo} className="w-6 h-6 object-contain flex-shrink-0" alt="Angel AI" />
                      <span
                        className="text-[10px] font-extrabold tracking-widest uppercase text-center flex-1 mx-1"
                        style={{
                          background: "linear-gradient(90deg, #ff0000, #ff7700, #ffdd00, #00ff00, #0099ff, #8800ff, #ff00ff)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        ✦ Bảng Danh Dự ✦
                      </span>
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarImage src={profile?.avatar_url || angelAvatar} className="object-cover" />
                        <AvatarFallback className="text-[9px] bg-amber-900 text-amber-200">{profile?.display_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Divider line */}
                    <div className="w-full h-px mb-2" style={{ background: "linear-gradient(90deg, transparent, #daa520, transparent)" }} />
                    <div className="grid grid-cols-2 gap-1">
                      {honorStats.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2 py-1.5 rounded-full"
                          style={{
                            background: pillBg,
                            border: pillBorder,
                            boxShadow: "0 0 6px rgba(218,165,32,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                          }}
                        >
                          <span className="text-[9px] leading-none font-semibold" style={{ color: labelColor }}>{s.icon} {s.label}</span>
                          <span className="text-[9px] font-extrabold ml-1 leading-none" style={{ color: valueColor }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Profile info section ─────────────────────────────────── */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-5">

              {/* Suspension/Ban banner — below cover, visible on all screens */}
              {suspensionInfo?.isSuspended && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border sm:ml-[240px] ${
                  suspensionInfo.isPermanent
                    ? "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800"
                    : "bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800"
                }`}>
                  {suspensionInfo.isPermanent ? (
                    <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${
                      suspensionInfo.isPermanent ? "text-red-700 dark:text-red-400" : "text-orange-700 dark:text-orange-400"
                    }`}>
                      {suspensionInfo.isPermanent ? "🚫 Tài khoản bị cấm vĩnh viễn" : "⚠️ Tài khoản đang bị đình chỉ"}
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      suspensionInfo.isPermanent ? "text-red-600/80 dark:text-red-300/80" : "text-orange-600/80 dark:text-orange-300/80"
                    }`}>
                      {suspensionInfo.isPermanent
                        ? "Tài khoản này đã vi phạm điều khoản sử dụng và bị cấm vĩnh viễn."
                        : "Tài khoản này đang bị đình chỉ tạm thời do vi phạm quy định."}
                    </p>
                  </div>
                </div>
              )}

              {/* Two-column: [Avatar+Orbital] + [Info] */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">

                {/* Left: Avatar + Orbital + Diamond Badge */}
                <div
                  className="relative flex-shrink-0 flex items-center justify-center self-center sm:self-start"
                  style={{ width: wrapperSize, height: wrapperSize, marginTop: -(wrapperSize / 2 + 4) }}
                >
                  {/* Glow ring */}
                  <div className="absolute rounded-full" style={{ width: orbitRadius * 2 + 8, height: orbitRadius * 2 + 8, background: "radial-gradient(circle, rgba(251,191,36,0.10) 0%, transparent 70%)" }} />

                  {/* Orbital social links (user avatar in each circle) */}
                  <OrbitalSocialLinks
                    socialLinks={activeSocialLinks}
                    orbitRadius={orbitRadius}
                    durationSecs={22}
                    userAvatarUrl={profile?.avatar_url}
                  />

                  {/* Avatar */}
                  <div className="relative z-20">
                    <div
                      className="rounded-full p-[3px] cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700, #ffec8b, #daa520, #b8860b)", boxShadow: "0 0 24px rgba(251,191,36,0.35)" }}
                      onClick={() => profile?.avatar_url && setAvatarLightboxOpen(true)}
                    >
                      <Avatar className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] border-[3px] border-white">
                        <AvatarImage src={profile?.avatar_url || angelAvatar} alt={profile?.display_name || "User"} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700">
                          {profile?.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Diamond Badge — top-center */}
                    <DiamondBadge />

                    {/* Edit avatar */}
                    {isOwnProfile && (
                      <Link to="/profile" className="absolute bottom-1 right-1 z-40 p-1.5 bg-white hover:bg-gray-50 rounded-full border border-amber-400/60 transition-colors shadow-sm">
                        <Camera className="w-3.5 h-3.5 text-amber-500" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right: Info */}
                <div className="flex-1 min-w-0 pt-1 sm:pt-3">

                  {/* Name — Angel AI gold metallic */}
                  <div className="flex items-start flex-wrap gap-2">
                    <h1
                      className="text-2xl sm:text-3xl font-extrabold leading-tight"
                      style={{ background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700, #b8860b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                    >
                      {profile?.display_name || "Người dùng ẩn danh"}
                    </h1>
                    <span className="self-center inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-300 text-amber-700">
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
                      <span className="text-sm font-semibold text-amber-500">@{profile.handle}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">· angel.fun.rich/{profile.handle}</span>
                      <button onClick={handleCopyLink} className="p-1 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors">
                        {copied ? <Check className="w-3 h-3 text-amber-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}

                  {/* Wallet row + Edit button (own profile) */}
                  <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
                    {userId && <WalletAddressDisplay userId={userId} />}
                    {isOwnProfile && (
                      <Link to="/profile">
                        <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 font-semibold whitespace-nowrap hover:bg-amber-50">
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Chỉnh sửa trang cá nhân
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Location + ecosystem */}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-amber-500" /> FUN Ecosystem</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      Tham gia {profile?.created_at ? format(new Date(profile.created_at), "MM/yyyy", { locale: vi }) : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      {positiveActions} hành động tốt
                    </span>
                  </div>

                  {/* Friends avatars */}
                  {friends.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                        {friends.slice(0, 6).map(friend => (
                          <Link key={friend.user_id} to={`/user/${friend.user_id}`}>
                            <Avatar className="w-7 h-7 border-2 border-white hover:z-10 transition-transform hover:scale-110">
                              <AvatarImage src={friend.avatar_url || angelAvatar} className="object-cover" />
                              <AvatarFallback className="text-xs">{friend.display_name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                          </Link>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{stats.friends} bạn bè</span>
                    </div>
                  )}

                  {/* Bio */}
                  {profile?.bio && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-md">{profile.bio}</p>
                  )}

                  {/* Action buttons (non-own profile) */}
                  <div className="mt-3">
                    {renderActionButtons()}
                  </div>
                </div>
              </div>

              {/* Separator */}
              <Separator className="my-4 bg-gray-200" />

              {/* ── Navigation Tabs + More menu ── */}
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-b-[3px] border-amber-500 rounded-b-none bg-amber-50/60"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                      style={activeTab === tab.id ? { color: "#daa520" } : {}}
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
        </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:items-start">

          {/* ── Left Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">

            {/* Intro Card */}
            <div className="rounded-2xl p-4 bg-white shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-3">Giới thiệu</h3>
              {profile?.bio && <p className="text-sm text-gray-500 mb-3 leading-relaxed">{profile.bio}</p>}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2.5 text-gray-500">
                  <Globe className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span>FUN Ecosystem · Angel AI Community</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-500">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span>Tham gia {profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy", { locale: vi }) : "gần đây"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-500">
                  <Star className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span>PoPL Score: <strong className="text-amber-600">{poplScore}/100</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-500">
                  <ThumbsUp className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span><strong className="text-gray-700">{stats.likes}</strong> lượt thích</span>
                </div>
              </div>

              {/* Camly Coin */}
              <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2.5 bg-amber-50 border border-amber-200">
                <img src={camlyCoinLogo} alt="CAMLY" className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400">Có thể rút · Tổng thu</p>
                  <p className="text-sm font-bold text-amber-600">{Math.floor(balance).toLocaleString()} · {Math.floor(tongThu).toLocaleString()} <span className="text-xs font-normal text-amber-500">CAMLY</span></p>
                </div>
              </div>

              {lixiReward > 0 && (
                <div className="mt-2 p-2.5 rounded-xl flex items-center gap-2.5 bg-red-50 border border-red-200">
                  <span className="text-xl">🧧</span>
                  <div>
                    <p className="text-[10px] text-gray-400">Lì xì Tết</p>
                    <p className="text-sm font-bold text-red-500">{Math.floor(lixiReward).toLocaleString()} <span className="text-xs font-normal text-gray-400">CAMLY</span></p>
                  </div>
                </div>
              )}

              {/* FUN Money */}
              {!funMoneyStats.isLoading && funMoneyStats.totalAmount > 0 && (
                <div className="mt-2 p-2.5 rounded-xl flex items-center gap-2.5 bg-emerald-50 border border-emerald-200">
                  <img src={funMoneyLogo} alt="FUN" className="w-7 h-7 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400">FUN Money (On-chain)</p>
                    <p className="text-sm font-bold text-emerald-600">{funMoneyStats.totalAmount.toLocaleString()} <span className="text-xs font-normal text-gray-400">FUN</span></p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="mt-3">
                <SocialLinksDisplay socialLinks={profile?.social_links ?? null} avatarUrl={profile?.avatar_url} />
              </div>

              {/* Own profile links */}
              {isOwnProfile && (
                <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                  <Link to="/activity-history" className="flex items-center justify-between text-sm text-gray-500 hover:text-amber-600 transition-colors">
                    <span className="flex items-center gap-2"><History className="w-4 h-4" />Lịch sử hoạt động</span>
                    <span>→</span>
                  </Link>
                  <Link to="/profile" className="flex items-center justify-between text-sm text-gray-500 hover:text-amber-600 transition-colors">
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4" />Chỉnh sửa chi tiết</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Admin Actions */}
            {isAdmin && !isOwnProfile && (
              <div className="rounded-2xl p-4 bg-white shadow-sm border border-red-200">
                <h3 className="text-base font-bold text-destructive flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-5 h-5" />Quản lý người dùng
                </h3>
                <div className="space-y-2">
                  <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-amber-600 border-amber-600 hover:bg-amber-50">
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
                              {["1","3","7","14","30","60"].map(d => <SelectItem key={d} value={d}>{d} ngày</SelectItem>)}
                              <SelectItem value="0">Vô thời hạn (cho đến khi mở lại)</SelectItem>
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
                        <Button onClick={handleSuspendUser} disabled={isSuspending || !suspendReason.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">
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
            <div className="rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Bạn bè</h3>
                  <p className="text-xs text-gray-400">{stats.friends} bạn bè</p>
                </div>
                {stats.friends > 9 && (
                  <button onClick={() => setActiveTab("friends")} className="text-amber-600 hover:underline text-xs">Xem tất cả</button>
                )}
              </div>
              {friends.length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm">Chưa có bạn bè</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {friends.slice(0, 9).map(friend => (
                    <Link key={friend.user_id} to={`/user/${friend.user_id}`} className="group">
                      <div className="aspect-square rounded-xl overflow-hidden border border-gray-100">
                        <img src={friend.avatar_url || angelAvatar} alt={friend.display_name || "User"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="text-[11px] font-medium text-gray-500 mt-1 truncate group-hover:text-amber-600 transition-colors">{friend.display_name || "Người dùng"}</p>
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
                  <div className="rounded-2xl p-12 text-center bg-white shadow-sm">
                    <FileText className="w-14 h-14 text-amber-300 mx-auto mb-3" />
                    <p className="text-gray-400">Chưa có bài viết nào</p>
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
              <div className="rounded-2xl p-6 space-y-5 bg-white shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">Giới thiệu</h3>
                {profile?.bio && (
                  <div>
                    <p className="text-sm text-gray-400 font-semibold mb-1">Tiểu sử</p>
                    <p className="text-[15px] text-gray-700">{profile.bio}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-gray-900">Tài chính & Thành tích</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {honorStats.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-full" style={{ background: "#1a6b3a", border: "1px solid #daa520" }}>
                        <span className="text-xs text-white">{s.icon} {s.label}</span>
                        <span className="text-xs font-bold text-amber-300 ml-1">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "friends" && (
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bạn bè · {stats.friends}</h3>
                {friends.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Chưa có bạn bè nào</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {friends.map(friend => (
                      <Link key={friend.user_id} to={`/user/${friend.user_id}`} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-50 transition-colors border border-gray-100">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={friend.avatar_url || angelAvatar} className="object-cover" />
                          <AvatarFallback className="text-sm">{friend.display_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors truncate">{friend.display_name || "Người dùng"}</p>
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

      {/* ── Cover Position Editor ────────────────────────────────────────── */}
      {profile?.cover_photo_url && isOwnProfile && (
        <CoverPositionEditor
          imageUrl={profile.cover_photo_url}
          isOpen={coverEditorOpen}
          onClose={() => setCoverEditorOpen(false)}
          onSave={handleSaveCoverPosition}
          initialPosition={profile.cover_position ?? 50}
        />
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

      </div>{/* end relative z-[2] content wrapper */}
    </div>
  );
};

export default UserProfile;
