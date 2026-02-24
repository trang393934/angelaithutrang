import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Home, Users, MessageCircle, Gift, Plus, LogOut, ChevronDown, Shield } from "lucide-react";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";
import { Web3WalletButton } from "@/components/Web3WalletButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useStories } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";
import { CreateStoryModal } from "./CreateStoryModal";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { FriendSearchModal } from "@/components/community/FriendSearchModal";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import angelAvatar from "@/assets/angel-avatar.png";
import angelAiLogo from "@/assets/angel-ai-logo.png";

import { useLanguage } from "@/contexts/LanguageContext";
import { getProfilePath } from "@/lib/profileUrl";

// Gift Button component for community header
const GiftButtonCommunity = () => {
  const [giftOpen, setGiftOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setGiftOpen(true)}
        className="flex items-center gap-1 px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 transition-all shadow-sm hover:shadow-md"
        title="Tặng thưởng"
      >
        <Gift className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-black" />
        <span className="hidden xl:inline text-xs font-bold text-black">Tặng thưởng</span>
      </button>
      <GiftCoinDialog open={giftOpen} onOpenChange={setGiftOpen} />
    </>
  );
};

export function CommunityHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shouldAutoFocusSearch = searchParams.get("search") === "1";
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(false);

  const { 
    groupedStories, 
    viewedStoryIds, 
    createStory, 
    markAsViewed, 
    deleteStory,
    isLoading 
  } = useStories();

  // Navigation items similar to Fun.rich
  const navItems = [
    { icon: Home, href: "/community", label: t("community.navHome"), action: null },
    { icon: Users, href: "/community?search=1", label: t("community.navFindFriends") || "Tìm bạn bè", action: () => setShowFriendSearch(true), mobileOnly: true },
    { icon: MessageCircle, href: "/messages", label: t("community.navMessages"), action: null },
    { icon: Gift, href: "/earn", label: t("nav.gift") || "Tặng thưởng", action: null },
  ];

  const isActive = (href: string) => {
    // Handle search param for Users/Find Friends tab
    if (href.includes("?")) {
      const [path, params] = href.split("?");
      return location.pathname === path && location.search.includes(params);
    }
    return location.pathname === href && !location.search.includes("search=1");
  };

  const [userProfile, setUserProfile] = useState<{ display_name: string | null; avatar_url: string | null; handle: string | null } | null>(null);

  const handleStoryClick = (groupIndex: number) => {
    setSelectedGroupIndex(groupIndex);
    setShowStoryViewer(true);
  };

  // Fetch user profile for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, handle")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setUserProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // Get current user's profile from grouped stories or fallback
  const currentUserStories = groupedStories.find(g => g.user_id === user?.id);

  // Color gradients for story rings
  const ringColors = [
    "from-pink-500 to-rose-500",
    "from-violet-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-blue-500",
    "from-fuchsia-500 to-pink-500",
  ];

  return (
    <>
      <div className="sticky top-0 z-50">
        {/* Main Navigation Bar - Bright Metallic Gold 3D */}
        <header className="relative border-b border-yellow-400/40 shadow-[0_4px_20px_rgba(255,215,0,0.3)]"
          style={{
            background: 'linear-gradient(180deg, #C49B30 0%, #E8C252 15%, #F5D976 40%, #FFF4C8 55%, #F5D976 70%, #E8C252 85%, #C49B30 100%)',
          }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-30" style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.8) 45%, transparent 55%)',
              animation: 'shimmer 4s ease-in-out infinite',
            }} />
          </div>
          {/* Inner shadow for 3D depth */}
          <div className="absolute inset-0 pointer-events-none rounded-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_6px_rgba(139,105,20,0.3)]" />
          
          <div className="container mx-auto px-2 sm:px-4 relative">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-0">
              {/* Left: Logo & Search */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Link to="/" className="flex-shrink-0">
                  <img 
                    src={angelAiLogo} 
                    alt="Angel AI" 
                    className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  />
                </Link>
                
                {/* Search Bar - desktop only */}
                <div className="flex-1 min-w-0 max-w-[160px] sm:max-w-xs">
                  <GlobalSearch 
                    variant="community" 
                    placeholder={t("community.search")}
                    className="w-full"
                    autoFocus={shouldAutoFocusSearch}
                  />
                </div>
              </div>

              {/* Center: Navigation Icons */}
              <nav className="flex items-center gap-0.5 sm:gap-2">
              {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const isMobileAction = item.mobileOnly && item.action;
                  
                  const handleClick = (e: React.MouseEvent) => {
                    if (isMobileAction && window.innerWidth < 640) {
                      e.preventDefault();
                      item.action!();
                    }
                  };
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={handleClick}
                      className={`relative flex items-center justify-center w-10 h-9 sm:w-20 sm:h-12 rounded-lg transition-all ${
                        active 
                          ? "bg-white shadow-[0_2px_10px_rgba(139,105,20,0.4)] ring-2 ring-yellow-300/60" 
                          : "hover:bg-white/30 text-black/80"
                      }`}
                      title={item.label}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${active ? "text-black" : "text-black/80 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]"}`} />
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-[1px] left-2 right-2 h-[3px] rounded-t-full"
                          style={{ background: 'linear-gradient(90deg, #8B6914, #E8C252, #8B6914)' }}
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Right: Notifications & Profile */}
              <div className="flex items-center gap-1 sm:gap-3 shrink-0 justify-end">
                {/* Gift Button */}
                <GiftButtonCommunity />
                <NotificationDropdown variant="community" />
                <span className="hidden sm:block"><Web3WalletButton /></span>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1">
                        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-yellow-200/70 cursor-pointer hover:ring-white transition-all shadow-[0_2px_8px_rgba(139,105,20,0.4)]">
                          <AvatarImage src={userProfile?.avatar_url || currentUserStories?.avatar_url || angelAvatar} />
                          <AvatarFallback className="bg-white text-primary-deep text-sm">
                            {userProfile?.display_name?.charAt(0) || currentUserStories?.display_name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-4 h-4 text-black/60 hidden sm:block" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {/* User Info Header - clickable to go to profile */}
                      <Link to={getProfilePath(user.id, userProfile?.handle)} className="block px-3 py-2 border-b border-border hover:bg-accent rounded-t-md transition-colors">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {userProfile?.display_name || currentUserStories?.display_name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </Link>
                      
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/admin/dashboard" className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {/* Logout */}
                      <DropdownMenuItem 
                        onClick={() => signOut()}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>{t("nav.logout") || "Đăng xuất"}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth">
                    <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-yellow-200/70 cursor-pointer hover:ring-white transition-all shadow-[0_2px_8px_rgba(139,105,20,0.4)]">
                      <AvatarImage src={angelAvatar} />
                      <AvatarFallback className="bg-white text-primary-deep text-sm">A</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stories Section - White Background */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
              {/* Create Story Button */}
              {user && (
                <button
                  onClick={() => setShowCreateStory(true)}
                  className="flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="w-16 h-16 sm:w-[72px] sm:h-[72px] ring-2 ring-primary/30">
                      <AvatarImage 
                        src={currentUserStories?.avatar_url || angelAvatar} 
                        className="object-cover" 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary-pale to-primary/20 text-primary-deep text-lg">
                        {currentUserStories?.display_name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-deep rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <span className="text-xs text-gray-700 font-medium truncate max-w-[72px]">Tạo tin</span>
                </button>
              )}

              {/* User Stories */}
              {groupedStories.map((group, index) => {
                // Skip current user if they appear in stories (we show them in create button)
                const isCurrentUser = group.user_id === user?.id;
                const ringColor = ringColors[index % ringColors.length];
                const hasUnviewed = group.hasUnviewed;
                
                return (
                  <button
                    key={group.user_id}
                    onClick={() => handleStoryClick(index)}
                    className="flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer"
                  >
                    <div 
                      className={`p-[2px] rounded-full ${
                        hasUnviewed 
                          ? `bg-gradient-to-br ${ringColor}` 
                          : "bg-gray-300"
                      }`}
                    >
                      <div className="p-[2px] bg-white rounded-full">
                        <Avatar className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px]">
                          <AvatarImage 
                            src={group.avatar_url || angelAvatar} 
                            className="object-cover" 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary-pale to-primary/30 text-primary">
                            {group.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <span className={`text-xs truncate max-w-[72px] text-center ${
                      hasUnviewed ? "text-gray-900 font-medium" : "text-gray-600"
                    }`}>
                      {isCurrentUser ? t("community.yourStory") : group.display_name.split(" ").slice(-2).join(" ")}
                    </span>
                  </button>
                );
              })}

              {/* Empty state */}
              {groupedStories.length === 0 && !isLoading && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <p className="text-gray-600 text-sm">
                    {user ? t("community.noStoriesYet") : (
                      <Link to="/auth" className="text-primary-deep font-medium hover:underline">
                        {t("community.loginToViewStories")}
                      </Link>
                    )}
                  </p>
                </div>
              )}

              {/* Loading skeleton */}
              {isLoading && groupedStories.length === 0 && (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1.5 min-w-[72px]">
                      <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-primary-pale/30 animate-pulse" />
                      <div className="w-12 h-3 bg-primary-pale/30 rounded animate-pulse" />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {showStoryViewer && groupedStories.length > 0 && (
          <StoryViewer
            groupedStories={groupedStories}
            initialGroupIndex={selectedGroupIndex}
            currentUserId={user?.id}
            viewedStoryIds={viewedStoryIds}
            onClose={() => setShowStoryViewer(false)}
            onViewed={markAsViewed}
            onDelete={deleteStory}
          />
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onSubmit={createStory}
      />

      {/* Friend Search Modal (mobile) */}
      <FriendSearchModal
        open={showFriendSearch}
        onClose={() => setShowFriendSearch(false)}
      />

    </>
  );
}
