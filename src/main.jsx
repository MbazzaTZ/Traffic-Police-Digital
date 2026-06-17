import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./styles/mobile-overrides.css";

// ═══════════════════════════════════════════════════════════════
// CHUNK LOAD ERROR RECOVERY
// ═══════════════════════════════════════════════════════════════
// When a new Vercel deploy lands, the old cached main bundle (in the
// browser or in the service worker cache) tries to fetch chunk files
// (e.g. CitationsPage-CW0e9BRj.js) that no longer exist on the server
// because the new build generated different chunk hashes.
//
// Without this recovery, users see a blank page with console errors:
//   "Failed to fetch dynamically imported module: ...CitationsPage-XXX.js"
//
// With this recovery, the error is caught ONCE, the cache is cleared,
// and the page reloads automatically — loading the fresh main bundle
// which references the fresh chunk hashes. The user sees a brief
// reload flash instead of a broken page.
//
// The recovery only fires ONCE per session to avoid infinite reload
// loops if the error is something else (e.g. actual network failure).
// ═══════════════════════════════════════════════════════════════

const CHUNK_LOAD_ERROR_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
  "net::ERR_ABORTED",
];

let reloadTriggered = false;

function isChunkLoadError(message) {
  if (!message) return false;
  const msg = String(message).toLowerCase();
  return CHUNK_LOAD_ERROR_PATTERNS.some(p => msg.includes(p.toLowerCase()));
}

async function handleChunkLoadError() {
  if (reloadTriggered) return; // safety: only reload once per session
  reloadTriggered = true;

  // Try to unregister the service worker so the old cached bundle
  // doesn't get served again after reload.
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    } catch {
      // ignore — SW unregister is best-effort
    }
  }

  // Clear browser caches (Cache Storage API) — these hold the stale
  // JS/CSS chunks from the previous build.
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch {
      // ignore
    }
  }

  // Force reload (bypass cache) — the fresh main bundle will load
  // and reference the fresh chunk hashes.
  window.location.reload();
}

// Global error listener — catches unhandled chunk-load errors
window.addEventListener("error", (e) => {
  if (isChunkLoadError(e?.message) || isChunkLoadError(e?.error?.message)) {
    handleChunkLoadError();
  }
});

// Unhandled rejection listener — catches chunk-load errors thrown
// by dynamic import() inside React's lazy()
window.addEventListener("unhandledrejection", (e) => {
  if (isChunkLoadError(e?.reason?.message) || isChunkLoadError(e?.reason)) {
    handleChunkLoadError();
  }
});

// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER UPDATE NOTIFICATION
// ═══════════════════════════════════════════════════════════════
// When vite-plugin-pwa detects a new version, it auto-updates by
// default (registerType: 'autoUpdate' in vite.config.js). But the
// user might still be on the old page. This listener waits for the
// SW to take control and quietly reloads once so the new version
// activates — without showing an annoying "Update available" banner.
if ("serviceWorker" in navigator) {
  let swReloadDone = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // The new SW has taken control. Reload once so the page picks
    // up the new assets. Guard against the event firing multiple
    // times (which it does in some browsers).
    if (!swReloadDone) {
      swReloadDone = true;
      window.location.reload();
    }
  });
}

// ═══════════════════════════════════════════════════════════════

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
