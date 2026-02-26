import { useState, useEffect } from "react";
import { Globe, Eye, MessageCircle, Send, Users, BarChart3, Grid3X3, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfilePublicSettings } from "@/hooks/useProfilePublicSettings";

const ALL_MODULES = [
  { id: "fun_play", label: "FUN Play 🎬" },
  { id: "fun_academy", label: "FUN Academy 🎓" },
  { id: "fun_market", label: "FUN Market 🛒" },
  { id: "fun_charity", label: "FUN Charity 🤍" },
  { id: "fun_farm", label: "FUN Farm 🌱" },
  { id: "fun_life", label: "FUN Life 🌌" },
  { id: "fun_invest", label: "FUN Invest 📈" },
];

export function PublicProfileSettingsSection() {
  const { settings, isLoading, isSaving, updateSettings } = useProfilePublicSettings();
  const [tagline, setTagline] = useState("");
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      setTagline(settings.tagline || "");
      setEnabledModules(settings.enabled_modules || []);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  const toggleSetting = (key: string, value: boolean) => {
    updateSettings({ [key]: value } as any);
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    const updated = checked
      ? [...enabledModules, moduleId]
      : enabledModules.filter((m) => m !== moduleId);
    setEnabledModules(updated);
    updateSettings({ enabled_modules: updated });
  };

  const handleSaveTagline = () => {
    updateSettings({ tagline: tagline.trim() || null });
  };

  const switches = [
    { key: "public_profile_enabled", label: "Bật hồ sơ công khai", icon: Globe, desc: "Cho phép mọi người xem trang fun.rich của bạn" },
    { key: "allow_public_follow", label: "Cho phép Follow công khai", icon: Users, desc: "Người lạ có thể follow bạn" },
    { key: "allow_public_message", label: "Cho phép nhắn tin công khai", icon: MessageCircle, desc: "Người lạ có thể gửi tin nhắn cho bạn" },
    { key: "allow_public_transfer", label: "Cho phép chuyển tiền công khai", icon: Send, desc: "Người lạ có thể gửi FUN Money / Camly Coin" },
    { key: "show_stats", label: "Hiện thống kê", icon: BarChart3, desc: "Hiển thị số liệu hoạt động trên profile" },
    { key: "show_friends_count", label: "Hiện số bạn bè", icon: Users, desc: "Hiển thị số lượng bạn bè" },
    { key: "show_modules", label: "Hiện FUN Worlds", icon: Grid3X3, desc: "Hiển thị các module FUN Ecosystem" },
    { key: "show_donation_button", label: "Hiện nút Donate", icon: Heart, desc: "Hiển thị nút quyên góp trên profile" },
  ];

  return (
    <Card className="border-2 border-primary/10 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-primary" />
          Cài đặt Hồ sơ Công khai
        </CardTitle>
        <CardDescription>
          Kiểm soát thông tin hiển thị trên trang fun.rich của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tagline */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tagline (giới thiệu 1 dòng)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="VD: Nhà sáng tạo nội dung & Cosmic Coach ✨"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={120}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleSaveTagline}
              disabled={isSaving}
            >
              Lưu
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{tagline.length}/120 ký tự</p>
        </div>

        {/* Privacy Toggles */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-foreground">Quyền riêng tư</Label>
          {switches.map(({ key, label, icon: Icon, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch
                checked={(settings as any)[key]}
                onCheckedChange={(checked) => toggleSetting(key, checked)}
                disabled={isSaving}
              />
            </div>
          ))}
        </div>

        {/* Module Selector */}
        {settings.show_modules && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              FUN Worlds hiển thị
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MODULES.map((mod) => (
                <label
                  key={mod.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={enabledModules.includes(mod.id)}
                    onCheckedChange={(checked) =>
                      handleModuleToggle(mod.id, checked as boolean)
                    }
                    disabled={isSaving}
                  />
                  <span className="text-sm">{mod.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
