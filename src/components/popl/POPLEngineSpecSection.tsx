import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface TechStackItem {
  name: string;
  value: string;
}

interface Entity {
  name: string;
  description: string;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
}

interface ApiCategory {
  category: string;
  endpoints: ApiEndpoint[];
}

interface DbTable {
  name: string;
  columns: string[];
}

interface ScoringPillar {
  code: string;
  name: string;
  range: string;
}

interface Multiplier {
  code: string;
  name: string;
  range: string;
  description: string;
}

interface Threshold {
  metric: string;
  value: string;
}

interface ScoringRubric {
  pillars: ScoringPillar[];
  multipliers: Multiplier[];
  defaultThresholds: Threshold[];
}

interface PlatformRubric {
  id: string;
  name: string;
  subtitle: string;
  actions: string[];
  rewardLogic: string;
  thresholds: string[];
  multiplierNotes: string[];
}

interface EIP712Domain {
  name: string;
  version: string;
  chainId: string;
  verifyingContract: string;
}

interface EIP712Type {
  name: string;
  type: string;
}

interface EIP712Data {
  domain: EIP712Domain;
  types: {
    MintRequest: EIP712Type[];
  };
  notes: string[];
}

interface EngineSpecSectionData {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  content: string[];
  techStack?: TechStackItem[];
  entities?: Entity[];
  apiEndpoints?: ApiCategory[];
  dbTables?: DbTable[];
  scoringRubric?: ScoringRubric;
  platformRubrics?: PlatformRubric[];
  policyExample?: any;
  eip712?: EIP712Data;
  checklist?: string[];
}

