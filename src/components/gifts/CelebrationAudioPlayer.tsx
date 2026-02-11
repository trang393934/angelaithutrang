import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

const AUDIO_TRACKS = [
  { id: "rich-1", label: "Rich! Rich! Rich! (1)", src: "/audio/rich-1.mp3" },
  { id: "rich-2", label: "Rich! Rich! Rich! (2)", src: "/audio/rich-2.mp3" },
  { id: "rich-3", label: "Rich! Rich! Rich! (3)", src: "/audio/rich-3.mp3" },
];

interface CelebrationAudioPlayerProps {
  selectedTrack: string;
  onTrackChange: (trackId: string) => void;
  autoPlay?: boolean;
}

export function CelebrationAudioPlayer({ selectedTrack, onTrackChange, autoPlay = false }: CelebrationAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const currentTrack = AUDIO_TRACKS.find((t) => t.id === selectedTrack) || AUDIO_TRACKS[0];

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [autoPlay]);

  useEffect(() => {
    // When track changes, reload
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentTrack.src;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [selectedTrack]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-amber-900/80">🎵 Âm thanh</label>
      <div className="flex gap-1.5 items-center flex-wrap">
        {AUDIO_TRACKS.map((track) => (
          <button
            key={track.id}
            onClick={() => onTrackChange(track.id)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedTrack === track.id
                ? "bg-amber-900/20 text-amber-900 ring-2 ring-amber-600/40"
                : "bg-white/40 text-amber-900/70 hover:bg-white/60"
            }`}
          >
            {track.label}
          </button>
        ))}
        <button onClick={togglePlay} className="p-1.5 rounded-full bg-white/40 hover:bg-white/60 transition-colors ml-1">
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-900" /> : <Play className="w-3.5 h-3.5 text-amber-900" />}
        </button>
        <button onClick={toggleMute} className="p-1.5 rounded-full bg-white/40 hover:bg-white/60 transition-colors">
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-900" /> : <Volume2 className="w-3.5 h-3.5 text-amber-900" />}
        </button>
      </div>
      <audio ref={audioRef} src={currentTrack.src} loop onEnded={() => setIsPlaying(false)} />
    </div>
  );
}

export { AUDIO_TRACKS };
