import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Routes where scroll position should be preserved when navigating back
const PRESERVE_SCROLL_ROUTES = ["/chat"];

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Skip scroll-to-top for routes that manage their own scroll position
    if (PRESERVE_SCROLL_ROUTES.some(route => pathname.startsWith(route))) {
      return;
    }
    // Scrolls to top with instant behavior
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};
