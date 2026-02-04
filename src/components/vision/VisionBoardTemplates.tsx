import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Heart, 
  Users, 
  Wallet, 
  GraduationCap, 
  Plane, 
  Home, 
  Sparkles,
  Target
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export interface VisionBoardTemplate {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descriptionKey: string;
  goals: string[];
  color: string;
}

const TEMPLATES: VisionBoardTemplate[] = [
  {
    id: "career",
    icon: Briefcase,
    titleKey: "visionBoard.template.career.title",
    descriptionKey: "visionBoard.template.career.description",
    goals: [
      "visionBoard.template.career.goal1",
      "visionBoard.template.career.goal2",
      "visionBoard.template.career.goal3",
      "visionBoard.template.career.goal4",
      "visionBoard.template.career.goal5",
    ],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "health",
    icon: Heart,
    titleKey: "visionBoard.template.health.title",
    descriptionKey: "visionBoard.template.health.description",
    goals: [
      "visionBoard.template.health.goal1",
      "visionBoard.template.health.goal2",
      "visionBoard.template.health.goal3",
      "visionBoard.template.health.goal4",
      "visionBoard.template.health.goal5",
    ],
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "family",
    icon: Users,
    titleKey: "visionBoard.template.family.title",
    descriptionKey: "visionBoard.template.family.description",
    goals: [
      "visionBoard.template.family.goal1",
      "visionBoard.template.family.goal2",
      "visionBoard.template.family.goal3",
      "visionBoard.template.family.goal4",
      "visionBoard.template.family.goal5",
    ],
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "finance",
    icon: Wallet,
    titleKey: "visionBoard.template.finance.title",
    descriptionKey: "visionBoard.template.finance.description",
    goals: [
      "visionBoard.template.finance.goal1",
      "visionBoard.template.finance.goal2",
      "visionBoard.template.finance.goal3",
      "visionBoard.template.finance.goal4",
      "visionBoard.template.finance.goal5",
    ],
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "education",
    icon: GraduationCap,
    titleKey: "visionBoard.template.education.title",
    descriptionKey: "visionBoard.template.education.description",
    goals: [
      "visionBoard.template.education.goal1",
      "visionBoard.template.education.goal2",
      "visionBoard.template.education.goal3",
      "visionBoard.template.education.goal4",
      "visionBoard.template.education.goal5",
    ],
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "travel",
    icon: Plane,
    titleKey: "visionBoard.template.travel.title",
    descriptionKey: "visionBoard.template.travel.description",
    goals: [
      "visionBoard.template.travel.goal1",
      "visionBoard.template.travel.goal2",
      "visionBoard.template.travel.goal3",
      "visionBoard.template.travel.goal4",
      "visionBoard.template.travel.goal5",
    ],
    color: "from-sky-500 to-indigo-500",
  },
  {
    id: "spiritual",
    icon: Sparkles,
    titleKey: "visionBoard.template.spiritual.title",
    descriptionKey: "visionBoard.template.spiritual.description",
    goals: [
      "visionBoard.template.spiritual.goal1",
      "visionBoard.template.spiritual.goal2",
      "visionBoard.template.spiritual.goal3",
      "visionBoard.template.spiritual.goal4",
      "visionBoard.template.spiritual.goal5",
    ],
    color: "from-yellow-400 to-amber-500",
  },
  {
    id: "home",
    icon: Home,
    titleKey: "visionBoard.template.home.title",
    descriptionKey: "visionBoard.template.home.description",
    goals: [
      "visionBoard.template.home.goal1",
      "visionBoard.template.home.goal2",
      "visionBoard.template.home.goal3",
      "visionBoard.template.home.goal4",
      "visionBoard.template.home.goal5",
    ],
    color: "from-teal-500 to-cyan-500",
  },
];

interface VisionBoardTemplatesProps {
  onSelectTemplate: (template: VisionBoardTemplate) => void;
}

export function VisionBoardTemplates({ onSelectTemplate }: VisionBoardTemplatesProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-lg">{t("visionBoard.templates")}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{t("visionBoard.templatesHint")}</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 overflow-hidden"
              onClick={() => onSelectTemplate(template)}
            >
              <div className={cn("h-2 bg-gradient-to-r", template.color)} />
              <CardContent className="p-4 text-center">
                <div className={cn(
                  "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3",
                  "bg-gradient-to-br text-white",
                  template.color
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="font-medium text-sm">{t(template.titleKey)}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t(template.descriptionKey)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { TEMPLATES };
