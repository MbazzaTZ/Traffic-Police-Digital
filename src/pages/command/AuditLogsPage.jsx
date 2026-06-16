import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { Shield, Search, MapPin, Monitor, RefreshCw, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";

const ACTION_C = {
  login:"#0891B2", logout:"#64748B",
  create_arrest:"#D97706", issue_citation:"#7C3AED", create_incident:"#DC2626",
  approve_request:"#059669", reject_request:"#DC2626",
  search_person:"#0D3477", search_vehicle:"#0D3477",
};
const card = { background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" };

export default function AuditLogsPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [fAction, setFAction] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("audit_logs")
      .select("*").order("created_at",{ascending:false}).limit(300);
    setLogs(data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const actions = [...new Set(logs.map(l=>l.action).filter(Boolean))];
  const filtered = logs.filter(l=>{
    const ms = !search || l.officer_name?.toLowerCase().includes(search.toLowerCase())
      || l.badge?.toLowerCase().includes(search.toLowerCase())
      || l.entity_ref?.toLowerCase().includes(search.toLowerCase())
      || l.description?.toLowerCase().includes(search.toLowerCase());
    return ms && (!fAction || l.action===fAction);
  });

  const sel = { height:38, border:"1px solid rgba(255,255,255,.12)", borderRadius:9, padding:"0 12px", fontSize:13, background:"rgba(255,255,255,.04)", color:"white", outline:"none" };

  return (
    <CommandLayout pageTitle="Audit Logs" pageTitle2="Kumbukumbu za Mfumo">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", margin:0 }}>Audit Trail</h1>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, marginTop:3 }}>{logs.length} actions logged · append-only · tamper-resistant</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", borderRadius:999, background:"rgba(5,150,105,.15)", border:"1px solid rgba(5,150,105,.3)" }}>
            <Shield size={13} color="#86EFAC"/>
            <span style={{ fontSize:11, fontWeight:700, color:"#86EFAC" }}>SECURE LOG</span>
          </div>
          <button onClick={load} style={{ width:38, height:38, borderRadius:9, ...card, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.6)" }}><RefreshCw size={15}/></button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, ...card, borderRadius:9, padding:"0 12px", height:38 }}>
          <Search size={14} color="rgba(255,255,255,.4)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search officer, badge, ref, description..."
            style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent", color:"white" }}/>
        </div>
        <select value={fAction} onChange={e=>setFAction(e.target.value)} style={sel}>
          <option value="" style={{background:"#03102B"}}>All Actions</option>
          {actions.map(a=><option key={a} value={a} style={{background:"#03102B"}}>{a.replace(/_/g," ")}</option>)}
        </select>
      </div>

      <div style={{ ...card, borderRadius:14, overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>
            <Shield size={40} style={{ opacity:.3, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600 }}>{logs.length===0?"No audit logs yet":"No logs match filters"}</div>
            {logs.length===0 && <div style={{ fontSize:13, marginTop:6 }}>Actions will appear here as officers use the system</div>}
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"rgba(255,255,255,.03)", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
              {["Time","Officer","Action","Entity","Description","GPS","Device"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(l=>{
                const ac = ACTION_C[l.action]||"#64748B";
                return (
                  <tr key={l.id} style={{ borderBottom:"1px solid rgba(255,255,255,.05)" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"10px 14px", fontSize:11, color:"rgba(255,255,255,.5)", whiteSpace:"nowrap", fontFamily:"monospace" }}>{new Date(l.created_at).toLocaleString("en-GB")}</td>
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"white" }}>{l.officer_name||"System"}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>{l.badge||"—"} · {l.officer_role?.replace(/_/g," ")||""}</div>
                    </td>
                    <td style={{ padding:"10px 14px" }}><span style={{ background:`${ac}25`, color:ac, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{l.action?.replace(/_/g," ")}</span></td>
                    <td style={{ padding:"10px 14px", fontSize:11, color:"#93C5FD", fontFamily:"monospace" }}>{l.entity_ref||"—"}</td>
                    <td style={{ padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,.6)", maxWidth:240 }}>{l.description||"—"}</td>
                    <td style={{ padding:"10px 14px" }}>
                      {l.gps_lat ? (
                        <a href={`https://maps.google.com/?q=${l.gps_lat},${l.gps_lng}`} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#86EFAC", textDecoration:"none" }}>
                          <MapPin size={11}/> {l.gps_lat.toFixed(3)},{l.gps_lng.toFixed(3)}
                        </a>
                      ) : <span style={{ fontSize:11, color:"rgba(255,255,255,.25)" }}>—</span>}
                    </td>
                    <td style={{ padding:"10px 14px", fontSize:10, color:"rgba(255,255,255,.4)", fontFamily:"monospace" }} title={l.user_agent}>{l.device_id||"—"}</td>
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
