import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";
import type { PublicFriend } from "@/hooks/usePublicProfile";

interface PublicProfileFriendsProps {
  friends: PublicFriend[];
  totalFriends: number;
  userId: string;
  showFriendsCount?: boolean;
}

export function PublicProfileFriends({
  friends,
  totalFriends,
  userId,
  showFriendsCount = true,
}: PublicProfileFriendsProps) {
  const { t } = useLanguage();

  if (friends.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 max-w-2xl mx-auto"
    >
      <h2 className="text-lg font-bold text-foreground mb-4 text-center">
        {t("publicProfile.friendsTitle") || "👥 Bạn bè"}
        {showFriendsCount && (
          <span className="text-sm font-normal text-muted-foreground ml-1">
            ({totalFriends})
          </span>
        )}
      </h2>

      <div className="flex justify-center gap-3 flex-wrap">
        {friends.map((friend, index) => (
          <motion.div
            key={friend.user_id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
          >
            <Link
              to={friend.handle ? `/@${friend.handle}` : `/user/${friend.user_id}`}
              className="group flex flex-col items-center gap-1.5 p-2"
            >
              <Avatar className="w-14 h-14 border-2 border-border-light group-hover:border-primary/30 shadow-sm group-hover:shadow-glow transition-all duration-300">
                <AvatarImage
                  src={friend.avatar_url || angelAvatar}
                  alt={friend.display_name || "User"}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {friend.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[72px] text-center">
                {friend.display_name || "User"}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
