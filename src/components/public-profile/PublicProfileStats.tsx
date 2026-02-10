import { Users, FileText, Heart, Award, Star, Coins, Wallet, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PublicProfileStats as StatsType } from "@/hooks/usePublicProfile";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";

interface PublicProfileStatsProps {
  stats: StatsType;
  showStats?: boolean;
  activeModulesCount?: number;
}

const statItems = [
  { key: "friends", icon: Users, labelKey: "publicProfile.statFriends" },
  { key: "posts", icon: FileText, labelKey: "publicProfile.statPosts" },
  { key: "likes", icon: Heart, labelKey: "publicProfile.statLikes" },
  { key: "balance", icon: Wallet, labelKey: "publicProfile.statBalance" },
  { key: "lifetimeEarned", icon: Award, labelKey: "publicProfile.statCoins" },
  { key: "lixiReward", icon: Gift, labelKey: "publicProfile.statLixi" },
  { key: "poplScore", icon: Star, labelKey: "publicProfile.statPoPL" },
  { key: "funMoneyTotal", icon: Coins, labelKey: "publicProfile.statFUN" },
  { key: "activeModules", icon: Star, labelKey: "publicProfile.statWorlds" },
] as const;

export function PublicProfileStats({ stats, showStats = true, activeModulesCount = 0 }: PublicProfileStatsProps) {
  const { t } = useLanguage();

  if (!showStats) return null;

  const values: Record<string, string> = {
    friends: stats.friends.toLocaleString(),
    posts: stats.posts.toLocaleString(),
    likes: stats.likes.toLocaleString(),
    balance: Math.floor(stats.balance).toLocaleString(),
    lifetimeEarned: Math.floor(stats.lifetimeEarned).toLocaleString(),
    lixiReward: stats.lixiReward > 0 ? Math.floor(stats.lixiReward).toLocaleString() : "0",
    poplScore: `${stats.poplScore}/100`,
    funMoneyTotal: stats.funMoneyTotal.toLocaleString(),
    activeModules: activeModulesCount.toString(),
  };

  const getIcon = (key: string, Icon: any) => {
    if (key === "balance" || key === "lifetimeEarned") {
      return <img src={camlyCoinLogo} alt="CAMLY" className="w-5 h-5 rounded-full" />;
    }
    if (key === "lixiReward") {
      return <span className="text-lg">🧧</span>;
    }
    if (key === "funMoneyTotal") {
      return <img src={funMoneyLogo} alt="FUN" className="w-5 h-5" />;
    }
    if (key === "activeModules") {
      return <span className="text-lg">🌍</span>;
    }
    return <Icon className="w-4 h-4 text-primary mb-1 group-hover:scale-110 transition-transform" />;
  };

  const getLabel = (key: string, labelKey: string) => {
    const translated = t(labelKey);
    if (translated && translated !== labelKey) return translated;
    switch (key) {
      case "friends": return "Bạn bè";
      case "posts": return "Bài viết";
      case "likes": return "Lượt thích";
      case "balance": return "Số dư";
      case "lifetimeEarned": return "Tích lũy";
      case "lixiReward": return "Lì xì Tết";
      case "poplScore": return "PoPL";
      case "funMoneyTotal": return "FUN Money";
      case "activeModules": return "FUN Worlds";
      default: return key;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="grid grid-cols-4 sm:grid-cols-9 gap-2 mt-8 max-w-4xl mx-auto"
    >
      {statItems.map(({ key, icon: Icon, labelKey }, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          className="flex flex-col items-center p-2.5 rounded-2xl bg-card border border-border-light shadow-soft hover:shadow-divine transition-all duration-300 group"
        >
          {getIcon(key, Icon)}
          <span className="text-base font-bold text-foreground mt-0.5">
            {values[key]}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium leading-tight text-center">
            {getLabel(key, labelKey)}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
