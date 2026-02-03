import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Pillar {
  number: number;
  title: string;
  question: string;
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
                      line.startsWith('✦') || line.startsWith('✨') || line.startsWith('🌞') || line.startsWith('🌟') || line.startsWith('🕊️') || line.startsWith('🤖')
                        ? 'font-semibold text-purple-700 mt-3' 
                        : ''
                    } ${line.startsWith('✅') ? 'text-green-700' : ''}`}
                  >
                    {line}
                  </p>
                ))}
                
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

                {/* Render Platforms Table */}
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
