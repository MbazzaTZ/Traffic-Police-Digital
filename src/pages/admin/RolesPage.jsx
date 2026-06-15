import AdminLayout from "../../layouts/AdminLayout";
import { Shield, Check, X } from "lucide-react";

const ROLES = [
  { name:"admin_officer",   label:"Admin Officer",    sw:"Msimamizi wa Mfumo",      color:"#FFD700", bg:"#FFF9E6",
    perms:["Manage Users","Create Accounts","System Settings","Roles Management","Audit Logs"] },
  { name:"igp",             label:"IGP / DIGP",       sw:"Mkurugenzi",              color:"#DC2626", bg:"#FEF2F2",
    perms:["Full System Access","All Regions","National Statistics","Intelligence","Internal Affairs"] },
  { name:"rpc",             label:"RPC",              sw:"Kamanda wa Mkoa",          color:"#7C3AED", bg:"#F5F3FF",
    perms:["View Region","All Districts","Regional Intelligence","Regional Dashboards"] },
  { name:"ocd",             label:"OCD",              sw:"Kamanda wa Wilaya",        color:"#0891B2", bg:"#EFF6FF",
    perms:["Manage District","All Stations","District Statistics","District Crime Reports"] },
  { name:"ocs",             label:"OCS",              sw:"Kamanda wa Kituo",         color:"#0D3477", bg:"#EFF6FF",
    perms:["Manage Station","Station Reports","Station Cases","Detentions","Cells"] },
  { name:"inspector",       label:"Inspector",        sw:"Inspekta",                color:"#059669", bg:"#F0FDF4",
    perms:["Citations","Arrests","Incidents","Cases","Person Search","Vehicle Search"] },
  { name:"regular_officer", label:"Regular Officer",  sw:"Afisa wa Kawaida",        color:"#475569", bg:"#F8FAFC",
    perms:["Person Search","Incident Reports","Arrests","Detentions","Patrol","Evidence","Communications"] },
  { name:"traffic_officer", label:"Traffic Officer",  sw:"Afisa wa Barabara",       color:"#D97706", bg:"#FFFBEB",
    perms:["Vehicle Search","Driver Licenses","Traffic Citations","Accident Reports","Insurance"] },
  { name:"cid_officer",     label:"CID Officer",      sw:"Afisa wa CID",            color:"#7C3AED", bg:"#F5F3FF",
    perms:["Criminal Cases","Warrants","Investigations","Suspects","Evidence","Forensics","Wanted Persons"] },
];

const MODULES = ["Person Search","Incidents","Arrests","Traffic","CID Cases","Intelligence","Evidence","Patrols","Station Mgmt","District Mgmt","Regional Mgmt","National View","System Admin"];
const ACCESS = {
  admin_officer:   [0,0,0,0,0,0,0,0,1,1,1,1,1],
  igp:             [1,1,1,1,1,1,1,1,1,1,1,1,0],
  rpc:             [1,1,1,0,0,1,1,1,0,1,1,0,0],
  ocd:             [1,1,1,1,0,0,1,1,1,1,0,0,0],
  ocs:             [1,1,1,1,0,0,1,1,1,0,0,0,0],
  inspector:       [1,1,1,1,0,0,1,1,0,0,0,0,0],
  regular_officer: [1,1,1,0,0,0,1,1,0,0,0,0,0],
  traffic_officer: [1,0,0,1,0,0,0,1,0,0,0,0,0],
  cid_officer:     [1,0,1,0,1,0,1,0,0,0,0,0,0],
};

export default function RolesPage() {
  return (
    <AdminLayout pageTitle="Roles & Access" pageTitle2="Majukumu na Ruhusa">
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#1a0533", margin:0 }}>Roles & Access Control</h1>
        <p style={{ color:"#64748B", marginTop:3 }}>Majukumu na Udhibiti wa Ufikiaji · {ROLES.length} system roles defined</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {ROLES.map((r, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ height:4, background:r.color }} />
            <div style={{ padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1a0533" }}>{r.label}</div>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>{r.sw}</div>
                </div>
                <span style={{ background:r.bg, color:r.color, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>0 officers</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {r.perms.map(p => (
                  <span key={p} style={{ background:r.bg, color:r.color, padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:600 }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Access Matrix */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"auto" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1a0533" }}>Access Matrix · Jedwali la Ruhusa</div>
          <div style={{ fontSize:12, color:"#94A3B8" }}>Which roles can access which modules</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#F8FAFC" }}>
              <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#475569", fontSize:11 }}>Role</th>
              {MODULES.map(m => (
                <th key={m} style={{ padding:"10px 7px", textAlign:"center", fontWeight:700, color:"#475569", fontSize:10, whiteSpace:"nowrap" }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((r, i) => (
              <tr key={i} style={{ borderBottom:"1px solid #F1F5F9" }}
                onMouseEnter={e => e.currentTarget.style.background="#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background="white"}>
                <td style={{ padding:"10px 14px", whiteSpace:"nowrap" }}>
                  <div style={{ fontWeight:700, color:"#1E293B" }}>{r.label}</div>
                  <div style={{ fontSize:10, color:"#94A3B8" }}>{r.sw}</div>
                </td>
                {(ACCESS[r.name] || []).map((has, j) => (
                  <td key={j} style={{ padding:"10px 7px", textAlign:"center" }}>
                    {has
                      ? <div style={{ width:22, height:22, borderRadius:6, background:"#F0FDF4", border:"1px solid #BBF7D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}><Check size={12} color="#16A34A" /></div>
                      : <div style={{ width:22, height:22, borderRadius:6, background:"#F8FAFC", border:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}><X size={12} color="#CBD5E1" /></div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
