import { useState, useEffect } from "react";
import { Link2, Loader2, Check, Facebook, Instagram, Youtube, Globe, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SOCIAL_PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/username", color: "text-blue-600" },
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/username", color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: () => <span className="text-base">🎵</span>, placeholder: "https://tiktok.com/@username", color: "text-foreground" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@channel", color: "text-red-500" },
  { id: "linkedin", label: "LinkedIn", icon: () => <span className="text-base">💼</span>, placeholder: "https://linkedin.com/in/username", color: "text-blue-700" },
  { id: "twitter", label: "X (Twitter)", icon: () => <span className="text-base">𝕏</span>, placeholder: "https://x.com/username", color: "text-foreground" },
  { id: "website", label: "Website", icon: Globe, placeholder: "https://yourwebsite.com", color: "text-primary" },
  { id: "telegram", label: "Telegram", icon: MessageCircle, placeholder: "https://t.me/username", color: "text-sky-500" },
  { id: "discord", label: "Discord", icon: () => <span className="text-base">🎮</span>, placeholder: "https://discord.gg/invite", color: "text-indigo-500" },
] as const;

export type SocialLinks = Record<string, string>;

export function SocialLinksEditor() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SocialLinks>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Clean empty values
      const cleaned: SocialLinks = {};
      for (const [key, val] of Object.entries(links)) {
        const trimmed = val.trim();
        if (trimmed) cleaned[key] = trimmed;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ social_links: cleaned } as any)
        .eq("user_id", user.id);

      if (error) throw error;
      setLinks(cleaned);
      toast.success("Đã lưu Social Links ✨");
    } catch {
      toast.error("Không thể lưu Social Links");
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
          Social Links / External Profiles
        </CardTitle>
        <CardDescription>
          Dán link mạng xã hội để hiển thị trên FUN Profile công khai của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {SOCIAL_PLATFORMS.map(({ id, label, icon: Icon, placeholder, color }) => (
          <div key={id} className="flex items-center gap-3">
            <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${color}`}>
              {typeof Icon === "function" && Icon.length === 0 ? <Icon /> : <Icon className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
              <Input
                placeholder={placeholder}
                value={links[id] || ""}
                onChange={(e) => setLinks((prev) => ({ ...prev, [id]: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
          </div>
        ))}

        <Button onClick={handleSave} disabled={isSaving} className="w-full mt-2">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Lưu Social Links
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
