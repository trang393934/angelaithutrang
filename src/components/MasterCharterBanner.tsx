import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sun, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export const MasterCharterBanner = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/docs/master-charter">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 md:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          {/* Background shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sun className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <Crown className="absolute -top-1 -right-1 w-4 h-4 text-amber-200" />
              </div>
              
              {/* Text */}
              <div className="text-white">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-amber-200 uppercase tracking-wide">
                    {t("masterCharter.banner.badge")}
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-bold leading-tight">
                  {t("masterCharter.banner.title")}
                </h3>
                <p className="text-xs text-amber-100 hidden sm:block mt-0.5">
                  {t("masterCharter.banner.subtitle")}
                </p>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
