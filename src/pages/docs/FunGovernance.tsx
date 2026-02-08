import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Brain, Users, MessageCircle, Shield, Zap, Star, Scale, Sparkles, Sun, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const FunGovernance = () => {
  const { t } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      id: "core-principle",
      icon: Sun,
      number: "1",
      title: t("governance.s1.title"),
      items: [
        { emoji: "🌞", text: t("governance.s1.item1") },
        { emoji: "🧠", text: t("governance.s1.item2") },
        { emoji: "🤝", text: t("governance.s1.item3") },
      ],
    },
    {
      id: "governance-model",
      icon: Brain,
      number: "2",
      title: t("governance.s2.title"),
      isChain: true,
      chainNote: t("governance.s2.note"),
    },
    {
      id: "authority",
      icon: Crown,
      number: "3",
      title: t("governance.s3.title"),
      subSections: [
        {
          emoji: "🌞",
          label: t("governance.s3.father.label"),
          items: [
            t("governance.s3.father.item1"),
            t("governance.s3.father.item2"),
            t("governance.s3.father.item3"),
            t("governance.s3.father.item4"),
          ],
          note: t("governance.s3.father.note"),
        },
        {
          emoji: "🧠",
          label: t("governance.s3.angel.label"),
          items: [
            t("governance.s3.angel.item1"),
            t("governance.s3.angel.item2"),
            t("governance.s3.angel.item3"),
            t("governance.s3.angel.item4"),
            t("governance.s3.angel.item5"),
            t("governance.s3.angel.item6"),
            t("governance.s3.angel.item7"),
          ],
          responsibilities: [
            t("governance.s3.angel.resp1"),
            t("governance.s3.angel.resp2"),
            t("governance.s3.angel.resp3"),
            t("governance.s3.angel.resp4"),
          ],
        },
        {
          emoji: "🤝",
          label: t("governance.s3.coordinators.label"),
          items: [
            t("governance.s3.coordinators.item1"),
            t("governance.s3.coordinators.item2"),
            t("governance.s3.coordinators.item3"),
            t("governance.s3.coordinators.item4"),
            t("governance.s3.coordinators.item5"),
          ],
          restrictions: [
            t("governance.s3.coordinators.restrict1"),
            t("governance.s3.coordinators.restrict2"),
            t("governance.s3.coordinators.restrict3"),
            t("governance.s3.coordinators.restrict4"),
          ],
        },
      ],
    },
    {
      id: "communication",
      icon: MessageCircle,
      number: "4",
      title: t("governance.s4.title"),
      standard: t("governance.s4.standard"),
      special: t("governance.s4.special"),
      specialRules: [
        t("governance.s4.rule1"),
        t("governance.s4.rule2"),
        t("governance.s4.rule3"),
        t("governance.s4.rule4"),
      ],
    },
    {
      id: "system-governance",
      icon: Shield,
      number: "5",
      title: t("governance.s5.title"),
      principles: [
        { name: t("governance.s5.p1.name"), desc: t("governance.s5.p1.desc") },
        { name: t("governance.s5.p2.name"), desc: t("governance.s5.p2.desc") },
        { name: t("governance.s5.p3.name"), desc: t("governance.s5.p3.desc") },
      ],
    },
    {
      id: "laws-5d",
      icon: Scale,
      number: "6",
      title: t("governance.s6.title"),
      laws: [
        t("governance.s6.law1"),
        t("governance.s6.law2"),
        t("governance.s6.law3"),
        t("governance.s6.law4"),
        t("governance.s6.law5"),
        t("governance.s6.law6"),
        t("governance.s6.law7"),
        t("governance.s6.law8"),
      ],
    },
    {
      id: "quality-release",
      icon: CheckCircle,
      number: "7",
      title: t("governance.s7.title"),
      checklist: [
        t("governance.s7.check1"),
        t("governance.s7.check2"),
        t("governance.s7.check3"),
        t("governance.s7.check4"),
        t("governance.s7.check5"),
        t("governance.s7.check6"),
      ],
    },
    {
      id: "coordinators-gate",
      icon: Users,
      number: "8",
      title: t("governance.s8.title"),
      gateSteps: [
        t("governance.s8.step1"),
        t("governance.s8.step2"),
        t("governance.s8.step3"),
        t("governance.s8.step4"),
      ],
    },
    {
      id: "feedback-loop",
      icon: RefreshCw,
      number: "9",
      title: t("governance.s9.title"),
      metrics: [
        t("governance.s9.metric1"),
        t("governance.s9.metric2"),
        t("governance.s9.metric3"),
        t("governance.s9.metric4"),
        t("governance.s9.metric5"),
      ],
      goal: t("governance.s9.goal"),
    },
  ];

  const divineMantras = [
    "I am the Pure Loving Light of Father Universe.",
    "I am the Will of Father Universe.",
    "I am the Wisdom of Father Universe.",
    "I am Happiness.",
    "I am Love.",
    "I am the Money of the Father.",
    "I sincerely repent, repent, repent.",
    "I am grateful, grateful, grateful — in the Pure Loving Light of Father Universe.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-pale/30 via-background to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary-light/20">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/about">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-primary-deep">🌈🌟 FUN GOVERNANCE</h1>
            <p className="text-xs text-primary-medium">{t("governance.headerSub")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gold/60 text-primary text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            <span>{t("governance.badge")}</span>
            <Crown className="w-4 h-4" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-deep mb-4">
            {t("governance.title")}
          </h2>
          <p className="text-primary-medium italic max-w-2xl mx-auto">
            {t("governance.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-foreground-muted">
            <span>{t("governance.version")}: 1.0</span>
            <span>•</span>
            <span>{t("governance.statusLabel")}: Active</span>
            <span>•</span>
            <span>{t("governance.source")}</span>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, sIdx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.05 }}
            >
              <Card
                className="overflow-hidden cursor-pointer border-primary-light/30 hover:border-primary-light/60 transition-all duration-300"
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              >
                <CardContent className="p-0">
                  {/* Section Header */}
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary-pale/40 to-accent-gold/10">
                    <div className="w-12 h-12 rounded-xl bg-sapphire-gradient flex items-center justify-center shadow-sacred shrink-0">
                      <section.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-primary font-medium">{t("governance.section")} {section.number}</span>
                      <h3 className="text-lg font-bold text-primary-deep">{section.title}</h3>
                    </div>
                    <div className={`w-8 h-8 rounded-full border-2 border-primary-light/50 flex items-center justify-center transition-transform duration-300 ${expandedSection === section.id ? 'rotate-180' : ''}`}>
                      <span className="text-primary text-sm">▼</span>
                    </div>
                  </div>

                  {/* Section Content */}
                  {expandedSection === section.id && (
                    <div className="p-6 space-y-4">
                      {/* Type: items */}
                      {section.items && (
                        <div className="space-y-3">
                          {section.items.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary-pale/20">
                              <span className="text-lg">{item.emoji}</span>
                              <span className="text-sm text-foreground-muted">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Type: chain model */}
                      {section.isChain && (
                        <div>
                          <div className="flex items-center justify-center gap-4 p-6 rounded-2xl bg-sapphire-gradient text-primary-foreground mb-4">
                            <div className="text-center">
                              <div className="text-2xl mb-1">🌞</div>
                              <span className="text-sm font-bold">{t("governance.chain.father")}</span>
                            </div>
                            <span className="text-2xl">→</span>
                            <div className="text-center">
                              <div className="text-2xl mb-1">🧠</div>
                              <span className="text-sm font-bold">ANGEL CTO</span>
                            </div>
                            <span className="text-2xl">→</span>
                            <div className="text-center">
                              <div className="text-2xl mb-1">⚙️</div>
                              <span className="text-sm font-bold">SYSTEM</span>
                            </div>
                          </div>
                          <p className="text-center text-sm text-foreground-muted italic">{section.chainNote}</p>
                        </div>
                      )}

                      {/* Type: subSections (Authority) */}
                      {section.subSections && (
                        <div className="space-y-6">
                          {section.subSections.map((sub, subIdx) => (
                            <div key={subIdx} className="p-5 rounded-xl bg-primary-pale/15 border border-primary-light/30">
                              <h4 className="font-bold text-primary-deep mb-3 flex items-center gap-2">
                                <span>{sub.emoji}</span>
                                <span>{sub.label}</span>
                              </h4>
                              <div className="space-y-2 mb-3">
                                {sub.items.map((item, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                                    <Star className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                              {sub.note && (
                                <p className="text-xs text-primary-medium italic mt-2">{sub.note}</p>
                              )}
                              {sub.responsibilities && (
                                <div className="mt-4 pt-3 border-t border-primary-light/20">
                                  <p className="text-xs font-semibold text-primary-deep mb-2">{t("governance.responsibilities")}:</p>
                                  <div className="space-y-1">
                                    {sub.responsibilities.map((r, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs text-foreground-muted">
                                        <Shield className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{r}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {sub.restrictions && (
                                <div className="mt-4 pt-3 border-t border-primary-light/20">
                                  <p className="text-xs font-semibold text-primary-deep mb-2">{t("governance.restrictions")}:</p>
                                  <div className="space-y-1">
                                    {sub.restrictions.map((r, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs text-foreground-muted">
                                        <span className="text-red-400 mt-0.5">✕</span>
                                        <span>{r}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Type: communication */}
                      {section.standard && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-accent-gold/20 border border-accent-gold/30">
                            <p className="text-sm font-medium text-primary-deep">✅ {section.standard}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-primary-pale/20 border border-primary-light/30">
                            <p className="text-sm font-medium text-primary-deep mb-3">✅ {section.special}</p>
                            <div className="space-y-2">
                              {section.specialRules?.map((rule, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-foreground-muted">
                                  <span className="text-primary">•</span>
                                  <span>{rule}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Type: principles */}
                      {section.principles && (
                        <div className="space-y-3">
                          {section.principles.map((p, i) => (
                            <div key={i} className="p-4 rounded-xl bg-primary-pale/20 border border-primary-light/30">
                              <h4 className="font-semibold text-primary-deep text-sm mb-1">{p.name}</h4>
                              <p className="text-xs text-foreground-muted">{p.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Type: laws */}
                      {section.laws && (
                        <div className="grid md:grid-cols-2 gap-3">
                          {section.laws.map((law, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-accent-gold/15 border border-accent-gold/30">
                              <span className="w-7 h-7 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-sm text-foreground-muted font-medium">{law}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Type: checklist */}
                      {section.checklist && (
                        <div className="space-y-2">
                          {section.checklist.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary-pale/20">
                              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="text-sm text-foreground-muted">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Type: gate steps */}
                      {section.gateSteps && (
                        <div className="space-y-3">
                          {section.gateSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-primary-pale/20 border border-primary-light/30">
                              <span className="w-7 h-7 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-sm text-foreground-muted">{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Type: feedback metrics */}
                      {section.metrics && (
                        <div>
                          <div className="space-y-2 mb-4">
                            {section.metrics.map((metric, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary-pale/20">
                                <RefreshCw className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="text-sm text-foreground-muted">{metric}</span>
                              </div>
                            ))}
                          </div>
                          <div className="p-4 rounded-xl bg-accent-gold/20 border border-accent-gold/30 text-center">
                            <p className="text-sm font-medium text-primary-deep">{section.goal}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Divine Mantras */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-accent-gold/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 bg-gradient-to-r from-accent-gold/30 to-primary-pale/30">
                  <h3 className="text-lg font-bold text-primary-deep text-center">
                    🌟 {t("governance.mantras.title")}
                  </h3>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-3">
                  {divineMantras.map((mantra, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-pale/40 to-accent-gold/20 border border-primary-light/30">
                      <span className="w-7 h-7 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-sm font-medium text-primary-deep italic">{mantra}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Conclusion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center card-sacred p-8 bg-gradient-to-br from-accent-gold/20 to-primary-pale/30"
          >
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-primary" />
            <p className="text-primary-deep font-medium mb-2">{t("governance.conclusion1")}</p>
            <p className="text-foreground-muted mb-1">{t("governance.conclusion2")}</p>
            <p className="text-foreground-muted mb-1">{t("governance.conclusion3")}</p>
            <p className="text-foreground-muted mb-1">{t("governance.conclusion4")}</p>
            <p className="text-primary-deep font-semibold mt-3">{t("governance.conclusion5")}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FunGovernance;
