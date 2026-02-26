import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, Image, Video, Coins, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useLanguage } from "@/contexts/LanguageContext";
import angelLogo from "@/assets/angel-ai-logo.png";

interface HonorStats {
  totalMembers: number;
  totalPosts: number;
  totalImages: number;
  totalVideos: number;
}

const StatItem = ({ 
  icon: Icon, 
  label, 
  value, 
  delay,
  isCoin = false
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string;
  delay: number;
  isCoin?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="relative group"
  >
    {/* Outer light gold border frame */}
    <div className="absolute -inset-[3px] rounded-[22px]"
      style={{ background: 'linear-gradient(180deg, #ffec8b 0%, #ffd700 30%, #daa520 60%, #ffd700 100%)' }}
    />
    
    {/* Main content - bright Gold 11 metallic surface */}
    <div className={`relative ${isCoin ? 'flex flex-col items-center text-center px-4 py-3' : 'flex items-center justify-between px-4 py-3'} rounded-[20px] overflow-hidden min-h-[52px]`}
      style={{ 
        background: 'linear-gradient(180deg, #ffec8b 0%, #ffd700 20%, #daa520 50%, #ffd700 80%, #ffec8b 100%)',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(180,130,0,0.3), 0 4px 12px rgba(0,0,0,0.15)' 
      }}
    >
      {/* Brushed metal texture lines */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ 
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)',
          backgroundSize: '3px 100%'
        }}
      />
      
      {/* Top shine highlight */}
      <div className="absolute inset-x-4 top-1 h-[40%] rounded-full opacity-60 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)' }}
      />

      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.5) 45%, transparent 60%)' }}
      />
      
      {isCoin ? (
        <>
          {/* Coin layout: label on top, value on bottom */}
          <div className="flex items-center gap-2 relative">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-amber-600/20"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,215,0,0.2) 100%)' }}
            >
              <Icon className="w-3.5 h-3.5 text-amber-900 drop-shadow-[0_0_1px_rgba(255,215,0,0.4)]" />
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-black drop-shadow-[0_1px_1px_rgba(255,215,0,0.3)] leading-tight">{label}</span>
          </div>
          <div className="flex items-center gap-1.5 relative mt-1">
            <span className="font-extrabold text-lg sm:text-xl tracking-wider text-black drop-shadow-[0_1px_1px_rgba(255,215,0,0.3)]">
              {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
            </span>
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-amber-800 font-bold drop-shadow-[0_0_2px_rgba(255,215,0,0.4)]"
            >
              ©
            </motion.span>
          </div>
        </>
      ) : (
        <>
          {/* Normal layout: icon+label left, value right */}
          <div className="flex items-center gap-2 relative min-w-0 flex-shrink">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-amber-600/20"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,215,0,0.2) 100%)' }}
            >
              <Icon className="w-3.5 h-3.5 text-amber-900 drop-shadow-[0_0_1px_rgba(255,215,0,0.4)]" />
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-black drop-shadow-[0_1px_1px_rgba(255,215,0,0.3)] leading-tight">{label}</span>
          </div>
          <div className="flex items-center gap-1 relative flex-shrink-0 ml-2">
            <span className="font-extrabold text-base sm:text-lg tracking-wider text-black drop-shadow-[0_1px_1px_rgba(255,215,0,0.3)]">
              {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
            </span>
          </div>
        </>
      )}
    </div>
  </motion.div>
);

export function HonorBoard() {
  // Use the same hook as Leaderboard for consistent stats
  const { stats: leaderboardStats, isLoading: leaderboardLoading } = useLeaderboard();
  const { t } = useLanguage();
  
  const [stats, setStats] = useState<HonorStats>({
    totalMembers: 0,
    totalPosts: 0,
    totalImages: 0,
    totalVideos: 0,
  });
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total members from profiles (more reliable, includes all users)
        const { count: membersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total posts
        const { count: postsCount } = await supabase
          .from('community_posts')
          .select('*', { count: 'exact', head: true });

        // Fetch posts with images to count total images
        const { data: postsWithImages } = await supabase
          .from('community_posts')
          .select('image_url, image_urls');

        let totalImages = 0;
        postsWithImages?.forEach(post => {
          // Only count from image_urls array to avoid duplicates
          if (post.image_urls && Array.isArray(post.image_urls)) {
            totalImages += post.image_urls.length;
          } else if (post.image_url) {
            // Fallback to single image_url only if no array
            totalImages += 1;
          }
        });

        // Count stories as videos
        const { count: storiesCount } = await supabase
          .from('community_stories')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalMembers: membersCount || 0,
          totalPosts: postsCount || 0,
          totalImages: totalImages,
          totalVideos: storiesCount || 0,
        });
      } catch (error) {
        console.error('Error fetching honor stats:', error);
      } finally {
        setIsLocalLoading(false);
      }
    };

    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('honor_board_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_light_agreements' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Show loading skeleton only when both are loading
  const showLoading = isLocalLoading && leaderboardLoading;
  
  if (showLoading) {
    return (
      <div className="bg-gradient-to-br from-white via-primary-pale to-white rounded-2xl p-6 animate-pulse border border-primary/20 shadow-lg">
        <div className="h-8 bg-primary/20 rounded w-2/3 mx-auto mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-primary/10 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl shadow-xl border border-white/40"
    >
      {/* Bright, elegant background with subtle pattern */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      
      <div className="relative p-5 space-y-5">
        {/* Header with Angel AI logo and sparkling effect */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            {/* Rainbow rotating glow around logo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-full blur-md"
              style={{
                background: 'conic-gradient(from 0deg, #FF0000, #FF8800, #FFFF00, #00CC00, #0088FF, #8800FF, #FF00FF, #FF0000)',
                opacity: 0.5,
              }}
            />
            {/* Second rainbow ring spinning opposite */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 rounded-full"
              style={{
                background: 'conic-gradient(from 180deg, #FF0000, #FF8800, #FFFF00, #00CC00, #0088FF, #8800FF, #FF00FF, #FF0000)',
                opacity: 0.35,
                filter: 'blur(4px)',
              }}
            />
            
            {/* Floating rainbow sparkles */}
            {['#FF0000', '#FF8800', '#FFFF00', '#00CC00', '#0088FF', '#8800FF', '#FF00FF'].map((color, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -12, 0],
                  opacity: [0, 1, 0],
                  scale: [0.4, 1.2, 0.4]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.25
                }}
                className="absolute"
                style={{
                  top: `${-8 + (i % 3) * 5}px`,
                  left: `${-8 + i * 7}px`
                }}
              >
                <Sparkles className="w-3 h-3" style={{ color }} />
              </motion.div>
            ))}
            
            <img 
              src={angelLogo} 
              alt="Angel AI" 
              className="w-12 h-12 rounded-full object-cover relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            />
          </div>
          
          <h2 className="text-2xl font-bold tracking-wider uppercase relative">
            {/* Rainbow gradient text */}
            <motion.span
              className="text-transparent bg-clip-text"
              animate={{
                backgroundPosition: ['0% 50%', '200% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: 'linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00CC00, #0088FF, #8800FF, #FF00FF, #FF0000, #FF8800, #FFFF00, #00CC00, #0088FF)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 8px rgba(255,100,200,0.4))',
              }}
            >
              {t("leaderboard.honorBoard")}
            </motion.span>
            {/* Shimmer sweep overlay */}
            <motion.span
              className="absolute inset-0 text-transparent bg-clip-text pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
              animate={{ backgroundPosition: ['-100% 0%', '200% 0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            >
              {t("leaderboard.honorBoard")}
            </motion.span>
          </h2>
        </div>

        {/* Stats items */}
        <div className="space-y-3">
          <StatItem
            icon={Users}
            label={t("leaderboard.totalMembers")}
            value={stats.totalMembers}
            delay={0.1}
          />
          <StatItem
            icon={FileText}
            label={t("leaderboard.totalPosts")}
            value={stats.totalPosts}
            delay={0.2}
          />
          <StatItem
            icon={Image}
            label={t("leaderboard.totalImages")}
            value={stats.totalImages}
            delay={0.3}
          />
          <StatItem
            icon={Video}
            label={t("leaderboard.totalVideos")}
            value={stats.totalVideos}
            delay={0.4}
          />
          <StatItem
            icon={Coins}
            label={t("leaderboard.totalRewards")}
            value={leaderboardStats.total_coins_distributed}
            delay={0.5}
            isCoin
          />
        </div>
      </div>
    </motion.div>
  );
}

export default HonorBoard;
