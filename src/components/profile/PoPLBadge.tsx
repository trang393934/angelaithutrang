import { Shield, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PoPLBadgeProps {
  isVerified: boolean;
  badgeLevel?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const BADGE_LEVELS = {
  newcomer: { icon: "🌱", label: "Newcomer", color: "from-slate-400 to-slate-600" },
  contributor: { icon: "🌿", label: "Contributor", color: "from-emerald-400 to-emerald-600" },
  guardian: { icon: "🛡️", label: "Guardian", color: "from-blue-400 to-blue-600" },
  lightworker: { icon: "✨", label: "Lightworker", color: "from-purple-400 to-purple-600" },
  angel: { icon: "👼", label: "Angel", color: "from-amber-400 to-amber-600" },
};

export const PoPLBadge = ({
  isVerified,
  badgeLevel = "newcomer",
  size = "md",
  showTooltip = true
}: PoPLBadgeProps) => {
  const level = BADGE_LEVELS[badgeLevel as keyof typeof BADGE_LEVELS] || BADGE_LEVELS.newcomer;
  
  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-7 h-7 text-sm",
    lg: "w-10 h-10 text-base"
  };

  const BadgeContent = () => (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {isVerified ? (
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center shadow-lg`}>
          <span>{level.icon}</span>
        </div>
      ) : (
        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
          <Shield className="w-3/5 h-3/5 text-muted-foreground" />
        </div>
      )}
      {isVerified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5">
          <CheckCircle className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
  );

  if (!showTooltip) {
    return <BadgeContent />;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer">
            <BadgeContent />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">
              {isVerified ? `PoPL Verified: ${level.label}` : "Chưa xác thực PoPL"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isVerified 
                ? "Đã chứng minh Pure Love" 
                : "Hoàn thành các hoạt động để xác thực"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
