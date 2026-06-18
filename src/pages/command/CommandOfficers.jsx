import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { Users, Search, Shield, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";

const ROLE_C = { admin_officer:"#DC2626", igp:"#7C3AED", rpc:"#0891B2", ocd:"#0D3477", ocs:"#059669", traffic_officer:"#D97706", cid_officer:"#7C3AED", regular_officer:"#0D3477", inspector:"#0891B2", forensic_officer:"#7C3AED" };
const card = { background:"rgba(255,255,255,.04)", borderRadius:14, border:"1px solid rgba(255,255,255,.08)" };

export default function CommandOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [fRole,    setFRole]    = useState("");
  const [fStatus,  setFStatus]  = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("profiles")
      .select("*, stations!profiles_station_id_fkey(name), regions(name), districts(name)")
      .order("created_at",{ascending:false}).limit(500);
    setOfficers(data||[]); setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = officers.filter(o=>{
    const ms = !search || o.full_name?.toLowerCase().includes(search.toLowerCase()) || o.badge?.toLowerCase().includes(search.toLowerCase());
    return ms && (!fRole||o.role===fRole) && (!fStatus||o.status===fStatus);
  });
  const roles = [...new Set(officers.map(o=>o.role).filter(Boolean))];
  const sel = { height:38, border:"1px solid rgba(255,255,255,.12)", borderRadius:9, padding:"0 12px", fontSize:13, background:"rgba(255,255,255,.04)", color:"white", outline:"none" };

  return (
    <CommandLayout pageTitle="Officer Roster" pageTitle2="Orodha ya Maafisa">
      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:"white", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Officer Roster</h1>
        <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, marginTop:3 }}>{officers.length} officers · {officers.filter(o=>o.status==="active").length} active</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          {label:"Total Officers", v:officers.length,                                  c:"#0D3477"},
          {label:"Active",         v:officers.filter(o=>o.status==="active").length,   c:"#16A34A"},
          {label:"Traffic Unit",   v:officers.filter(o=>o.role==="traffic_officer").length, c:"#D97706"},
          {label:"CID Unit",       v:officers.filter(o=>o.role==="cid_officer").length, c:"#7C3AED"},
        ].map(k=>(
          <div key={k.label} style={{ ...card, padding:"16px", textAlign:"center", borderTop:`3px solid ${k.c}` }}>
            <div style={{ fontSize:"clamp(26px,4vw,30px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.7)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, ...card, padding:"0 12px", height:38 }}>
          <Search size={14} color="rgba(255,255,255,.4)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or badge..."
            style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent", color:"white" }}/>
        </div>
        <select value={fRole} onChange={e=>setFRole(e.target.value)} style={sel}>
          <option value="" style={{background:"#03102B"}}>All Roles</option>
          {roles.map(r=><option key={r} value={r} style={{background:"#03102B"}}>{r.replace(/_/g," ")}</option>)}
        </select>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={sel}>
          <option value="" style={{background:"#03102B"}}>All Status</option>
          <option value="active" style={{background:"#03102B"}}>Active</option>
          <option value="inactive" style={{background:"#03102B"}}>Inactive</option>
        </select>
      </div>

      <div style={{ ...card, overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>
            <Users size={40} style={{ opacity:.3, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600 }}>{officers.length===0?"No officers registered":"No officers match filters"}</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"rgba(255,255,255,.03)", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
              {["Officer","Badge","Rank","Role","Station","Region","Status"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(o=>{
                const rc=ROLE_C[o.role]||"#0D3477";
                return (
                  <tr key={o.id} style={{ borderBottom:"1px solid rgba(255,255,255,.05)" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:rc, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, fontWeight:800, flexShrink:0 }}>
                          {o.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("")||"?"}
                        </div>
                        <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{o.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.6)", fontFamily:"monospace" }}>{o.badge||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.6)" }}>{o.rank||"—"}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${rc}25`, color:rc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize", whiteSpace:"nowrap" }}>{o.role?.replace(/_/g," ")||"—"}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.6)" }}>{o.stations?.name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.5)" }}>{o.regions?.name||"—"}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:o.status==="active"?"rgba(22,163,74,.2)":"rgba(148,163,184,.15)", color:o.status==="active"?"#86EFAC":"#94A3B8", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{o.status||"active"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </CommandLayout>
  );
}
