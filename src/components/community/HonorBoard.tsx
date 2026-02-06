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
    {/* Outer glow - bright gold shimmer */}
    <div className="absolute -inset-[4px] rounded-full opacity-100 shadow-[0_0_16px_rgba(255,215,0,0.7)] group-hover:shadow-[0_0_24px_rgba(255,215,0,0.9)] transition-all duration-300"
      style={{ background: 'linear-gradient(180deg, #FFE082 0%, #FFD54F 30%, #FFC107 50%, #FFB300 70%, #FF8F00 100%)' }}
    />
    
    {/* Middle metallic band */}
    <div className="absolute -inset-[3px] rounded-full"
      style={{ background: 'linear-gradient(180deg, #FFF8E1 0%, #FFE082 25%, #FFD54F 50%, #FFC107 75%, #FFB300 100%)' }}
    />
    
    {/* Inner highlight for 3D depth */}
    <div className="absolute -inset-[2px] rounded-full shadow-[inset_0_2px_6px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(180,130,0,0.5)]"
      style={{ background: 'linear-gradient(180deg, #FFFDE7 0%, #FFF9C4 30%, #FFE082 60%, #FFD54F 100%)' }}
    />
    
    {/* Main content - metallic gold 3D background */}
    <div className="relative flex items-center justify-between px-5 py-3 rounded-full text-white overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #D4A017 0%, #C49B30 15%, #B8860B 30%, #A67C00 50%, #8B6914 70%, #7A5C00 85%, #6B4F00 100%)',
        boxShadow: '0 3px 10px rgba(0,0,0,0.35), inset 0 2px 3px rgba(255,235,170,0.5), inset 0 -1px 3px rgba(100,70,0,0.4)' 
      }}
    >
      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'linear-gradient(105deg, transparent 25%, rgba(255,245,200,0.4) 45%, transparent 60%)' }}
      />
      
      {/* Left side - Icon and label */}
      <div className="flex items-center gap-3 relative">
        <div className="w-8 h-8 rounded-full flex items-center justify-center border border-yellow-300/50"
          style={{ background: 'linear-gradient(135deg, rgba(255,235,170,0.35) 0%, rgba(255,215,0,0.2) 100%)' }}
        >
          <Icon className="w-4 h-4 text-yellow-100 drop-shadow-[0_0_3px_rgba(255,215,0,0.6)]" />
        </div>
        <span className="font-bold text-sm tracking-wide uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{label}</span>
      </div>
      
      {/* Right side - Value */}
      <div className="flex items-center gap-1.5 relative">
        <span className="font-bold text-lg tracking-wider text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </span>
        {isCoin && (
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-yellow-200 drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]"
          >
            ©
          </motion.span>
        )}
      </div>
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
      className="relative overflow-hidden rounded-2xl shadow-xl border border-primary/20"
    >
      {/* Bright, elegant background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-primary-pale to-white" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231565C0' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
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
              className="w-12 h-12 object-contain relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
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
