// MorePage - mobile-only "more menu" reachable from the bottom nav.
// Lists every destination not in the 4 primary bottom-nav slots,
// grouped by section. Looks like a native iOS/Android settings list.
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import TrafficLayout from "../../layouts/TrafficLayout";
import CIDLayout from "../../layouts/CIDLayout";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  Lock, Stethoscope, UserX, Target, Users, Home, Gavel, Banknote,
  MapPinned, FolderOpen, MessageSquare, Bell, Settings, FileCheck,
  Search, ChevronRight, LogOut, User, Car, AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

function RoleLayout({ role, children, ...props }) {
  if (role === "traffic_officer") return <TrafficLayout {...props}>{children}</TrafficLayout>;
  if (role === "cid_officer" || role === "forensic_officer") return <CIDLayout {...props}>{children}</CIDLayout>;
  return <DashboardLayout {...props}>{children}</DashboardLayout>;
}

// Build the menu groups based on role.
// When the sidebar slims down to "essentials only", this page becomes
// the safety-net for everything else. Everything removed from the
// sidebar MUST appear here, organized for quick scanning.
function menuFor(role) {
  const isTraffic = role === "traffic_officer";

  // Operations - same for both roles, but ordered by relevance
  // (regular officers see Detentions/PF3 first, traffic see Vehicle Search first)
  const operationsCommon = [
    { icon:Lock,         label:"Detentions",    sw:"Vizuizini",    path:"/detentions" },
    { icon:Stethoscope,  label:"PF3 Forms",     sw:"Fomu ya PF3",  path:"/pf3" },
    { icon:UserX,        label:"Registries",    sw:"Daftari",      path:"/registries" },
    { icon:Target,       label:"Firearms",      sw:"Silaha",       path:"/firearms" },
    { icon:Users,        label:"Prisoners",     sw:"Wafungwa",     path:"/prisoners" },
    { icon:Home,         label:"Cells",         sw:"Vyumba",       path:"/cells" },
    { icon:Gavel,        label:"Court Cases",   sw:"Kesi",         path:"/court-cases" },
    { icon:Banknote,     label:"Payments",      sw:"Malipo",       path:isTraffic ? "/traffic/payments" : "/payments" },
  ];

  // Lookup tools - cross-functional
  const lookups = isTraffic ? [
    // Traffic also gets Person Search (was removed from their slim sidebar)
    { icon:Search,       label:"Person Search", sw:"Tafuta Mtu",   path:"/person-search" },
  ] : [
    // Regular gets Vehicle Search + Citation Requests
    // (the gateway to flagging traffic offenses)
    { icon:Car,          label:"Vehicle Search",sw:"Tafuta Gari",  path:"/vehicle-search" },
    { icon:FileCheck,    label:"Citation Requests", sw:"Maombi ya Faini", path:"/citation-requests" },
    { icon:MapPinned,    label:"Patrols",       sw:"Doria",        path:"/patrols" },
    { icon:FolderOpen,   label:"Evidence",      sw:"Ushahidi",     path:"/evidence" },
  ];

  const communications = [
    { icon:MessageSquare, label:"Messages",     sw:"Ujumbe",       path:"/messages" },
    { icon:Bell,          label:"Alerts",       sw:"Tahadhari",    path:"/alerts" },
    { icon:FileCheck,     label:"Approvals",    sw:"Maombi",       path:isTraffic ? "/traffic/approvals" : "/approvals" },
  ];

  const account = [
    { icon:User,          label:"My Profile",   sw:"Wasifu Wangu", path:"/profile" },
    { icon:Settings,      label:"Settings",     sw:"Mipangilio",   path:isTraffic ? "/traffic/settings" : "/settings" },
  ];

  return [
    { title:"Lookups · Utafutaji",            items:lookups },
    { title:"Operations · Shughuli",          items:operationsCommon },
    { title:"Communications · Mawasiliano",   items:communications },
    { title:"Account · Akaunti",              items:account },
  ];
}

export default function MorePage() {
  const nav = useNavigate();
  const { profile, fullName, badge } = useCurrentUser();
  const groups = menuFor(profile?.role);
  const themeColor = profile?.role === "traffic_officer" ? "#D97706" : "#0D3477";

  async function logout() {
    await supabase.auth.signOut();
    nav("/");
  }

  return (
    <RoleLayout role={profile?.role} pageTitle="More" pageTitle2="Zaidi">
      {/* User card */}
      <div onClick={()=>nav("/profile")}
        style={{ background:`linear-gradient(135deg, ${themeColor}, ${themeColor}DD)`, borderRadius:16, padding:"18px 18px", marginBottom:18, cursor:"pointer", color:"white", display:"flex", alignItems:"center", gap:14, boxShadow:"0 4px 14px rgba(0,0,0,.08)" }}>
        <div style={{ width:54, height:54, borderRadius:"50%", background:"rgba(255,255,255,.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"2px solid rgba(255,255,255,.25)" }}>
          <span style={{ fontSize:18, fontWeight:800 }}>{fullName?.split(" ").map(n=>n[0]).slice(0,2).join("") || "O"}</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fullName || "Officer"}</div>
          <div style={{ fontSize:11, opacity:.85, marginTop:2 }}>{badge || "TPDOP"} · {(profile?.role||"").replace(/_/g," ")}</div>
        </div>
        <ChevronRight size={18} style={{ opacity:.7 }}/>
      </div>

      {/* Grouped menu sections */}
      {groups.map(group => (
        <div key={group.title} style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.8, padding:"0 4px 8px" }}>{group.title}</div>
          <div style={{ background:"white", borderRadius:12, overflow:"hidden", border:"1px solid #E2E8F0", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            {group.items.map((item, i) => {
              const Icon = item.icon;
              const isLast = i === group.items.length - 1;
              return (
                <button key={item.path} onClick={()=>nav(item.path)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"white", border:"none", cursor:"pointer", borderBottom:isLast?"none":"1px solid #F1F5F9", textAlign:"left" }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:`${themeColor}14`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon size={17} color={themeColor}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1E293B" }}>{item.label}</div>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>{item.sw}</div>
                  </div>
                  <ChevronRight size={16} color="#CBD5E1"/>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button onClick={logout}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px 16px", background:"white", border:"1px solid #FECACA", color:"#DC2626", borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:700, marginTop:6 }}>
        <LogOut size={16}/> Logout · Toka
      </button>

      {/* Footer */}
      <div style={{ textAlign:"center", fontSize:10, color:"#CBD5E1", marginTop:18, padding:"0 0 6px" }}>
        TPDOP · Tanzania Police Force<br/>
        Version 1.0.0
      </div>
    </RoleLayout>
  );
}
