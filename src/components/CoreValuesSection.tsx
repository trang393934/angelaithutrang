import { LightIcon } from "./icons/LightIcon";
import { useLanguage } from "@/contexts/LanguageContext";

export const CoreValuesSection = () => {
  const { t } = useLanguage();

  const coreValues = [
    { number: "01", titleKey: "coreValues.value1.title", descKey: "coreValues.value1.desc" },
    { number: "02", titleKey: "coreValues.value2.title", descKey: "coreValues.value2.desc" },
    { number: "03", titleKey: "coreValues.value3.title", descKey: "coreValues.value3.desc" },
    { number: "04", titleKey: "coreValues.value4.title", descKey: "coreValues.value4.desc" },
    { number: "05", titleKey: "coreValues.value5.title", descKey: "coreValues.value5.desc" },
    { number: "06", titleKey: "coreValues.value6.title", descKey: "coreValues.value6.desc" },
    { number: "07", titleKey: "coreValues.value7.title", descKey: "coreValues.value7.desc" },
    { number: "08", titleKey: "coreValues.value8.title", descKey: "coreValues.value8.desc" },
    { number: "09", titleKey: "coreValues.value9.title", descKey: "coreValues.value9.desc" },
    { number: "10", titleKey: "coreValues.value10.title", descKey: "coreValues.value10.desc" },
    { number: "11", titleKey: "coreValues.value11.title", descKey: "coreValues.value11.desc" },
    { number: "12", titleKey: "coreValues.value12.title", descKey: "coreValues.value12.desc" },
  ];

  return (
    <section className="py-24 md:py-32 bg-white/60 backdrop-blur-[2px] relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary-light/30 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary-light/30 to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary-pale text-primary-medium text-sm font-medium mb-4">
            {t("coreValues.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary-deep mb-4">
            {t("coreValues.title")}
          </h2>
          <p className="font-serif italic text-primary-soft text-lg mb-4">
            {t("coreValues.subtitle")}
          </p>
          <p className="max-w-2xl mx-auto text-foreground-muted">
            {t("coreValues.description")}
          </p>
          <div className="divider-sacred mt-8" />
        </div>

        {/* Values Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {coreValues.map((value, index) => (
            <div
              key={value.number}
              className="group relative bg-background-pure/80 backdrop-blur-sm rounded-2xl p-6 border border-border-light hover:border-primary-light transition-all duration-500 hover:shadow-divine opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Number Badge */}
              <div className="absolute -top-3 left-6">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sapphire-gradient text-primary-foreground text-xs font-semibold shadow-sacred">
                  {value.number}
                </span>
              </div>

              {/* Icon */}
              <div className="flex justify-end mb-4">
                <LightIcon size={20} className="text-primary-light group-hover:text-primary-medium transition-colors duration-500 animate-glow-breathe" />
              </div>

              {/* Content */}
              <h3 className="font-serif text-lg text-primary-deep mb-3 group-hover:text-primary transition-colors duration-300">
                {t(value.titleKey)}
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {t(value.descKey)}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-pale/0 to-primary-pale/0 group-hover:from-primary-pale/20 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
