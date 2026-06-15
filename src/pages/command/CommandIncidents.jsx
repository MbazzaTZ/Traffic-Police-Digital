import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { Activity, MapPin, Search, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";

const SEV_C = { low:"#64748B", medium:"#D97706", high:"#DC2626", critical:"#7C3AED" };
const STATUS_C = { open:"#DC2626", investigating:"#D97706", resolved:"#059669", closed:"#94A3B8" };
const card = { background:"rgba(255,255,255,.04)", borderRadius:14, border:"1px solid rgba(255,255,255,.08)" };

export default function CommandIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [fStatus,   setFStatus]   = useState("");
  const [fSeverity, setFSeverity] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("incidents")
      .select("*, profiles!incidents_reported_by_fkey(full_name,badge), regions(name), districts(name)")
      .order("created_at",{ascending:false}).limit(200);
    setIncidents(data||[]); setLoading(false);
  }

  useEffect(() => {
    load();
    const sub = supabase.channel("cmd-incidents")
      .on("postgres_changes",{event:"*",schema:"public",table:"incidents"},load).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const filtered = incidents.filter(i => {
    const ms = !search || i.ref_number?.includes(search) || i.type?.toLowerCase().includes(search.toLowerCase()) || i.location_text?.toLowerCase().includes(search.toLowerCase());
    return ms && (!fStatus||i.status===fStatus) && (!fSeverity||i.severity===fSeverity);
  });

  const sel = { height:38, border:"1px solid rgba(255,255,255,.12)", borderRadius:9, padding:"0 12px", fontSize:13, background:"rgba(255,255,255,.04)", color:"white", outline:"none" };

  return (
    <CommandLayout pageTitle="Live Incidents" pageTitle2="Matukio Hai">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", margin:0 }}>Live Incidents</h1>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, marginTop:3 }}>{incidents.length} total · {incidents.filter(i=>i.status==="open").length} open · real-time</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", borderRadius:999, background:"rgba(220,38,38,.15)", border:"1px solid rgba(220,38,38,.3)" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#DC2626" }}/>
          <span style={{ fontSize:11, fontWeight:700, color:"#FCA5A5" }}>LIVE FEED</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          {label:"Open",          v:incidents.filter(i=>i.status==="open").length,          c:"#DC2626"},
          {label:"Investigating", v:incidents.filter(i=>i.status==="investigating").length,  c:"#D97706"},
          {label:"Critical",      v:incidents.filter(i=>i.severity==="critical").length,     c:"#7C3AED"},
          {label:"Resolved Today",v:incidents.filter(i=>i.status==="resolved"&&new Date(i.created_at).toDateString()===new Date().toDateString()).length, c:"#059669"},
        ].map(k=>(
          <div key={k.label} style={{ ...card, padding:"16px", textAlign:"center", borderTop:`3px solid ${k.c}` }}>
            <div style={{ fontSize:30, fontWeight:900, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.7)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, ...card, padding:"0 12px", height:38 }}>
          <Search size={14} color="rgba(255,255,255,.4)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ref, type, location..."
            style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent", color:"white" }}/>
        </div>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={sel}>
          <option value="" style={{background:"#03102B"}}>All Status</option>
          {["open","investigating","resolved","closed"].map(s=><option key={s} value={s} style={{background:"#03102B"}}>{s}</option>)}
        </select>
        <select value={fSeverity} onChange={e=>setFSeverity(e.target.value)} style={sel}>
          <option value="" style={{background:"#03102B"}}>All Severity</option>
          {Object.keys(SEV_C).map(s=><option key={s} value={s} style={{background:"#03102B"}}>{s}</option>)}
        </select>
        <button onClick={load} style={{ ...sel, cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:"rgba(255,255,255,.6)" }}><RefreshCw size={14}/></button>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>
            <Activity size={40} style={{ opacity:.3, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600 }}>{incidents.length===0?"No incidents reported":"No incidents match filters"}</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"rgba(255,255,255,.03)", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
              {["Ref #","Type","Severity","Status","Location","Region","Reported By","Time"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(inc=>{
                const sc=SEV_C[inc.severity]||"#64748B", stc=STATUS_C[inc.status]||"#94A3B8";
                return (
                  <tr key={inc.id} style={{ borderBottom:"1px solid rgba(255,255,255,.05)" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:"#93C5FD", fontSize:12, fontFamily:"monospace" }}>{inc.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"white" }}>{inc.type}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}25`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{inc.severity}</span></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${stc}25`, color:stc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{inc.status}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.6)", maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inc.location_text||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.5)" }}>{inc.regions?.name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.5)" }}>{inc.profiles?.full_name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"rgba(255,255,255,.35)", whiteSpace:"nowrap" }}>{new Date(inc.created_at).toLocaleString("en-GB")}</td>
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
