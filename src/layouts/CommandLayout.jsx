import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LayoutDashboard, Activity, Bell, Users, FileText, Map, Settings, LogOut, Shield } from "lucide-react";

const NAV = [
  { icon:LayoutDashboard, label:"Command Center", sw:"Makao Makuu",   path:"/command" },
  { icon:Activity,        label:"Live Incidents", sw:"Matukio Hai",   path:"/command/incidents" },
  { icon:Bell,            label:"Issue Alerts",   sw:"Toa Tahadhari", path:"/command/alerts" },
  { icon:Users,           label:"Officers",       sw:"Maafisa",       path:"/command/officers" },
  { icon:FileText,        label:"Reports",        sw:"Ripoti",        path:"/command/reports" },
  { icon:Settings,        label:"Settings",       sw:"Mipangilio",    path:"/command/settings" },
];

export default function CommandLayout({ children, pageTitle="Command", pageTitle2="" }) {
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0A0F1E", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <aside style={{ width:230, minHeight:"100vh", background:"linear-gradient(180deg,#03102B 0%,#050D22 100%)", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:50, borderRight:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.06)", textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:14, background:"white", border:"2px solid rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", padding:6 }}>
            <img src="/police-logo.png" alt="TPDOP" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
          </div>
          <div style={{ color:"white", fontWeight:900, fontSize:15, letterSpacing:2 }}>TPDOP</div>
          <div style={{ color:"rgba(255,255,255,.35)", fontSize:9, letterSpacing:1.5, marginTop:2 }}>COMMAND CENTER</div>
          <div style={{ marginTop:8, padding:"4px 10px", borderRadius:999, background:"rgba(220,38,38,.2)", border:"1px solid rgba(220,38,38,.4)", display:"inline-block" }}>
            <span style={{ color:"#FCA5A5", fontSize:10, fontWeight:700 }}>⚡ COMMAND AUTHORITY</span>
          </div>
        </div>
        <nav style={{ flex:1, padding:"10px 8px" }}>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = loc.pathname===item.path;
            return (
              <button key={item.path} onClick={()=>nav(item.path)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"none", background:active?"rgba(255,255,255,.1)":"transparent", color:active?"white":"rgba(255,255,255,.5)", cursor:"pointer", marginBottom:2, textAlign:"left", borderLeft:active?"3px solid #DC2626":"3px solid transparent" }}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.color="white";}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.5)";}}} >
                <Icon size={16} style={{flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{item.label}</div><div style={{fontSize:10,opacity:.5}}>{item.sw}</div></div>
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"10px 8px 14px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
          <button onClick={async()=>{await supabase.auth.signOut();nav("/");}}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"8px 12px", borderRadius:8, border:"none", background:"transparent", color:"rgba(255,255,255,.35)", cursor:"pointer", fontSize:12 }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(220,38,38,.15)";e.currentTarget.style.color="#FCA5A5";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.35)";}}>
            <LogOut size={13}/><span>Logout · Toka</span>
          </button>
        </div>
      </aside>
      <div style={{ marginLeft:230, flex:1, display:"flex", flexDirection:"column" }}>
        <header style={{ position:"fixed", top:0, left:230, right:0, height:58, background:"rgba(5,13,34,.95)", backdropFilter:"blur(8px)", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", zIndex:40 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Shield size={14} color="#FCA5A5"/>
            <span style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>Command</span>
            <span style={{ color:"rgba(255,255,255,.2)" }}>·</span>
            <span style={{ fontSize:14, fontWeight:700, color:"white" }}>{pageTitle}</span>
            {pageTitle2&&<span style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>· {pageTitle2}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:"rgba(220,38,38,.15)", border:"1px solid rgba(220,38,38,.3)" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#DC2626", display:"inline-block" }}/>
              <span style={{ fontSize:11, fontWeight:700, color:"#FCA5A5" }}>COMMAND ACTIVE</span>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontFamily:"monospace" }}>{new Date().toLocaleTimeString("en-GB")}</div>
          </div>
        </header>
        <div style={{ marginTop:58, padding:22, flex:1 }}>{children}</div>
      </div>
    </div>
  );
}
