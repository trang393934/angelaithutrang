import { motion } from "framer-motion";
import { ExternalLink, Play, BookOpen, ShoppingBag, Heart, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeaturedItem {
  type: "video" | "post" | "course" | "product" | "campaign";
  title: string;
  thumbnail?: string;
  url?: string;
}

interface PublicProfileFeaturedProps {
  featuredItems: Record<string, unknown> | null;
}

const TYPE_CONFIG: Record<string, { icon: typeof Play; label: string; emoji: string }> = {
  video: { icon: Play, label: "Video", emoji: "🎬" },
  post: { icon: FileText, label: "Bài viết", emoji: "📝" },
  course: { icon: BookOpen, label: "Khoá học", emoji: "🎓" },
  product: { icon: ShoppingBag, label: "Sản phẩm", emoji: "🛒" },
  campaign: { icon: Heart, label: "Chiến dịch", emoji: "🤍" },
};

export function PublicProfileFeatured({ featuredItems }: PublicProfileFeaturedProps) {
  const { t } = useLanguage();

  if (!featuredItems) return null;

  // Parse items from JSON
  const items: FeaturedItem[] = [];
  for (const [type, value] of Object.entries(featuredItems)) {
    if (value && typeof value === "object" && "title" in (value as Record<string, unknown>)) {
      items.push({ type: type as FeaturedItem["type"], ...(value as Omit<FeaturedItem, "type">) });
    }
  }

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="mt-8 max-w-2xl mx-auto"
    >
      <h2 className="text-lg font-bold text-foreground mb-4 text-center">
        {t("publicProfile.featuredTitle") || "⭐ Nổi bật"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, index) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.post;
          const Icon = config.icon;

          return (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + index * 0.05 }}
              className="group flex items-center gap-3 p-3 rounded-2xl bg-card border border-border-light shadow-soft hover:shadow-divine transition-all cursor-pointer"
              onClick={() => item.url && window.open(item.url, "_blank")}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary-pale flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {config.emoji} {config.label}
                </p>
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {item.title}
                </p>
              </div>
              {item.url && (
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