interface POPLEngineSpecSectionProps {
  section: EngineSpecSectionData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const POPLEngineSpecSection = ({ section, index, isExpanded, onToggle }: POPLEngineSpecSectionProps) => {
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden border-emerald-200/50 shadow-lg shadow-emerald-100/50 hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300">
        <CardContent className="p-0">
          <button
            onClick={onToggle}
            className="w-full p-6 flex items-start gap-4 text-left hover:bg-emerald-50/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-800">{section.title}</h3>
              <p className="text-sm text-emerald-600/70 mt-1">{section.subtitle}</p>
            </div>
            <div className={`text-emerald-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
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
              <Separator className="mb-4 bg-emerald-200/50" />
              <div className="pl-16 space-y-4">
                {section.content.map((line, i) => (
                  <p key={i} className={`text-emerald-900/80 ${line === '' ? 'h-3' : ''} ${
                    line.startsWith('🛠️') || line.startsWith('📐') || line.startsWith('🌐') || line.startsWith('🗄️') || line.startsWith('📊') || line.startsWith('📋') || line.startsWith('📄') || line.startsWith('🔐') || line.startsWith('🔧') || line.startsWith('✅')
                      ? 'font-semibold text-emerald-700 mt-3' 
                      : ''
                  }`}>
                    {line}
                  </p>
                ))}

                {/* Tech Stack */}
                {section.techStack && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {section.techStack.map((item, i) => (
                          <tr key={i} className="border-b border-emerald-100 last:border-b-0">
                            <td className="p-3 font-semibold text-emerald-700 w-32">{item.name}</td>
                            <td className="p-3 text-emerald-800/80">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Entities */}
                {section.entities && (
                  <div className="mt-4 space-y-2">
                    {section.entities.map((entity, i) => (
                      <div key={i} className="flex items-start gap-3 bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                        <span className="font-mono text-emerald-600 font-bold min-w-[140px]">{entity.name}</span>
                        <span className="text-emerald-800/80 text-sm">{entity.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* API Endpoints */}
                {section.apiEndpoints && (
                  <div className="mt-4 space-y-4">
                    {section.apiEndpoints.map((cat, i) => (
                      <div key={i} className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-100">
                        <h4 className="font-bold text-emerald-700 mb-3">{cat.category}</h4>
                        <div className="space-y-2">
                          {cat.endpoints.map((ep, j) => (
                            <div key={j} className="flex items-start gap-2 text-sm">
                              <span className={`font-mono px-2 py-0.5 rounded text-xs ${
                                ep.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {ep.method}
                              </span>
                              <span className="font-mono text-emerald-600">{ep.path}</span>
                              <span className="text-emerald-800/70">— {ep.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* DB Tables */}
                {section.dbTables && (
                  <div className="mt-4 space-y-3">
                    {section.dbTables.map((table, i) => (
                      <div key={i} className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-100">
                        <h4 className="font-mono font-bold text-emerald-700 mb-2">{table.name}</h4>
                        <div className="space-y-1">
                          {table.columns.map((col, j) => (
                            <p key={j} className="text-xs font-mono text-emerald-800/70">• {col}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scoring Rubric */}
                {section.scoringRubric && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-emerald-700 mb-3">Pillars Scoring (0–100)</h4>
                      <div className="space-y-2">
                        {section.scoringRubric.pillars.map((p, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="font-mono font-bold text-emerald-600 w-6">{p.code}</span>
                            <span className="font-medium text-emerald-700 min-w-[160px]">{p.name}:</span>
                            <span className="text-emerald-800/70">{p.range}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-emerald-700 mb-3">Multipliers</h4>
                      <div className="space-y-2">
                        {section.scoringRubric.multipliers.map((m, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="font-mono font-bold text-emerald-600 w-6">{m.code}</span>
                            <span className="font-medium text-emerald-700 min-w-[80px]">{m.name}:</span>
                            <span className="text-teal-600 font-mono">{m.range}</span>
                            <span className="text-emerald-800/70">— {m.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-emerald-700 mb-3">Default Thresholds</h4>
                      <div className="flex flex-wrap gap-3">
                        {section.scoringRubric.defaultThresholds.map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-emerald-700 border border-emerald-200">
                            {t.metric}: {t.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Platform Rubrics */}
                {section.platformRubrics && (
                  <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {section.platformRubrics.map((platform) => (
                      <div key={platform.id} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-emerald-800">{platform.name}</span>
                          <span className="text-xs text-teal-600">— {platform.subtitle}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-emerald-700">Actions: </span>
                            <span className="font-mono text-xs text-emerald-600">{platform.actions.join(", ")}</span>
                          </div>
                          <div>
                            <span className="font-medium text-emerald-700">Reward: </span>
                            <span className="text-emerald-800/80">{platform.rewardLogic}</span>
                          </div>
                          <div>
                            <span className="font-medium text-emerald-700">Thresholds: </span>
                            <span className="text-emerald-800/80">{platform.thresholds.join(" | ")}</span>
                          </div>
                          <div className="text-xs text-teal-600 italic">
                            {platform.multiplierNotes.join(" • ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Policy Example */}
                {section.policyExample && (
                  <div className="mt-4 bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
{`{
  "version": ${section.policyExample.version},
  "global": {
    "minTruth": ${section.policyExample.global.minTruth},
    "minIntegrity": ${section.policyExample.global.minIntegrity},
    "minLightScore": ${section.policyExample.global.minLightScore},
    "weights": { "S": 0.25, "T": 0.20, "H": 0.20, "C": 0.20, "U": 0.15 }
  },
  "platforms": {
    "${section.policyExample.platformExample.name}": {
      "actions": {
        "LEARN_COMPLETE": {
          "baseReward": 200,
          "thresholds": { "T": 70, "LightScore": 60, "K": 60 },
          "multipliers": { "Q": [0.8, 2.0], "I": [0.8, 1.5], "K": [0.6, 1.0] }
        }
      }
    }
  }
}`}
                    </pre>
                  </div>
                )}

                {/* EIP-712 */}
                {section.eip712 && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-emerald-700 mb-3">EIP-712 Domain</h4>
                      <div className="space-y-1 font-mono text-sm">
                        <p className="text-emerald-800">name: "{section.eip712.domain.name}"</p>
                        <p className="text-emerald-800">version: "{section.eip712.domain.version}"</p>
                        <p className="text-emerald-800">chainId: {section.eip712.domain.chainId}</p>
                        <p className="text-emerald-800">verifyingContract: {section.eip712.domain.verifyingContract}</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50/30 rounded-lg p-4 border border-emerald-100">
                      <h4 className="font-bold text-emerald-700 mb-3">MintRequest Types</h4>
                      <div className="space-y-1 font-mono text-xs">
                        {section.eip712.types.MintRequest.map((t, i) => (
                          <p key={i} className="text-emerald-700">
                            <span className="text-teal-600">{t.name}</span>: {t.type}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-200">
                      <h4 className="font-bold text-amber-700 mb-2">⚠️ Important Notes</h4>
                      <ul className="space-y-1">
                        {section.eip712.notes.map((note, i) => (
                          <li key={i} className="text-sm text-amber-800">• {note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {section.checklist && (
                  <div className="mt-4 space-y-2">
                    {section.checklist.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs">
                          ✓
                        </span>
                        <p className="text-sm text-emerald-800">{item}</p>
                      </div>
                    ))}
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
