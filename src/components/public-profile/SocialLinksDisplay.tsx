import { Facebook, Instagram, Youtube, Globe, MessageCircle, ExternalLink } from "lucide-react";

interface SocialLinksDisplayProps {
  socialLinks: Record<string, string> | null;
  avatarUrl?: string | null;
}

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode; bgClass: string; textClass: string }> = {
  facebook: {
    label: "Facebook",
    icon: <Facebook className="w-4 h-4" />,
    bgClass: "bg-blue-100 dark:bg-blue-950/40",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  instagram: {
    label: "Instagram",
    icon: <Instagram className="w-4 h-4" />,
    bgClass: "bg-pink-100 dark:bg-pink-950/40",
    textClass: "text-pink-600 dark:text-pink-400",
  },
  tiktok: {
    label: "TikTok",
    icon: <span className="text-sm font-bold">T</span>,
    bgClass: "bg-gray-100 dark:bg-gray-800",
    textClass: "text-gray-900 dark:text-gray-200",
  },
  youtube: {
    label: "YouTube",
    icon: <Youtube className="w-4 h-4" />,
    bgClass: "bg-red-100 dark:bg-red-950/40",
    textClass: "text-red-600 dark:text-red-400",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <span className="text-sm font-bold">in</span>,
    bgClass: "bg-blue-100 dark:bg-blue-950/40",
    textClass: "text-blue-700 dark:text-blue-400",
  },
  twitter: {
    label: "X (Twitter)",
    icon: <span className="text-sm font-bold">𝕏</span>,
    bgClass: "bg-gray-100 dark:bg-gray-800",
    textClass: "text-gray-900 dark:text-gray-200",
  },
  website: {
    label: "Website",
    icon: <Globe className="w-4 h-4" />,
    bgClass: "bg-emerald-100 dark:bg-emerald-950/40",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  telegram: {
    label: "Telegram",
    icon: <MessageCircle className="w-4 h-4" />,
    bgClass: "bg-sky-100 dark:bg-sky-950/40",
    textClass: "text-sky-600 dark:text-sky-400",
  },
  discord: {
    label: "Discord",
    icon: <span className="text-sm font-bold">D</span>,
    bgClass: "bg-indigo-100 dark:bg-indigo-950/40",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
};

function extractDisplayUrl(url: string): string {
  try {
    const u = new URL(url);
    // Show path for social profiles, e.g. facebook.com/username
    const path = u.pathname.replace(/\/$/, "");
    if (path && path !== "/") {
      return u.host + path;
    }
    return u.host;
  } catch {
    return url;
  }
}

export function SocialLinksDisplay({ socialLinks }: SocialLinksDisplayProps) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) return null;

  const activeLinks = Object.entries(socialLinks).filter(
    ([, url]) => url && url.trim().length > 0
  );

  if (activeLinks.length === 0) return null;

  return (
    <div className="space-y-1.5 w-full">
      {activeLinks.map(([platform, url]) => {
        const meta = PLATFORM_META[platform];
        if (!meta) return null;

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors group w-full"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bgClass} ${meta.textClass}`}>
              {meta.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${meta.textClass} truncate`}>
                {extractDisplayUrl(url)}
              </p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
