import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Benefit {
  icon: string;
  titleKey: string;
  descKey: string;
  highlight?: boolean;
  link?: string;
}

const benefits: Benefit[] = [
  { icon: "🆓", titleKey: "benefits.free.title", descKey: "benefits.free.desc" },
  { icon: "🪙", titleKey: "benefits.earn.title", descKey: "benefits.earn.desc", highlight: true, link: "/earn" },
  { icon: "💰", titleKey: "benefits.withdraw.title", descKey: "benefits.withdraw.desc", highlight: true, link: "/earn" },
  { icon: "🔥", titleKey: "benefits.dailyLogin.title", descKey: "benefits.dailyLogin.desc", link: "/earn" },
  { icon: "🎨", titleKey: "benefits.imageGen.title", descKey: "benefits.imageGen.desc", link: "/chat" },
  { icon: "🔍", titleKey: "benefits.imageAnalyze.title", descKey: "benefits.imageAnalyze.desc", link: "/chat" },
  { icon: "✏️", titleKey: "benefits.imageEdit.title", descKey: "benefits.imageEdit.desc", link: "/chat" },
  { icon: "✍️", titleKey: "benefits.contentWriter.title", descKey: "benefits.contentWriter.desc", link: "/content-writer" },
  { icon: "📚", titleKey: "benefits.library.title", descKey: "benefits.library.desc", link: "/knowledge" },
  { icon: "🎯", titleKey: "benefits.visionBoard.title", descKey: "benefits.visionBoard.desc", link: "/vision" },
  { icon: "📝", titleKey: "benefits.journal.title", descKey: "benefits.journal.desc", link: "/earn" },
  { icon: "🏆", titleKey: "benefits.bounty.title", descKey: "benefits.bounty.desc", link: "/bounty" },
  { icon: "👥", titleKey: "benefits.community.title", descKey: "benefits.community.desc", link: "/community" },
  { icon: "💡", titleKey: "benefits.ideas.title", descKey: "benefits.ideas.desc", link: "/ideas" },
  { icon: "🔊", titleKey: "benefits.voice.title", descKey: "benefits.voice.desc", link: "/chat" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const BenefitsSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 rounded-full text-sm font-medium mb-4">
            ✨ {t("benefits.sectionBadge")} ✨
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            {t("benefits.sectionTitle")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("benefits.sectionSubtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {benefits.map((benefit, index) => {
            const content = (
              <Card
                className={`h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group ${
                  benefit.highlight
                    ? "bg-gradient-to-br from-amber-50 to-amber-100/80 border-amber-300/50 shadow-amber-100/50"
                    : "bg-white/80 hover:bg-white border-border/50"
                }`}
              >
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-2xl flex-shrink-0 ${
                        benefit.highlight ? "animate-pulse" : ""
                      }`}
                    >
                      {benefit.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-sm mb-1 ${
                          benefit.highlight
                            ? "text-amber-800"
                            : "text-foreground"
                        }`}
                      >
                        {t(benefit.titleKey)}
                      </h3>
                      <p
                        className={`text-xs leading-relaxed ${
                          benefit.highlight
                            ? "text-amber-700/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t(benefit.descKey)}
                      </p>
                    </div>
                  </div>
                  {benefit.link && (
                    <div className="mt-auto pt-2">
                      <span className="text-xs text-primary/70 group-hover:text-primary transition-colors">
                        {t("common.goTo")} →
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );

            return (
              <motion.div key={index} variants={itemVariants} className="h-full">
                {benefit.link ? (
                  <Link to={benefit.link} className="block h-full">
                    {content}
                  </Link>
                ) : (
                  <div className="h-full">{content}</div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};