import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PoPLBadge } from "@/components/profile/PoPLBadge";
import { WalletAddressDisplay } from "@/components/profile/WalletAddressDisplay";
import { ProfileBadge } from "@/components/public-profile/ProfileBadge";
import angelAvatar from "@/assets/angel-avatar.png";
import type { PublicProfileData, PublicProfileStats } from "@/hooks/usePublicProfile";

interface PublicProfileHeaderProps {
  profile: PublicProfileData;
  stats: PublicProfileStats;
  tagline?: string | null;
  badgeType?: string | null;
}

export function PublicProfileHeader({ profile, stats, tagline, badgeType }: PublicProfileHeaderProps) {
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="max-w-3xl mx-auto px-4 -mt-20 sm:-mt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="relative mb-4">
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

          {/* Name + Badge */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {profile.display_name || "FUN Member"}
            </h1>
            <ProfileBadge badgeType={badgeType ?? null} />
          </div>

          {/* Handle */}
          {profile.handle && (
            <p className="text-sm font-medium text-primary mt-1">
              fun.rich/{profile.handle}
            </p>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground mt-3 max-w-md leading-relaxed text-sm sm:text-base">
              {profile.bio}
            </p>
          )}

          {/* Tagline */}
          {tagline && (
            <p className="text-xs text-primary/80 mt-1.5 font-medium italic max-w-sm">
              ✨ {tagline}
            </p>
          )}

          {/* Wallet Address */}
          <div className="mt-3">
            <WalletAddressDisplay userId={profile.user_id} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
