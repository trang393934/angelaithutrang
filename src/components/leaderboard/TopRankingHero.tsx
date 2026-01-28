import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardUser } from "@/hooks/useLeaderboard";
import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import topRankingBg from "@/assets/top-ranking-bg.jpg";

interface TopRankingHeroProps {
  topUsers: LeaderboardUser[];
}

interface TrophyAvatarProps {
  user: LeaderboardUser | undefined;
  rank: number;
  position: "top1" | "top2" | "top3" | "top4" | "top5";
}

function TrophyAvatar({ user, rank, position }: TrophyAvatarProps) {
  if (!user) return null;

  // Avatar sizes - all equal, positioned to fit within golden frames
  const positionConfig = {
    top1: {
      avatar: "w-[50px] h-[50px] md:w-[68px] md:h-[68px]",
      name: "text-xs md:text-sm",
      nameOffset: "mt-[18px] md:mt-[24px]",
    },
    top2: {
      avatar: "w-[50px] h-[50px] md:w-[68px] md:h-[68px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[18px] md:mt-[24px]",
    },
    top3: {
      avatar: "w-[50px] h-[50px] md:w-[68px] md:h-[68px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[18px] md:mt-[24px]",
    },
    top4: {
      avatar: "w-[50px] h-[50px] md:w-[68px] md:h-[68px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[18px] md:mt-[24px]",
    },
    top5: {
      avatar: "w-[50px] h-[50px] md:w-[68px] md:h-[68px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[18px] md:mt-[24px]",
    },
  };

  const config = positionConfig[position];
  const avatarKey = `${user.user_id}-${rank}`;

  return (
    <Link
      to={`/user/${user.user_id}`}
      className="flex flex-col items-center group"
    >
      <motion.div
        key={avatarKey}
        className="flex flex-col items-center"
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Avatar - positioned to fit inside golden circle */}
        <Avatar className={`${config.avatar} border-2 border-amber-300/60 shadow-lg`} key={user.avatar_url}>
          <AvatarImage
            src={user.avatar_url || angelAvatar}
            className="object-cover"
            key={`img-${user.user_id}-${user.avatar_url}`}
          />
          <AvatarFallback className="text-lg bg-amber-100 text-amber-700 font-semibold">
            {user.display_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* User Name - positioned at pedestal base */}
      <p className={`${config.name} ${config.nameOffset} font-semibold text-amber-800 group-hover:text-amber-600 transition-colors text-center max-w-[80px] md:max-w-[110px] leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]`}>
        {user.display_name || "Ẩn danh"}
      </p>
    </Link>
  );
}

export function TopRankingHero({ topUsers }: TopRankingHeroProps) {
  const top5 = topUsers.slice(0, 5);

  if (top5.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative rounded-2xl overflow-hidden"
      style={{
        backgroundImage: `url(${topRankingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        aspectRatio: '4/5',
      }}
    >
      {/* Top 1 - Center, inside the top circle */}
      {top5[0] && (
        <div className="absolute top-[11%] left-1/2 -translate-x-1/2">
          <TrophyAvatar user={top5[0]} rank={1} position="top1" />
        </div>
      )}

      {/* Top 2 & 3 - Second row, inside circles */}
      <div className="absolute top-[32%] left-0 right-0 flex justify-between px-[12%] md:px-[14%]">
        {top5[1] && (
          <TrophyAvatar user={top5[1]} rank={2} position="top2" />
        )}
        {top5[2] && (
          <TrophyAvatar user={top5[2]} rank={3} position="top3" />
        )}
      </div>

      {/* Top 4 & 5 - Third row, inside circles */}
      <div className="absolute top-[56%] left-0 right-0 flex justify-between px-[12%] md:px-[14%]">
        {top5[3] && (
          <TrophyAvatar user={top5[3]} rank={4} position="top4" />
        )}
        {top5[4] && (
          <TrophyAvatar user={top5[4]} rank={5} position="top5" />
        )}
      </div>
    </div>
  );
}
