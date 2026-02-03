import { useState } from "react";
import { POPLHeader } from "@/components/popl/POPLHeader";
import { POPLHero } from "@/components/popl/POPLHero";
import { POPLSectionCard } from "@/components/popl/POPLSectionCard";
import { POPLDivineSeal } from "@/components/popl/POPLDivineSeal";
import { POPLFooter } from "@/components/popl/POPLFooter";
import { sections, mantras } from "./poplData";

const PoPLWhitepaper = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50/30">
      <POPLHeader />
      <POPLHero />

      {/* Content Sections */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, index) => (
            <POPLSectionCard
              key={section.id}
              section={section}
              index={index}
              isExpanded={expandedSection === section.id}
              onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            />
          ))}
        </div>
      </section>

      <POPLDivineSeal mantras={mantras} />
      <POPLFooter />
    </div>
  );
};

export default PoPLWhitepaper;
