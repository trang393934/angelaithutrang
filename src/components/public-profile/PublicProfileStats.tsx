import { Users, FileText, Heart, Award, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PublicProfileStats as StatsType } from "@/hooks/usePublicProfile";

interface PublicProfileStatsProps {
  stats: StatsType;
}

const statItems = [
  { key: "friends", icon: Users, labelKey: "publicProfile.statFriends" },
  { key: "posts", icon: FileText, labelKey: "publicProfile.statPosts" },
  { key: "likes", icon: Heart, labelKey: "publicProfile.statLikes" },
  { key: "lifetimeEarned", icon: Award, labelKey: "publicProfile.statCoins" },
  { key: "poplScore", icon: Star, labelKey: "publicProfile.statPoPL" },
] as const;

export function PublicProfileStats({ stats }: PublicProfileStatsProps) {
  const { t } = useLanguage();

  const values: Record<string, string> = {
    friends: stats.friends.toLocaleString(),
    posts: stats.posts.toLocaleString(),
    likes: stats.likes.toLocaleString(),
    lifetimeEarned: Math.floor(stats.lifetimeEarned).toLocaleString(),
    poplScore: `${stats.poplScore}/100`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-8 max-w-2xl mx-auto"
    >
      {statItems.map(({ key, icon: Icon, labelKey }, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          className="flex flex-col items-center p-3 rounded-2xl bg-card border border-border-light shadow-soft hover:shadow-divine transition-all duration-300 group"
        >
          <Icon className="w-4 h-4 text-primary mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-lg font-bold text-foreground">
            {values[key]}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            {t(labelKey) ||
              (key === "friends"
                ? "Bạn bè"
                : key === "posts"
                ? "Bài viết"
                : key === "likes"
                ? "Lượt thích"
                : key === "lifetimeEarned"
                ? "CAMLY"
                : "PoPL")}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
