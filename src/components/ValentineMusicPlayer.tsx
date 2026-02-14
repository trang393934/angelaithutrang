import { useState, useRef, useEffect } from "react";
import { Music, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export const ValentineMusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(() =>
    localStorage.getItem("valentine_music_playing") === "true"
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/audio/valentine-bg.mp3");
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = 0.4;
    audioRef.current = audio;

    if (isPlaying) {
      const timer = setTimeout(() => {
        audio.play().catch(() => {
          setIsPlaying(false);
          localStorage.setItem("valentine_music_playing", "false");
        });
      }, 300);
      return () => { clearTimeout(timer); audio.pause(); audio.src = ""; };
    }

    return () => { audio.pause(); audio.src = ""; };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
    localStorage.setItem("valentine_music_playing", String(isPlaying));
  }, [isPlaying]);

  return (
    <button
      onClick={() => setIsPlaying((p) => !p)}
      title={isPlaying ? "Tắt nhạc Valentine" : "🎵 Bật nhạc Valentine"}
      className={cn(
        "fixed bottom-6 right-20 z-50 h-12 w-12 rounded-full shadow-lg",
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
  );
};
