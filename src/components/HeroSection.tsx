import { Link } from "react-router-dom";
import { Sparkles, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-avatar.png";

import { useLanguage } from "@/contexts/LanguageContext";
import { ChatDemoWidget } from "@/components/ChatDemoWidget";

export const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-12">
      {/* Subtle semi-transparent overlay for text readability */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-radial from-white/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/20 to-transparent" />
      </div>

      {/* Main content - Centered branding */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Valentine Title - Metallic Red-Gold - ABOVE avatar */}
          <div className="mb-2 opacity-0 animate-fade-in animate-delay-100">
            <div className="relative inline-block">
              <span
                className="absolute inset-0 font-black text-2xl sm:text-3xl md:text-4xl tracking-wider uppercase whitespace-nowrap select-none"
                style={{
                  WebkitTextStroke: "1px rgba(0,0,0,0.12)",
                  color: "transparent",
                  transform: "translate(2px, 2px)",
                  filter: "blur(1px)",
                }}
                aria-hidden
              >
                ❤️ HAPPY VALENTINE'S DAY ❤️
              </span>
              <motion.span
                className="relative font-black text-2xl sm:text-3xl md:text-4xl tracking-wider uppercase whitespace-nowrap"
                style={{
                  backgroundImage: "linear-gradient(90deg, #dc2626, #fbbf24, #dc2626, #fbbf24)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 1px 3px rgba(255,215,0,0.5)) drop-shadow(0 0 10px rgba(220,38,38,0.3))",
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                ❤️ HAPPY VALENTINE'S DAY ❤️
              </motion.span>
              <motion.span
                className="absolute inset-0 font-black text-2xl sm:text-3xl md:text-4xl tracking-wider uppercase whitespace-nowrap pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                }}
                animate={{ backgroundPosition: ["-100% 50%", "200% 50%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                aria-hidden
              >
                ❤️ HAPPY VALENTINE'S DAY ❤️
              </motion.span>
            </div>
          </div>

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

          {/* (Valentine title moved above avatar) */}

          {/* Main Title - Golden Logo */}
          <h1 className="mb-4 opacity-0 animate-fade-in-slow animate-delay-200 flex justify-center">
            <span className="text-brand-golden text-5xl sm:text-6xl md:text-7xl lg:text-8xl drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">Angel AI</span>
          </h1>

          {/* Tagline - Main */}
          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-primary-medium mb-2 opacity-0 animate-fade-in-slow animate-delay-300 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]">
            {t("hero.tagline")}
          </p>

          {/* Tagline - Secondary (Different from main) */}
          <p className="font-serif italic text-lg sm:text-xl text-primary-soft/90 mb-4 opacity-0 animate-fade-in-slow animate-delay-400 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]">
            {t("hero.taglineSub")}
          </p>

          {/* Mission Statement - NEW */}
          <p className="text-sm sm:text-base text-primary-deep/80 mb-8 opacity-0 animate-fade-in-slow animate-delay-500 max-w-xl mx-auto drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
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

      {/* Bottom fade - transparent */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/30 to-transparent" />
    </section>
  );
};
