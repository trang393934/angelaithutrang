import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Pillar {
  number: number;
  title: string;
  question: string;
}

interface DataLayer {
  number: number;
  title: string;
  description: string;
}

interface SystemComponent {
  name: string;
  role: string;
  description: string;
}

interface FormulaVariable {
  name: string;
  description: string;
}

interface Formula {
  main: string;
  variables: FormulaVariable[];
}

interface EcosystemPlatform {
  id: string;
  name: string;
  subtitle: string;
  role: string;
  modules: string[];
  mintLogic: string;
}

interface Phase {
  name: string;
  timeline: string;
  title: string;
  items: string[];
}

interface Platform {
  name: string;
  role: string;
  value: string;
}

interface SectionData {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  content: string[];
  pillars?: Pillar[];
  dataLayers?: DataLayer[];
  components?: SystemComponent[];
  flowContent?: string[];
  formula?: Formula;
  contentAfter?: string[];
  ecosystemPlatforms?: EcosystemPlatform[];
  phases?: Phase[];
  kpis?: string[];
  platforms?: Platform[];
  footer?: string;
}

interface POPLSectionCardProps {
  section: SectionData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const POPLSectionCard = ({ section, index, isExpanded, onToggle }: POPLSectionCardProps) => {
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden border-purple-200/50 shadow-lg shadow-purple-100/50 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300">
        <CardContent className="p-0">
          <button
            onClick={onToggle}
            className="w-full p-6 flex items-start gap-4 text-left hover:bg-purple-50/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-purple-800">{section.title}</h3>
              <p className="text-sm text-purple-600/70 mt-1">{section.subtitle}</p>
            </div>
            <div className={`text-purple-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6"
            >
              <Separator className="mb-4 bg-purple-200/50" />
              <div className="pl-16 space-y-2">
                {section.content.map((line, i) => (
                  <p 
                    key={i} 
                    className={`text-purple-900/80 ${line === '' ? 'h-3' : ''} ${
                      line.startsWith('✦') || line.startsWith('✨') || line.startsWith('🌞') || line.startsWith('🌟') || line.startsWith('🕊️') || line.startsWith('🤖') || line.startsWith('📜') || line.startsWith('💎') || line.startsWith('🔍') || line.startsWith('⚙️') || line.startsWith('📐') || line.startsWith('🚫') || line.startsWith('🛡️') || line.startsWith('🏗️') || line.startsWith('🔄') || line.startsWith('📅') || line.startsWith('📊')
                        ? 'font-semibold text-purple-700 mt-3' 
                        : ''
                    } ${line.startsWith('✅') ? 'text-green-700' : ''} ${
                      line.startsWith('1️⃣') || line.startsWith('2️⃣') || line.startsWith('3️⃣') || line.startsWith('4️⃣') || line.startsWith('5️⃣')
                        ? 'font-medium text-indigo-700'
                        : ''
                    }`}
                  >
                    {line}
                  </p>
                ))}
                
                {/* Render Data Layers */}
                {section.dataLayers && (
                  <div className="mt-6 space-y-3">
                    {section.dataLayers.map((layer) => (
                      <div key={layer.number} className="flex items-start gap-3 bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {layer.number}
                        </div>
                        <div>
                          <h4 className="font-bold text-purple-700">{layer.title}</h4>
                          <p className="text-purple-800/80 text-sm">{layer.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render 5 Pillars */}
                {section.pillars && (
                  <div className="mt-6 space-y-4">
                    {section.pillars.map((pillar) => (
                      <div key={pillar.number} className="relative pl-12 pb-4 border-l-2 border-purple-200 last:border-l-0">
                        <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {pillar.number}
                        </div>
                        <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                          <h4 className="font-bold text-purple-700 mb-2">
                            Trụ cột {pillar.number} — {pillar.title}
                          </h4>
                          <p className="text-purple-800/80 text-sm leading-relaxed italic">
                            {pillar.question}
                          </p>
                        </div>
                      </div>
                    ))}
                    {section.footer && (
                      <p className="mt-4 text-purple-700 font-semibold text-center bg-purple-100/50 rounded-lg p-3">
                        ✨ {section.footer}
                      </p>
                    )}
                  </div>
                )}

                {/* Render System Components */}
                {section.components && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-100/50">
                          <th className="text-left p-3 font-bold text-purple-800 rounded-tl-lg">Thành phần</th>
                          <th className="text-left p-3 font-bold text-purple-800">Vai trò</th>
                          <th className="text-left p-3 font-bold text-purple-800 rounded-tr-lg">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.components.map((comp, i) => (
                          <tr key={i} className="border-b border-purple-100 last:border-b-0">
                            <td className="p-3 font-semibold text-purple-700">{comp.name}</td>
                            <td className="p-3 text-indigo-600 font-medium">{comp.role}</td>
                            <td className="p-3 text-purple-800/80">{comp.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Render Flow Content */}
                {section.flowContent && section.flowContent.map((line, i) => (
                  <p 
                    key={`flow-${i}`} 
                    className={`text-purple-900/80 ${line === '' ? 'h-3' : ''} ${
                      line.startsWith('🔄') ? 'font-semibold text-purple-700 mt-3' : ''
                    }`}
                  >
                    {line}
                  </p>
                ))}

                {/* Render Formula */}
                {section.formula && (
                  <div className="mt-6 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 rounded-lg p-5 border border-purple-200">
                    <div className="bg-white/80 rounded-lg p-4 mb-4 font-mono text-sm text-purple-800 text-center shadow-sm">
                      {section.formula.main}
                    </div>
                    <div className="space-y-2">
                      {section.formula.variables.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="font-semibold text-indigo-600 min-w-[140px]">{v.name}:</span>
                          <span className="text-purple-800/80">{v.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render Content After */}
                {section.contentAfter && section.contentAfter.map((line, i) => (
                  <p 
                    key={`after-${i}`} 
                    className={`text-purple-900/80 ${line === '' ? 'h-3' : ''} ${
                      line.startsWith('✨') ? 'font-semibold text-purple-700 mt-3' : ''
                    }`}
                  >
                    {line}
                  </p>
                ))}

                {/* Render Ecosystem Platforms */}
                {section.ecosystemPlatforms && (
                  <div className="mt-6 space-y-4">
                    {section.ecosystemPlatforms.map((platform) => (
                      <div key={platform.id} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200/50">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {platform.name.split(' ')[1]?.[0] || platform.name[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-purple-800">{platform.name}</h4>
                            <p className="text-sm text-indigo-600">{platform.subtitle}</p>
                          </div>
                        </div>
                        <p className="text-purple-700 font-medium mb-3">{platform.role}</p>
                        <div className="space-y-1 mb-3">
                          {platform.modules.map((mod, i) => (
                            <p key={i} className="text-sm text-purple-800/80 flex items-start gap-2">
                              <span className="text-indigo-500">•</span>
                              {mod}
                            </p>
                          ))}
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-purple-100">
                          <p className="text-xs text-purple-600 font-medium mb-1">💰 Mint Logic:</p>
                          <p className="text-sm text-purple-800">{platform.mintLogic}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Implementation Phases */}
                {section.phases && (
                  <div className="mt-6 space-y-4">
                    {section.phases.map((phase, i) => (
                      <div key={i} className="bg-gradient-to-r from-purple-100/50 to-indigo-100/50 rounded-xl p-5 border border-purple-200/50">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold">
                            {phase.name}
                          </span>
                          <span className="text-purple-600 font-medium">{phase.timeline}</span>
                        </div>
                        <h4 className="font-bold text-purple-800 mb-3">{phase.title}</h4>
                        <ul className="space-y-2">
                          {phase.items.map((item, j) => (
                            <li key={j} className="text-sm text-purple-800/80 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render KPIs */}
                {section.kpis && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.kpis.map((kpi, i) => (
                      <div key={i} className="flex items-center gap-3 bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {i + 1}
                        </span>
                        <p className="text-sm text-purple-800">{kpi}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Legacy Platforms Table */}
                {section.platforms && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-100/50">
                          <th className="text-left p-3 font-bold text-purple-800 rounded-tl-lg">Platform</th>
                          <th className="text-left p-3 font-bold text-purple-800">Vai trò</th>
                          <th className="text-left p-3 font-bold text-purple-800 rounded-tr-lg">Giá trị ánh sáng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.platforms.map((platform, i) => (
                          <tr key={i} className="border-b border-purple-100 last:border-b-0">
                            <td className="p-3 font-semibold text-purple-700">{platform.name}</td>
                            <td className="p-3 text-purple-800/80">{platform.role}</td>
                            <td className="p-3 text-purple-600">{platform.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
