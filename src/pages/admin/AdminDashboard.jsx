import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { Users, Building2, Shield, MapPin, UserPlus, Activity, CheckCircle } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";

const ROLE_LABELS = { regular_officer:"Regular Officer", traffic_officer:"Traffic Officer", cid_officer:"CID Officer", forensic_officer:"Forensic Officer", ocs:"OCS", ocd:"OCD", rpc:"RPC", igp:"IGP", admin_officer:"Admin Officer" };

export default function AdminDashboard() {
  const nav = useNavigate();
  const { officers, stations, regions, loading } = useAppData();

  const kpis = [
    { label:"Total Officers",  sw:"Maafisa Wote",       color:"#0D3477", icon:Users,        v: officers.length },
    { label:"Police Stations", sw:"Vituo vya Polisi",   color:"#082A63", icon:Building2,    v: stations.length },
    { label:"Regions",         sw:"Mikoa",              color:"#059669", icon:MapPin,        v: regions.length },
    { label:"Active Roles",    sw:"Majukumu",           color:"#D97706", icon:Shield,        v: 9 },
    { label:"Active Officers", sw:"Wanaofanya Kazi",    color:"#16A34A", icon:CheckCircle,   v: officers.filter(o=>o.status==="active").length },
  ];

  return (
    <AdminLayout pageTitle="Dashboard" pageTitle2="Dashibodi ya Usimamizi">

      {/* Banner */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#05193E,#082A63)", borderRadius:18, padding:"22px 28px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:22, boxShadow:"0 8px 28px rgba(3,16,43,.35)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,.03)" }} />
        <div style={{ display:"flex", alignItems:"center", gap:16, zIndex:1 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#FFD700,#FFA500)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:26, fontWeight:900, color:"#03102B" }}>A</span>
          </div>
          <div>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, marginBottom:3, textTransform:"uppercase" }}>System Administrator · Msimamizi wa Mfumo</div>
            <div style={{ fontSize:22, fontWeight:800 }}>Admin Officer</div>
            <div style={{ fontSize:13, opacity:.7, marginTop:3 }}>TZP-ADMIN-001 · National HQ · Full System Access</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, zIndex:1 }}>
          <button onClick={() => nav("/admin/create-user")} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#FFD700", color:"#03102B", fontWeight:800, fontSize:13, cursor:"pointer" }}>+ Create Officer</button>
          <button onClick={() => nav("/admin/stations")} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"rgba(255,255,255,.15)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Add Station</button>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:"#94A3B8" }}>Loading data from Supabase...</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:22 }}>
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} style={{ background:"white", borderRadius:16, padding:"18px 16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.color}`, textAlign:"center" }}>
                <Icon size={22} color={k.color} style={{ marginBottom:8 }} />
                <div style={{ fontSize:36, fontWeight:900, color:k.color, lineHeight:1, marginBottom:5 }}>{k.v}</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
                <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{k.sw}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ fontSize:16, fontWeight:700, color:"#03102B", marginBottom:12 }}>Quick Actions · Vitendo vya Haraka</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:22 }}>
        {[
          { icon:UserPlus,  label:"Create Officer",  sw:"Unda Afisa",       path:"/admin/create-user", color:"#0D3477" },
          { icon:Building2, label:"Add Station",     sw:"Ongeza Kituo",     path:"/admin/stations",    color:"#082A63" },
          { icon:MapPin,    label:"Manage Regions",  sw:"Simamia Mikoa",    path:"/admin/regions",     color:"#059669" },
          { icon:Shield,    label:"Manage Roles",    sw:"Simamia Majukumu", path:"/admin/roles",       color:"#D97706" },
          { icon:Users,     label:"All Officers",    sw:"Maafisa Wote",     path:"/admin/officers",    color:"#0891B2" },
          { icon:Activity,  label:"System Settings", sw:"Mipangilio",       path:"/admin/settings",    color:"#475569" },
        ].map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => nav(a.path)}
              style={{ background:"white", borderRadius:14, border:"1.5px solid #E2E8F0", padding:"16px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:".18s", textAlign:"center" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=a.color; e.currentTarget.style.boxShadow=`0 6px 18px ${a.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${a.color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={22} color={a.color} />
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{a.label}</div>
              <div style={{ fontSize:10, color:"#94A3B8" }}>{a.sw}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Officers table */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#03102B" }}>Officers · Maafisa</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>{officers.length} in Supabase</div>
            </div>
            <button onClick={() => nav("/admin/officers")} style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:"#475569" }}>View All</button>
          </div>
          {officers.length === 0 ? (
            <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8" }}>
              <Users size={32} style={{ opacity:.2, marginBottom:10 }} />
              <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No officers in database yet</div>
              <button onClick={() => nav("/admin/create-user")} style={{ marginTop:12, padding:"8px 18px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:12 }}>Create First Officer</button>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#F8FAFC" }}>
                  {["Officer","Badge","Role","Status"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {officers.slice(0,5).map((o, i) => (
                  <tr key={o.id} style={{ borderBottom:i<4?"1px solid #F1F5F9":"none" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#082A63,#0D3477)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, fontWeight:800, flexShrink:0 }}>
                          {o.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("")||"?"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{o.full_name}</div>
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:11, fontWeight:700, color:"#0D3477" }}>{o.badge}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{ROLE_LABELS[o.role]||o.role}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:"#F0FDF4", color:"#16A34A", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stations + Summary */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#03102B" }}>Stations · Vituo</div>
                <div style={{ fontSize:11, color:"#94A3B8" }}>{stations.length} in Supabase</div>
              </div>
              <button onClick={() => nav("/admin/stations")} style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:"#475569" }}>View All</button>
            </div>
            {stations.length === 0 ? (
              <div style={{ padding:"24px 20px", textAlign:"center", color:"#94A3B8" }}>
                <Building2 size={28} style={{ opacity:.2, marginBottom:8 }} />
                <div style={{ fontSize:13, fontWeight:600, color:"#64748B" }}>No stations in database</div>
                <button onClick={() => nav("/admin/stations")} style={{ marginTop:10, padding:"7px 16px", borderRadius:8, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:12 }}>Add Station</button>
              </div>
            ) : (
              <div style={{ padding:"10px 14px" }}>
                {stations.slice(0,4).map((s, i) => (
                  <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 6px", borderBottom:i<3&&i<stations.length-1?"1px solid #F8FAFC":"none" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{s.name}</div>
                      <div style={{ fontSize:11, color:"#94A3B8" }}>{s.regions?.name||"—"} · {s.districts?.name||"—"}</div>
                    </div>
                    <span style={{ background:"#EFF6FF", color:"#0D3477", padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700 }}>{s.type}</span>
                  </div>
                ))}
                {stations.length>4 && <div style={{ padding:"8px 6px 2px", fontSize:12, color:"#0D3477", cursor:"pointer", fontWeight:600 }} onClick={()=>nav("/admin/stations")}>+ {stations.length-4} more →</div>}
              </div>
            )}
          </div>

          {/* Summary */}
          <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"16px 18px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#03102B", marginBottom:12 }}>Supabase Summary</div>
            {[
              { label:`${officers.length} Officer${officers.length!==1?"s":""} in database`, c:"#0D3477", v:officers.length },
              { label:`${stations.length} Station${stations.length!==1?"s":""} in database`,  c:"#059669", v:stations.length },
              { label:`${regions.length} Region${regions.length!==1?"s":""} configured`,       c:"#D97706", v:regions.length },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #F8FAFC" }}>
                <div style={{ width:34, height:34, borderRadius:10, background:`${s.c}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <div style={{ fontSize:16, fontWeight:900, color:s.c }}>{s.v}</div>
                </div>
                <div style={{ fontSize:13, color:"#475569" }}>{s.label}</div>
                {s.v>0 && <CheckCircle size={15} color="#16A34A" style={{ marginLeft:"auto" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
