import { useState, useRef, useEffect } from "react";
import { Music, VolumeX, Volume2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Initialize audio once
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const audio = new Audio("/audio/valentine-bg.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    if (isPlaying) {
      const timer = setTimeout(() => {
        audio.play().catch(() => {
          // Browser blocked autoplay — resume on first user interaction
          const resumeOnClick = () => {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            document.removeEventListener("click", resumeOnClick);
            document.removeEventListener("touchstart", resumeOnClick);
          };
          document.addEventListener("click", resumeOnClick, { once: true });
          document.addEventListener("touchstart", resumeOnClick, { once: true });
        });
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
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
      audio.play().catch(() => {});
    } else {
      audio.pause();
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

  const adjustVolume = (delta: number) => {
    setVolume((v) => Math.min(1, Math.max(0, +(v + delta).toFixed(2))));
  };

  return (
    <div className="fixed bottom-6 right-20 z-50 flex flex-col items-center gap-2">
      {/* Volume controls */}
      {showVolume && (
        <div className="flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md rounded-xl p-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => adjustVolume(0.1)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Tăng âm lượng"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="text-white text-xs font-medium min-w-[2ch] text-center">
            {Math.round(volume * 100)}
          </span>
          <button
            onClick={() => adjustVolume(-0.1)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Giảm âm lượng"
          >
            <Minus className="h-4 w-4" />
          </button>
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
