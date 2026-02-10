import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
import { PublicProfileFeatured } from "@/components/public-profile/PublicProfileFeatured";
import { AskAngelButton } from "@/components/public-profile/AskAngelButton";
import { trackProfileEvent } from "@/lib/profileEvents";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import angelLogo from "@/assets/angel-ai-golden-logo.png";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";
import { useState } from "react";

const updateMetaTags = (profile: { display_name: string | null; bio: string | null; avatar_url: string | null; handle: string | null }) => {
  document.title = `${profile.display_name || "FUN Member"} | FUN Profile`;

  const setMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  const desc = profile.bio || `${profile.display_name || "FUN Member"} trên FUN Ecosystem`;
  const url = `${window.location.origin}/@${profile.handle}`;
  setMeta("og:title", `${profile.display_name || "FUN Member"} | FUN Profile`);
  setMeta("og:description", desc);
  setMeta("og:url", url);
  if (profile.avatar_url) setMeta("og:image", profile.avatar_url);
  setMeta("og:type", "profile");
};

const HandleProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const { profile, stats, recentPosts, friends, publicSettings, isLoading, notFound } =
    usePublicProfile(handle);

  // Store referral param
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("fun_referrer", ref);
    }
  }, [searchParams]);

  // Track profile view + set meta tags
  useEffect(() => {
    if (profile?.user_id) {
      const ref = searchParams.get("ref") || localStorage.getItem("fun_referrer") || undefined;
      trackProfileEvent(profile.user_id, "view", undefined, ref);
      updateMetaTags(profile);
    }
  }, [profile?.user_id]);

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
              angel.fun.rich/{handle}
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
      {/* Header: Cover + Avatar + Name + Handle + Bio + Tagline + Badge */}
      <PublicProfileHeader
        profile={profile}
        stats={stats}
        tagline={publicSettings.tagline}
        badgeType={publicSettings.badge_type}
      />

      {/* Ask Angel Button + TẶNG THƯỞNG CTA */}
      <div className="flex items-center justify-center gap-3 mt-2 px-4 flex-wrap">
        <AskAngelButton
          displayName={profile.display_name}
          userId={profile.user_id}
          handle={profile.handle}
        />
        <button
          onClick={() => setShowGiftDialog(true)}
          className="btn-golden-3d flex items-center gap-2 px-5 py-2.5 rounded-full !text-black font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 animate-shimmer"
        >
          <Gift className="w-4 h-4" />
          🌟 TẶNG THƯỞNG
        </button>
      </div>

      {/* Gift Dialog */}
      <GiftCoinDialog
        open={showGiftDialog}
        onOpenChange={setShowGiftDialog}
        preselectedUser={{
          id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        }}
        contextType="profile"
      />

      {/* Action Buttons: Follow, Message, Send Gift (privacy-aware) */}
      <div className="px-4">
        <PublicProfileActions
          userId={profile.user_id}
          displayName={profile.display_name}
          publicSettings={publicSettings}
        />
      </div>

      {/* Social Proof Stats (privacy-aware) */}
      <div className="px-4">
        <PublicProfileStats stats={stats} showStats={publicSettings.show_stats} activeModulesCount={publicSettings.enabled_modules?.length || 0} />
      </div>

      {/* Friends Preview (privacy-aware) */}
      <div className="px-4">
        <PublicProfileFriends
          friends={friends}
          totalFriends={stats.friends}
          userId={profile.user_id}
          showFriendsCount={publicSettings.show_friends_count}
        />
      </div>

      {/* Featured Content */}
      <div className="px-4">
        <PublicProfileFeatured featuredItems={publicSettings.featured_items} />
      </div>

      {/* Recent Posts */}
      <div className="px-4">
        <PublicProfilePosts posts={recentPosts} profile={profile} />
      </div>

      {/* FUN Worlds / Ecosystem Tiles (filtered by enabled_modules) */}
      <div className="px-4">
        <FunWorldsTiles
          enabledModules={publicSettings.enabled_modules}
          showModules={publicSettings.show_modules}
        />
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
