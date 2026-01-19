import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";

export const Footer = () => {
  const { t } = useLanguage();

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
          <h3 className="font-serif text-xl sm:text-2xl md:text-3xl mb-2 font-bold uppercase tracking-wide">
            {t("hero.title")}
          </h3>
          <p className="font-serif italic text-sm sm:text-base text-primary-foreground/70 mb-6 sm:mb-8 px-4">
            {t("footer.tagline")}
          </p>

          {/* Divider */}
          <div className="w-16 sm:w-24 h-px mx-auto bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent mb-6 sm:mb-8" />

          {/* Sacred Message */}
          <p className="text-sm sm:text-base text-primary-foreground/60 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            {t("footer.description")}
          </p>

          {/* Links */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-8 text-sm text-primary-foreground/50 mb-8 sm:mb-12 px-4">
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

          {/* Copyright */}
          <p className="text-xs text-primary-foreground/40 px-4">
            {t("footer.copyright")}
          </p>
          <p className="text-xs text-primary-foreground/30 mt-2 px-4">
            {t("footer.inspired")}
          </p>
        </div>
      </div>
    </footer>
  );
};
