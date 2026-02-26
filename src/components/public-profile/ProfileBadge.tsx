import { Shield, Star, Sparkles, Briefcase } from "lucide-react";

interface ProfileBadgeProps {
  badgeType: string | null;
}

const BADGE_CONFIG: Record<string, { label: string; icon: typeof Star; className: string }> = {
  founder: {
    label: "Founder",
    icon: Sparkles,
    className: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 border-amber-500/30",
  },
  verified: {
    label: "Verified",
    icon: Shield,
    className: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 border-blue-500/30",
  },
  cosmic_coach: {
    label: "Cosmic Coach",
    icon: Star,
    className: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 border-purple-500/30",
  },
  business: {
    label: "Business",
    icon: Briefcase,
    className: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 border-emerald-500/30",
  },
};

export function ProfileBadge({ badgeType }: ProfileBadgeProps) {
  if (!badgeType || !BADGE_CONFIG[badgeType]) return null;

  const config = BADGE_CONFIG[badgeType];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
