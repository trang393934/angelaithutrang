import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Routes where scroll position should be preserved when navigating back
const PRESERVE_SCROLL_ROUTES = ["/chat", "/community", "/earn", "/mint", "/messages"];

// Store scroll positions per pathname
const scrollPositions = new Map<string, number>();

export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Save scroll position of the page we're leaving
    if (prevPathname.current !== pathname) {
      scrollPositions.set(prevPathname.current, window.scrollY);
      prevPathname.current = pathname;
    }

    // Restore or reset scroll
    if (PRESERVE_SCROLL_ROUTES.some(route => pathname.startsWith(route))) {
      const saved = scrollPositions.get(pathname);
      if (saved !== undefined) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved, left: 0, behavior: "instant" as ScrollBehavior });
        });
      }
      return;
    }

    // Default: scroll to top for non-preserved routes
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
};
