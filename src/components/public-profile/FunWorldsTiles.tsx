import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

// Import logos
import funProfileLogo from "@/assets/fun-profile-logo.png";
import funPlayLogo from "@/assets/fun-play-logo.png";
import funAcademyLogo from "@/assets/fun-academy-logo.png";
import funFarmLogo from "@/assets/fun-farm-logo.png";
import funCharityLogo from "@/assets/fun-charity-logo.png";
import funWalletLogo from "@/assets/fun-wallet-logo.png";
import funPlanetLogo from "@/assets/fun-planet-logo.png";
import funEarthLogo from "@/assets/fun-earth-logo.png";
import funTreasuryLogo from "@/assets/fun-treasury-logo.png";

const funWorlds = [
  {
    name: "FUN Play",
    logo: funPlayLogo,
    url: "https://play.fun.rich",
    emoji: "🎬",
    descKey: "publicProfile.worldPlay",
  },
  {
    name: "FUN Academy",
    logo: funAcademyLogo,
    url: "https://academy.fun.rich",
    emoji: "🎓",
    descKey: "publicProfile.worldAcademy",
  },
  {
    name: "FUN Farm",
    logo: funFarmLogo,
    url: "https://farm.fun.rich",
    emoji: "🌱",
    descKey: "publicProfile.worldFarm",
  },
  {
    name: "FUN Charity",
    logo: funCharityLogo,
    url: "https://charity.fun.rich",
    emoji: "🤍",
    descKey: "publicProfile.worldCharity",
  },
  {
    name: "FUN Wallet",
    logo: funWalletLogo,
    url: "https://wallet.fun.rich",
    emoji: "💳",
    descKey: "publicProfile.worldWallet",
  },
  {
    name: "FUN Planet",
    logo: funPlanetLogo,
    url: "https://planet.fun.rich",
    emoji: "🎮",
    descKey: "publicProfile.worldPlanet",
  },
  {
    name: "Green Earth",
    logo: funEarthLogo,
    url: "https://greenearth-fun.lovable.app",
    emoji: "🌍",
    descKey: "publicProfile.worldEarth",
  },
  {
    name: "FUN Treasury",
    logo: funTreasuryLogo,
    url: "https://treasury.fun.rich",
    emoji: "📈",
    descKey: "publicProfile.worldTreasury",
  },
];

interface FunWorldsTilesProps {
  enabledModules?: string[];
  showModules?: boolean;
}

// Map module IDs to funWorlds entries
const MODULE_ID_MAP: Record<string, string> = {
  fun_play: "FUN Play",
  fun_academy: "FUN Academy",
  fun_farm: "FUN Farm",
  fun_charity: "FUN Charity",
  fun_invest: "FUN Treasury",
  fun_life: "FUN Planet",
  fun_market: "FUN Wallet",
};

export function FunWorldsTiles({ enabledModules, showModules = true }: FunWorldsTilesProps) {
  const { t } = useLanguage();

  if (!showModules) return null;

  const filteredWorlds = enabledModules
    ? funWorlds.filter((w) => {
        // Check if any enabled module maps to this world
        return enabledModules.some((m) => MODULE_ID_MAP[m] === w.name) ||
          // Also include worlds not in the map (like Green Earth)
          !Object.values(MODULE_ID_MAP).includes(w.name);
      })
    : funWorlds;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-8 max-w-2xl mx-auto"
    >
      <h2 className="text-lg font-bold text-foreground mb-4 text-center">
        {t("publicProfile.funWorldsTitle") || "🌍 Khám phá FUN Ecosystem"}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filteredWorlds.map((world, index) => (
          <motion.a
            key={world.name}
            href={world.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.04 }}
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border-light shadow-soft hover:shadow-divine hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-pale to-accent p-1.5 shadow-sm group-hover:shadow-glow transition-all">
              <img
                src={world.logo}
                alt={world.name}
                className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {world.name}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t(world.descKey) || world.emoji}
              </p>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}
