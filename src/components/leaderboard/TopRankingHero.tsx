import { Link } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardUser } from "@/hooks/useLeaderboard";
import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";

interface TopRankingHeroProps {
  topUsers: LeaderboardUser[];
}

interface TrophyAvatarProps {
  user: LeaderboardUser | undefined;
  rank: number;
  size: "lg" | "md" | "sm";
}

function TrophyAvatar({ user, rank, size }: TrophyAvatarProps) {
  if (!user) return null;

  const sizeConfig = {
    lg: {
      container: "w-28 md:w-32",
      avatar: "w-20 h-20 md:w-24 md:h-24",
      frame: "w-24 h-24 md:w-28 md:h-28",
      base: "w-28 h-8 md:w-32 md:h-10",
      rank: "text-lg md:text-xl",
      name: "text-sm md:text-base",
    },
    md: {
      container: "w-22 md:w-26",
      avatar: "w-16 h-16 md:w-20 md:h-20",
      frame: "w-20 h-20 md:w-24 md:h-24",
      base: "w-22 h-6 md:w-26 md:h-8",
      rank: "text-base",
      name: "text-xs md:text-sm",
    },
    sm: {
      container: "w-20 md:w-24",
      avatar: "w-14 h-14 md:w-18 md:h-18",
      frame: "w-18 h-18 md:w-22 md:h-22",
      base: "w-20 h-5 md:w-24 md:h-7",
      rank: "text-sm",
      name: "text-xs",
    },
  };

  const config = sizeConfig[size];

  return (
    <Link
      to={`/user/${user.user_id}`}
      className="flex flex-col items-center group"
    >
      <motion.div
        className={`relative ${config.container} flex flex-col items-center`}
        whileHover={{ scale: 1.05, y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Crown for Top 1 */}
        {rank === 1 && (
          <motion.div
            className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 z-20"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
          </motion.div>
        )}

        {/* Ornate Golden Frame */}
        <div className="relative">
          {/* Outer glow */}
          <motion.div
            className={`absolute inset-0 ${config.frame} rounded-full`}
            animate={{
              boxShadow: [
                "0 0 20px rgba(255,215,0,0.4)",
                "0 0 35px rgba(255,215,0,0.6)",
                "0 0 20px rgba(255,215,0,0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Golden ornate border - multiple layers for depth */}
          <div className={`relative ${config.frame} flex items-center justify-center`}>
            {/* Outermost ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-600 shadow-[0_4px_15px_rgba(255,215,0,0.5)]" />
            
            {/* Middle ring with highlight */}
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500" />
            
            {/* Inner highlight ring */}
            <div className="absolute inset-[6px] rounded-full bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-400 shadow-[inset_0_2px_6px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(180,130,0,0.5)]" />

            {/* Avatar container */}
            <div className="absolute inset-[9px] rounded-full overflow-hidden bg-white shadow-inner">
              <Avatar className="w-full h-full">
                <AvatarImage
                  src={user.avatar_url || angelAvatar}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                  {user.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Corner sparkle accents */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-1"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
            </motion.div>
          </div>
        </div>

        {/* Trophy Base / Pedestal */}
        <div className={`relative ${config.base} -mt-2`}>
          {/* Base top surface */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[40%] rounded-t-lg bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-500 shadow-[0_2px_8px_rgba(0,0,0,0.2)]" />
          
          {/* Base middle */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-full h-[35%] bg-gradient-to-b from-amber-500 via-yellow-600 to-amber-700" />
          
          {/* Base bottom platform */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110%] h-[35%] rounded-b-md bg-gradient-to-b from-amber-600 via-yellow-700 to-amber-800 shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />

          {/* Rank number on base */}
          <div className={`absolute inset-0 flex items-center justify-center ${config.rank} font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}>
            #{rank}
          </div>
        </div>
      </motion.div>

      {/* User Name - Full display */}
      <div className="mt-2 text-center max-w-[120px] md:max-w-[140px]">
        <p className={`${config.name} font-semibold text-primary-deep group-hover:text-primary transition-colors leading-tight`}>
          {user.display_name || "Ẩn danh"}
        </p>
      </div>
    </Link>
  );
}

export function TopRankingHero({ topUsers }: TopRankingHeroProps) {
  const top5 = topUsers.slice(0, 5);

  if (top5.length < 5) {
    return (
      <div className="flex justify-center gap-4 flex-wrap py-6">
        {top5.map((user, index) => (
          <TrophyAvatar
            key={user.user_id}
            user={user}
            rank={index + 1}
            size={index === 0 ? "lg" : "md"}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 md:gap-4 py-4">
      {/* Row 1: Top 1 (Center, Largest) */}
      <div className="flex justify-center">
        <TrophyAvatar user={top5[0]} rank={1} size="lg" />
      </div>

      {/* Row 2: Top 2 and 3 */}
      <div className="flex justify-center gap-8 md:gap-16 -mt-2">
        <TrophyAvatar user={top5[1]} rank={2} size="md" />
        <TrophyAvatar user={top5[2]} rank={3} size="md" />
      </div>

      {/* Row 3: Top 4 and 5 */}
      <div className="flex justify-center gap-10 md:gap-20 -mt-2">
        <TrophyAvatar user={top5[3]} rank={4} size="sm" />
        <TrophyAvatar user={top5[4]} rank={5} size="sm" />
      </div>
    </div>
  );
}
