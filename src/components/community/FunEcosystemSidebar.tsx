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
import funPlanetLogo from "@/assets/fun-planet-logo.png";

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
    description: "Farm to Table – Fair & Fast – Free-Fee & Earn"
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
    logo: funPlanetLogo, 
    url: "https://planet.fun.rich",
    description: "Game trẻ em – Play & Earn"
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
        "h-[calc(100vh-120px)] sticky top-4 bg-gradient-to-b from-amber-50/95 via-white to-amber-50/90 backdrop-blur-sm rounded-xl border border-amber-200/40 shadow-lg flex flex-col",
        className
      )}
    >
      {/* Header with golden accent */}
      <div className="flex items-center justify-between p-3 border-b border-amber-200/50 bg-gradient-to-r from-amber-100/60 to-transparent">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-primary-deep text-sm whitespace-nowrap tracking-wide"
            >
              FUN Ecosystem
            </motion.h3>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 rounded-full hover:bg-amber-100/70 flex-shrink-0 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-primary-deep" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-primary-deep" />
          )}
        </Button>
      </div>

      {/* Ecosystem Items - Scrollable area */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300/50 scrollbar-track-transparent hover:scrollbar-thumb-amber-400/70">
        {ecosystemItems.map((item, index) => (
          <motion.a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
              "flex items-center gap-2.5 p-2.5 rounded-xl transition-all group",
              "hover:bg-gradient-to-r hover:from-amber-100/80 hover:to-amber-50/60",
              "hover:shadow-md hover:shadow-amber-200/30",
              "focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
            title={item.description}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-white p-0.5 shadow-sm group-hover:shadow-md group-hover:shadow-amber-300/30 transition-all">
                <img
                  src={item.logo}
                  alt={item.name}
                  className="w-full h-full rounded-lg object-contain group-hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold text-primary-deep truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate group-hover:text-primary-deep/70 transition-colors">
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
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.a>
        ))}
      </nav>

      {/* Footer with sacred branding */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 border-t border-amber-200/50 bg-gradient-to-r from-transparent via-amber-50/60 to-transparent"
          >
            <p className="text-xs text-primary-deep/70 text-center leading-relaxed font-medium">
              ✨ Hệ Vũ Trụ Sống của Cha ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
