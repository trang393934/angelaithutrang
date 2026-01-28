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

      {/* 3-Step Staircase Pedestal - Brighter */}
      <div className="flex flex-col items-center -mt-1 relative">
        {/* Step 1 - Top (narrowest) - Brighter yellow */}
        <div 
          className="relative overflow-hidden"
          style={{
            width: size === "large" ? "50px" : size === "medium" ? "42px" : "38px",
            height: size === "large" ? "8px" : "6px",
            background: "linear-gradient(180deg, #FFF176 0%, #FFEB3B 30%, #FFD700 70%, #FFC107 100%)",
            borderRadius: "3px 3px 0 0",
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.9), 0 2px 4px rgba(255,235,59,0.5)",
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
          {/* Sparkle */}
          <motion.div
            className="absolute w-[3px] h-[3px] md:w-[4px] md:h-[4px] rounded-full bg-white"
            style={{ left: "50%", top: "30%", boxShadow: "0 0 6px 2px rgba(255,255,255,1)" }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
        </div>
        
        {/* Step 2 - Middle with Rank Number - Brighter */}
        <div 
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            width: size === "large" ? "68px" : size === "medium" ? "56px" : "50px",
            height: size === "large" ? "18px" : size === "medium" ? "16px" : "14px",
            background: "linear-gradient(180deg, #FFEB3B 0%, #FFD700 30%, #FFC107 70%, #DAA520 100%)",
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.8), 0 2px 4px rgba(255,235,59,0.4)",
          }}
        >
          {/* Rank Number - Brighter */}
          <span 
            className="relative z-10 font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            style={{
              fontSize: size === "large" ? "16px" : size === "medium" ? "14px" : "12px",
              background: "linear-gradient(180deg, #FFFFFF 0%, #FFF59D 30%, #FFEB3B 70%, #FFD700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 12px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 235, 59, 0.8)",
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
          {/* Sparkles */}
          <motion.div
            className="absolute w-[3px] h-[3px] md:w-[4px] md:h-[4px] rounded-full bg-white"
            style={{ left: "15%", top: "40%", boxShadow: "0 0 4px 2px rgba(255,255,255,0.9)" }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="absolute w-[3px] h-[3px] md:w-[4px] md:h-[4px] rounded-full bg-white"
            style={{ left: "85%", top: "40%", boxShadow: "0 0 4px 2px rgba(255,255,255,0.9)" }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }}
          />
        </div>
        
        {/* Step 3 - Bottom (widest) - Brighter */}
        <div 
          className="relative overflow-hidden"
          style={{
            width: size === "large" ? "85px" : size === "medium" ? "70px" : "62px",
            height: size === "large" ? "10px" : "8px",
            background: "linear-gradient(180deg, #FFD700 0%, #FFC107 30%, #DAA520 70%, #B8860B 100%)",
            borderRadius: "0 0 5px 5px",
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.7), 0 4px 8px rgba(255,193,7,0.4)",
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
          />
          {/* Sparkles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[3px] h-[3px] md:w-[4px] md:h-[4px] rounded-full"
              style={{
                background: "radial-gradient(circle, #FFF 0%, #FFEB3B 60%, transparent 100%)",
                left: `${15 + i * 35}%`,
                top: "40%",
                boxShadow: "0 0 5px 2px rgba(255, 235, 59, 0.8)",
              }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
        
        {/* Brighter glow effect under pedestal */}
        <div 
          className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 w-[100%] h-4 md:h-5 blur-md"
          style={{
            background: "radial-gradient(ellipse, rgba(255, 235, 59, 0.8) 0%, rgba(255, 215, 0, 0.5) 50%, transparent 80%)",
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
          background: "linear-gradient(180deg, #FFFDE7 0%, #FFF9C4 20%, #FFEB3B 50%, #FFD700 80%, #FFC107 100%)",
        }}
      >
        {/* Firework Camly Coins */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <FireworkCoin
              key={`firework-${i}`}
              delay={i * 0.5}
              startX={25 + (i % 3) * 25}
              startY={30 + Math.floor(i / 3) * 25}
            />
          ))}
        </div>

        {/* Light rays background - brighter */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-0 left-1/2 h-full origin-top"
              style={{
                width: "5px",
                background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,235,59,0.3) 30%, transparent 60%)",
                transform: `translateX(-50%) rotate(${i * 30 - 180}deg)`,
              }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>

        {/* Sparkle effects - more and brighter */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white rounded-full"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 90}%`,
                boxShadow: "0 0 6px 2px rgba(255,255,255,0.9)",
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.3, 1.5, 0.3],
              }}
              transition={{
                duration: 1.5 + Math.random() * 1,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Title - Brighter */}
        <motion.h2 
          className="text-center font-black text-2xl md:text-3xl mb-6 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "linear-gradient(180deg, #5D4037 0%, #3E2723 50%, #1B0F08 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "3px 3px 6px rgba(255, 235, 59, 0.5)",
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            letterSpacing: "3px",
          }}
        >
          ⭐ TOP RANKING ⭐
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
