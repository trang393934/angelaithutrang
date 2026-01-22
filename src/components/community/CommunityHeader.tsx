import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, MessageCircle, ShoppingBag, Bell, Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useStories, GroupedStories } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";
import { CreateStoryModal } from "./CreateStoryModal";
import { motion, AnimatePresence } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import angelAiLogo from "@/assets/angel-ai-logo.png";

export function CommunityHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
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
        {/* Main Navigation Bar */}
        <header className="bg-background-pure border-b border-primary-pale/30 shadow-sm">
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
                <div className="relative hidden sm:block max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-10 bg-primary-pale/30 border-0 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-primary/20"
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
                          ? "bg-amber-400 text-white shadow-md" 
                          : "hover:bg-primary-pale/50 text-foreground-muted"
                      }`}
                      title={item.label}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${active ? "text-white" : ""}`} />
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-[1px] left-2 right-2 h-[3px] bg-amber-500 rounded-t-full"
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
                  className="rounded-full bg-primary-pale/30 hover:bg-primary-pale/50"
                >
                  <Bell className="w-5 h-5 text-foreground-muted" />
                </Button>
                
                <Link to={user ? "/profile" : "/auth"}>
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-primary-pale cursor-pointer hover:ring-primary transition-all">
                    <AvatarImage src={currentUserStories?.avatar_url || angelAvatar} />
                    <AvatarFallback className="bg-primary-pale text-primary text-sm">
                      {currentUserStories?.display_name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Stories Section */}
        <div className="bg-background-pure border-b border-primary-pale/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
              {/* Create Story Button */}
              {user && (
                <button
                  onClick={() => setShowCreateStory(true)}
                  className="flex flex-col items-center gap-1.5 min-w-[72px] cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="w-16 h-16 sm:w-[72px] sm:h-[72px] ring-2 ring-primary-pale/50">
                      <AvatarImage 
                        src={currentUserStories?.avatar_url || angelAvatar} 
                        className="object-cover" 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary-pale to-primary/20 text-primary text-lg">
                        {currentUserStories?.display_name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <span className="text-xs text-foreground-muted truncate max-w-[72px]">Tạo tin</span>
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
                      hasUnviewed ? "text-foreground font-medium" : "text-foreground-muted"
                    }`}>
                      {isCurrentUser ? "Tin của bạn" : group.display_name.split(" ").slice(-2).join(" ")}
                    </span>
                  </button>
                );
              })}

              {/* Empty state */}
              {groupedStories.length === 0 && !isLoading && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <p className="text-foreground-muted text-sm">
                    {user ? "Chưa có tin nào. Hãy tạo tin đầu tiên!" : (
                      <Link to="/auth" className="text-primary hover:underline">
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
