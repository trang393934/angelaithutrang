import { useState, useCallback, useEffect } from "react";
import { type VideoTheme, getVideoTheme } from "./VideoThemeSelector";

const THEME_VIDEOS: Record<VideoTheme, string[]> = {
  "nature-1": ["/videos/nature-1.mp4", "/videos/nature-2.mp4"],
  "nature-2": ["/videos/nature-3.mp4", "/videos/nature-4.mp4"],
  "nature-3": ["/videos/nature-1.mp4", "/videos/nature-3.mp4"],
  "nature-4": ["/videos/nature-2.mp4", "/videos/nature-4.mp4"],
  "none": [],
};

export const ValentineVideoBackground = () => {
  const [theme, setTheme] = useState<VideoTheme>(getVideoTheme);
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    const handler = () => {
      setTheme(getVideoTheme());
      setVideoIndex(0);
    };
    window.addEventListener("video-theme-change", handler);
    return () => window.removeEventListener("video-theme-change", handler);
  }, []);

  const videos = THEME_VIDEOS[theme] || [];

  const handleEnded = useCallback(() => {
    setVideoIndex((prev) => (prev + 1) % (videos.length || 1));
  }, [videos.length]);

  if (videos.length === 0) return null;

  const src = videos[videoIndex % videos.length];

  return (
    <video
      key={`bg-${theme}-${videoIndex}`}
      autoPlay
      muted
      playsInline
      onEnded={handleEnded}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        objectFit: "cover",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.3,
        filter: "saturate(1.3) contrast(1.1)",
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};
