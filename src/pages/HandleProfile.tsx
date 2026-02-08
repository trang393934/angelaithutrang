import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicProfileHeader } from "@/components/public-profile/PublicProfileHeader";
import { PublicProfileActions } from "@/components/public-profile/PublicProfileActions";
import { PublicProfileStats } from "@/components/public-profile/PublicProfileStats";
import { PublicProfileFriends } from "@/components/public-profile/PublicProfileFriends";
import { FunWorldsTiles } from "@/components/public-profile/FunWorldsTiles";
import { PublicProfilePosts } from "@/components/public-profile/PublicProfilePosts";
import { PublicProfileJoinCTA } from "@/components/public-profile/PublicProfileJoinCTA";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import angelLogo from "@/assets/angel-ai-golden-logo.png";

/**
 * FUN Public Landing Profile — fun.rich/{handle}
 * Publicly accessible profile page optimized for sharing & viral growth.
 */
const HandleProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const { t } = useLanguage();
  const { profile, stats, recentPosts, friends, isLoading, notFound } =
    usePublicProfile(handle);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-pale via-background to-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">
            {t("publicProfile.loading") || "Đang tải hồ sơ..."}
          </span>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-pale via-background to-background">
        <div className="text-center space-y-4 p-8 max-w-sm">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("publicProfile.notFoundTitle") || "Không tìm thấy hồ sơ"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("publicProfile.notFoundDesc") || "Link"}{" "}
            <span className="font-mono font-medium text-primary">
              fun.rich/{handle}
            </span>{" "}
            {t("publicProfile.notFoundSuffix") || "chưa có ai sử dụng."}
          </p>
          <Link to="/">
            <Button className="mt-2">
              {t("publicProfile.goHome") || "Về Trang Chủ"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary-pale/20">
      {/* Header: Cover + Avatar + Name + Handle + Bio */}
      <PublicProfileHeader profile={profile} stats={stats} />

      {/* Action Buttons: Follow, Message, Send Gift */}
      <div className="px-4">
        <PublicProfileActions
          userId={profile.user_id}
          displayName={profile.display_name}
        />
      </div>

      {/* Social Proof Stats */}
      <div className="px-4">
        <PublicProfileStats stats={stats} />
      </div>

      {/* Friends Preview */}
      <div className="px-4">
        <PublicProfileFriends
          friends={friends}
          totalFriends={stats.friends}
          userId={profile.user_id}
        />
      </div>

      {/* Recent Posts */}
      <div className="px-4">
        <PublicProfilePosts posts={recentPosts} profile={profile} />
      </div>

      {/* FUN Worlds / Ecosystem Tiles */}
      <div className="px-4">
        <FunWorldsTiles />
      </div>

      {/* Join CTA for non-logged-in users */}
      <div className="px-4">
        <PublicProfileJoinCTA />
      </div>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <img src={angelLogo} alt="Angel AI" className="w-6 h-6" />
          <span className="text-xs font-medium text-muted-foreground">
            FUN Ecosystem · Powered by Angel AI
          </span>
        </Link>
      </footer>
    </div>
  );
};

export default HandleProfile;
