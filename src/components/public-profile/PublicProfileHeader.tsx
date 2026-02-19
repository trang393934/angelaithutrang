import { motion } from "framer-motion";
import { Copy, Check, Share2, Calendar, Facebook, Instagram, Youtube, Globe, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PoPLBadge } from "@/components/profile/PoPLBadge";
import { WalletAddressDisplay } from "@/components/profile/WalletAddressDisplay";
import { ProfileBadge } from "@/components/public-profile/ProfileBadge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import angelAvatar from "@/assets/angel-avatar.png";
import type { PublicProfileData, PublicProfileStats } from "@/hooks/usePublicProfile";

// ─── Platform Meta ────────────────────────────────────────────────────────────
const PLATFORM_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
}> = {
  facebook: {
    label: "Facebook",
    icon: <Facebook className="w-4 h-4" />,
    bg: "#1877F2",
    color: "#fff",
  },
  instagram: {
    label: "Instagram",
    icon: <Instagram className="w-4 h-4" />,
    bg: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)",
    color: "#fff",
  },
  tiktok: {
    label: "TikTok",
    icon: <span className="text-xs font-black leading-none">TK</span>,
    bg: "#010101",
    color: "#fff",
  },
  youtube: {
    label: "YouTube",
    icon: <Youtube className="w-4 h-4" />,
    bg: "#FF0000",
    color: "#fff",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <span className="text-xs font-black leading-none">in</span>,
    bg: "#0A66C2",
    color: "#fff",
  },
  twitter: {
    label: "X (Twitter)",
    icon: <span className="text-xs font-black leading-none">𝕏</span>,
    bg: "#14171A",
    color: "#fff",
  },
  website: {
    label: "Website",
    icon: <Globe className="w-4 h-4" />,
    bg: "#10B981",
    color: "#fff",
  },
  telegram: {
    label: "Telegram",
    icon: <MessageCircle className="w-4 h-4" />,
    bg: "#26A5E4",
    color: "#fff",
  },
  discord: {
    label: "Discord",
    icon: <span className="text-xs font-black leading-none">D</span>,
    bg: "#5865F2",
    color: "#fff",
  },
};

// ─── Orbital Social Links ─────────────────────────────────────────────────────
interface OrbitalSocialLinksProps {
  socialLinks: Record<string, string>;
  orbitRadius?: number;
  durationSecs?: number;
}

