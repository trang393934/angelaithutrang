import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Home, Info, BookOpen, MessageCircle, Users, 
  PenLine, ArrowRightLeft, Star, PanelLeft, Gift, History, Shield, User, Crown
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import angelAvatar from "@/assets/angel-avatar.png";
import { GiftCoinDialog } from "@/components/gifts/GiftCoinDialog";
import { useAuth } from "@/hooks/useAuth";
import { AuthActionGuard } from "@/components/AuthActionGuard";

export function MainSidebar() {
  const { t } = useLanguage();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setAvatarUrl(data.avatar_url);
          setDisplayName(data.display_name);
        }
      });
  }, [user]);

  const navItems = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.about"), href: "/about", icon: Info },
    { label: t("nav.founder") || "Nhà sáng lập", href: "/about#founder", icon: Crown },
    { label: t("nav.knowledge"), href: "/knowledge", icon: BookOpen },
    { label: t("nav.connect"), href: "/chat", icon: MessageCircle },
    { label: t("nav.community") || "Cộng đồng", href: "/community", icon: Users },
    { label: t("nav.contentWriter"), href: "/content-writer", icon: PenLine },
    { label: t("nav.swap"), href: "/swap", icon: ArrowRightLeft },
    { label: t("nav.earn"), href: "/earn", icon: Star },
  ];

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-amber-200/30 !z-20"
    >
      {/* Header with Logo - 2cm (~20px) gap from top */}
      <SidebarHeader className="border-b border-amber-200/20 py-3 mt-5">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {isCollapsed ? (
            <SidebarTrigger className="hover:bg-amber-100/70 rounded-md p-1.5">
              <PanelLeft className="w-5 h-5 text-primary" />
            </SidebarTrigger>
          ) : (
            <>
              <span className="text-brand-golden text-2xl">Angel AI</span>
              <SidebarTrigger className="hover:bg-amber-100/70 rounded-md p-1.5">
                <PanelLeft className="w-5 h-5 text-primary" />
              </SidebarTrigger>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={`transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-primary to-primary-deep text-white shadow-md' 
                          : 'hover:bg-amber-100/70 text-foreground'
                      }`}
                    >
                      <NavLink to={item.href}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-primary'}`} />
                        <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Gift Button */}
              <SidebarMenuItem>
                <AuthActionGuard>
                  <button
                    onClick={() => setShowGiftDialog(true)}
                    className={`flex items-center gap-2 w-full rounded-lg py-2.5 px-3 transition-all duration-200
                      bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-medium shadow-md hover:shadow-lg
                      ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Gift className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>🎁 Tặng thưởng</span>}
                  </button>
                </AuthActionGuard>
              </SidebarMenuItem>

              {/* Transaction History */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/activity-history"}
                  tooltip="Lịch sử giao dịch"
                  className={`transition-all duration-200 ${
                    location.pathname === "/activity-history"
                      ? 'bg-gradient-to-r from-primary to-primary-deep text-white shadow-md'
                      : 'hover:bg-amber-100/70 text-foreground'
                  }`}
                >
                  <NavLink to="/activity-history">
                    <History className={`w-5 h-5 ${location.pathname === "/activity-history" ? 'text-white' : 'text-primary'}`} />
                    <span className={`font-medium ${location.pathname === "/activity-history" ? 'text-white' : ''}`}>Lịch sử giao dịch</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* User Management */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/admin/user-management"}
                  tooltip="Quản lý User"
                  className={`transition-all duration-200 ${
                    location.pathname === "/admin/user-management"
                      ? 'bg-gradient-to-r from-primary to-primary-deep text-white shadow-md'
                      : 'hover:bg-amber-100/70 text-foreground'
                  }`}
                >
                  <NavLink to="/admin/user-management">
                    <Shield className={`w-5 h-5 ${location.pathname === "/admin/user-management" ? 'text-white' : 'text-primary'}`} />
                    <span className={`font-medium ${location.pathname === "/admin/user-management" ? 'text-white' : ''}`}>Quản lý User</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Avatar + Toggle at bottom */}
      <div className={`border-t border-amber-200/20`}>
        {user && (
          <button
            onClick={() => navigate("/profile")}
            className={`flex items-center gap-2 w-full p-3 transition-all duration-200 hover:bg-amber-100/70 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Avatar className="w-8 h-8 shrink-0 ring-2 ring-primary/30">
              <AvatarImage src={avatarUrl || undefined} alt={displayName || "Profile"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <span className="text-sm font-medium text-foreground truncate">
                {displayName || user.email?.split("@")[0] || "Hồ sơ"}
              </span>
            )}
          </button>
        )}
        
      </div>

      {/* Gift Dialog */}
      <GiftCoinDialog
        open={showGiftDialog}
        onOpenChange={setShowGiftDialog}
        contextType="global"
      />
    </Sidebar>
  );
}

export default MainSidebar;
