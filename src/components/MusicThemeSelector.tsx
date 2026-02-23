import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Music, Check, PartyPopper, Sparkles, AudioLines } from "lucide-react";
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

// Simple touch device detection
const isTouchDevice = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

interface MusicThemeSelectorProps {
  variant?: "header" | "floating";
}

export const MusicThemeSelector = ({ variant = "floating" }: MusicThemeSelectorProps) => {
  const [track, setTrack] = useState<MusicTrack>(getStoredTrack);
  const [volume, setVolume] = useState(getStoredVolume);
  const [isPlaying, setIsPlaying] = useState(getStoredPlaying);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const lastTrackRef = useRef<MusicTrack>(getStoredTrack() === "none" ? "rich-4" : getStoredTrack());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitRef = useRef(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    if (audio.readyState >= 3) attempt();
    else audio.addEventListener("canplaythrough", attempt, { once: true });
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

  // Close menu on outside click (for mobile)
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      const menuEl = document.getElementById("music-menu-portal");
      if (menuEl?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [menuOpen]);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }
    lastTrackRef.current = track === "none" ? lastTrackRef.current : track;
    setTrack("none");
    setIsPlaying(false);
    localStorage.setItem("bg-music-track", "none");
    localStorage.setItem("bg-music-playing", "false");
  }, [track]);

  const startMusic = useCallback((targetTrack?: MusicTrack) => {
    const restoreTrack = targetTrack || lastTrackRef.current;
    const selected = TRACK_OPTIONS.find((t) => t.value === restoreTrack);
    if (!selected) return;
    lastTrackRef.current = restoreTrack;
    setTrack(restoreTrack);
    localStorage.setItem("bg-music-track", restoreTrack);
    const audio = getOrCreateAudio(selected.src);
    playAudio(audio);
    setIsPlaying(true);
    localStorage.setItem("bg-music-playing", "true");
  }, [getOrCreateAudio, playAudio]);

  // Calculate menu position
  const updateMenuPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 240;
    const isHeaderVariant = variant === "header";
    if (isHeaderVariant) {
      setMenuPos({
        top: rect.bottom + 6,
        left: Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8),
      });
    } else {
      setMenuPos({
        top: rect.top - 6,
        left: Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8),
      });
    }
  }, [variant]);

  // Desktop: click toggles music, hover opens menu
  // Mobile: click opens menu (with toggle inside)
  const handleButtonClick = () => {
    if (isTouchDevice()) {
      updateMenuPos();
      setMenuOpen((prev) => !prev);
    } else {
      // Desktop click = toggle
      if (isPlaying && track !== "none") stopMusic();
      else startMusic();
    }
  };

  const handleMouseEnter = () => {
    if (isTouchDevice()) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    updateMenuPos();
    setMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice()) return;
    hoverTimeoutRef.current = setTimeout(() => setMenuOpen(false), 300);
  };

  const handleMenuEnter = () => {
    if (isTouchDevice()) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleMenuLeave = () => {
    if (isTouchDevice()) return;
    hoverTimeoutRef.current = setTimeout(() => setMenuOpen(false), 200);
  };

  const selectTrack = (value: MusicTrack) => {
    startMusic(value);
    if (isTouchDevice()) {
      // Keep menu open on mobile so user can adjust volume
    } else {
      setMenuOpen(false);
    }
  };

  // Cleanup
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

  const dropdownMenu = menuOpen && menuPos && createPortal(
    <div
      id="music-menu-portal"
      onMouseEnter={handleMenuEnter}
      onMouseLeave={handleMenuLeave}
      className="fixed z-[9999] w-60 rounded-xl border border-amber-200/60 bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(180,130,20,0.18),0_2px_8px_rgba(0,0,0,0.08)] p-3 animate-fade-in"
      style={{
        top: isHeader ? menuPos.top : undefined,
        bottom: isHeader ? undefined : `${window.innerHeight - menuPos.top}px`,
        left: menuPos.left,
      }}
    >
      <p className="text-xs font-bold text-amber-800/80 uppercase tracking-wider px-1 pb-2">
        🎵 Nhạc nền
      </p>

      {/* Mobile: show play/stop toggle */}
      {isTouchDevice() && (
        <button
          onClick={() => {
            if (isActive) stopMusic();
            else startMusic();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold mb-1 transition-all ${
            isActive
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>{isActive ? "⏸ Tắt nhạc" : "▶ Bật nhạc"}</span>
        </button>
      )}

      <div className="space-y-0.5">
        {TRACK_OPTIONS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => selectTrack(value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              track === value
                ? "bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-900 font-semibold shadow-sm ring-1 ring-amber-200/50"
                : "hover:bg-amber-50/80 text-foreground"
            }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${track === value ? "text-amber-600" : "text-muted-foreground"}`} />
            <span className="flex-1 text-left">{label}</span>
            {track === value && <Check className="w-4 h-4 flex-shrink-0 text-amber-600" />}
          </button>
        ))}
      </div>

      {/* Volume slider */}
      <div className="mt-3 px-1 pt-2 border-t border-amber-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-amber-700/80">Âm lượng</p>
          <span className="text-[11px] font-bold text-amber-600">{Math.round(volume * 100)}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Math.round(volume * 100)]}
          onValueChange={([v]) => setVolume(v / 100)}
        />
      </div>
    </div>,
    document.body
  );

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={isHeader ? "relative" : ""}
    >
      {isHeader ? (
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
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
          ref={buttonRef}
          onClick={handleButtonClick}
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

      {dropdownMenu}
    </div>
  );
};
