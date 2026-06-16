import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Car, FileText, AlertTriangle, Search, LayoutDashboard, Settings, LogOut, Bell, FileCheck, Lock, Stethoscope, UserX, Target, MessageSquare } from "lucide-react";

const NAV = [
  { icon:LayoutDashboard, label:"Dashboard",    sw:"Dashibodi",    path:"/traffic" },
  { icon:FileText,        label:"Citations",    sw:"Faini",        path:"/traffic/citations" },
  { icon:AlertTriangle,   label:"Accidents",    sw:"Ajali",        path:"/traffic/accidents" },
  { icon:Search,          label:"Veh. Search",  sw:"Tafuta Gari",  path:"/traffic/vehicles" },
  { icon:Car,             label:"Checkpoints",  sw:"Vizuizi",      path:"/traffic/checkpoints" },
  { divider:true, label:"Cross-Functional" },
  { icon:Search,          label:"Person Search", sw:"Tafuta Mtu",  path:"/person-search" },
  { icon:Lock,            label:"Detentions",   sw:"Vizuizini",    path:"/detentions" },
  { icon:Stethoscope,     label:"PF3 Forms",    sw:"Fomu ya PF3",  path:"/pf3" },
  { icon:UserX,           label:"Registries",   sw:"Daftari",      path:"/registries" },
  { icon:Target,          label:"Firearms",     sw:"Silaha",       path:"/firearms" },
  { icon:MessageSquare,   label:"Messages",     sw:"Ujumbe",       path:"/messages" },
  { icon:Bell,            label:"Alerts",       sw:"Tahadhari",    path:"/alerts" },
  { divider:true },
  { icon:FileCheck,       label:"Approvals",    sw:"Maombi",       path:"/traffic/approvals" },
  { icon:Settings,        label:"Settings",     sw:"Mipangilio",   path:"/traffic/settings" },
];

export default function TrafficLayout({ children, pageTitle="Traffic", pageTitle2="" }) {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F4F7FC", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <aside style={{ width:220, minHeight:"100vh", background:"linear-gradient(180deg,#03102B 0%,#05193E 40%,#082A63 100%)", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:50, boxShadow:"4px 0 24px rgba(0,0,0,.25)" }}>
        <div style={{ padding:"18px 14px", borderBottom:"1px solid rgba(255,255,255,.07)", textAlign:"center" }}>
          <div style={{ width:68, height:68, borderRadius:13, background:"white", border:"2px solid rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 9px", padding:6, boxShadow:"0 4px 12px rgba(0,0,0,.2)" }}>
            <img src="/police-logo.png" alt="TPDOP" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
          </div>
          <div style={{ color:"white", fontWeight:900, fontSize:14, letterSpacing:2 }}>TPDOP</div>
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:9, letterSpacing:1, marginTop:2 }}>TRAFFIC UNIT</div>
          <div style={{ marginTop:7, padding:"3px 10px", borderRadius:999, background:"rgba(217,119,6,.2)", border:"1px solid rgba(217,119,6,.4)", display:"inline-block" }}>
            <span style={{ color:"#FCD34D", fontSize:10, fontWeight:700 }}>🚦 TRAFFIC OFFICER</span>
          </div>
        </div>
        <nav style={{ flex:1, padding:"8px 6px" }}>
          {NAV.map((item, i) => {
            if (item.divider) {
              return (
                <div key={`div-${i}`} style={{ padding:"10px 11px 4px", marginTop:6, borderTop:"1px solid rgba(255,255,255,.06)" }}>
                  {item.label && <div style={{ fontSize:9, fontWeight:800, color:"rgba(255,255,255,.35)", letterSpacing:1.2, textTransform:"uppercase" }}>{item.label}</div>}
                </div>
              );
            }
            const Icon = item.icon;
            const active = loc.pathname === item.path;
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
            <Car size={14} color="#D97706"/>
            <span style={{ fontSize:13, color:"#64748B" }}>Traffic Unit</span>
            <span style={{ color:"#CBD5E1" }}>·</span>
            <span style={{ fontSize:14, fontWeight:700, color:"#0D3477" }}>{pageTitle}</span>
            {pageTitle2&&<span style={{ fontSize:12, color:"#94A3B8" }}>· {pageTitle2}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ padding:"4px 11px", borderRadius:999, background:"#FFF7ED", border:"1px solid #FED7AA" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#C2410C" }}>🚦 ON DUTY</span>
            </div>
            <button style={{ width:36, height:36, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}><Bell size={16}/></button>
          </div>
        </header>
        <div style={{ marginTop:60, padding:22 }}>{children}</div>
      </div>
    </div>
  );
}
