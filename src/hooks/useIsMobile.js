// useIsMobile - lightweight viewport tracker.
// Returns true when window width is below the breakpoint (default 768px).
// Separate from useResponsiveSidebar so any component can use it without
// the sidebar's open/close state machine.
import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < breakpoint); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}
