import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Utility component that resets the scroll position to the top
 * whenever the route (pathname) changes. This matches native app
 * and standard website behavior.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top immediately on route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
