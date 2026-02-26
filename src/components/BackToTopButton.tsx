import { useState, useEffect, RefObject } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackToTopButtonProps {
  scrollRef?: RefObject<HTMLElement>;
}

export const BackToTopButton = ({ scrollRef }: BackToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = scrollRef?.current;

    const toggleVisibility = () => {
      const scrollTop = target ? target.scrollTop : window.scrollY;
      setIsVisible(scrollTop > 300);
    };

    const el = target || window;
    el.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => el.removeEventListener("scroll", toggleVisibility);
  }, [scrollRef]);

  const scrollToTop = () => {
    const target = scrollRef?.current;
    if (target) {
      target.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
        "transition-all duration-300 ease-in-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
      size="icon"
      aria-label="Quay lại đầu trang"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};
