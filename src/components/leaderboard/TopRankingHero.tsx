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

  // Avatar sizes to fit within the golden frames in background image
  const positionConfig = {
    top1: {
      avatar: "w-[70px] h-[70px] md:w-[90px] md:h-[90px]",
      name: "text-sm md:text-base",
    },
    top2: {
      avatar: "w-[55px] h-[55px] md:w-[70px] md:h-[70px]",
      name: "text-xs md:text-sm",
    },
    top3: {
      avatar: "w-[55px] h-[55px] md:w-[70px] md:h-[70px]",
      name: "text-xs md:text-sm",
    },
    top4: {
      avatar: "w-[50px] h-[50px] md:w-[65px] md:h-[65px]",
      name: "text-xs",
    },
    top5: {
      avatar: "w-[50px] h-[50px] md:w-[65px] md:h-[65px]",
      name: "text-xs",
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
        {/* Clean circular avatar - fits inside background frame */}
        <Avatar className={`${config.avatar} border-2 border-amber-400/50 shadow-lg`} key={user.avatar_url}>
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

      {/* User Name */}
      <p className={`${config.name} font-semibold text-amber-900 group-hover:text-amber-600 transition-colors mt-1 text-center max-w-[100px] md:max-w-[130px] leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]`}>
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
      {/* Top 1 - Center top */}
      {top5[0] && (
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2">
          <TrophyAvatar user={top5[0]} rank={1} position="top1" />
        </div>
      )}

      {/* Top 2 & 3 - Second row */}
      <div className="absolute top-[38%] left-0 right-0 flex justify-center gap-[25%] md:gap-[30%]">
        {top5[1] && (
          <TrophyAvatar user={top5[1]} rank={2} position="top2" />
        )}
        {top5[2] && (
          <TrophyAvatar user={top5[2]} rank={3} position="top3" />
        )}
      </div>

      {/* Top 4 & 5 - Third row */}
      <div className="absolute top-[62%] left-0 right-0 flex justify-center gap-[25%] md:gap-[30%]">
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
