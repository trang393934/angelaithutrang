import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Upload, PartyPopper, Heart, Cake, Gift, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CelebrationTheme {
  id: string;
  label: string;
  icon: React.ReactNode;
  backgrounds: string[];
}

const THEMES: CelebrationTheme[] = [
  {
    id: "congratulations",
    label: "🎉 Chúc mừng",
    icon: <PartyPopper className="w-4 h-4" />,
    backgrounds: [
      "linear-gradient(135deg, #b8860b 0%, #daa520 15%, #ffd700 35%, #ffec8b 50%, #ffd700 65%, #daa520 85%, #b8860b 100%)",
      "linear-gradient(135deg, #ff6b6b 0%, #feca57 30%, #ff9ff3 60%, #54a0ff 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffd700 100%)",
    ],
  },
  {
    id: "gratitude",
    label: "🙏 Tri ân",
    icon: <Heart className="w-4 h-4" />,
    backgrounds: [
      "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 50%, #f6d365 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)",
    ],
  },
  {
    id: "birthday",
    label: "🎂 Sinh nhật",
    icon: <Cake className="w-4 h-4" />,
    backgrounds: [
      "linear-gradient(135deg, #fa709a 0%, #fee140 50%, #fa709a 100%)",
      "linear-gradient(135deg, #f5576c 0%, #ff6b6b 30%, #feca57 60%, #48dbfb 100%)",
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fdfcfb 100%)",
    ],
  },
  {
    id: "love",
    label: "❤️ Tình yêu",
    icon: <Heart className="w-4 h-4" />,
    backgrounds: [
      "linear-gradient(135deg, #ee5a6f 0%, #f093fb 50%, #ee5a6f 100%)",
      "linear-gradient(135deg, #ff0844 0%, #ffb199 50%, #ff0844 100%)",
      "linear-gradient(135deg, #f43b47 0%, #453a94 100%)",
    ],
  },
  {
    id: "newyear",
    label: "🎊 Năm mới",
    icon: <Sparkles className="w-4 h-4" />,
    backgrounds: [
      "linear-gradient(135deg, #b8860b 0%, #ff0000 30%, #ffd700 60%, #ff0000 100%)",
      "linear-gradient(135deg, #c62828 0%, #ffd700 50%, #c62828 100%)",
      "linear-gradient(135deg, #ff416c 0%, #ff4b2b 30%, #ffd700 70%, #ff416c 100%)",
    ],
  },
  {
    id: "family",
    label: "👨‍👩‍👧‍👦 Gia đình",
    icon: <Users className="w-4 h-4" />,
    backgrounds: [
      "linear-gradient(135deg, #96ceb4 0%, #ffeaa7 50%, #dfe6e9 100%)",
      "linear-gradient(135deg, #a8e6cf 0%, #dcedc1 30%, #ffd3b6 60%, #ffaaa5 100%)",
      "linear-gradient(135deg, #89f7fe 0%, #66a6ff 50%, #89f7fe 100%)",
    ],
  },
];

interface CelebrationThemeSelectorProps {
  selectedTheme: string;
  selectedBackground: number;
  customImage: string | null;
  onThemeChange: (themeId: string) => void;
  onBackgroundChange: (index: number) => void;
  onCustomImage: (url: string | null) => void;
}

export function CelebrationThemeSelector({
  selectedTheme,
  selectedBackground,
  customImage,
  onThemeChange,
  onBackgroundChange,
  onCustomImage,
}: CelebrationThemeSelectorProps) {
  const currentTheme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onCustomImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-amber-900/80">Chọn chủ đề</label>
      {/* Theme chips */}
      <div className="flex flex-wrap gap-1.5">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              onThemeChange(theme.id);
              onCustomImage(null);
              onBackgroundChange(0);
            }}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedTheme === theme.id
                ? "bg-amber-900/20 text-amber-900 ring-2 ring-amber-600/40"
                : "bg-white/40 text-amber-900/70 hover:bg-white/60"
            }`}
          >
            {theme.label}
          </button>
        ))}
      </div>

      {/* Background previews */}
      <div className="flex gap-2 items-center">
        {currentTheme.backgrounds.map((bg, idx) => (
          <button
            key={idx}
            onClick={() => {
              onBackgroundChange(idx);
              onCustomImage(null);
            }}
            className={`w-12 h-12 rounded-lg border-2 transition-all relative overflow-hidden ${
              !customImage && selectedBackground === idx
                ? "border-amber-600 ring-2 ring-amber-400/50 scale-105"
                : "border-white/50 hover:border-amber-400"
            }`}
            style={{ backgroundImage: bg }}
          >
            {!customImage && selectedBackground === idx && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
        {/* Upload custom */}
        <label
          className={`w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
            customImage
              ? "border-amber-600 ring-2 ring-amber-400/50"
              : "border-white/50 hover:border-amber-400"
          }`}
          style={customImage ? { backgroundImage: `url(${customImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          {!customImage && <Upload className="w-4 h-4 text-amber-900/50" />}
          {customImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>
    </div>
  );
}

export function getThemeBackground(themeId: string, bgIndex: number, customImage?: string | null): string {
  if (customImage) return "";
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  return theme.backgrounds[bgIndex] || theme.backgrounds[0];
}

export { THEMES };
