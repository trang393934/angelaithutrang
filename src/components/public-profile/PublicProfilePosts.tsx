import { FileText, Heart, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getProfilePath } from "@/lib/profileUrl";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import angelAvatar from "@/assets/angel-avatar.png";
import type { PublicPost, PublicProfileData } from "@/hooks/usePublicProfile";

interface PublicProfilePostsProps {
  posts: PublicPost[];
  profile: PublicProfileData;
}

export function PublicProfilePosts({ posts, profile }: PublicProfilePostsProps) {
  const { t, currentLanguage } = useLanguage();

  if (posts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="mt-8 max-w-2xl mx-auto"
    >
      <h2 className="text-lg font-bold text-foreground mb-4 text-center">
        {t("publicProfile.recentPosts") || "📝 Bài viết gần đây"}
      </h2>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.08 }}
            className="bg-card border border-border-light rounded-2xl shadow-soft p-4 hover:shadow-divine transition-all duration-300"
          >
            {/* Post header */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={profile.avatar_url || angelAvatar}
                  alt={profile.display_name || "User"}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {profile.display_name || "FUN Member"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: currentLanguage === "vi" ? vi : undefined,
                  })}
                </p>
              </div>
            </div>

            {/* Post content */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
              {post.content}
            </p>

            {/* Post image */}
            {(post.image_url || (post.image_urls && post.image_urls.length > 0)) && (
              <div className="mt-3 rounded-xl overflow-hidden">
                <img
                  src={post.image_url || post.image_urls?.[0] || ""}
                  alt="Post"
                  className="w-full max-h-64 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Post stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-light">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Heart className="w-3.5 h-3.5" />
                {post.likes_count || 0}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.comments_count || 0}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Share2 className="w-3.5 h-3.5" />
                {post.shares_count || 0}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View all posts CTA */}
      {profile.user_id && (
        <div className="text-center mt-4">
          <Link to={getProfilePath(profile.user_id, profile.handle)}>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              {t("publicProfile.viewAllPosts") || "Xem tất cả bài viết"}
            </Button>
          </Link>
        </div>
      )}
    </motion.section>
  );
}
