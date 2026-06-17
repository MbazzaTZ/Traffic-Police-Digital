// InstallPrompt - small banner inviting the user to install the PWA.
// Listens for the beforeinstallprompt event (Chrome/Edge/Android),
// shows a friendly prompt, and triggers the native install flow on tap.
// Dismissable - remembers via localStorage so we don't pester.
// iOS Safari doesn't fire beforeinstallprompt, so we show a small
// "Add to Home Screen" hint instead.
import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "tpdop_install_dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show,     setShow]     = useState(false);
  const [isIOS,    setIsIOS]    = useState(false);

  useEffect(() => {
    // Already installed (standalone PWA mode)? Hide.
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone) return; // iOS

    // Previously dismissed within last 14 days? Skip.
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < 14 * 24 * 60 * 60 * 1000) return;

    // iOS Safari - no beforeinstallprompt, show manual hint
    const ua = window.navigator.userAgent;
    const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    if (isIOSSafari) {
      setIsIOS(true);
      setTimeout(() => setShow(true), 4000);
      return;
    }

    // Chrome / Edge / Android
    function onPrompt(e) {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferred(null);
    } else {
      dismiss();
    }
  }

  if (!show) return null;

  return (
    <div role="dialog" aria-label="Install TPDOP app"
      style={{ position:"fixed", left:14, right:14, bottom:84, zIndex:120, background:"white", borderRadius:14, padding:"14px 16px", boxShadow:"0 10px 32px rgba(0,0,0,.15)", border:"1px solid #E2E8F0", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:42, height:42, borderRadius:10, background:"linear-gradient(135deg,#0D3477,#082A63)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Download size={20} color="white"/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#0F172A" }}>Install TPDOP</div>
        <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>
          {isIOS
            ? "Tap Share → Add to Home Screen"
            : "Faster access, works offline. Add to Home screen."}
        </div>
      </div>
      {!isIOS && (
        <button onClick={install} style={{ padding:"8px 14px", background:"#0D3477", color:"white", border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0 }}>
          Install
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss" style={{ width:28, height:28, borderRadius:6, background:"#F1F5F9", border:"none", color:"#94A3B8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <X size={14}/>
      </button>
    </div>
  );
}
