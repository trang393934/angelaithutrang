import { useState, useEffect } from "react";
import { Link2, Loader2, Check, Facebook, Youtube, MessageCircle, X, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import funProfileLogo from "@/assets/fun-profile-logo.png";
import funPlayLogo from "@/assets/fun-play-logo.png";

// ─── Platform definitions (order matters — matches reference images) ──────────
const PLATFORMS = [
  {
    id: "fun_profile",
    label: "Fun Profile",
    placeholder: "https://angel.fun.rich/your-handle",
    iconNode: <img src={funProfileLogo} className="w-6 h-6 object-contain" alt="Fun Profile" />,
    bg: "#1a2e1a",
    color: "#ffd700",
    textColor: "text-amber-400",
  },
  {
    id: "fun_play",
    label: "Fun Play",
    placeholder: "https://play.fun.rich/your-handle",
    iconNode: <img src={funPlayLogo} className="w-6 h-6 object-contain" alt="Fun Play" />,
    bg: "#0a1a3a",
    color: "#ffd700",
    textColor: "text-amber-400",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/username",
    iconNode: <Facebook className="w-5 h-5" />,
    bg: "#1877F2",
    color: "#fff",
    textColor: "text-blue-600",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@channel",
    iconNode: <Youtube className="w-5 h-5" />,
    bg: "#FF0000",
    color: "#fff",
    textColor: "text-red-500",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    placeholder: "https://x.com/username",
    iconNode: <span className="text-sm font-black leading-none">𝕏</span>,
    bg: "#14171A",
    color: "#fff",
    textColor: "text-foreground",
  },
  {
    id: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/username",
    iconNode: <MessageCircle className="w-5 h-5" />,
    bg: "#26A5E4",
    color: "#fff",
    textColor: "text-sky-500",
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@username",
    iconNode: <span className="text-sm font-black leading-none">TK</span>,
    bg: "#010101",
    color: "#fff",
    textColor: "text-foreground",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    iconNode: <span className="text-sm font-black leading-none">in</span>,
    bg: "#0A66C2",
    color: "#fff",
    textColor: "text-blue-700",
  },
  {
    id: "zalo",
    label: "Zalo",
    placeholder: "https://zalo.me/username",
    iconNode: <span className="text-sm font-black leading-none">Z</span>,
    bg: "#0068FF",
    color: "#fff",
    textColor: "text-blue-500",
  },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];
export type SocialLinks = Partial<Record<PlatformId, string>>;

function extractDisplayUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return path && path !== "/" ? u.host + path : u.host;
  } catch {
    return url;
  }
}

function PlatformIcon({
  platform,
  size = 48,
}: {
  platform: typeof PLATFORMS[number];
  size?: number;
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        background: platform.bg,
        color: platform.color,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      }}
    >
      {platform.iconNode}
    </div>
  );
}

export function SocialLinksEditor() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SocialLinks>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchLinks = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("social_links")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.social_links && typeof data.social_links === "object") {
        setLinks(data.social_links as SocialLinks);
      }
      setIsLoading(false);
    };
    fetchLinks();
  }, [user]);

  const activeLinks = PLATFORMS.filter((p) => links[p.id]?.trim());
  const availablePlatforms = PLATFORMS.filter((p) => !links[p.id]?.trim());
  const selectedMeta = PLATFORMS.find((p) => p.id === selectedPlatform);

  const handleSelectPlatform = (id: PlatformId) => {
    setSelectedPlatform(id);
    setInputValue(links[id] || "");
  };

  const handleAddLink = () => {
    if (!selectedPlatform || !inputValue.trim()) return;
    setLinks((prev) => ({ ...prev, [selectedPlatform]: inputValue.trim() }));
    setSelectedPlatform(null);
    setInputValue("");
  };

  const handleRemoveLink = (id: PlatformId) => {
    setLinks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const cleaned: SocialLinks = {};
      for (const [key, val] of Object.entries(links)) {
        const trimmed = (val as string)?.trim();
        if (trimmed) (cleaned as Record<string, string>)[key] = trimmed;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ social_links: cleaned } as any)
        .eq("user_id", user.id);

      if (error) throw error;
      setLinks(cleaned);
      toast.success("Đã lưu Mạng xã hội ✨");
    } catch {
      toast.error("Không thể lưu liên kết");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/10 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="w-5 h-5 text-primary" />
          Mạng xã hội ({activeLinks.length}/{PLATFORMS.length})
        </CardTitle>
        <CardDescription>
          Thêm link mạng xã hội để hiển thị xoay quanh avatar trên FUN Profile công khai của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ── Saved links list ── */}
        {activeLinks.length > 0 && (
          <div className="space-y-2">
            {activeLinks.map((platform) => {
              const url = links[platform.id]!;
              return (
                <div
                  key={platform.id}
                  className="relative flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
                >
                  <PlatformIcon platform={platform} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {platform.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {extractDisplayUrl(url)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveLink(platform.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    aria-label={`Xóa ${platform.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Platform grid selector ── */}
        {availablePlatforms.length > 0 && (
          <div>
            {activeLinks.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Thêm mạng xã hội
              </p>
            )}
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3">
              <div className="grid grid-cols-3 gap-2">
                {availablePlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handleSelectPlatform(platform.id)}
                    className={`flex items-center gap-2 px-2 py-2.5 rounded-lg text-left transition-all hover:bg-muted/60 ${
                      selectedPlatform === platform.id
                        ? "bg-primary/10 ring-1 ring-primary/40"
                        : "bg-background/60"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                      style={{ background: platform.bg, color: platform.color }}
                    >
                      <span className="scale-75 flex items-center justify-center">
                        {platform.iconNode}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight line-clamp-1">
                      {platform.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* ── Input for selected platform ── */}
              {selectedPlatform && selectedMeta && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformIcon platform={selectedMeta} size={32} />
                    <p className="text-sm font-semibold text-foreground">
                      {selectedMeta.label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={selectedMeta.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="h-9 text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddLink();
                        if (e.key === "Escape") setSelectedPlatform(null);
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-9 px-3 shrink-0"
                      onClick={handleAddLink}
                      disabled={!inputValue.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Save button ── */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full mt-1">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Cập nhật hồ sơ
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
