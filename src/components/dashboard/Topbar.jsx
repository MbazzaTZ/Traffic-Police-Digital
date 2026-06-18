import { Bell, MessageSquare, MapPin, ChevronDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ pageTitle = "Dashboard", pageTitle2 = "", isMobile = false, onMenuClick }) {
  const nav = useNavigate();
  const date = new Date().toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short", year:"numeric" });

  return (
    <header style={{
      position:"fixed", top:0, left: isMobile ? 0 : 240, right:0, height:64,
      background:"rgba(255,255,255,0.72)",
      backdropFilter:"blur(14px) saturate(140%)",
      WebkitBackdropFilter:"blur(14px) saturate(140%)",
      borderBottom:"1px solid rgba(13,52,119,0.14)",
      boxShadow:"0 1px 8px rgba(3,16,43,0.06)",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:isMobile ? "0 12px" : "0 24px", zIndex:40,
      fontFamily:"var(--font-sans, 'IBM Plex Sans', sans-serif)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, flex:1 }}>
        {isMobile && (
          <button onClick={onMenuClick} aria-label="Open menu" style={{ width:38, height:38, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477", flexShrink:0 }}>
            <Menu size={18}/>
          </button>
        )}
        {!isMobile && <MapPin size={14} color="#16A34A"/>}
        {!isMobile && <span style={{ fontSize:13, color:"#64748B" }}>Tanzania Police Force</span>}
        {!isMobile && <span style={{ color:"#CBD5E1" }}>·</span>}
        <span style={{ fontSize:14, fontWeight:700, color:"var(--navy-700, #0D3477)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:"var(--font-serif, Georgia, serif)" }}>{pageTitle}</span>
        {!isMobile && pageTitle2 && <span style={{ fontSize:13, color:"#94A3B8" }}>· {pageTitle2}</span>}
        {!isMobile && <span style={{ color:"#CBD5E1", margin:"0 4px" }}>·</span>}
        {!isMobile && <span style={{ fontSize:12, color:"#94A3B8" }}>{date}</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        {!isMobile && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:999, background:"var(--success-bg, #F0FDF4)", border:"1px solid rgba(21,128,61,0.25)" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--success, #15803D)", display:"inline-block" }}/>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--success, #15803D)" }}>ON DUTY</span>
          </div>
        )}
        <button onClick={() => nav("/messages")} aria-label="Messages" style={{ position:"relative", width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", color:"#64748B" }}>
          <MessageSquare size={18}/>
        </button>
        <button onClick={() => nav("/alerts")} aria-label="Alerts" style={{ position:"relative", width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", color:"#64748B" }}>
          <Bell size={18}/>
        </button>
        {!isMobile && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px 5px 6px", borderRadius:999, border:"1px solid #E2E8F0", cursor:"pointer" }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg, var(--navy-700, #0D3477), var(--navy-800, #082A63))", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 3px rgba(13,52,119,0.3)" }}>
              <span style={{ color:"white", fontSize:12, fontWeight:800 }}>P</span>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>Officer</div>
              <div style={{ fontSize:10, color:"#94A3B8" }}>TPDOP</div>
            </div>
            <ChevronDown size={13} color="#94A3B8"/>
          </div>
        )}
      </div>
    </header>
  );
}
