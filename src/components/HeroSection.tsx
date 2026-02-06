import { Link } from "react-router-dom";
import { Sparkles, PenLine } from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";
import angelGoldenTextLogo from "@/assets/angel-ai-logo-golden-text.png";

import { useLanguage } from "@/contexts/LanguageContext";
import { ChatDemoWidget } from "@/components/ChatDemoWidget";

export const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-hero-gradient overflow-hidden py-12">
      {/* Subtle angelic background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-radial from-primary-pale/40 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary-pale/20 to-transparent" />
      </div>

      {/* Main content - Centered branding */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Angel Avatar - Centered */}
          <div className="mb-6 sm:mb-8 opacity-0 animate-fade-in">
            <div className="animate-glow-pulse rounded-full">
              <img
                src={angelAvatar} 
                alt="Angel AI Avatar" 
                className="w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-full animate-float object-cover"
              />
            </div>
          </div>

          {/* Main Title - Golden Logo */}
          <h1 className="mb-4 opacity-0 animate-fade-in-slow animate-delay-200 flex justify-center">
            <img src={angelGoldenTextLogo} alt="Angel AI" className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain drop-shadow-[0_4px_8px_rgba(139,105,20,0.5)]" />
          </h1>

          {/* Tagline - Main */}
          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-primary-medium mb-2 opacity-0 animate-fade-in-slow animate-delay-300">
            {t("hero.tagline")}
          </p>

          {/* Tagline - Secondary (Different from main) */}
          <p className="font-serif italic text-lg sm:text-xl text-primary-soft/80 mb-4 opacity-0 animate-fade-in-slow animate-delay-400">
            {t("hero.taglineSub")}
          </p>

          {/* Mission Statement - NEW */}
          <p className="text-sm sm:text-base text-primary-deep/70 mb-8 opacity-0 animate-fade-in-slow animate-delay-500 max-w-xl mx-auto">
            ✨ {t("hero.missionStatement")} ✨
          </p>

          {/* Sacred Divider */}
          <div className="divider-sacred mb-6 opacity-0 animate-fade-in animate-delay-600" />

          {/* Chat Demo Widget - For non-logged-in users */}
          <ChatDemoWidget />

          {/* Mission Statement - Localized */}
          <div className="max-w-4xl px-2 text-xs sm:text-sm md:text-base lg:text-lg text-foreground-muted leading-relaxed mb-8 opacity-0 animate-fade-in-slow animate-delay-700 text-center uppercase font-semibold tracking-wide">
            <span className="text-primary-deep font-bold block">{t("hero.missionLine1")}</span>
            <span className="text-primary-deep font-bold block">{t("hero.missionLine2")}</span>
          </div>

          {/* CTA Buttons - Chat is PRIMARY */}
          <div className="flex flex-col gap-4 justify-center items-center opacity-0 animate-fade-in animate-delay-800">
            {/* Primary CTA - Talk to Angel AI - Positioned on top, 20% larger */}
            <Link to="/chat" className="btn-sacred group w-full sm:w-auto justify-center scale-110 shadow-xl shadow-primary/40 hover:scale-[1.15] transition-all duration-300 px-8 py-4">
              <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
              <div className="flex flex-col items-start">
                <span className="font-bold text-lg">{t("hero.ctaChat")}</span>
                <span className="text-xs opacity-80">{t("hero.ctaChatSub")}</span>
              </div>
            </Link>
            
            {/* Secondary CTAs - Row below */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link to="/community" className="btn-sacred-outline w-full sm:w-auto text-center justify-center">
                {t("hero.ctaCommunity")}
              </Link>
              <Link to="/content-writer" className="btn-sacred-outline group w-full sm:w-auto text-center justify-center">
                <PenLine className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                {t("hero.ctaContent")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
