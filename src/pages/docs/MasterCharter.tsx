import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sun, Crown, Globe, Users, Shield, Scale, Droplets, Flame, 
  Heart, Sparkles, Star, ChevronDown, ChevronUp, Coins, 
  HandHeart, Lightbulb, Zap, ArrowRight, CheckCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import beLyFounder from "@/assets/be-ly-founder.png";
import angelAiLogo from "@/assets/angel-ai-logo.png";
import funProfileLogo from "@/assets/fun-profile-logo.png";
import funPlayLogo from "@/assets/fun-play-logo.png";
import funPlanetLogo from "@/assets/fun-planet-logo.png";
import funAcademyLogo from "@/assets/fun-academy-logo.png";
import funCharityLogo from "@/assets/fun-charity-logo.png";
import funWalletLogo from "@/assets/fun-wallet-logo.png";
import funFarmLogo from "@/assets/fun-farm-logo.png";
import funEarthLogo from "@/assets/fun-earth-logo.png";
import fuLegalLogo from "@/assets/fu-legal-logo.png";
import funLifeLogo from "@/assets/fun-life-logo.png";
import camlyCoinLogo from "@/assets/camly-coin-logo.png";
import funMoneyLogo from "@/assets/fun-money-logo.png";

interface SectionProps {
  icon: React.ReactNode;
  number: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({ icon, number, title, children, defaultOpen = false }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-amber-200/50 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-amber-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg">
                  {icon}
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-amber-600">{number}</span>
                  <h3 className="text-lg md:text-xl font-bold text-amber-900">{title}</h3>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-amber-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-amber-600" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <AnimatePresence>
            {isOpen && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="pt-0 pb-6 px-6">
                    <div className="border-t border-amber-200/50 pt-6">
                      {children}
                    </div>
                  </CardContent>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Collapsible>
      </Card>
    </motion.div>
  );
};

const MasterCharter = () => {
  const { t } = useLanguage();

  const platforms = [
    { name: "FUN Profile", logo: funProfileLogo },
    { name: "FUN Play", logo: funPlayLogo },
    { name: "FUN Planet", logo: funPlanetLogo },
    { name: "FUNLife / Cosmic Game", logo: funLifeLogo },
    { name: "FUN Academy", logo: funAcademyLogo },
    { name: "FUN Charity", logo: funCharityLogo },
    { name: "FUN Wallet", logo: funWalletLogo },
    { name: "FUN Farm", logo: funFarmLogo },
    { name: "FUN Market", logo: funProfileLogo },
    { name: "FUN Legal", logo: fuLegalLogo },
    { name: "Green Earth", logo: funEarthLogo },
    { name: "Angel AI", logo: angelAiLogo },
  ];

  const divineMantras = [
    t("masterCharter.mantra1"),
    t("masterCharter.mantra2"),
    t("masterCharter.mantra3"),
    t("masterCharter.mantra4"),
    t("masterCharter.mantra5"),
    t("masterCharter.mantra6"),
    t("masterCharter.mantra7"),
    t("masterCharter.mantra8"),
  ];

  const earnModels = [
    "Learn & Earn",
    "Play & Earn", 
    "Invest & Earn",
    "Give & Gain",
    "Share & Have",
    "Own & Earn",
    "Review & Reward",
    "Build & Bounty"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50/30">
      <Header />
      
      {/* Hero Header */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-amber-100/50 to-transparent" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-2xl opacity-40 scale-150 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-2xl">
                  <Sun className="w-12 h-12 text-white" />
                </div>
                <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-500" />
              </div>
            </div>
            
            {/* Titles */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              <span>{t("masterCharter.badge")}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-3">
              {t("masterCharter.title")}
            </h1>
            
            <h2 className="text-xl md:text-2xl font-semibold text-amber-800/80 mb-4">
              {t("masterCharter.titleEn")}
            </h2>
            
            <p className="text-lg text-amber-700 italic mb-8">
              {t("masterCharter.tagline")}
            </p>
            
            {/* Banner */}
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {[
                t("masterCharter.free1"),
                t("masterCharter.free2"),
                t("masterCharter.free3"),
                t("masterCharter.free4")
              ].map((item, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl space-y-6">
          
          {/* Section I - Origin Declaration */}
          <CollapsibleSection
            icon={<Globe className="w-6 h-6" />}
            number="I"
            title={t("masterCharter.section1.title")}
            defaultOpen={true}
          >
            <div className="space-y-4 text-amber-900/80">
              <p className="text-lg font-medium text-amber-800">
                {t("masterCharter.section1.intro")}
              </p>
              <div className="grid gap-3 mt-4">
                {[
                  t("masterCharter.section1.point1"),
                  t("masterCharter.section1.point2"),
                  t("masterCharter.section1.point3"),
                  t("masterCharter.section1.point4")
                ].map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50">
                    <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                <p className="font-medium text-amber-800 mb-2">{t("masterCharter.section1.transformTitle")}</p>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-amber-600" />
                    <span>{t("masterCharter.section1.transform1")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-amber-600" />
                    <span>{t("masterCharter.section1.transform2")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-amber-600" />
                    <span>{t("masterCharter.section1.transform3")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-amber-600" />
                    <span>{t("masterCharter.section1.transform4")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section II - Core Mission */}
          <CollapsibleSection
            icon={<Star className="w-6 h-6" />}
            number="II"
            title={t("masterCharter.section2.title")}
          >
            <div className="space-y-4 text-amber-900/80">
              <p className="text-lg">{t("masterCharter.section2.intro")}</p>
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-200/50 to-orange-200/50 text-center">
                <p className="text-2xl font-bold text-amber-700">99% {t("masterCharter.section2.gift")}</p>
              </div>
              
              <p className="font-medium text-amber-800">{t("masterCharter.section2.through")}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {earnModels.map((model, index) => (
                  <div key={index} className="p-3 rounded-lg bg-amber-50 text-center border border-amber-200/50 hover:bg-amber-100 transition-colors">
                    <span className="text-sm font-medium text-amber-700">{model}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section III - Sacred Principles */}
          <CollapsibleSection
            icon={<Shield className="w-6 h-6" />}
            number="III"
            title={t("masterCharter.section3.title")}
          >
            <div className="space-y-4">
              {[
                { icon: Heart, title: t("masterCharter.section3.principle1.title"), desc: t("masterCharter.section3.principle1.desc") },
                { icon: Lightbulb, title: t("masterCharter.section3.principle2.title"), desc: t("masterCharter.section3.principle2.desc") },
                { icon: Coins, title: t("masterCharter.section3.principle3.title"), desc: t("masterCharter.section3.principle3.desc") },
                { icon: Zap, title: t("masterCharter.section3.principle4.title"), desc: t("masterCharter.section3.principle4.desc") },
                { icon: Users, title: t("masterCharter.section3.principle5.title"), desc: t("masterCharter.section3.principle5.desc") },
              ].map((principle, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <principle.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800">{index + 1}. {principle.title}</h4>
                    <p className="text-amber-700/80 text-sm mt-1">{principle.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Section IV - Two Sacred Flows */}
          <CollapsibleSection
            icon={<Droplets className="w-6 h-6" />}
            number="IV"
            title={t("masterCharter.section4.title")}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <img src={camlyCoinLogo} alt="Camly Coin" className="w-12 h-12 rounded-full shadow-lg" />
                  <div>
                    <h4 className="font-bold text-blue-800">💧 Camly Coin</h4>
                    <span className="text-sm text-blue-600">{t("masterCharter.section4.camlyCoin.subtitle")}</span>
                  </div>
                </div>
                <p className="text-blue-700/80 text-sm">{t("masterCharter.section4.camlyCoin.desc")}</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <img src={funMoneyLogo} alt="FUN Money" className="w-12 h-12 rounded-full shadow-lg" />
                  <div>
                    <h4 className="font-bold text-amber-800">☀️ FUN Money</h4>
                    <span className="text-sm text-amber-600">{t("masterCharter.section4.funMoney.subtitle")}</span>
                  </div>
                </div>
                <p className="text-amber-700/80 text-sm">{t("masterCharter.section4.funMoney.desc")}</p>
              </div>
            </div>
            <p className="mt-4 text-center text-amber-700 italic">{t("masterCharter.section4.together")}</p>
          </CollapsibleSection>

          {/* Section V - Platform Unity */}
          <CollapsibleSection
            icon={<Globe className="w-6 h-6" />}
            number="V"
            title={t("masterCharter.section5.title")}
          >
            <div className="space-y-4">
              <p className="text-amber-800">{t("masterCharter.section5.intro")}</p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {platforms.map((platform, index) => (
                  <div key={index} className="flex flex-col items-center p-3 rounded-xl bg-white/50 border border-amber-100 hover:shadow-md transition-all">
                    <img src={platform.logo} alt={platform.name} className="w-12 h-12 rounded-full mb-2" />
                    <span className="text-xs text-center text-amber-700 font-medium">{platform.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-amber-600 italic text-center mt-4">{t("masterCharter.section5.more")}</p>
            </div>
          </CollapsibleSection>

          {/* Section VI - Founder Role */}
          <CollapsibleSection
            icon={<Crown className="w-6 h-6" />}
            number="VI"
            title={t("masterCharter.section6.title")}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/40 to-orange-400/40 rounded-full blur-2xl scale-125" />
                <img 
                  src={beLyFounder} 
                  alt="Bé Ly" 
                  className="relative w-32 h-32 rounded-full object-cover object-top border-4 border-amber-300 shadow-xl"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 rounded-full text-xs font-semibold text-white shadow-lg">
                  👑 Cosmic Queen
                </div>
              </div>
              <div className="text-center md:text-left space-y-2">
                <h4 className="text-xl font-bold text-amber-800">Bé Ly (Camly Duong)</h4>
                <ul className="space-y-1 text-amber-700/80 text-sm">
                  <li>• {t("masterCharter.section6.role1")}</li>
                  <li>• {t("masterCharter.section6.role2")}</li>
                  <li>• {t("masterCharter.section6.role3")}</li>
                  <li>• {t("masterCharter.section6.role4")}</li>
                  <li>• {t("masterCharter.section6.role5")}</li>
                </ul>
                <p className="text-sm italic text-amber-600 mt-4">{t("masterCharter.section6.note")}</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section VII - Community Commitment */}
          <CollapsibleSection
            icon={<HandHeart className="w-6 h-6" />}
            number="VII"
            title={t("masterCharter.section7.title")}
          >
            <div className="space-y-3">
              <p className="text-amber-800 mb-4">{t("masterCharter.section7.intro")}</p>
              {[
                t("masterCharter.section7.commitment1"),
                t("masterCharter.section7.commitment2"),
                t("masterCharter.section7.commitment3"),
                t("masterCharter.section7.commitment4")
              ].map((commitment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="text-amber-800">{commitment}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Section VIII - Final Law */}
          <CollapsibleSection
            icon={<Scale className="w-6 h-6" />}
            number="VIII"
            title={t("masterCharter.section8.title")}
          >
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200">
              <p className="text-lg font-semibold text-amber-800 mb-4">{t("masterCharter.section8.intro")}</p>
              <blockquote className="text-xl italic text-amber-700">
                "{t("masterCharter.section8.law")}"
              </blockquote>
              <p className="mt-4 text-amber-600 font-medium">{t("masterCharter.section8.wisdom")}</p>
            </div>
          </CollapsibleSection>

          {/* Divine Seal - Most Prominent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 shadow-2xl">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span>{t("masterCharter.divineSeal.badge")}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {t("masterCharter.divineSeal.title")}
                  </h3>
                </div>
                
                <div className="grid gap-4 max-w-2xl mx-auto">
                  {divineMantras.map((mantra, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/60 border border-amber-200/50 hover:bg-white/80 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="text-amber-800 font-medium">{mantra}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Closing Declaration */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 md:p-12 text-center text-white shadow-2xl"
          >
            {/* Sunrise animation background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-1/2 bg-gradient-to-t from-amber-300/30 to-transparent rounded-t-full animate-pulse" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <Sun className="w-16 h-16 text-amber-200 animate-pulse" />
              </div>
              <h3 className="text-xl font-medium mb-2">🌅 {t("masterCharter.closing.badge")}</h3>
              <p className="text-lg mb-6">{t("masterCharter.closing.intro")}</p>
              <p className="text-2xl md:text-3xl font-bold mb-4">
                ✨ {t("masterCharter.closing.statement")} ✨
              </p>
              <div className="flex justify-center gap-2 text-3xl">
                <span>✨</span>
                <span>✨</span>
                <span>✨</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MasterCharter;
