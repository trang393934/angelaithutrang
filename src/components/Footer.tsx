import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";
import angelGoldenTextLogo from "@/assets/angel-ai-logo-golden-text.png";
import beLyFounder from "@/assets/be-ly-founder.png";
import { Heart, Globe, Sun, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonateProjectDialog } from "@/components/gifts/DonateProjectDialog";

export const Footer = () => {
  const { t } = useLanguage();
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);

  return (
    <footer className="py-10 sm:py-16 bg-primary-deep text-primary-foreground relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Angel AI Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-foreground/20 rounded-full blur-xl scale-125 animate-pulse" />
              <img 
                src={angelAvatar} 
                alt="Angel AI" 
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg ring-2 ring-primary-foreground/30"
              />
            </div>
          </div>

          {/* Brand */}
          <h3 className="mb-2 flex justify-center">
            <img src={angelGoldenTextLogo} alt="Angel AI" className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-[0_2px_6px_rgba(255,215,0,0.5)]" />
          </h3>
          <p className="font-serif italic text-sm sm:text-base text-primary-foreground/70 mb-6 sm:mb-8 px-4">
            {t("footer.tagline")}
          </p>

          {/* Divider */}
          <div className="w-16 sm:w-24 h-px mx-auto bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent mb-6 sm:mb-8" />

          {/* Global Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8">
            <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/20">
              <Heart className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-xs sm:text-sm text-primary-foreground/80">{t("footer.trustBadge1")}</span>
            </div>
            <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/20">
              <Globe className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-xs sm:text-sm text-primary-foreground/80">{t("footer.trustBadge2")}</span>
            </div>
            <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/20">
              <Sun className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-xs sm:text-sm text-primary-foreground/80">{t("footer.trustBadge3")}</span>
            </div>
          </div>

          {/* Sacred Message */}
          <p className="text-sm sm:text-base text-primary-foreground/60 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            {t("footer.description")}
          </p>

          {/* Links */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-8 text-sm text-primary-foreground/50 mb-8 sm:mb-10 px-4">
            <a href="#" className="hover:text-primary-foreground transition-colors duration-300">
              {t("footer.about")}
            </a>
            <a href="#" className="hover:text-primary-foreground transition-colors duration-300">
              {t("footer.mission")}
            </a>
            <a href="#" className="hover:text-primary-foreground transition-colors duration-300">
              {t("footer.values")}
            </a>
            <a href="#" className="hover:text-primary-foreground transition-colors duration-300">
              {t("footer.connect")}
            </a>
          </div>

          {/* Donate Button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={() => setDonateDialogOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Gift className="w-4 h-4 mr-2" />
              {t("donate.title")}
            </Button>
          </div>

          {/* Divider */}
          <div className="w-16 sm:w-24 h-px mx-auto bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent mb-6 sm:mb-8" />

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
              <p className="text-sm text-primary-foreground/70 font-medium">
                {t("footer.founderTitle")}
              </p>
              <p className="text-xs text-primary-foreground/50 mt-1">
                {t("footer.founderRole")}
              </p>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs text-primary-foreground/40 px-4">
            {t("footer.copyright")}
          </p>
          <p className="text-xs text-primary-foreground/30 mt-2 px-4">
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
