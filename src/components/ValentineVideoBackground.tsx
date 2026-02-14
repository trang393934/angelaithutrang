import { useState, useCallback } from "react";

const VALENTINE_VIDEOS = [
  "/videos/valentine-1.mp4",
  "/videos/valentine-2.mp4",
  "/videos/valentine-3.mp4",
];

export const ValentineVideoBackground = () => {
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(1);

  const handleLeftEnded = useCallback(() => {
    setLeftIndex((prev) => (prev + 1) % VALENTINE_VIDEOS.length);
  }, []);

  const handleRightEnded = useCallback(() => {
    setRightIndex((prev) => (prev + 1) % VALENTINE_VIDEOS.length);
  }, []);

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
      {/* Left video */}
      <video
        key={`left-${leftIndex}`}
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
        <source src={VALENTINE_VIDEOS[leftIndex]} type="video/mp4" />
      </video>

      {/* Right video */}
      <video
        key={`right-${rightIndex}`}
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
        <source src={VALENTINE_VIDEOS[rightIndex]} type="video/mp4" />
      </video>
    </>
  );
};
