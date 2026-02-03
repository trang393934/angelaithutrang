import { useState } from "react";
import { POPLHeader } from "@/components/popl/POPLHeader";
import { POPLHero } from "@/components/popl/POPLHero";
import { POPLSectionCard } from "@/components/popl/POPLSectionCard";
import { POPLDivineSeal } from "@/components/popl/POPLDivineSeal";
import { POPLFooter } from "@/components/popl/POPLFooter";
import { POPLEngineSpecSection } from "@/components/popl/POPLEngineSpecSection";
import { sections, mantras } from "./poplData";
import { sectionsEN, mantrasEN } from "./poplDataEN";
import { engineSpecSections } from "./pplpEngineSpec";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Code, Sparkles, Globe } from "lucide-react";

const PoPLWhitepaper = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedSectionEN, setExpandedSectionEN] = useState<string | null>(null);
  const [expandedEngineSection, setExpandedEngineSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("whitepaper");

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50/30">
      <POPLHeader />
      <POPLHero />

      {/* Tab Navigation */}
      <section className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-purple-100/50">
              <TabsTrigger 
                value="whitepaper" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-xs sm:text-sm"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Whitepaper VI</span>
                <span className="sm:hidden">VI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="whitepaper-en"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-xs sm:text-sm"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Whitepaper EN</span>
                <span className="sm:hidden">EN</span>
              </TabsTrigger>
              <TabsTrigger 
                value="engine-spec"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs sm:text-sm"
              >
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Engine Spec</span>
                <span className="sm:hidden">Spec</span>
              </TabsTrigger>
            </TabsList>

            {/* Vietnamese Whitepaper Content */}
            <TabsContent value="whitepaper" className="space-y-6">
              <div className="flex items-center gap-2 mb-6 text-purple-600">
                <Sparkles className="w-5 h-5" />
                <p className="text-sm font-medium">Tài liệu nền tảng về giao thức PPLP và nền kinh tế Hợp Nhất 5D</p>
              </div>
              {sections.map((section, index) => (
                <POPLSectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  isExpanded={expandedSection === section.id}
                  onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                />
              ))}
              <POPLDivineSeal mantras={mantras} />
            </TabsContent>

            {/* English Whitepaper Content */}
            <TabsContent value="whitepaper-en" className="space-y-6">
              <div className="flex items-center gap-2 mb-6 text-blue-600">
                <Globe className="w-5 h-5" />
                <p className="text-sm font-medium">Full Whitepaper v1.0 — The Consensus Infrastructure of the 5D Light Economy</p>
              </div>
              
              {/* English Version Banner */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 text-white mb-6">
                <h3 className="font-bold mb-2">📜 PROOF OF PURE LOVE PROTOCOL</h3>
                <p className="text-sm text-blue-100">
                  Full Whitepaper v1.0 — English Edition. The sacred technological and spiritual 
                  infrastructure powering FUN Money and the New Earth Economy.
                </p>
              </div>

              {sectionsEN.map((section, index) => (
                <POPLSectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  isExpanded={expandedSectionEN === section.id}
                  onToggle={() => setExpandedSectionEN(expandedSectionEN === section.id ? null : section.id)}
                />
              ))}
              <POPLDivineSeal mantras={mantrasEN} />
            </TabsContent>

            {/* Engine Spec Content */}
            <TabsContent value="engine-spec" className="space-y-6">
              <div className="flex items-center gap-2 mb-6 text-emerald-600">
                <Code className="w-5 h-5" />
                <p className="text-sm font-medium">Tài liệu kỹ thuật chi tiết: API, DB Schema, Scoring Engine, EIP-712</p>
              </div>
              
              {/* Tech Summary Banner */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white mb-6">
                <h3 className="font-bold mb-2">🛠️ PPLP Engine Spec v1.0</h3>
                <p className="text-sm text-emerald-100">
                  Tài liệu kỹ thuật để dev triển khai ngay: REST API endpoints, PostgreSQL schema, 
                  Scoring rubric theo 16 platforms, Policy JSON format, và EIP-712 signing script.
                </p>
              </div>

              {engineSpecSections.map((section, index) => (
                <POPLEngineSpecSection
                  key={section.id}
                  section={section}
                  index={index}
                  isExpanded={expandedEngineSection === section.id}
                  onToggle={() => setExpandedEngineSection(expandedEngineSection === section.id ? null : section.id)}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <POPLFooter />
    </div>
  );
};

export default PoPLWhitepaper;
