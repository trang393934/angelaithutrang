import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Check, VolumeX, PartyPopper, Sparkles, AudioLines } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export type MusicTrack = "tet-1" | "tet-2" | "rich-4" | "none";

const TRACK_OPTIONS: { value: MusicTrack; icon: React.ElementType; label: string; src: string }[] = [
  { value: "tet-1", icon: PartyPopper, label: "Tết Vui Vẻ 1", src: "/audio/tet-vui-ve-1.mp3" },
  { value: "tet-2", icon: Sparkles, label: "Tết Vui Vẻ 2", src: "/audio/tet-vui-ve-2.mp3" },
  { value: "rich-4", icon: AudioLines, label: "Nhạc hiệu 2", src: "/audio/rich-4.mp3" },
];

const getStoredTrack = (): MusicTrack => {
  const stored = localStorage.getItem("bg-music-track") as MusicTrack;
  return stored === "tet-1" || stored === "tet-2" || stored === "rich-4" || stored === "none" ? stored : "rich-4";
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
  const [hoverOpen, setHoverOpen] = useState(false);
  const lastTrackRef = useRef<MusicTrack>(getStoredTrack() === "none" ? "rich-4" : getStoredTrack());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitRef = useRef(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create or get audio element
  const getOrCreateAudio = useCallback((src: string): HTMLAudioElement => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;
    return audio;
  }, [volume]);

  // Play with mobile-safe fallback
  const playAudio = useCallback((audio: HTMLAudioElement) => {
    const attempt = () => {
      audio.play().catch(() => {
        const resume = () => {
          audio.play().catch(() => {});
          document.removeEventListener("touchstart", resume, true);
          document.removeEventListener("click", resume, true);
          document.removeEventListener("touchend", resume, true);
        };
        document.addEventListener("touchstart", resume, { capture: true, passive: true });
        document.addEventListener("touchend", resume, { capture: true, passive: true });
        document.addEventListener("click", resume, { capture: true });
      });
    };

    if (audio.readyState >= 3) {
      attempt();
    } else {
      audio.addEventListener("canplaythrough", attempt, { once: true });
    }
  }, []);

  // Resume on visibility change
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!document.hidden && audio && isPlaying && track !== "none") {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isPlaying, track]);

  // Init audio on mount
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    if (track === "none" || !isPlaying) return;

    const currentTrack = TRACK_OPTIONS.find((t) => t.value === track);
    if (!currentTrack) return;

    const audio = getOrCreateAudio(currentTrack.src);
    setTimeout(() => playAudio(audio), 300);
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem("bg-music-volume", String(volume));
  }, [volume]);

  // Toggle play/pause on click
  const handleToggle = () => {
    if (isPlaying && track !== "none") {
      // Currently playing → stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
      }
      lastTrackRef.current = track;
      setTrack("none");
      setIsPlaying(false);
      localStorage.setItem("bg-music-track", "none");
      localStorage.setItem("bg-music-playing", "false");
    } else {
      // Currently stopped → play last track
      const restoreTrack = lastTrackRef.current;
      const selected = TRACK_OPTIONS.find((t) => t.value === restoreTrack);
      if (!selected) return;

      setTrack(restoreTrack);
      localStorage.setItem("bg-music-track", restoreTrack);

      const audio = getOrCreateAudio(selected.src);
      playAudio(audio);

      setIsPlaying(true);
      localStorage.setItem("bg-music-playing", "true");
    }
  };

  // Select a specific track from hover menu
  const selectTrack = (value: MusicTrack) => {
    lastTrackRef.current = value;
    setTrack(value);
    localStorage.setItem("bg-music-track", value);

    const selected = TRACK_OPTIONS.find((t) => t.value === value);
    if (!selected) return;

    const audio = getOrCreateAudio(selected.src);
    playAudio(audio);

    setIsPlaying(true);
    localStorage.setItem("bg-music-playing", "true");
    setHoverOpen(false);
  };

  // Hover handlers with delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoverOpen(false), 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const isHeader = variant === "header";
  const isActive = isPlaying && track !== "none";

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main toggle button */}
      {isHeader ? (
        <button
          onClick={handleToggle}
          className={`flex items-center gap-1 px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-full transition-all ${
            isActive
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              : "bg-primary-pale/50 hover:bg-primary-pale"
          }`}
          aria-label={isActive ? "Tắt nhạc nền" : "Bật nhạc nền"}
          type="button"
        >
          <Music
            className={`w-5 h-5 ${
              isActive ? "text-black animate-[spin_3s_linear_infinite]" : "text-amber-500"
            }`}
          />
        </button>
      ) : (
        <button
          onClick={handleToggle}
          className={`fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full backdrop-blur-sm shadow-lg border flex items-center justify-center transition-all ${
            isActive
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.5)]"
              : "bg-white/80 border-primary/20 hover:bg-white/90"
          }`}
          aria-label={isActive ? "Tắt nhạc nền" : "Bật nhạc nền"}
        >
          <Music
            className={`w-5 h-5 ${
              isActive ? "text-black animate-[spin_3s_linear_infinite]" : "text-amber-500"
            }`}
          />
        </button>
      )}

      {/* Hover dropdown */}
      {hoverOpen && (
        <div
          className={`absolute z-[100] w-56 p-2 rounded-lg border bg-popover text-popover-foreground shadow-lg ${
            isHeader ? "top-full right-0 mt-1" : "bottom-full right-0 mb-2"
          }`}
        >
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
        </div>
      )}
    </div>
  );
};
