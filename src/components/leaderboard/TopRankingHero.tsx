import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardUser } from "@/hooks/useLeaderboard";
import { motion } from "framer-motion";
import { ImageLightbox } from "@/components/community/ImageLightbox";
import angelAvatar from "@/assets/angel-avatar.png";

interface TopRankingHeroProps {
  topUsers: LeaderboardUser[];
}

interface RankingCardProps {
  user: LeaderboardUser | undefined;
  rank: number;
  size: "large" | "medium" | "small";
  delay: number;
  onAvatarClick: (imageUrl: string, userName: string) => void;
}

function RankingCard({ user, rank, size, delay, onAvatarClick }: RankingCardProps) {
  if (!user) return null;

  const sizeConfig = {
    large: {
      ring: "w-[90px] h-[90px] md:w-[110px] md:h-[110px]",
      avatar: "w-[70px] h-[70px] md:w-[88px] md:h-[88px]",
      pedestal: "w-[100px] h-[35px] md:w-[120px] md:h-[45px]",
      name: "text-sm md:text-base",
      ringWidth: "4px",
    },
    medium: {
      ring: "w-[75px] h-[75px] md:w-[95px] md:h-[95px]",
      avatar: "w-[58px] h-[58px] md:w-[75px] md:h-[75px]",
      pedestal: "w-[85px] h-[30px] md:w-[105px] md:h-[38px]",
      name: "text-xs md:text-sm",
      ringWidth: "3px",
    },
    small: {
      ring: "w-[70px] h-[70px] md:w-[85px] md:h-[85px]",
      avatar: "w-[52px] h-[52px] md:w-[65px] md:h-[65px]",
      pedestal: "w-[80px] h-[28px] md:w-[95px] md:h-[35px]",
      name: "text-[11px] md:text-xs",
      ringWidth: "3px",
    },
  };

  const config = sizeConfig[size];
  const avatarUrl = user.avatar_url || angelAvatar;

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAvatarClick(avatarUrl, user.display_name || "Ẩn danh");
  };

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
    >
      {/* Golden Ring Frame */}
      <div
        className={`${config.ring} rounded-full flex items-center justify-center cursor-pointer relative`}
        style={{
          background: "linear-gradient(145deg, #FFD700, #DAA520, #B8860B, #DAA520, #FFD700)",
          boxShadow: "0 4px 20px rgba(218, 165, 32, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.3)",
        }}
        onClick={handleAvatarClick}
      >
        {/* Inner shadow ring */}
        <div
          className="absolute inset-[3px] md:inset-[4px] rounded-full"
          style={{
            background: "linear-gradient(145deg, #B8860B, #8B7355, #B8860B)",
            boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        />
        
        {/* Avatar container */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative z-10"
        >
          <Avatar className={`${config.avatar} border-2 border-amber-200/60`} key={user.avatar_url}>
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
        
        {/* Shine effect */}
        <div 
          className="absolute top-1 left-1/4 w-1/3 h-1/4 rounded-full opacity-40"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Luxurious Pedestal */}
      <div className={`${config.pedestal} -mt-1 relative`}>
        {/* Main pedestal body with 3D effect */}
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #FFD700 0%, #FFC107 15%, #DAA520 30%, #B8860B 50%, #8B6914 70%, #6B5714 85%, #4A3C0F 100%)",
            borderRadius: "12px 12px 50% 50% / 12px 12px 100% 100%",
            boxShadow: `
              0 8px 32px rgba(218, 165, 32, 0.5),
              0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 0.6),
              inset 0 -2px 8px rgba(0, 0, 0, 0.3)
            `,
            border: "1px solid rgba(255, 215, 0, 0.5)",
          }}
        >
          {/* Top shine strip */}
          <div 
            className="absolute top-0 left-0 right-0 h-[40%]"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 30%, transparent 100%)",
              borderRadius: "12px 12px 0 0",
            }}
          />
          
          {/* Shimmer animation overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              borderRadius: "12px 12px 50% 50% / 12px 12px 100% 100%",
            }}
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />
          
          {/* Gold sparkles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: "radial-gradient(circle, #FFF 0%, #FFD700 50%, transparent 100%)",
                left: `${20 + i * 30}%`,
                top: `${30 + i * 15}%`,
                boxShadow: "0 0 4px 2px rgba(255, 215, 0, 0.6)",
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
          
          {/* Side highlights */}
          <div 
            className="absolute left-0 top-[20%] bottom-[30%] w-[3px]"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.3) 70%, transparent 100%)",
              borderRadius: "2px",
            }}
          />
          <div 
            className="absolute right-0 top-[20%] bottom-[30%] w-[3px]"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.2) 70%, transparent 100%)",
              borderRadius: "2px",
            }}
          />
        </div>
        
        {/* Glow effect under pedestal */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-3 blur-md"
          style={{
            background: "radial-gradient(ellipse, rgba(255, 215, 0, 0.5) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* User Name */}
      <Link to={`/user/${user.user_id}`} className="group mt-1">
        <p className={`${config.name} font-bold text-amber-900 group-hover:text-amber-600 transition-colors text-center max-w-[100px] md:max-w-[130px] leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] truncate`}>
          {user.display_name || "Ẩn danh"}
        </p>
      </Link>
    </motion.div>
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
        className="relative rounded-2xl overflow-hidden p-4 md:p-6"
        style={{
          background: "linear-gradient(180deg, #FFF8DC 0%, #FFE4B5 20%, #F4A460 50%, #DAA520 80%, #B8860B 100%)",
        }}
      >
        {/* Light rays background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 h-full origin-top"
              style={{
                width: "4px",
                background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
                transform: `translateX(-50%) rotate(${i * 22.5 - 90}deg)`,
              }}
            />
          ))}
        </div>

        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <motion.h2 
          className="text-center font-black text-2xl md:text-3xl mb-6 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "linear-gradient(180deg, #8B4513 0%, #654321 50%, #3E2723 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "2px 2px 4px rgba(255, 215, 0, 0.3)",
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            letterSpacing: "2px",
          }}
        >
          TOP RANKING
        </motion.h2>

        {/* Rankings Layout */}
        <div className="relative z-10 space-y-4">
          {/* Row 1: Top 1 */}
          <div className="flex justify-center">
            <RankingCard
              user={top5[0]}
              rank={1}
              size="large"
              delay={0.1}
              onAvatarClick={handleAvatarClick}
            />
          </div>

          {/* Row 2: Top 2 & 3 */}
          <div className="flex justify-center gap-8 md:gap-16">
            <RankingCard
              user={top5[1]}
              rank={2}
              size="medium"
              delay={0.2}
              onAvatarClick={handleAvatarClick}
            />
            <RankingCard
              user={top5[2]}
              rank={3}
              size="medium"
              delay={0.3}
              onAvatarClick={handleAvatarClick}
            />
          </div>

          {/* Row 3: Top 4 & 5 */}
          <div className="flex justify-center gap-8 md:gap-16">
            <RankingCard
              user={top5[3]}
              rank={4}
              size="small"
              delay={0.4}
              onAvatarClick={handleAvatarClick}
            />
            <RankingCard
              user={top5[4]}
              rank={5}
              size="small"
              delay={0.5}
              onAvatarClick={handleAvatarClick}
            />
          </div>
        </div>
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
