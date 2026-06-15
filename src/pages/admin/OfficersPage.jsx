import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { UserPlus, Search, Users, Eye, Edit, Trash2 } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";

const ROLE_LABELS = { regular_officer:"Regular Officer", traffic_officer:"Traffic Officer", cid_officer:"CID Officer", forensic_officer:"Forensic Officer", ocs:"OCS", ocd:"OCD", rpc:"RPC", igp:"IGP", admin_officer:"Admin Officer" };

export default function OfficersPage() {
  const nav = useNavigate();
  const { officers } = useAppData();
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const roles = ["All", ...new Set(officers.map(o => o.role))];
  const filtered = officers.filter(o => {
    const ms = !search || o.full_name?.toLowerCase().includes(search.toLowerCase()) || o.badge?.includes(search);
    const mr = filterRole==="All" || o.role===filterRole;
    const mst = filterStatus==="All" || o.status===filterStatus;
    return ms && mr && mst;
  });

  return (
    <AdminLayout pageTitle="Officers" pageTitle2="Maafisa Wote">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>
            Officers <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Maafisa</span>
          </h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{officers.length} officers registered</p>
        </div>
        <button onClick={() => nav("/admin/create-user")}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <UserPlus size={16} /> Create Officer
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Total",     v:officers.length,                                       c:"#0D3477" },
          { label:"Active",    v:officers.filter(o=>o.status==="Active").length,        c:"#059669" },
          { label:"Pending",   v:officers.filter(o=>o.status==="Pending").length,       c:"#D97706" },
          { label:"Suspended", v:officers.filter(o=>o.status==="Suspended").length,     c:"#DC2626" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 14px", height:40 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or badge..."
            style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }} />
        </div>
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
          style={{ height:40, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, background:"white", outline:"none", cursor:"pointer" }}>
          {roles.map(r=><option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{ height:40, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, background:"white", outline:"none", cursor:"pointer" }}>
          {["All","Active","Pending","Suspended"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length===0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Users size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>{officers.length===0?"No officers registered yet":"No officers match your search"}</div>
          <div style={{ fontSize:13, marginTop:6 }}>Maafisa hawajasajiliwa bado</div>
          {officers.length===0 && (
            <button onClick={()=>nav("/admin/create-user")} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
              Create First Officer · Unda Afisa wa Kwanza
            </button>
          )}
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                {["Officer","Badge","Rank","Role","Region / Station","Status","Actions"].map(h=>(
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o,i)=>(
                <tr key={o.id||i} style={{ borderBottom:"1px solid #F1F5F9" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                  onMouseLeave={e=>e.currentTarget.style.background="white"}>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#082A63,#0D3477)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:12, fontWeight:800, flexShrink:0 }}>
                        {o.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("")||"?"}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{o.full_name}</div>
                        <div style={{ fontSize:11, color:"#94A3B8" }}>{o.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", fontSize:12, fontWeight:700, color:"#0D3477" }}>{o.badge}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#475569" }}>{o.rank}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#475569" }}>{ROLE_LABELS[o.role]||o.role}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1E293B" }}>{o.region}</div>
                    <div style={{ fontSize:11, color:"#94A3B8" }}>{o.station_name||o.district}</div>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ background:"#F0FDF4", color:"#16A34A", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{o.status}</span>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ width:30, height:30, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}><Eye size={14}/></button>
                      <button style={{ width:30, height:30, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}><Edit size={14}/></button>
                      <button style={{ width:30, height:30, borderRadius:8, border:"1px solid #FEE2E2", background:"#FEF2F2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#DC2626" }}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
