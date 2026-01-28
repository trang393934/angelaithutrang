import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardUser } from "@/hooks/useLeaderboard";
import { motion } from "framer-motion";
import { ImageLightbox } from "@/components/community/ImageLightbox";
import angelAvatar from "@/assets/angel-avatar.png";
import topRankingBg from "@/assets/top-ranking-bg-clean.png";

interface TopRankingHeroProps {
  topUsers: LeaderboardUser[];
}

interface TrophyAvatarProps {
  user: LeaderboardUser | undefined;
  rank: number;
  position: "top1" | "top2" | "top3" | "top4" | "top5";
  onAvatarClick: (imageUrl: string, userName: string) => void;
}

function TrophyAvatar({ user, rank, position, onAvatarClick }: TrophyAvatarProps) {
  if (!user) return null;

  // Avatar sizes - all equal, positioned to fit within golden frames
  const positionConfig = {
    top1: {
      avatar: "w-[60px] h-[60px] md:w-[80px] md:h-[80px]",
      name: "text-xs md:text-sm",
      nameOffset: "mt-[5px] md:mt-[8px]",
    },
    top2: {
      avatar: "w-[55px] h-[55px] md:w-[70px] md:h-[70px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[5px] md:mt-[8px]",
    },
    top3: {
      avatar: "w-[55px] h-[55px] md:w-[70px] md:h-[70px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[5px] md:mt-[8px]",
    },
    top4: {
      avatar: "w-[50px] h-[50px] md:w-[65px] md:h-[65px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[5px] md:mt-[8px]",
    },
    top5: {
      avatar: "w-[50px] h-[50px] md:w-[65px] md:h-[65px]",
      name: "text-[10px] md:text-xs",
      nameOffset: "mt-[5px] md:mt-[8px]",
    },
  };

  const config = positionConfig[position];
  const avatarKey = `${user.user_id}-${rank}`;
  const avatarUrl = user.avatar_url || angelAvatar;

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAvatarClick(avatarUrl, user.display_name || "Ẩn danh");
  };

  return (
    <div className="flex flex-col items-center relative">
      <motion.div
        key={avatarKey}
        className="flex flex-col items-center cursor-pointer"
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handleAvatarClick}
      >
        {/* Avatar - positioned to fit inside golden circle */}
        <Avatar className={`${config.avatar} border-2 border-amber-300/60 shadow-lg`} key={user.avatar_url}>
          <AvatarImage
            src={avatarUrl}
            className="object-cover"
            key={`img-${user.user_id}-${user.avatar_url}`}
          />
          <AvatarFallback className="text-lg bg-amber-100 text-amber-700 font-semibold">
            {user.display_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* User Name - positioned on the pedestal */}
      <Link to={`/user/${user.user_id}`} className="group absolute left-1/2 -translate-x-1/2" style={{ top: '100%' }}>
        <p className={`${config.name} ${config.nameOffset} font-bold text-amber-900 group-hover:text-amber-600 transition-colors text-center max-w-[90px] md:max-w-[120px] leading-tight drop-shadow-[0_1px_3px_rgba(255,255,255,1)] whitespace-nowrap overflow-hidden text-ellipsis`}>
          {user.display_name || "Ẩn danh"}
        </p>
      </Link>
    </div>
  );
}

export function TopRankingHero({ topUsers }: TopRankingHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: "", name: "" });
  
  const top5 = topUsers.slice(0, 5);

  const handleAvatarClick = (imageUrl: string, userName: string) => {
    setSelectedImage({ url: imageUrl, name: userName });
    setLightboxOpen(true);
  };

  if (top5.length === 0) {
    return null;
  }

  return (
    <>
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{
          backgroundImage: `url(${topRankingBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          aspectRatio: '3/4',
        }}
      >
        {/* Top 1 - Center */}
        {top5[0] && (
          <div className="absolute top-[11%] left-1/2 -translate-x-1/2">
            <TrophyAvatar user={top5[0]} rank={1} position="top1" onAvatarClick={handleAvatarClick} />
          </div>
        )}

        {/* Top 2 - Left, row 2 */}
        {top5[1] && (
          <div className="absolute top-[33%] left-[27%] -translate-x-1/2">
            <TrophyAvatar user={top5[1]} rank={2} position="top2" onAvatarClick={handleAvatarClick} />
          </div>
        )}

        {/* Top 3 - Right, row 2 */}
        {top5[2] && (
          <div className="absolute top-[33%] left-[73%] -translate-x-1/2">
            <TrophyAvatar user={top5[2]} rank={3} position="top3" onAvatarClick={handleAvatarClick} />
          </div>
        )}

        {/* Top 4 - Left, row 3 */}
        {top5[3] && (
          <div className="absolute top-[58%] left-[27%] -translate-x-1/2">
            <TrophyAvatar user={top5[3]} rank={4} position="top4" onAvatarClick={handleAvatarClick} />
          </div>
        )}

        {/* Top 5 - Right, row 3 */}
        {top5[4] && (
          <div className="absolute top-[58%] left-[73%] -translate-x-1/2">
            <TrophyAvatar user={top5[4]} rank={5} position="top5" onAvatarClick={handleAvatarClick} />
          </div>
        )}
      </div>

      <ImageLightbox
        imageUrl={selectedImage.url}
        alt={`Avatar của ${selectedImage.name}`}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
