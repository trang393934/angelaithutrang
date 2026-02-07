import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
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
    label: "Người dùng",
    colorClass: "text-purple-600 dark:text-purple-400",
    activeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    items: [
      { to: "/admin/statistics", icon: TrendingUp, label: "Thống kê" },
      { to: "/admin/early-adopters", icon: Users, label: "Early Adopters" },
    ],
  },
  {
    label: "Tài chính",
    colorClass: "text-amber-600 dark:text-amber-400",
    activeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    items: [
      { to: "/admin/withdrawals", icon: Wallet, label: "Rút coin" },
      { to: "/admin/project-fund", icon: Heart, label: "Quỹ" },
      { to: "/admin/mint-stats", icon: Sparkles, label: "FUN Money" },
      { to: "/admin/tip-reports", icon: Gift, label: "Tip Reports" },
    ],
  },
  {
    label: "Nội dung",
    colorClass: "text-blue-600 dark:text-blue-400",
    activeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    items: [
      { to: "/admin/knowledge", icon: MessageSquare, label: "Kiến thức" },
      { to: "/admin/ideas", icon: Zap, label: "Ý tưởng" },
      { to: "/admin/bounty", icon: FileText, label: "Bounty" },
    ],
  },
  {
    label: "Lịch sử",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    activeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    items: [
      { to: "/admin/activity-history", icon: History, label: "Lịch sử chat" },
      { to: "/admin/ai-usage", icon: BarChart3, label: "AI Usage" },
      { to: "/admin/image-history", icon: Image, label: "Lịch sử ảnh" },
    ],
  },
];

const AdminNavToolbar = () => {
  const location = useLocation();

  return (
    <div className="sticky top-[73px] z-40 bg-primary-pale/50 backdrop-blur-md border-b border-primary-pale">
      <div className="container mx-auto px-2 sm:px-4">
        <nav className="flex items-stretch gap-0 overflow-x-auto scrollbar-none py-1.5">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className="flex items-stretch shrink-0">
              {/* Group separator */}
              {groupIndex > 0 && (
                <div className="w-px bg-border/60 mx-1.5 my-1.5 self-stretch" />
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
        </nav>
      </div>
    </div>
  );
};

export default AdminNavToolbar;
