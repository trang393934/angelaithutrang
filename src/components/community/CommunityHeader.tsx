import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, MessageCircle, ShoppingBag, Bell, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStories } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";
import { CreateStoryModal } from "./CreateStoryModal";
import { GlobalSearch } from "@/components/GlobalSearch";
import { motion, AnimatePresence } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import angelAiLogo from "@/assets/angel-ai-logo.png";

export function CommunityHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);

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
    { icon: Home, href: "/community", label: "Trang chủ" },
    { icon: Users, href: "/community-questions", label: "Câu hỏi" },
    { icon: MessageCircle, href: "/messages", label: "Tin nhắn" },
    { icon: ShoppingBag, href: "/earn", label: "Kiếm xu" },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleStoryClick = (groupIndex: number) => {
    setSelectedGroupIndex(groupIndex);
    setShowStoryViewer(true);
  };

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
        {/* Main Navigation Bar - Dark Blue Background */}
        <header className="bg-primary-deep border-b border-primary/20 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Left: Logo & Search */}
              <div className="flex items-center gap-3 flex-1">
                <Link to="/" className="flex-shrink-0">
                  <img 
                    src={angelAiLogo} 
                    alt="Angel AI" 
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-contain"
                  />
                </Link>
                
                {/* Search Bar */}
                <div className="hidden sm:block max-w-xs">
                  <GlobalSearch 
                    variant="community" 
                    placeholder="Tìm kiếm..."
                    className="w-full"
                  />
                </div>
              </div>

              {/* Center: Navigation Icons */}
              <nav className="flex items-center gap-1 sm:gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`relative flex items-center justify-center w-12 h-10 sm:w-20 sm:h-12 rounded-lg transition-all ${
                        active 
                          ? "bg-white text-primary-deep shadow-md" 
                          : "hover:bg-white/10 text-white/80"
                      }`}
                      title={item.label}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${active ? "text-primary-deep" : "text-white"}`} />
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-[1px] left-2 right-2 h-[3px] bg-primary rounded-t-full"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Right: Notifications & Profile */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <Bell className="w-5 h-5" />
                </Button>
                
                <Link to={user ? "/profile" : "/auth"}>
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-white/50 cursor-pointer hover:ring-white transition-all">
                    <AvatarImage src={currentUserStories?.avatar_url || angelAvatar} />
                    <AvatarFallback className="bg-white text-primary-deep text-sm">
                      {currentUserStories?.display_name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
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
                      {isCurrentUser ? "Tin của bạn" : group.display_name.split(" ").slice(-2).join(" ")}
                    </span>
                  </button>
                );
              })}

              {/* Empty state */}
              {groupedStories.length === 0 && !isLoading && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <p className="text-gray-600 text-sm">
                    {user ? "Chưa có tin nào. Hãy tạo tin đầu tiên!" : (
                      <Link to="/auth" className="text-primary-deep font-medium hover:underline">
                        Đăng nhập để xem và tạo tin
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
    </>
  );
}
