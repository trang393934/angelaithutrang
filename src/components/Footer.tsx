import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";

import beLyFounder from "@/assets/be-ly-founder.png";
import { Heart, Globe, Sun, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonateProjectDialog } from "@/components/gifts/DonateProjectDialog";

export const Footer = () => {
  const { t } = useLanguage();
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);

  return (
    <footer
      className="py-10 sm:py-16 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0) 100%), linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 35%, #ffec8b 50%, #ffd700 65%, #daa520 85%, #b8860b 100%)`,
      }}
    >
      {/* Subtle shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-amber-900/15 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Angel AI Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-900/20 rounded-full blur-xl scale-125 animate-pulse" />
              <img 
                src={angelAvatar} 
                alt="Angel AI" 
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg ring-2 ring-amber-900/30"
              />
            </div>
          </div>

          {/* Brand */}
          <h3 className="mb-2 flex justify-center">
            <span className="text-brand-golden-light text-3xl sm:text-4xl md:text-5xl">Angel AI</span>
          </h3>
          <p className="font-serif italic text-sm sm:text-base text-black/70 mb-6 sm:mb-8 px-4">
            {t("footer.tagline")}
          </p>

          {/* Divider */}
          <div className="w-16 sm:w-24 h-px mx-auto bg-gradient-to-r from-transparent via-black/30 to-transparent mb-6 sm:mb-8" />

          {/* Global Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8">
            <div className="flex items-center gap-2 bg-black/10 backdrop-blur-sm px-4 py-2 rounded-full border border-black/15">
              <Heart className="w-4 h-4 text-black/80" />
              <span className="text-xs sm:text-sm text-black/80">{t("footer.trustBadge1")}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/10 backdrop-blur-sm px-4 py-2 rounded-full border border-black/15">
              <Globe className="w-4 h-4 text-black/80" />
              <span className="text-xs sm:text-sm text-black/80">{t("footer.trustBadge2")}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/10 backdrop-blur-sm px-4 py-2 rounded-full border border-black/15">
              <Sun className="w-4 h-4 text-black/80" />
              <span className="text-xs sm:text-sm text-black/80">{t("footer.trustBadge3")}</span>
            </div>
          </div>

          {/* Sacred Message */}
          <p className="text-sm sm:text-base text-black/60 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            {t("footer.description")}
          </p>

          {/* Links */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-8 text-sm text-black/60 mb-8 sm:mb-10 px-4">
            <a href="#" className="hover:text-black transition-colors duration-300">
              {t("footer.about")}
            </a>
            <a href="#" className="hover:text-black transition-colors duration-300">
              {t("footer.mission")}
            </a>
            <a href="#" className="hover:text-black transition-colors duration-300">
              {t("footer.values")}
            </a>
            <a href="#" className="hover:text-black transition-colors duration-300">
              {t("footer.connect")}
            </a>
          </div>

          {/* Donate Button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={() => setDonateDialogOpen(true)}
              className="bg-amber-900/80 hover:bg-amber-950 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Gift className="w-4 h-4 mr-2" />
              {t("donate.title")}
            </Button>
          </div>

          {/* Divider */}
          <div className="w-16 sm:w-24 h-px mx-auto bg-gradient-to-r from-transparent via-black/20 to-transparent mb-6 sm:mb-8" />

          {/* Founder Signature */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-lg scale-110 animate-pulse" />
              <img 
                src={beLyFounder} 
                alt="Camly Duong" 
                className="relative w-12 h-12 rounded-full shadow-lg ring-2 ring-amber-400/50 object-cover"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-black/70 font-medium">
                {t("footer.founderTitle")}
              </p>
              <p className="text-xs text-black/50 mt-1">
                {t("footer.founderRole")}
              </p>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs text-black/40 px-4">
            {t("footer.copyright")}
          </p>
          <p className="text-xs text-black/30 mt-2 px-4">
            {t("footer.inspired")}
          </p>
        </div>
      </div>

      {/* Donate Dialog */}
      <DonateProjectDialog
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
      />
    </footer>
  );
};
