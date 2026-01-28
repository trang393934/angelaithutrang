import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardUser } from "@/hooks/useLeaderboard";
import { motion } from "framer-motion";
import { ImageLightbox } from "@/components/community/ImageLightbox";
import angelAvatar from "@/assets/angel-avatar.png";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";

// Firework Camly Coin component
const FireworkCoin = ({ delay, startX, startY }: { delay: number; startX: number; startY: number }) => {
  const angle = Math.random() * 360;
  const distance = 80 + Math.random() * 60;
  const endX = Math.cos(angle * Math.PI / 180) * distance;
  const endY = Math.sin(angle * Math.PI / 180) * distance;
  
  return (
    <motion.div
      className="absolute w-4 h-4 md:w-5 md:h-5"
      style={{ left: `${startX}%`, top: `${startY}%` }}
      initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      animate={{
        scale: [0, 1.2, 0.8, 0],
        opacity: [0, 1, 1, 0],
        x: [0, endX * 0.5, endX],
        y: [0, endY * 0.5, endY],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeOut",
      }}
    >
      <img src={camlyCoinLogo} alt="" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
    </motion.div>
  );
};

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

  // Compact sizes for homepage sidebar display
  const sizeConfig = {
    large: {
      ring: "w-[70px] h-[70px] md:w-[80px] md:h-[80px]",
      avatar: "w-[54px] h-[54px] md:w-[64px] md:h-[64px]",
      pedestal: "w-[80px] h-[28px] md:w-[90px] md:h-[32px]",
      name: "text-xs md:text-sm",
      ringWidth: "3px",
    },
    medium: {
      ring: "w-[60px] h-[60px] md:w-[70px] md:h-[70px]",
      avatar: "w-[46px] h-[46px] md:w-[54px] md:h-[54px]",
      pedestal: "w-[68px] h-[24px] md:w-[78px] md:h-[28px]",
      name: "text-[11px] md:text-xs",
      ringWidth: "2px",
    },
    small: {
      ring: "w-[55px] h-[55px] md:w-[65px] md:h-[65px]",
      avatar: "w-[42px] h-[42px] md:w-[50px] md:h-[50px]",
      pedestal: "w-[62px] h-[22px] md:w-[72px] md:h-[26px]",
      name: "text-[10px] md:text-[11px]",
      ringWidth: "2px",
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
      {/* Brighter Golden Ring Frame */}
      <div
        className={`${config.ring} rounded-full flex items-center justify-center cursor-pointer relative`}
        style={{
          background: "linear-gradient(145deg, #FFEB3B, #FFD700, #FFC107, #FFD700, #FFEB3B)",
          boxShadow: "0 4px 25px rgba(255, 235, 59, 0.7), inset 0 2px 12px rgba(255, 255, 255, 0.5)",
        }}
        onClick={handleAvatarClick}
      >
        {/* Inner shadow ring - brighter */}
        <div
          className="absolute inset-[3px] md:inset-[4px] rounded-full"
          style={{
            background: "linear-gradient(145deg, #FFC107, #DAA520, #FFC107)",
            boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
        />
        
        {/* Avatar container */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative z-10"
        >
          <Avatar className={`${config.avatar} border-2 border-yellow-200/80`} key={user.avatar_url}>
            <AvatarImage
              src={avatarUrl}
              className="object-cover"
              key={`img-${user.user_id}-${user.avatar_url}`}
            />
            <AvatarFallback className="text-lg bg-yellow-100 text-amber-700 font-semibold">
              {user.display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        
        {/* Brighter shine effect */}
        <div 
          className="absolute top-1 left-1/4 w-1/3 h-1/4 rounded-full opacity-60"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Compact 2-Step Staircase Pedestal */}
      <div className="flex flex-col items-center -mt-0.5 relative">
        {/* Step 1 - Top */}
        <div 
          className="relative overflow-hidden"
          style={{
            width: size === "large" ? "40px" : size === "medium" ? "34px" : "30px",
            height: size === "large" ? "6px" : "5px",
            background: "linear-gradient(180deg, #FFF176 0%, #FFEB3B 30%, #FFD700 70%, #FFC107 100%)",
            borderRadius: "2px 2px 0 0",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.9), 0 1px 3px rgba(255,235,59,0.5)",
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
          />
        </div>
        
        {/* Step 2 - Bottom with Rank Number */}
        <div 
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            width: size === "large" ? "55px" : size === "medium" ? "45px" : "40px",
            height: size === "large" ? "14px" : size === "medium" ? "12px" : "10px",
            background: "linear-gradient(180deg, #FFEB3B 0%, #FFD700 30%, #FFC107 70%, #DAA520 100%)",
            borderRadius: "0 0 3px 3px",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 4px rgba(255,235,59,0.4)",
          }}
        >
          {/* Rank Number */}
          <span 
            className="relative z-10 font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
            style={{
              fontSize: size === "large" ? "12px" : size === "medium" ? "10px" : "9px",
              background: "linear-gradient(180deg, #FFFFFF 0%, #FFF59D 30%, #FFEB3B 70%, #FFD700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {rank}
          </span>
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
        </div>
        {/* Glow effect under pedestal */}
        <div 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[90%] h-2 blur-sm"
          style={{
            background: "radial-gradient(ellipse, rgba(255, 235, 59, 0.6) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* User Name */}
      <Link to={`/user/${user.user_id}`} className="group mt-0.5">
        <p className={`${config.name} font-bold text-amber-900 group-hover:text-amber-600 transition-colors text-center max-w-[80px] md:max-w-[100px] leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] truncate`}>
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
        className="relative rounded-xl overflow-hidden p-3 md:p-4"
        style={{
          background: "linear-gradient(180deg, #FFFDE7 0%, #FFF9C4 20%, #FFEB3B 50%, #FFD700 80%, #FFC107 100%)",
        }}
      >
        {/* Firework Camly Coins - Reduced */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <FireworkCoin
              key={`firework-${i}`}
              delay={i * 0.6}
              startX={20 + (i % 3) * 30}
              startY={35 + Math.floor(i / 3) * 30}
            />
          ))}
        </div>

        {/* Light rays background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-0 left-1/2 h-full origin-top"
              style={{
                width: "4px",
                background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,235,59,0.2) 30%, transparent 60%)",
                transform: `translateX(-50%) rotate(${i * 45 - 180}deg)`,
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
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
                boxShadow: "0 0 4px 1px rgba(255,255,255,0.8)",
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.3, 1.2, 0.3],
              }}
              transition={{
                duration: 1.5 + Math.random() * 1,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Title - Single line */}
        <motion.h2 
          className="text-center font-black text-lg md:text-xl mb-3 relative z-10 whitespace-nowrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "linear-gradient(180deg, #5D4037 0%, #3E2723 50%, #1B0F08 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "2px 2px 4px rgba(255, 235, 59, 0.5)",
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            letterSpacing: "2px",
          }}
        >
          ⭐ TOP RANKING ⭐
        </motion.h2>

        {/* Compact Rankings Layout */}
        <div className="relative z-10 space-y-2">
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
          <div className="flex justify-center gap-6 md:gap-10">
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
          <div className="flex justify-center gap-6 md:gap-10">
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
