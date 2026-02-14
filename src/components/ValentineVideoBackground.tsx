import { useState, useCallback, RefObject } from "react";

const VALENTINE_VIDEOS = [
  "/videos/valentine-1.mp4",
  "/videos/valentine-2.mp4",
  "/videos/valentine-3.mp4",
];

interface Props {
  headerRef: RefObject<HTMLDivElement>;
}

export const ValentineVideoBackground = ({ headerRef }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleEnded = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % VALENTINE_VIDEOS.length);
  }, []);

  return (
    <video
      key={currentIndex}
      autoPlay
      muted
      playsInline
      onEnded={handleEnded}
      className="fixed left-0 right-0 bottom-0 w-full object-contain object-top z-[1] pointer-events-none transition-opacity duration-1000"
      style={{
        opacity: 1,
        filter: "saturate(1.3) contrast(1.1)",
        top: "var(--index-header-h, 3.5rem)",
        height: "calc(100vh - var(--index-header-h, 3.5rem))",
      }}
    >
      <source src={VALENTINE_VIDEOS[currentIndex]} type="video/mp4" />
    </video>
  );
};
