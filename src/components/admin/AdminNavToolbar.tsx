import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  UserCog,
  Wallet,
  Heart,
  Sparkles,
  FileText,
  MessageSquare,
  Zap,
  History,
  BarChart3,
  Image,
  Gift,
  Shield,
  FileBarChart,
  Siren,
} from "lucide-react";

interface NavGroup {
  label: string;
  colorClass: string;
  activeClass: string;
  items: {
    to: string;
    icon: React.ElementType;
    label: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Quản lý",
    colorClass: "text-purple-600 dark:text-purple-400",
    activeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    items: [
      { to: "/admin/user-management", icon: UserCog, label: "Quản lý User" },
      { to: "/admin/wallet-management", icon: Wallet, label: "Quản lý Ví" },
      { to: "/admin/withdrawals", icon: Wallet, label: "Rút coin" },
      { to: "/admin/mint-stats", icon: Sparkles, label: "FUN Money" },
      { to: "/admin/tet-reward", icon: Gift, label: "Thưởng Tết" },
      { to: "/admin/knowledge", icon: MessageSquare, label: "Kiến thức" },
      { to: "/admin/ideas", icon: Zap, label: "Ý tưởng" },
    ],
  },
  {
    label: "Tài chính",
    colorClass: "text-amber-600 dark:text-amber-400",
    activeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    items: [
      { to: "/admin/project-fund", icon: Heart, label: "Quỹ" },
      { to: "/admin/mint-approval", icon: Shield, label: "Mint Approval" },
      { to: "/admin/tip-reports", icon: Gift, label: "Tip Reports" },
    ],
  },
  {
    label: "Nội dung",
    colorClass: "text-blue-600 dark:text-blue-400",
    activeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    items: [
      { to: "/admin/bounty", icon: FileText, label: "Bounty" },
    ],
  },
  {
    label: "Thống kê",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    activeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    items: [
      { to: "/admin/statistics", icon: TrendingUp, label: "Thống kê" },
      { to: "/admin/early-adopters", icon: Users, label: "Early Adopters" },
      { to: "/admin/activity-history", icon: History, label: "Lịch sử chat" },
      { to: "/admin/ai-usage", icon: BarChart3, label: "AI Usage" },
      { to: "/admin/image-history", icon: Image, label: "Lịch sử ảnh" },
    ],
  },
  {
    label: "Báo cáo",
    colorClass: "text-rose-600 dark:text-rose-400",
    activeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    items: [
      { to: "/admin/report", icon: FileBarChart, label: "Báo cáo" },
    ],
  },
];

const AdminNavToolbar = () => {
  const location = useLocation();
  const [unreviewedCount, setUnreviewedCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("fraud_alerts")
        .select("id", { count: "exact", head: true })
        .eq("is_reviewed", false);
      setUnreviewedCount(count || 0);
    };
    fetchCount();
  }, []);

  return (
    <div className="sticky top-[73px] z-40 bg-primary-pale/50 backdrop-blur-md border-b border-primary-pale">
      <div className="container mx-auto px-2 sm:px-4">
        <nav className="flex items-start flex-wrap gap-y-1 py-1.5">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className="flex items-center shrink-0">
              {/* Group separator */}
              {groupIndex > 0 && (
                <div className="w-px bg-border/60 mx-1.5 my-1 self-stretch min-h-[24px]" />
              )}

              {/* Group label (visible on md+) */}
              <span
                className={cn(
                  "hidden md:flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 shrink-0",
                  group.colorClass
                )}
              >
                {group.label}
              </span>

              {/* Group items */}
              <div className="flex items-center gap-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.to;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                        isActive
                          ? group.activeClass
                          : "text-foreground-muted hover:text-foreground hover:bg-background-pure/60"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Fraud Alerts button - always visible with badge */}
          <div className="flex items-stretch shrink-0">
            <div className="w-px bg-border/60 mx-1.5 my-1.5 self-stretch" />
            <Link
              to="/admin/fraud-alerts"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 relative",
                location.pathname === "/admin/fraud-alerts"
                  ? "bg-destructive/10 text-destructive"
                  : "text-destructive hover:bg-destructive/10"
              )}
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Cảnh báo</span>
              {unreviewedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1 leading-none">
                  {unreviewedCount > 99 ? "99+" : unreviewedCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default AdminNavToolbar;
