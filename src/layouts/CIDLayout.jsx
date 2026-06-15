import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LayoutDashboard, FolderOpen, Users, Search, FileText, Shield, LogOut, Bell } from "lucide-react";

const NAV = [
  { icon:LayoutDashboard, label:"Dashboard",   sw:"Dashibodi",  path:"/cid" },
  { icon:FolderOpen,      label:"Cases",       sw:"Kesi",       path:"/cid/cases" },
  { icon:Users,           label:"Suspects",    sw:"Washukiwa",  path:"/cid/suspects" },
  { icon:Shield,          label:"Wanted",      sw:"Watuhumiwa", path:"/cid/wanted" },
  { icon:FileText,        label:"Evidence",    sw:"Ushahidi",   path:"/cid/evidence" },
  { icon:Search,          label:"NIDA Search", sw:"Tafuta NIDA",path:"/cid/search" },
];

export default function CIDLayout({ children, pageTitle="CID", pageTitle2="" }) {
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F4F7FC", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <aside style={{ width:220, minHeight:"100vh", background:"linear-gradient(180deg,#03102B 0%,#05193E 40%,#082A63 100%)", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:50, boxShadow:"4px 0 24px rgba(0,0,0,.25)" }}>
        <div style={{ padding:"18px 14px", borderBottom:"1px solid rgba(255,255,255,.07)", textAlign:"center" }}>
          <div style={{ width:68, height:68, borderRadius:13, background:"white", border:"2px solid rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 9px", padding:6 }}>
            <img src="/police-logo.png" alt="TPDOP" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
          </div>
          <div style={{ color:"white", fontWeight:900, fontSize:14, letterSpacing:2 }}>TPDOP</div>
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:9, letterSpacing:1, marginTop:2 }}>CID UNIT</div>
          <div style={{ marginTop:7, padding:"3px 10px", borderRadius:999, background:"rgba(124,58,237,.25)", border:"1px solid rgba(124,58,237,.4)", display:"inline-block" }}>
            <span style={{ color:"#C4B5FD", fontSize:10, fontWeight:700 }}>🔍 CID OFFICER</span>
          </div>
        </div>
        <nav style={{ flex:1, padding:"8px 6px" }}>
          {NAV.map(item=>{
            const Icon = item.icon;
            const active = loc.pathname===item.path;
            return (
              <button key={item.path} onClick={()=>nav(item.path)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:9, border:"none", background:active?"rgba(255,255,255,.13)":"transparent", color:active?"white":"rgba(255,255,255,.6)", cursor:"pointer", marginBottom:2, transition:".15s", textAlign:"left", borderLeft:active?"3px solid rgba(255,255,255,.5)":"3px solid transparent" }}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,.07)";e.currentTarget.style.color="white";}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.6)";}}} >
                <Icon size={15} style={{flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{item.label}</div><div style={{fontSize:10,opacity:.5}}>{item.sw}</div></div>
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"8px 6px 12px", borderTop:"1px solid rgba(255,255,255,.07)" }}>
          <button onClick={async()=>{await supabase.auth.signOut();nav("/");}}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:8, border:"none", background:"transparent", color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:12 }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(220,38,38,.15)";e.currentTarget.style.color="#FCA5A5";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>
            <LogOut size={13}/><span>Logout · Toka</span>
          </button>
        </div>
      </aside>
      <div style={{ marginLeft:220, flex:1 }}>
        <header style={{ position:"fixed", top:0, left:220, right:0, height:60, background:"white", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", zIndex:40, boxShadow:"0 1px 6px rgba(0,0,0,.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <FolderOpen size={14} color="#7C3AED"/>
            <span style={{ fontSize:13, color:"#64748B" }}>CID Unit</span>
            <span style={{ color:"#CBD5E1" }}>·</span>
            <span style={{ fontSize:14, fontWeight:700, color:"#0D3477" }}>{pageTitle}</span>
            {pageTitle2&&<span style={{ fontSize:12, color:"#94A3B8" }}>· {pageTitle2}</span>}
          </div>
          <div style={{ padding:"4px 11px", borderRadius:999, background:"#F5F3FF", border:"1px solid #DDD6FE" }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#6D28D9" }}>🔍 INVESTIGATING</span>
          </div>
        </header>
        <div style={{ marginTop:60, padding:22 }}>{children}</div>
      </div>
    </div>
  );
}
