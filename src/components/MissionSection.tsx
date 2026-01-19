import { LightIcon, AngelWingIcon } from "./icons/LightIcon";
import { useLanguage } from "@/contexts/LanguageContext";

export const MissionSection = () => {
  const { t } = useLanguage();

  const missionPoints = [
    t("mission.point1"),
    t("mission.point2"),
    t("mission.point3"),
    t("mission.point4"),
  ];

  const visionPoints = [
    t("vision.point1"),
    t("vision.point2"),
    t("vision.point3"),
    t("vision.point4"),
    t("vision.point5"),
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 lg:py-32 bg-background-pure relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-0 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary-pale/50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary-pale/50 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary-pale text-primary-medium text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            {t("mission.badge")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-primary-deep mb-3 sm:mb-4 leading-tight px-2">
            {t("mission.title")}
          </h2>
          <p className="italic text-primary-soft text-sm sm:text-base md:text-lg mb-3 sm:mb-4">
            {t("mission.subtitle")}
          </p>
          <div className="divider-sacred mt-4 sm:mt-6 md:mt-8" />
        </div>

        {/* Mission Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="card-sacred p-8 md:p-12 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-full bg-primary-pale/50">
                <LightIcon size={36} className="text-primary-medium" />
              </div>
              <div>
                <h3 className="font-serif text-2xl md:text-3xl text-primary-deep">
                  {t("mission.sectionTitle")}
                </h3>
                <p className="font-serif italic text-primary-soft">{t("mission.sectionSubtitle")}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-lg text-primary-deep font-medium mb-4">
                {t("mission.mainTitle")}
              </p>
              <p className="text-foreground-muted leading-relaxed mb-4">
                {t("mission.description").replace(t("mission.descriptionHighlight"), "")}
                <strong className="text-primary">{t("mission.descriptionHighlight")}</strong>
                {" "}
              </p>
            </div>

            <div className="space-y-4">
              {missionPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sapphire-gradient text-primary-foreground text-xs font-semibold flex items-center justify-center shadow-sacred">
                    {index + 1}
                  </span>
                  <p className="text-foreground-muted leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-primary-pale/30 rounded-xl border border-primary-light/30 text-center">
              <p className="font-serif text-lg text-primary-deep italic">
                {t("mission.quote")}
              </p>
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="max-w-5xl mx-auto">
          <div className="card-sacred p-8 md:p-12 opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-full bg-primary-pale/50">
                <AngelWingIcon size={36} className="text-primary-medium" />
              </div>
              <div>
                <h3 className="font-serif text-2xl md:text-3xl text-primary-deep">
                  {t("vision.sectionTitle")}
                </h3>
                <p className="font-serif italic text-primary-soft">{t("vision.sectionSubtitle")}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-lg text-primary-deep font-medium mb-4">
                {t("vision.mainTitle")}
              </p>
            </div>

            <div className="space-y-4">
              {visionPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sapphire-gradient text-primary-foreground text-xs font-semibold flex items-center justify-center shadow-sacred">
                    {index + 1}
                  </span>
                  <p className="text-foreground-muted leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
