import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, FileText, Shield, MapPinned, FolderOpen, MessageSquare, Bell, Settings, LogOut } from "lucide-react";

const NAV = [
  { icon:LayoutDashboard, label:"Dashboard",        sw:"Dashibodi",   path:"/dashboard" },
  { icon:Search,          label:"Person Search",    sw:"Tafuta Mtu",  path:"/person-search" },
  { icon:FileText,        label:"Incidents",        sw:"Ripoti",      path:"/incidents" },
  { icon:Shield,          label:"Arrests",          sw:"Kukamatwa",   path:"/arrests" },
  { icon:MapPinned,       label:"Patrols",          sw:"Doria",       path:"/patrols" },
  { icon:FolderOpen,      label:"Evidence",         sw:"Ushahidi",    path:"/evidence" },
  { icon:MessageSquare,   label:"Messages",         sw:"Ujumbe",      path:"/messages" },
  { icon:Bell,            label:"Alerts",           sw:"Tahadhari",   path:"/alerts" },
  { icon:Settings,        label:"Settings",         sw:"Mipangilio",  path:"/settings" },
];

export default function Sidebar() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <aside style={{
      width:240, minHeight:"100vh",
      background:"linear-gradient(180deg,#03102B 0%,#05193E 40%,#082A63 100%)",
      display:"flex", flexDirection:"column",
      position:"fixed", top:0, left:0, zIndex:50,
      boxShadow:"4px 0 24px rgba(0,0,0,.25)",
    }}>
      {/* Brand */}
      <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", textAlign:"center" }}>
        {/* White rounded square so logo bg blends perfectly */}
        <div style={{
          width:76, height:76, borderRadius:14,
          background:"white",
          border:"2px solid rgba(255,255,255,.15)",
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 10px", padding:6,
          boxShadow:"0 4px 12px rgba(0,0,0,.2)",
        }}>
          <img src="/police-logo.png" alt="Tanzania Police"
            style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }} />
        </div>
        <div style={{ color:"white", fontWeight:900, fontSize:15, letterSpacing:2 }}>TPDOP</div>
        <div style={{ color:"rgba(255,255,255,.4)", fontSize:9, letterSpacing:1, marginTop:2 }}>DIGITAL OPERATIONS</div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
        <div style={{ fontSize:9, fontWeight:800, color:"rgba(255,255,255,.3)", letterSpacing:1.5, padding:"8px 10px 4px", textTransform:"uppercase" }}>Operations</div>
        {NAV.map(item => {
          const Icon = item.icon;
          const active = loc.pathname === item.path;
          return (
            <button key={item.path} onClick={() => nav(item.path)}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"10px 12px", borderRadius:10, border:"none",
                background:active?"rgba(255,255,255,.13)":"transparent",
                color:active?"white":"rgba(255,255,255,.6)",
                cursor:"pointer", marginBottom:2, transition:".15s", textAlign:"left",
                borderLeft:active?"3px solid rgba(255,255,255,.5)":"3px solid transparent",
              }}
              onMouseEnter={e => { if(!active){e.currentTarget.style.background="rgba(255,255,255,.07)";e.currentTarget.style.color="white";}}}
              onMouseLeave={e => { if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.6)";}}}
            >
              <Icon size={16} style={{ flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{item.label}</div>
                <div style={{ fontSize:10, opacity:.5, marginTop:1 }}>{item.sw}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding:"10px 8px 14px", borderTop:"1px solid rgba(255,255,255,.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", marginBottom:6 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"#14489E", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ color:"white", fontSize:13, fontWeight:800 }}>P</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"white" }}>Police Officer</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>TPDOP System</div>
          </div>
        </div>
        <button onClick={() => nav("/")}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, border:"none", background:"transparent", color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:12 }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(220,38,38,.15)"; e.currentTarget.style.color="#FCA5A5"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,.4)"; }}>
          <LogOut size={14} /><span>Logout · Toka</span>
        </button>
      </div>
    </aside>
  );
}
