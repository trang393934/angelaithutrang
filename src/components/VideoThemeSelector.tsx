import { Film, Check, VideoOff, Trees, Waves, Mountain, Flower2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export type VideoTheme = "nature-1" | "nature-2" | "nature-3" | "nature-4" | "none";

const THEME_OPTIONS: { value: VideoTheme; icon: React.ElementType; labelKey: string }[] = [
  { value: "nature-1", icon: Trees, labelKey: "Rừng & Suối" },
  { value: "nature-2", icon: Waves, labelKey: "Biển & Sóng" },
  { value: "nature-3", icon: Mountain, labelKey: "Núi & Rừng" },
  { value: "nature-4", icon: Flower2, labelKey: "Hoa & Biển" },
  { value: "none", icon: VideoOff, labelKey: "Tắt video" },
];

export const getVideoTheme = (): VideoTheme => {
  return (localStorage.getItem("video-theme") as VideoTheme) || "nature-1";
};

interface VideoThemeSelectorProps {
  variant?: "header" | "floating";
}

export const VideoThemeSelector = ({ variant = "floating" }: VideoThemeSelectorProps) => {
  const [theme, setTheme] = useState<VideoTheme>(getVideoTheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setTheme(getVideoTheme());
    window.addEventListener("video-theme-change", handler);
    return () => window.removeEventListener("video-theme-change", handler);
  }, []);

  const selectTheme = (value: VideoTheme) => {
    localStorage.setItem("video-theme", value);
    setTheme(value);
    window.dispatchEvent(new Event("video-theme-change"));
    setOpen(false);
  };

  const isHeader = variant === "header";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {isHeader ? (
          <button
            className="flex items-center gap-1 px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-full bg-primary-pale/50 hover:bg-primary-pale transition-colors"
            aria-label="Chọn video nền"
            type="button"
          >
            <Film className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-500" />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-primary/20 hover:bg-white/90"
            aria-label="Chọn video nền"
          >
            <Film className="w-5 h-5 text-amber-500" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent side={isHeader ? "bottom" : "top"} align="end" className="w-52 p-2">
        <p className="text-xs font-semibold text-muted-foreground px-2 pb-1.5">Video nền</p>
        {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
          <button
            key={value}
            onClick={() => selectTheme(value)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
              theme === value
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{labelKey}</span>
            {theme === value && <Check className="w-4 h-4 flex-shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
