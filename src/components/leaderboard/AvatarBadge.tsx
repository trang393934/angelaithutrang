import { Link } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardUser } from "@/hooks/useLeaderboard";
import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";

interface AvatarBadgeProps {
  rank: number;
  user: LeaderboardUser | undefined;
  size: "sm" | "md" | "lg";
  crown?: boolean;
}

const sizeConfig = {
  sm: {
    container: "w-14 h-14",
    avatar: "w-12 h-12",
    badge: "w-5 h-5 text-[10px]",
    name: "text-xs",
    glow: "shadow-[0_0_10px_rgba(255,215,0,0.5)]",
    hoverGlow: "group-hover:shadow-[0_0_18px_rgba(255,215,0,0.7)]",
  },
  md: {
    container: "w-16 h-16",
    avatar: "w-14 h-14",
    badge: "w-6 h-6 text-xs",
    name: "text-sm",
    glow: "shadow-[0_0_12px_rgba(255,215,0,0.6)]",
    hoverGlow: "group-hover:shadow-[0_0_20px_rgba(255,215,0,0.8)]",
  },
  lg: {
    container: "w-20 h-20",
    avatar: "w-[72px] h-[72px]",
    badge: "w-7 h-7 text-sm",
    name: "text-base font-semibold",
    glow: "shadow-[0_0_15px_rgba(255,215,0,0.7)]",
    hoverGlow: "group-hover:shadow-[0_0_25px_rgba(255,215,0,0.9)]",
  },
};

export function AvatarBadge({ rank, user, size, crown }: AvatarBadgeProps) {
  const config = sizeConfig[size];
  
  if (!user) return null;

  return (
    <Link
      to={getProfilePath(user.user_id)}
      className="flex flex-col items-center gap-1 group"
    >
      <motion.div
        className={`relative ${config.container}`}
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Crown for Top 1 */}
        {crown && (
          <motion.div
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crown className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" />
          </motion.div>
        )}

        {/* Outer Glow Layer */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 ${config.glow} ${config.hoverGlow} transition-all duration-300`}
        />

        {/* Middle Highlight Layer */}
        <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-yellow-200 via-yellow-300 to-amber-400" />

        {/* Inner 3D Highlight Layer */}
        <div className="absolute inset-[4px] rounded-full bg-gradient-to-b from-yellow-100 via-amber-200 to-yellow-400 shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(180,130,0,0.4)]" />

        {/* Avatar Container */}
        <div className="absolute inset-[6px] rounded-full overflow-hidden bg-white">
          <Avatar className="w-full h-full">
            <AvatarImage
              src={user.avatar_url || angelAvatar}
              className="object-cover"
            />
            <AvatarFallback className="text-sm bg-primary/10 text-primary">
              {user.display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Rank Badge */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${config.badge} rounded-full bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] z-10`}
        >
          {rank}
        </div>
      </motion.div>

      {/* User Name - Full display without truncation */}
      <span
        className={`${config.name} text-foreground text-center group-hover:text-primary transition-colors leading-tight max-w-24 ${size === 'lg' ? 'max-w-28' : size === 'md' ? 'max-w-24' : 'max-w-20'}`}
        style={{ wordBreak: 'keep-all' }}
      >
        {user.display_name || "Ẩn danh"}
      </span>
    </Link>
  );
}
