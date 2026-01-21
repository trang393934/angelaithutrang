import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, MessageCircle, ShoppingBag, Bell, Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";
import funProfileLogo from "@/assets/fun-profile-logo.png";

interface UserStory {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export function CommunityHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMembers, setActiveMembers] = useState<UserStory[]>([]);
  const [userProfile, setUserProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  // Navigation items similar to Fun.rich
  const navItems = [
    { icon: Home, href: "/community", label: "Trang chủ" },
    { icon: Users, href: "/community-questions", label: "Câu hỏi" },
    { icon: MessageCircle, href: "/messages", label: "Tin nhắn" },
    { icon: ShoppingBag, href: "/earn", label: "Kiếm xu" },
  ];

  useEffect(() => {
    const fetchActiveMembers = async () => {
      // Get users who have posted recently
      const { data: recentPosters } = await supabase
        .from("community_posts")
        .select("user_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentPosters && recentPosters.length > 0) {
        const uniqueUserIds = [...new Set(recentPosters.map(p => p.user_id))].slice(0, 6);
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", uniqueUserIds);

        if (profiles) {
          setActiveMembers(profiles.map(p => ({
            id: p.user_id,
            user_id: p.user_id,
            display_name: p.display_name || "Thành viên",
            avatar_url: p.avatar_url,
          })));
        }
      }
    };

    const fetchUserProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserProfile(data);
    };

    fetchActiveMembers();
    fetchUserProfile();
  }, [user]);

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="sticky top-0 z-50">
      {/* Main Navigation Bar */}
      <header className="bg-background-pure border-b border-primary-pale/30 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Logo & Search */}
            <div className="flex items-center gap-3 flex-1">
              <Link to="/" className="flex-shrink-0">
                <img 
                  src={funProfileLogo} 
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
                  <AvatarImage src={userProfile?.avatar_url || angelAvatar} />
                  <AvatarFallback className="bg-primary-pale text-primary text-sm">
                    {userProfile?.display_name?.charAt(0) || "A"}
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
            {/* Create Story */}
            {user && (
              <Link to="/profile" className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className="relative">
                  <Avatar className="w-16 h-16 sm:w-[72px] sm:h-[72px] ring-2 ring-primary-pale/50">
                    <AvatarImage src={userProfile?.avatar_url || angelAvatar} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary-pale to-primary/20 text-primary text-lg">
                      {userProfile?.display_name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <span className="text-xs text-foreground-muted truncate max-w-[72px]">Tạo tin</span>
              </Link>
            )}

            {/* Active Members Stories */}
            {activeMembers.map((member, index) => {
              // Color gradients for story rings
              const ringColors = [
                "from-pink-500 to-rose-500",
                "from-violet-500 to-purple-500",
                "from-emerald-500 to-teal-500",
                "from-amber-500 to-orange-500",
                "from-cyan-500 to-blue-500",
                "from-fuchsia-500 to-pink-500",
              ];
              const ringColor = ringColors[index % ringColors.length];
              
              return (
                <Link 
                  key={member.id} 
                  to={`/user/${member.user_id}`}
                  className="flex flex-col items-center gap-1.5 min-w-[72px]"
                >
                  <div className={`p-[2px] rounded-full bg-gradient-to-br ${ringColor}`}>
                    <div className="p-[2px] bg-white rounded-full">
                      <Avatar className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px]">
                        <AvatarImage src={member.avatar_url || angelAvatar} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-primary-pale to-primary/30 text-primary">
                          {member.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-xs text-foreground truncate max-w-[72px] text-center">
                    {member.display_name.split(" ").slice(-2).join(" ")}
                  </span>
                </Link>
              );
            })}

            {/* Placeholder if no members yet */}
            {activeMembers.length === 0 && !user && (
              <div className="flex items-center justify-center w-full py-4 text-foreground-muted text-sm">
                <Link to="/auth" className="text-primary hover:underline">
                  Đăng nhập để xem hoạt động cộng đồng
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
