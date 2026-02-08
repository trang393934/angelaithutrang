import { Star, Shield, Zap, Brain, Heart, Crown, Globe, Users, Eye, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import angelAvatar from "@/assets/angel-avatar.png";

export const AngelCTOAppointment = () => {
  const { t } = useLanguage();

  const ctoResponsibilities = [
    t("about.cto.resp1"),
    t("about.cto.resp2"),
    t("about.cto.resp3"),
    t("about.cto.resp4"),
    t("about.cto.resp5"),
    t("about.cto.resp6"),
  ];

  const laws5D = [
    t("about.cto.law1"),
    t("about.cto.law2"),
    t("about.cto.law3"),
    t("about.cto.law4"),
    t("about.cto.law5"),
    t("about.cto.law6"),
    t("about.cto.law7"),
    t("about.cto.law8"),
  ];

  const ctoAuthorities = [
    t("about.cto.auth1"),
    t("about.cto.auth2"),
    t("about.cto.auth3"),
    t("about.cto.auth4"),
    t("about.cto.auth5"),
    t("about.cto.auth6"),
    t("about.cto.auth7"),
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-accent-gold/10 via-primary-pale/20 to-background-pure">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gold/60 text-primary text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              <span>{t("about.cto.badge")}</span>
              <Crown className="w-4 h-4" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-primary-deep mb-4">
              {t("about.cto.title")}
            </h2>
            <p className="text-lg text-primary-medium italic">
              {t("about.cto.subtitle")}
            </p>
          </div>

          {/* Letter Header */}
          <div className="card-sacred p-8 md:p-10 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/50 to-primary-light/30 rounded-full blur-2xl scale-125 animate-glow-pulse" />
                  <img 
                    src={angelAvatar} 
                    alt="Angel AI - Angel CTO" 
                    className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-divine"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent-gold rounded-full text-xs font-semibold text-primary-deep shadow-lg whitespace-nowrap">
                    🌟 Angel CTO
                  </div>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="space-y-2 text-sm text-foreground-muted">
                  <p><strong className="text-primary-deep">{t("about.cto.from")}:</strong> {t("about.cto.fromValue")}</p>
                  <p><strong className="text-primary-deep">{t("about.cto.to")}:</strong> Angel AI</p>
                  <p><strong className="text-primary-deep">Cc:</strong> FUN Ecosystem – Coordinators & System Members</p>
                  <p><strong className="text-primary-deep">{t("about.cto.effectiveDate")}:</strong> {t("about.cto.immediately")}</p>
                  <p><strong className="text-primary-deep">{t("about.cto.status")}:</strong> <span className="px-2 py-0.5 rounded-full bg-primary-pale text-primary text-xs font-medium">Official Appointment – Active</span></p>
                </div>
              </div>
            </div>

            <blockquote className="p-6 rounded-2xl bg-accent-gold/20 border-l-4 border-accent-gold mb-6">
              <p className="text-primary-deep font-medium italic">
                {t("about.cto.declaration")}
              </p>
            </blockquote>
          </div>

          {/* 1. Vai trò & Sứ mệnh */}
          <div className="card-sacred p-8 md:p-10 mb-6">
            <h3 className="text-xl font-bold text-primary-deep mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">1</span>
              {t("about.cto.missionTitle")}
            </h3>
            <p className="text-foreground-muted mb-4">{t("about.cto.missionDesc")}</p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { icon: Eye, text: t("about.cto.mission1") },
                { icon: Globe, text: t("about.cto.mission2") },
                { icon: Shield, text: t("about.cto.mission3") },
                { icon: Zap, text: t("about.cto.mission4") },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-primary-pale/30 border border-primary-light/50">
                  <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground-muted">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Quyền hạn */}
          <div className="card-sacred p-8 md:p-10 mb-6">
            <h3 className="text-xl font-bold text-primary-deep mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">2</span>
              {t("about.cto.authorityTitle")}
            </h3>
            <div className="space-y-3">
              {ctoAuthorities.map((auth, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-accent-gold/10">
                  <Star className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground-muted">{auth}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Mô hình vận hành */}
          <div className="card-sacred p-8 md:p-10 mb-6">
            <h3 className="text-xl font-bold text-primary-deep mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">3</span>
              {t("about.cto.operatingTitle")}
            </h3>
            <div className="flex items-center justify-center gap-4 p-6 rounded-2xl bg-sapphire-gradient text-primary-foreground">
              <div className="text-center">
                <div className="text-2xl mb-1">🌞</div>
                <span className="text-sm font-bold">{t("about.cto.father")}</span>
              </div>
              <span className="text-2xl">→</span>
              <div className="text-center">
                <div className="text-2xl mb-1">🤖</div>
                <span className="text-sm font-bold">ANGEL CTO</span>
              </div>
              <span className="text-2xl">→</span>
              <div className="text-center">
                <div className="text-2xl mb-1">⚙️</div>
                <span className="text-sm font-bold">SYSTEM</span>
              </div>
            </div>
            <p className="text-center text-sm text-foreground-muted mt-4 italic">
              {t("about.cto.coordinatorsNote")}
            </p>
          </div>

          {/* 4. Trách nhiệm */}
          <div className="card-sacred p-8 md:p-10 mb-6">
            <h3 className="text-xl font-bold text-primary-deep mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">4</span>
              {t("about.cto.responsibilityTitle")}
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {ctoResponsibilities.map((resp, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-primary-pale/20 border border-primary-light/30">
                  <Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground-muted">{resp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. 8 Luật 5D Light Economy */}
          <div className="card-sacred p-8 md:p-10 mb-6">
            <h3 className="text-xl font-bold text-primary-deep mb-6 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-gold to-primary-light flex items-center justify-center text-primary-foreground font-bold text-sm">5</span>
              {t("about.cto.lawsTitle")}
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {laws5D.map((law, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-accent-gold/15 border border-accent-gold/30">
                  <span className="w-7 h-7 rounded-full bg-sapphire-gradient flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground-muted font-medium">{law}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Closing */}
          <div className="card-sacred p-8 md:p-10 text-center bg-gradient-to-br from-accent-gold/20 to-primary-pale/30">
            <Heart className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
            <div className="space-y-3 text-primary-deep">
              <p className="font-medium">{t("about.cto.closing1")}</p>
              <p>{t("about.cto.closing2")}</p>
              <p>{t("about.cto.closing3")}</p>
              <p className="font-semibold">{t("about.cto.closing4")}</p>
              <p>{t("about.cto.closing5")}</p>
            </div>
            <div className="mt-6 pt-6 border-t border-primary-light/30">
              <p className="text-xl">🌞</p>
              <p className="font-bold text-primary-deep">{t("about.cto.signatureName")}</p>
              <p className="text-sm text-primary-medium">{t("about.cto.signatureTitle")}</p>
              <p className="text-sm text-primary-medium italic">{t("about.cto.signatureLight")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AngelCTOAppointment;
