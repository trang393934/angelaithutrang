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
import { SocialLinksDisplay } from "@/components/public-profile/SocialLinksDisplay";

interface PublicProfileHeaderProps {
  profile: PublicProfileData;
  stats: PublicProfileStats;
  tagline?: string | null;
  badgeType?: string | null;
  socialLinks?: Record<string, string> | null;
}

export function PublicProfileHeader({ profile, stats, tagline, badgeType, socialLinks }: PublicProfileHeaderProps) {
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
      <div className="h-[200px] sm:h-[280px] md:h-[320px] relative overflow-hidden rounded-b-xl">
        {profile.cover_photo_url ? (
          <img
            src={profile.cover_photo_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary-pale to-accent-gold/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
      </div>

      {/* Facebook-style: Avatar left + Info right */}
      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <div className="flex items-end gap-4 -mt-[60px] sm:-mt-[75px]">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] border-[5px] border-background shadow-xl ring-2 ring-primary/30">
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

          {/* Name + Stats + Actions row */}
          <div className="flex-1 min-w-0 pb-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight truncate">
                      {profile.display_name || "FUN Member"}
                    </h1>
                    <ProfileBadge badgeType={badgeType ?? null} />
                  </div>

                  {profile.handle && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-sm sm:text-base font-semibold text-primary truncate">
                        @{profile.handle}
                      </p>
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                        • angel.fun.rich/{profile.handle}
                      </span>
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
            </motion.div>
          </div>
        </div>

        {/* Bio + Tagline + Meta — below the avatar row, full width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-3 space-y-1.5"
        >
          {profile.bio && (
            <p className="text-muted-foreground max-w-lg leading-relaxed text-sm sm:text-base">
              {profile.bio}
            </p>
          )}

          {tagline && (
            <p className="text-xs text-primary/80 font-medium italic max-w-sm">
              ✨ {tagline}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{joinedLabel}</span>
          </div>

          <SocialLinksDisplay socialLinks={socialLinks} avatarUrl={profile.avatar_url} />

          <div className="mt-2">
            <WalletAddressDisplay userId={profile.user_id} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
