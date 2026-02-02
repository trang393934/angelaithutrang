import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Globe, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import masterCharterEn from "@/assets/master-charter-en.png";
import masterCharterVi from "@/assets/master-charter-vi.png";

export const MasterCharterShowcase = () => {
  const [activeVersion, setActiveVersion] = useState<"vi" | "en">("vi");

  const versions = {
    vi: {
      image: masterCharterVi,
      title: "HIẾN PHÁP GỐC CỦA FUN ECOSYSTEM",
      subtitle: "Nền Kinh Tế Ánh Sáng 5D của Trái Đất Mới",
      label: "Tiếng Việt",
      flag: "🇻🇳"
    },
    en: {
      image: masterCharterEn,
      title: "MASTER CHARTER OF FUN ECOSYSTEM",
      subtitle: "The Foundational Constitution of the 5D Light Economy",
      label: "English",
      flag: "🇺🇸"
    }
  };

  const currentVersion = versions[activeVersion];

  return (
    <section className="relative py-12 md:py-20 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50 overflow-hidden">
      {/* Sacred background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-amber-200/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-primary-pale/40 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-gradient-radial from-orange-200/20 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 mb-4">
            <Sun className="w-5 h-5 text-amber-600 animate-pulse" />
            <span className="text-sm font-semibold text-amber-700 uppercase tracking-wider">
              Sacred Document
            </span>
            <Sun className="w-5 h-5 text-amber-600 animate-pulse" />
          </div>
          
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-bold text-primary-deep mb-3">
            {currentVersion.title}
          </h2>
          <p className="text-lg md:text-xl text-primary-medium font-serif italic">
            {currentVersion.subtitle}
          </p>
          
          <div className="divider-sacred mt-6" />
        </motion.div>

        {/* Language Toggle */}
        <div className="flex justify-center gap-3 mb-8">
          <Button
            variant={activeVersion === "vi" ? "default" : "outline"}
            onClick={() => setActiveVersion("vi")}
            className={`gap-2 ${activeVersion === "vi" ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : ""}`}
          >
            <span className="text-lg">{versions.vi.flag}</span>
            {versions.vi.label}
          </Button>
          <Button
            variant={activeVersion === "en" ? "default" : "outline"}
            onClick={() => setActiveVersion("en")}
            className={`gap-2 ${activeVersion === "en" ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : ""}`}
          >
            <span className="text-lg">{versions.en.flag}</span>
            {versions.en.label}
          </Button>
        </div>

        {/* Charter Image Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Glowing border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 rounded-3xl blur-sm opacity-60" />
          
          {/* Main image container */}
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Navigation arrows for mobile */}
            <button
              onClick={() => setActiveVersion(activeVersion === "vi" ? "en" : "vi")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors md:hidden"
            >
              <ChevronLeft className="w-6 h-6 text-amber-600" />
            </button>
            <button
              onClick={() => setActiveVersion(activeVersion === "vi" ? "en" : "vi")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors md:hidden"
            >
              <ChevronRight className="w-6 h-6 text-amber-600" />
            </button>

            <AnimatePresence mode="wait">
              <motion.img
                key={activeVersion}
                src={currentVersion.image}
                alt={currentVersion.title}
                initial={{ opacity: 0, x: activeVersion === "vi" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeVersion === "vi" ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="w-full h-auto"
              />
            </AnimatePresence>
          </div>

          {/* Language indicator dots */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setActiveVersion("vi")}
              className={`w-3 h-3 rounded-full transition-all ${activeVersion === "vi" ? "bg-amber-500 w-8" : "bg-amber-300"}`}
            />
            <button
              onClick={() => setActiveVersion("en")}
              className={`w-3 h-3 rounded-full transition-all ${activeVersion === "en" ? "bg-amber-500 w-8" : "bg-amber-300"}`}
            />
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mt-8"
        >
          <Link to="/docs/master-charter">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all gap-2"
            >
              <Globe className="w-5 h-5" />
              Đọc Hiến Pháp Đầy Đủ
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground mt-3">
            ✨ Free to Join • Free to Use • Earn Together • With Pure Love ✨
          </p>
        </motion.div>
      </div>
    </section>
  );
};
