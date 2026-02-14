import { useState, useRef, useEffect, useCallback } from "react";
import { Music, VolumeX, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export const ValentineMusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(() =>
    localStorage.getItem("valentine_music_playing") !== "false"
  );
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("valentine_music_volume");
    return saved ? parseFloat(saved) : 0.4;
  });
  const [showVolume, setShowVolume] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitRef = useRef(false);
  const isReadyRef = useRef(false);

  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const doPlay = () => {
      audio.play().then(() => {
        // Successfully playing — remove global listeners
        document.removeEventListener("click", onInteraction, true);
        document.removeEventListener("touchstart", onInteraction, true);
      }).catch(() => {
        // Still blocked — keep listeners active
      });
    };

    if (isReadyRef.current) {
      doPlay();
    } else {
      audio.addEventListener("canplaythrough", () => doPlay(), { once: true });
    }
  }, []);

  const onInteraction = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) return; // already playing
    tryPlay();
  }, [tryPlay]);

  // Initialize audio once
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const audio = new Audio("/audio/valentine-bg.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("canplaythrough", () => {
      isReadyRef.current = true;
    }, { once: true });

    if (isPlaying) {
      // Wait a tick for audio to start loading
      const timer = setTimeout(() => {
        tryPlay();
        // Register global interaction fallback
        document.addEventListener("click", onInteraction, { capture: true });
        document.addEventListener("touchstart", onInteraction, { capture: true });
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.removeEventListener("click", onInteraction, true);
      document.removeEventListener("touchstart", onInteraction, true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Sync play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      tryPlay();
      document.addEventListener("click", onInteraction, { capture: true });
      document.addEventListener("touchstart", onInteraction, { capture: true });
    } else {
      audio.pause();
      document.removeEventListener("click", onInteraction, true);
      document.removeEventListener("touchstart", onInteraction, true);
    }
    localStorage.setItem("valentine_music_playing", String(isPlaying));
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    localStorage.setItem("valentine_music_volume", String(volume));
  }, [volume]);

  return (
    <div className="fixed bottom-6 right-20 z-50 flex flex-col items-center gap-2">
      {/* Volume slider */}
      {showVolume && (
        <div className="flex flex-col items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-xl p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-white text-[10px] font-medium">
            {Math.round(volume * 100)}%
          </span>
          <div className="h-20 flex items-center justify-center">
            <Slider
              orientation="vertical"
              min={0}
              max={100}
              step={1}
              value={[Math.round(volume * 100)]}
              onValueChange={([v]) => setVolume(v / 100)}
              className="h-full [&_[data-orientation=vertical]]:w-2 [&_[data-orientation=vertical]_.relative]:bg-white/20 [&_[data-orientation=vertical]_[role=slider]]:h-4 [&_[data-orientation=vertical]_[role=slider]]:w-4 [&_[data-orientation=vertical]_[role=slider]]:border-pink-400 [&_[data-orientation=vertical]_[role=slider]]:bg-white [&_[data-orientation=vertical]_span.absolute]:bg-gradient-to-t [&_[data-orientation=vertical]_span.absolute]:from-pink-500 [&_[data-orientation=vertical]_span.absolute]:to-red-400"
            />
          </div>
        </div>
      )}

      {/* Volume toggle */}
      <button
        onClick={() => setShowVolume((s) => !s)}
        title="Điều chỉnh âm lượng"
        className={cn(
          "h-10 w-10 rounded-full shadow-md flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-pink-400 to-red-400 text-white",
          "hover:scale-110 hover:shadow-pink-400/40 hover:shadow-lg"
        )}
      >
        <Volume2 className="h-4 w-4" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={() => setIsPlaying((p) => !p)}
        title={isPlaying ? "Tắt nhạc Valentine" : "🎵 Bật nhạc Valentine"}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg",
          "flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-pink-500 to-red-500 text-white",
          "hover:scale-110 hover:shadow-pink-500/40 hover:shadow-xl",
          !isPlaying && "animate-pulse"
        )}
      >
        {isPlaying ? (
          <Music className="h-5 w-5 animate-[spin_3s_linear_infinite]" />
        ) : (
          <VolumeX className="h-5 w-5" />
        )}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full animate-ping bg-pink-400 opacity-20" />
        )}
      </button>
    </div>
  );
};
