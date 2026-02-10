import { motion } from "framer-motion";
import { Copy, Check, Share2, Calendar } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PoPLBadge } from "@/components/profile/PoPLBadge";
import { WalletAddressDisplay } from "@/components/profile/WalletAddressDisplay";
import { ProfileBadge } from "@/components/public-profile/ProfileBadge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import angelAvatar from "@/assets/angel-avatar.png";
import type { PublicProfileData, PublicProfileStats } from "@/hooks/usePublicProfile";

interface PublicProfileHeaderProps {
  profile: PublicProfileData;
  stats: PublicProfileStats;
  tagline?: string | null;
  badgeType?: string | null;
}

export function PublicProfileHeader({ profile, stats, tagline, badgeType }: PublicProfileHeaderProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

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
      <div className="h-[200px] sm:h-[280px] md:h-[320px] relative overflow-hidden">
        {profile.cover_photo_url ? (
          <img
            src={profile.cover_photo_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary-pale to-accent-gold/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="max-w-3xl mx-auto px-4 -mt-20 sm:-mt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Avatar + Name row */}
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background shadow-divine ring-4 ring-primary-pale/50">
                <AvatarImage
                  src={profile.avatar_url || angelAvatar}
                  alt={profile.display_name || "User"}
                />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary-deep text-primary-foreground">
                  {profile.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <PoPLBadge
                  isVerified={stats.poplScore >= 20}
                  badgeLevel={stats.badgeLevel}
                  size="lg"
                />
              </div>
            </div>

            {/* Name + Handle + Badge — aligned to bottom half of avatar */}
            <div className="pb-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {profile.display_name || "FUN Member"}
                </h1>
                <ProfileBadge badgeType={badgeType ?? null} />
              </div>

              {profile.handle && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-sm font-medium text-primary truncate">
                    angel.fun.rich/{profile.handle}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                    onClick={handleShare}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bio, Tagline, Member Since, Wallet — centered below */}
          <div className="flex flex-col items-center text-center mt-4">
            {profile.bio && (
              <p className="text-muted-foreground max-w-md leading-relaxed text-sm sm:text-base">
                {profile.bio}
              </p>
            )}

            {tagline && (
              <p className="text-xs text-primary/80 mt-1.5 font-medium italic max-w-sm">
                ✨ {tagline}
              </p>
            )}

            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{joinedLabel}</span>
            </div>

            <div className="mt-3">
              <WalletAddressDisplay userId={profile.user_id} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