function OrbitalSocialLinks({
  socialLinks,
  orbitRadius = 90,
  durationSecs = 20,
}: OrbitalSocialLinksProps) {
  const activeLinks = Object.entries(socialLinks).filter(([, url]) => url?.trim());
  if (activeLinks.length === 0) return null;

  const count = activeLinks.length;
  const containerSize = (orbitRadius + 20) * 2; // padding for icon overflow
  const center = containerSize / 2;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {/* Orbit track ring */}
      <div
        className="absolute rounded-full border border-amber-400/20"
        style={{
          width: orbitRadius * 2,
          height: orbitRadius * 2,
        }}
      />

      {/* Rotating wrapper — all icons spin together */}
      <motion.div
        className="absolute"
        style={{
          width: orbitRadius * 2,
          height: orbitRadius * 2,
          top: "50%",
          left: "50%",
          marginTop: -(orbitRadius),
          marginLeft: -(orbitRadius),
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: durationSecs, repeat: Infinity, ease: "linear" }}
      >
        {activeLinks.map(([platform, url], i) => {
          const angle = (360 / count) * i; // initial offset in degrees
          const rad = (angle * Math.PI) / 180;
          const x = orbitRadius + orbitRadius * Math.cos(rad) - 18; // -18 = half icon
          const y = orbitRadius + orbitRadius * Math.sin(rad) - 18;
          const meta = PLATFORM_META[platform];
          if (!meta) return null;

          return (
            <OrbitalIcon
              key={platform}
              platform={platform}
              url={url}
              meta={meta}
              x={x}
              y={y}
              durationSecs={durationSecs}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── Single Orbital Icon (handles hover pause + counter-rotate) ───────────────
interface OrbitalIconProps {
  platform: string;
  url: string;
  meta: { label: string; icon: React.ReactNode; bg: string; color: string };
  x: number;
  y: number;
  durationSecs: number;
}

function OrbitalIcon({ platform, url, meta, x, y, durationSecs }: OrbitalIconProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute flex items-center justify-center rounded-full pointer-events-auto cursor-pointer"
            style={{
              left: x,
              top: y,
              width: 36,
              height: 36,
              background: meta.bg,
              color: meta.color,
              boxShadow: hovered
                ? "0 0 16px rgba(251,191,36,0.7), 0 2px 10px rgba(0,0,0,0.4)"
                : "0 2px 8px rgba(0,0,0,0.35)",
              outline: hovered ? "2px solid #fbbf24" : "1.5px solid rgba(251,191,36,0.45)",
              outlineOffset: 1,
              zIndex: 20,
            }}
            // Counter-rotate so icon stays upright
            animate={{ rotate: hovered ? 0 : -360 }}
            transition={{
              duration: hovered ? 0.2 : durationSecs,
              repeat: hovered ? 0 : Infinity,
              ease: "linear",
            }}
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

// ─── Props ────────────────────────────────────────────────────────────────────
interface PublicProfileHeaderProps {
  profile: PublicProfileData;
  stats: PublicProfileStats;
  tagline?: string | null;
  badgeType?: string | null;
  socialLinks?: Record<string, string> | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PublicProfileHeader({ profile, stats, tagline, badgeType, socialLinks }: PublicProfileHeaderProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const activeSocialLinks = socialLinks
    ? Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v?.trim()))
    : {};
  const hasSocialLinks = Object.keys(activeSocialLinks).length > 0;

  // Responsive orbit radius
  const orbitRadius = 90;
  // Avatar wrapper size must accommodate orbit
  const wrapperSize = (orbitRadius + 36) * 2; // 36 = icon diameter

  const profileUrl = `${window.location.origin}/@${profile.handle}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success(t("publicProfile.linkCopied") || "Đã sao chép link!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.display_name || "FUN Profile",
          text: tagline || profile.bio || "",
          url: profileUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const joinedDate = new Date(profile.created_at);
  const joinedLabel = `${t("publicProfile.memberSince") || "Thành viên từ"} ${String(joinedDate.getMonth() + 1).padStart(2, "0")}/${joinedDate.getFullYear()}`;

  return (
    <div className="relative">
      {/* Cover Photo */}
      <div className="h-[200px] sm:h-[260px] relative overflow-hidden">
        {profile.cover_photo_url ? (
          <img
            src={profile.cover_photo_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-950/30 via-background to-amber-900/20" />
        )}
        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>

      {/* Centered avatar + orbital section */}
      <div className="flex flex-col items-center -mt-[70px] relative z-10 px-4">

        {/* Avatar + Orbit wrapper */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: wrapperSize, height: wrapperSize }}
        >
          {/* Glow background ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: orbitRadius * 2 + 8,
              height: orbitRadius * 2 + 8,
              background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)",
              boxShadow: "0 0 40px rgba(251,191,36,0.15)",
            }}
          />

          {/* Avatar */}
          <div className="relative z-20">
            {/* Gold gradient border via wrapper */}
            <div
              className="rounded-full p-[3px]"
              style={{
                background: "linear-gradient(135deg, #b8860b, #daa520, #ffd700, #ffec8b, #daa520, #b8860b)",
                boxShadow: "0 0 30px rgba(251,191,36,0.4), 0 0 60px rgba(251,191,36,0.15)",
              }}
            >
              <Avatar className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] border-[3px] border-background">
                <AvatarImage
                  src={profile.avatar_url || angelAvatar}
                  alt={profile.display_name || "User"}
                />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-amber-900 to-amber-700 text-amber-100">
                  {profile.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* PoPL Badge */}
            <div className="absolute -bottom-1 -right-1 z-30">
              <PoPLBadge
                isVerified={stats.poplScore >= 20}
                badgeLevel={stats.badgeLevel}
                size="lg"
              />
            </div>
          </div>

          {/* Orbiting social icons */}
          {hasSocialLinks && (
            <OrbitalSocialLinks
              socialLinks={activeSocialLinks}
              orbitRadius={orbitRadius}
              durationSecs={22}
            />
          )}
        </div>

        {/* Name + Handle + Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-3 text-center space-y-1.5"
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
              {profile.display_name || "FUN Member"}
            </h1>
            <ProfileBadge badgeType={badgeType ?? null} />
          </div>

          {profile.handle && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <p className="text-sm sm:text-base font-semibold text-amber-500 dark:text-amber-400">
                @{profile.handle}
              </p>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                · angel.fun.rich/{profile.handle}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-amber-400 shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-amber-400 shrink-0"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground max-w-sm leading-relaxed text-sm sm:text-base mx-auto">
              {profile.bio}
            </p>
          )}

          {/* Tagline */}
          {tagline && (
            <p className="text-xs text-amber-500/80 font-medium italic max-w-sm mx-auto">
              ✨ {tagline}
            </p>
          )}

          {/* Joined date */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{joinedLabel}</span>
          </div>

          {/* Wallet */}
          <div className="flex justify-center">
            <WalletAddressDisplay userId={profile.user_id} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
