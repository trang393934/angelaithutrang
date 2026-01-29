import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import logos
import funProfileLogo from "@/assets/fun-profile-logo.png";
import funPlayLogo from "@/assets/fun-play-logo.png";
import funAcademyLogo from "@/assets/fun-academy-logo.png";
import funFarmLogo from "@/assets/fun-farm-logo.png";
import funCharityLogo from "@/assets/fun-charity-logo.png";
import funWalletLogo from "@/assets/fun-wallet-logo.png";
import funLifeLogo from "@/assets/fun-life-logo.png";
import funTreasuryLogo from "@/assets/fun-treasury-logo.png";
import fuLegalLogo from "@/assets/fu-legal-logo.png";
import fuTradingLogo from "@/assets/fu-trading-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";
import funEarthLogo from "@/assets/fun-earth-logo.png";

const ecosystemItems = [
  { 
    name: "FUN Profile", 
    logo: funProfileLogo, 
    url: "https://fun.rich",
    description: "Hồ sơ cá nhân"
  },
  { 
    name: "FUN Farm", 
    logo: funFarmLogo, 
    url: "https://farm.fun.rich",
    description: "Nông trại số"
  },
  { 
    name: "FUN Charity", 
    logo: funCharityLogo, 
    url: "https://charity.fun.rich",
    description: "Từ thiện & Lan tỏa"
  },
  { 
    name: "FUN Academy", 
    logo: funAcademyLogo, 
    url: "https://academy.fun.rich",
    description: "Học viện tri thức"
  },
  { 
    name: "FUN Play", 
    logo: funPlayLogo, 
    url: "https://play.fun.rich",
    description: "Video Web3 platform. Play & Earn. Shine Your Light!"
  },
  { 
    name: "FUN Planet", 
    logo: funLifeLogo, 
    url: "https://planet.fun.rich",
    description: "Hành tinh FUN"
  },
  { 
    name: "FUN Wallet", 
    logo: funWalletLogo, 
    url: "https://wallet.fun.rich",
    description: "Ví điện tử"
  },
  { 
    name: "FUN Treasury", 
    logo: funTreasuryLogo, 
    url: "https://treasury.fun.rich",
    description: "Kho báu & Đầu tư"
  },
  { 
    name: "Green Earth", 
    logo: funEarthLogo, 
    url: "https://greenearth-fun.lovable.app",
    description: "Bảo vệ Trái Đất"
  },
  { 
    name: "Camly Coin", 
    logo: funMoneyLogo, 
    url: "https://camly.co",
    description: "Đồng tiền Ánh Sáng"
  },
];

interface FunEcosystemSidebarProps {
  className?: string;
}

export function FunEcosystemSidebar({ className }: FunEcosystemSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 60 : "100%" }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      className={cn(
        "h-fit bg-white/90 backdrop-blur-sm rounded-xl border border-primary/10 shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary-pale/30">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-primary-deep text-sm whitespace-nowrap"
            >
              FUN Ecosystem
            </motion.h3>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 rounded-full hover:bg-primary-pale/50 flex-shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-foreground-muted" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-foreground-muted" />
          )}
        </Button>
      </div>

      {/* Ecosystem Items */}
      <nav className="p-2 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
        {ecosystemItems.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2.5 p-2 rounded-lg transition-all group",
              "hover:bg-gradient-to-r hover:from-primary-pale/60 hover:to-primary-pale/30",
              "focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
            title={item.description}
          >
            <img
              src={item.logo}
              alt={item.name}
              className="w-8 h-8 rounded-lg object-contain flex-shrink-0 group-hover:scale-110 transition-transform"
            />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary-deep transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-foreground-muted truncate">
                    {item.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-foreground-muted/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </a>
        ))}
      </nav>

      {/* Footer */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 border-t border-primary-pale/30"
          >
            <p className="text-xs text-foreground-muted text-center leading-relaxed">
              Hệ Vũ Trụ Sống của Cha
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
