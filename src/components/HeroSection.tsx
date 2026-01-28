import { Link } from "react-router-dom";
import { Sparkles, PenLine } from "lucide-react";
import angelAvatar from "@/assets/angel-avatar.png";
import Leaderboard from "@/components/Leaderboard";
import { useLanguage } from "@/contexts/LanguageContext";

export const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-hero-gradient overflow-hidden">
      {/* Subtle angelic background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-radial from-primary-pale/40 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary-pale/20 to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8 lg:gap-12">
          {/* Left side - Angel Avatar and Content */}
          <div className="flex-1 text-center lg:text-left w-full">
            {/* Angel Avatar */}
            <div className="flex justify-center lg:justify-start mb-6 sm:mb-8 opacity-0 animate-fade-in">
              <div className="animate-glow-pulse rounded-full">
                <img
                  src={angelAvatar} 
                  alt="Angel AI Avatar" 
                  className="w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full animate-float object-cover"
                />
              </div>
            </div>

            {/* Main Title */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide text-primary-deep mb-3 sm:mb-4 opacity-0 animate-fade-in-slow animate-delay-200">
              {t("hero.title")}
            </h1>

            {/* Tagline */}
            <p className="font-serif text-lg sm:text-xl md:text-2xl text-primary-medium mb-2 sm:mb-3 opacity-0 animate-fade-in-slow animate-delay-300 px-2 sm:px-0">
              {t("hero.tagline")}
            </p>

            {/* Tagline English */}
            <p className="font-serif italic text-base sm:text-lg text-primary-soft/80 mb-6 sm:mb-8 opacity-0 animate-fade-in-slow animate-delay-400 px-4 sm:px-0">
              {t("hero.taglineEn")}
            </p>

            {/* Sacred Divider */}
            <div className="divider-sacred mb-6 sm:mb-8 opacity-0 animate-fade-in animate-delay-500 mx-auto lg:mx-0" />

            {/* Mission Statement */}
            <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base md:text-lg text-foreground-muted leading-relaxed mb-6 sm:mb-8 opacity-0 animate-fade-in-slow animate-delay-600 px-4 sm:px-0">
              {t("hero.mission")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center opacity-0 animate-fade-in animate-delay-700 px-4 sm:px-0">
              <Link to="/chat" className="btn-sacred group w-full sm:w-auto justify-center">
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{t("hero.ctaChat")}</span>
                  <span className="text-xs opacity-80">{t("hero.ctaChatSub")}</span>
                </div>
              </Link>
              <Link to="/community" className="btn-sacred-outline w-full sm:w-auto text-center justify-center">
                {t("hero.ctaCommunity")}
              </Link>
              <Link to="/content-writer" className="btn-sacred-outline group w-full sm:w-auto text-center justify-center">
                <PenLine className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                {t("hero.ctaContent")}
              </Link>
            </div>
          </div>

          {/* Right side - Leaderboard */}
          <div className="w-full lg:w-96 opacity-0 animate-fade-in animate-delay-500 px-4 sm:px-0">
            <Leaderboard />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
