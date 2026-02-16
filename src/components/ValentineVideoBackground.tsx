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
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const handler = () => {
      const newTheme = getVideoTheme();
      setTheme(newTheme);
      setLeftIndex(0);
      setRightIndex(1);
    };
    window.addEventListener("video-theme-change", handler);
    return () => window.removeEventListener("video-theme-change", handler);
  }, []);

  const videos = THEME_VIDEOS[theme] || [];

  const handleLeftEnded = useCallback(() => {
    setLeftIndex((prev) => (prev + 1) % (videos.length || 1));
  }, [videos.length]);

  const handleRightEnded = useCallback(() => {
    setRightIndex((prev) => (prev + 1) % (videos.length || 1));
  }, [videos.length]);

  if (videos.length === 0) return null;

  const leftSrc = videos[leftIndex % videos.length];
  const rightSrc = videos[rightIndex % videos.length] || videos[0];

  // Mobile: single full-width video with low opacity
  if (isMobile) {
    return (
      <video
        key={`mobile-${theme}-${leftIndex}`}
        autoPlay
        muted
        playsInline
        onEnded={handleLeftEnded}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          objectFit: "cover",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.25,
          filter: "saturate(1.3) contrast(1.1)",
        }}
      >
        <source src={leftSrc} type="video/mp4" />
      </video>
    );
  }

  // Desktop: dual side videos
  const videoStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    bottom: 0,
    width: "38%",
    height: "100vh",
    objectFit: "cover",
    pointerEvents: "none",
    zIndex: 0,
    filter: "saturate(1.3) contrast(1.1)",
  };

  return (
    <>
      <video
        key={`left-${theme}-${leftIndex}`}
        autoPlay
        muted
        playsInline
        onEnded={handleLeftEnded}
        style={{
          ...videoStyle,
          left: 0,
          maskImage: "linear-gradient(to right, black 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 100%)",
        }}
      >
        <source src={leftSrc} type="video/mp4" />
      </video>

      <video
        key={`right-${theme}-${rightIndex}`}
        autoPlay
        muted
        playsInline
        onEnded={handleRightEnded}
        style={{
          ...videoStyle,
          right: 0,
          maskImage: "linear-gradient(to left, black 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, black 50%, transparent 100%)",
        }}
      >
        <source src={rightSrc} type="video/mp4" />
      </video>
    </>
  );
};
