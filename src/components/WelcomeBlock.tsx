import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export const WelcomeBlock = () => {
  const { t } = useLanguage();

  const features = [
    { key: "welcome.free1", icon: "✅" },
    { key: "welcome.free2", icon: "✅" },
    { key: "welcome.free3", icon: "✅" },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Main Welcome Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/80 border border-amber-200/50 shadow-lg backdrop-blur-sm">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/10 to-transparent opacity-60 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-amber-300/20 to-transparent opacity-50 translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative p-6 sm:p-8 lg:p-10">
            {/* Header with sparkle */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-primary-deep">
                {t("welcome.title")}
              </h2>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>

            {/* Description */}
            <p className="text-center text-foreground-muted text-base sm:text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
              {t("welcome.description")}
            </p>

            {/* Mission Statement */}
            <div className="text-center mb-6">
              <p className="text-sm sm:text-base text-primary-medium italic font-medium">
                ✨ {t("welcome.mission")} ✨
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-amber-100/80 border border-primary/20 shadow-sm"
                >
                  <span className="text-lg">{feature.icon}</span>
                  <span className="font-semibold text-primary-deep text-sm sm:text-base">
                    {t(feature.key)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-amber-200/50">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-primary-medium/80">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-primary" />
                  {t("welcome.badge1")}
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-primary" />
                  {t("welcome.badge2")}
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-primary" />
                  {t("welcome.badge3")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default WelcomeBlock;
