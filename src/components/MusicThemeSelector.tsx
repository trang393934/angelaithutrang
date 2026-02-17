import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Check, VolumeX, PartyPopper, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

export type MusicTrack = "tet-1" | "tet-2" | "none";

const TRACK_OPTIONS: { value: MusicTrack; icon: React.ElementType; label: string; src: string }[] = [
  { value: "tet-1", icon: PartyPopper, label: "Tết Vui Vẻ 1", src: "/audio/tet-vui-ve-1.mp3" },
  { value: "tet-2", icon: Sparkles, label: "Tết Vui Vẻ 2", src: "/audio/tet-vui-ve-2.mp3" },
  { value: "none", icon: VolumeX, label: "Tắt nhạc", src: "" },
];

const getStoredTrack = (): MusicTrack => {
  const stored = localStorage.getItem("bg-music-track") as MusicTrack;
  return stored === "tet-1" || stored === "tet-2" || stored === "none" ? stored : "tet-1";
};

const getStoredVolume = (): number => {
  const v = localStorage.getItem("bg-music-volume");
  return v ? parseFloat(v) : 0.4;
};

const getStoredPlaying = (): boolean =>
  localStorage.getItem("bg-music-playing") !== "false";

interface MusicThemeSelectorProps {
  variant?: "header" | "floating";
}

export const MusicThemeSelector = ({ variant = "floating" }: MusicThemeSelectorProps) => {
  const [track, setTrack] = useState<MusicTrack>(getStoredTrack);
  const [volume, setVolume] = useState(getStoredVolume);
  const [isPlaying, setIsPlaying] = useState(getStoredPlaying);
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitRef = useRef(false);
  const isReadyRef = useRef(false);

  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    audio.play().then(() => {
      document.removeEventListener("click", onInteraction, true);
      document.removeEventListener("touchstart", onInteraction, true);
    }).catch(() => {});
  }, []);

  const onInteraction = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) return;
    tryPlay();
  }, [tryPlay]);

  // Init audio once
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const currentTrack = TRACK_OPTIONS.find((t) => t.value === track);
    if (!currentTrack || currentTrack.value === "none") return;

    const audio = new Audio(currentTrack.src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("canplaythrough", () => { isReadyRef.current = true; }, { once: true });

    if (isPlaying) {
      const timer = setTimeout(() => {
        tryPlay();
        document.addEventListener("click", onInteraction, { capture: true });
        document.addEventListener("touchstart", onInteraction, { capture: true });
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.removeEventListener("click", onInteraction, true);
      document.removeEventListener("touchstart", onInteraction, true);
    };
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem("bg-music-volume", String(volume));
  }, [volume]);

  const selectTrack = (value: MusicTrack) => {
    setTrack(value);
    localStorage.setItem("bg-music-track", value);

    const audio = audioRef.current;

    if (value === "none") {
      if (audio) audio.pause();
      setIsPlaying(false);
      localStorage.setItem("bg-music-playing", "false");
      setOpen(false);
      return;
    }

    const selected = TRACK_OPTIONS.find((t) => t.value === value);
    if (!selected) return;

    if (!audio) {
      const newAudio = new Audio(selected.src);
      newAudio.loop = true;
      newAudio.preload = "auto";
      newAudio.volume = volume;
      audioRef.current = newAudio;
      newAudio.addEventListener("canplaythrough", () => {
        newAudio.play().catch(() => {});
      }, { once: true });
    } else {
      audio.pause();
      audio.src = selected.src;
      audio.load();
      audio.addEventListener("canplaythrough", () => {
        audio.play().catch(() => {});
      }, { once: true });
    }

    setIsPlaying(true);
    localStorage.setItem("bg-music-playing", "true");
    document.addEventListener("click", onInteraction, { capture: true });
    document.addEventListener("touchstart", onInteraction, { capture: true });
    setOpen(false);
  };

  const isHeader = variant === "header";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {isHeader ? (
          <button
            className="flex items-center gap-1 px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-full bg-primary-pale/50 hover:bg-primary-pale transition-colors"
            aria-label="Chọn nhạc nền"
            type="button"
          >
            <Music className="w-5 h-5 text-pink-500" />
          </button>
        ) : (
          <button
            className="fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-primary/20 hover:bg-white/90 flex items-center justify-center"
            aria-label="Chọn nhạc nền"
          >
            <Music className="w-5 h-5 text-pink-500" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent side={isHeader ? "bottom" : "top"} align="end" className="w-56 p-2">
        <p className="text-xs font-semibold text-muted-foreground px-2 pb-1.5">Nhạc nền</p>
        {TRACK_OPTIONS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => selectTrack(value)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
              track === value
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {track === value && <Check className="w-4 h-4 flex-shrink-0" />}
          </button>
        ))}

        {/* Volume slider */}
        {track !== "none" && (
          <div className="mt-2 px-2.5 pb-1">
            <p className="text-[10px] text-muted-foreground mb-1.5">Âm lượng: {Math.round(volume * 100)}%</p>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(volume * 100)]}
              onValueChange={([v]) => setVolume(v / 100)}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
