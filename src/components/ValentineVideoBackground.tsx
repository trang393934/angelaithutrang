import { useState, useCallback, useEffect, useRef } from "react";
import { type VideoTheme, getVideoTheme } from "./VideoThemeSelector";

const THEME_VIDEOS: Record<VideoTheme, string[]> = {
  "nature-1": ["/videos/nature-1.mp4", "/videos/nature-2.mp4"],
  "nature-2": ["/videos/nature-3.mp4", "/videos/nature-4.mp4"],
  "nature-3": ["/videos/nature-1.mp4", "/videos/nature-3.mp4"],
  "nature-4": ["/videos/nature-2.mp4", "/videos/nature-4.mp4"],
  "nature-5": ["/videos/nature-5.mp4"],
  "none": [],
};

export const ValentineVideoBackground = () => {
  const [theme, setTheme] = useState<VideoTheme>(getVideoTheme);
  const [videoIndex, setVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handler = () => {
      setTheme(getVideoTheme());
      setVideoIndex(0);
    };
    window.addEventListener("video-theme-change", handler);
    return () => window.removeEventListener("video-theme-change", handler);
  }, []);

  // On mobile, browsers may pause video on tab switch or interaction — resume it
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    // Resume on visibility change (tab switch, lock screen)
    const onVisibility = () => {
      if (!document.hidden) tryPlay();
    };

    // Resume on any user interaction (required by iOS Safari)
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("touchstart", tryPlay, { once: false, passive: true });
    document.addEventListener("click", tryPlay, { once: false, passive: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("click", tryPlay);
    };
  }, [theme, videoIndex]);

  const videos = THEME_VIDEOS[theme] || [];

  const handleEnded = useCallback(() => {
    setVideoIndex((prev) => (prev + 1) % (videos.length || 1));
  }, [videos.length]);

  if (videos.length === 0) return null;

  const src = videos[videoIndex % videos.length];

  return (
    <video
      ref={videoRef}
      key={`bg-${theme}-${videoIndex}`}
      autoPlay
      muted
      playsInline
      loop={videos.length === 1}
      onEnded={handleEnded}
      // On some mobile browsers the video stalls — try to resume
      onStalled={() => videoRef.current?.load()}
      onSuspend={() => {
        const v = videoRef.current;
        if (v && v.paused) v.play().catch(() => {});
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        objectFit: "cover",
        pointerEvents: "none",
        zIndex: 0,
        filter: "saturate(1.3) contrast(1.1)",
        // iOS Safari needs this to prevent full-screen takeover
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};
