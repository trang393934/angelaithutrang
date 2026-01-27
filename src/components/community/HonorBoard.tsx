import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, Image, Video, Coins, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLeaderboard } from "@/hooks/useLeaderboard";
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
    {/* Metallic Gold 3D border effect - outer glow */}
    <div className="absolute -inset-[3px] rounded-full bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Metallic Gold 3D border - middle highlight */}
    <div className="absolute -inset-[2px] rounded-full bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500" />
    
    {/* Inner shadow for 3D depth */}
    <div className="absolute -inset-[1px] rounded-full bg-gradient-to-b from-yellow-300/80 via-amber-400/60 to-yellow-600/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.3)]" />
    
    {/* Main content */}
    <div className="relative flex items-center justify-between px-5 py-3 rounded-full bg-gradient-to-r from-primary-deep via-primary to-primary-deep text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      {/* Left side - Icon and label */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-yellow-400/30">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide uppercase">{label}</span>
      </div>
      
      {/* Right side - Value */}
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-lg tracking-wider">
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </span>
        {isCoin && (
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-yellow-300"
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
            {/* Sparkle effects around logo */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-primary-deep/30 to-primary/20 rounded-full blur-md"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 border border-dashed border-primary/30 rounded-full"
            />
            
            {/* Floating sparkles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
                className="absolute"
                style={{
                  top: `${-5 + i * 3}px`,
                  left: `${-5 + i * 12}px`
                }}
              >
                <Sparkles className="w-3 h-3 text-primary" />
              </motion.div>
            ))}
            
            <img 
              src={angelLogo} 
              alt="Angel AI" 
              className="w-12 h-12 object-contain relative z-10 drop-shadow-[0_0_10px_rgba(21,101,192,0.4)]"
            />
          </div>
          
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-deep via-primary to-primary-deep tracking-wider uppercase drop-shadow-lg">
            Bảng Danh Dự
          </h2>
        </div>

        {/* Stats items */}
        <div className="space-y-3">
          <StatItem
            icon={Users}
            label="Tổng Thành Viên"
            value={stats.totalMembers}
            delay={0.1}
          />
          <StatItem
            icon={FileText}
            label="Tổng Bài Viết"
            value={stats.totalPosts}
            delay={0.2}
          />
          <StatItem
            icon={Image}
            label="Tổng Hình Ảnh"
            value={stats.totalImages}
            delay={0.3}
          />
          <StatItem
            icon={Video}
            label="Tổng Video"
            value={stats.totalVideos}
            delay={0.4}
          />
          <StatItem
            icon={Coins}
            label="Tổng Phần Thưởng"
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
