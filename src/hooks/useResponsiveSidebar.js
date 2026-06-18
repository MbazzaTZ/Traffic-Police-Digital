// ============================================================
// useResponsiveSidebar — mobile-aware sidebar visibility
// On mobile (<768px) the sidebar is hidden by default and toggled
// via a hamburger button. On desktop it's always visible.
// Auto-closes when the route changes on mobile.
// ============================================================
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useResponsiveSidebar() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Track viewport size
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-close on navigation when in mobile mode
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [location.pathname, isMobile]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile, open]);

  return { isMobile, open, toggle: () => setOpen(o => !o), close: () => setOpen(false) };
}
