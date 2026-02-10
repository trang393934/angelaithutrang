import { Facebook, Instagram, Youtube, Globe, MessageCircle, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SocialLinksDisplayProps {
  socialLinks: Record<string, string> | null;
  avatarUrl?: string | null;
}

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode; bgClass: string }> = {
  facebook: {
    label: "Facebook",
    icon: <Facebook className="w-3.5 h-3.5 text-white" />,
    bgClass: "bg-blue-600",
  },
  instagram: {
    label: "Instagram",
    icon: <Instagram className="w-3.5 h-3.5 text-white" />,
    bgClass: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
  },
  tiktok: {
    label: "TikTok",
    icon: <span className="text-xs text-white font-bold">T</span>,
    bgClass: "bg-black",
  },
  youtube: {
    label: "YouTube",
    icon: <Youtube className="w-3.5 h-3.5 text-white" />,
    bgClass: "bg-red-600",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <span className="text-xs text-white font-bold">in</span>,
    bgClass: "bg-blue-700",
  },
  twitter: {
    label: "X (Twitter)",
    icon: <span className="text-xs text-white font-bold">𝕏</span>,
    bgClass: "bg-black",
  },
  website: {
    label: "Website",
    icon: <Globe className="w-3.5 h-3.5 text-white" />,
    bgClass: "bg-primary",
  },
  telegram: {
    label: "Telegram",
    icon: <MessageCircle className="w-3.5 h-3.5 text-white" />,
    bgClass: "bg-sky-500",
  },
  discord: {
    label: "Discord",
    icon: <span className="text-xs text-white font-bold">D</span>,
    bgClass: "bg-indigo-600",
  },
};

export function SocialLinksDisplay({ socialLinks, avatarUrl }: SocialLinksDisplayProps) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) return null;

  const activeLinks = Object.entries(socialLinks).filter(
    ([, url]) => url && url.trim().length > 0
  );

  if (activeLinks.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
        {activeLinks.map(([platform, url]) => {
          const meta = PLATFORM_META[platform];
          if (!meta) return null;

          return (
            <Tooltip key={platform}>
              <TooltipTrigger asChild>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  {/* Mini avatar container with platform badge */}
                  <div className="w-10 h-10 rounded-full border-2 border-background shadow-md overflow-hidden ring-2 ring-primary-pale/50 hover:ring-primary/50 transition-all duration-300 hover:scale-110">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={meta.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${meta.bgClass}`}>
                        {meta.icon}
                      </div>
                    )}
                  </div>
                  {/* Platform badge overlay */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center ${meta.bgClass} ring-2 ring-background shadow-sm`}
                    style={{ width: 18, height: 18 }}
                  >
                    {meta.icon}
                  </div>
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {meta.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
