import { useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  Home, Info, BookOpen, MessageCircle, Users, 
  PenLine, ArrowRightLeft, Star, PanelLeft, Gift, History
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
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
  const [showGiftDialog, setShowGiftDialog] = useState(false);

  const navItems = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.about"), href: "/about", icon: Info },
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
      className="border-r border-amber-200/30 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50"
    >
      {/* Header with Logo - 2cm (~20px) gap from top */}
      <SidebarHeader className="border-b border-amber-200/30 py-4 mt-5">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
          {isCollapsed ? (
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src={angelAvatar} alt="Angel AI" className="w-8 h-8 object-contain" />
                </div>
              </div>
            </div>
          ) : (
            <span className="text-brand-golden text-2xl">Angel AI</span>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Toggle Button at bottom */}
      <div className={`p-3 border-t border-amber-200/30 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <SidebarTrigger className="w-full justify-center hover:bg-amber-100/70" />
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
