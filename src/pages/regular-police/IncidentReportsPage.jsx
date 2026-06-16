import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, FileText, X, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const TYPES = ["Theft","Assault","Robbery","Burglary","Fraud","Disturbance","Missing Person","Accident","Arson","Drug Offense","Sexual Offense","Kidnapping","Vandalism","Other"];
const SEVERITY = [{ v:"low",c:"#64748B" },{ v:"medium",c:"#D97706" },{ v:"high",c:"#DC2626" },{ v:"critical",c:"#7C3AED" }];
const STATUS_COLORS = { open:"#DC2626", investigating:"#D97706", resolved:"#059669", closed:"#94A3B8" };

const S = {
  inp: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function IncidentReportsPage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(null);
  const [err,       setErr]       = useState("");
  const [search,    setSearch]    = useState("");
  const [fStatus,   setFStatus]   = useState("");
  const [fSeverity, setFSeverity] = useState("");

  const [form, setForm] = useState({ type:"", title:"", description:"", severity:"medium", location_text:"", occurred_at:"" });
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true);
    let q = supabase.from("incidents").select("*, profiles!incidents_reported_by_fkey(full_name,badge)").order("created_at", { ascending:false }).limit(100);
    if (stationId) q = q.eq("station_id", stationId);
    const { data, error } = await q;
    if (error) console.error(error);
    setIncidents(data || []);
    setLoading(false);
  }

  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("incidents").insert({
        type:          form.type,
        title:         form.title || form.type,
        description:   form.description,
        severity:      form.severity,
        location_text: form.location_text,
        occurred_at:   form.occurred_at || new Date().toISOString(),
        station_id:    stationId  || null,
        region_id:     regionId   || null,
        district_id:   districtId || null,
        reported_by:   profile?.id || null,
        status:        "open",
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_incident", entityType:"incident", entityId:data.id, entityRef:data.ref_number, description:`Incident: ${data.type} - ${data.severity}` });
      setDone(data);
      await load();
      setTimeout(() => { setModal(false); setDone(null); setForm({ type:"", title:"", description:"", severity:"medium", location_text:"", occurred_at:"" }); }, 2500);
    } catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  const filtered = incidents.filter(i => {
    const ms = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.ref_number?.includes(search) || i.type?.toLowerCase().includes(search.toLowerCase());
    const mst = !fStatus   || i.status   === fStatus;
    const msv = !fSeverity || i.severity === fSeverity;
    return ms && mst && msv;
  });

  return (
    <DashboardLayout pageTitle="Incident Reports" pageTitle2="Ripoti za Matukio">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Incident Reports <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Ripoti</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{incidents.length} total · {incidents.filter(i=>i.status==="open").length} open</p>
        </div>
        <button onClick={() => { setErr(""); setModal(true); }}
          style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> New Incident
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Open",          v:incidents.filter(i=>i.status==="open").length,          c:"#DC2626" },
          { label:"Investigating", v:incidents.filter(i=>i.status==="investigating").length,  c:"#D97706" },
          { label:"Resolved",      v:incidents.filter(i=>i.status==="resolved").length,       c:"#059669" },
          { label:"Critical",      v:incidents.filter(i=>i.severity==="critical").length,     c:"#7C3AED" },
        ].map(k => (
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px 16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by ref, type or title..."
            style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...S.sel, width:140 }}>
          <option value="">All Status</option>
          {["open","investigating","resolved","closed"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fSeverity} onChange={e=>setFSeverity(e.target.value)} style={{ ...S.sel, width:140 }}>
          <option value="">All Severity</option>
          {SEVERITY.map(s=><option key={s.v} value={s.v}>{s.v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>Loading from Supabase...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <FileText size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{incidents.length===0?"No incidents recorded yet":"No incidents match filters"}</div>
            <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Record First Incident</button>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                {["Ref #","Type","Severity","Status","Location","Reported By","Date"].map(h=>(
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc,i) => {
                const sc = STATUS_COLORS[inc.status] || "#94A3B8";
                const sv = SEVERITY.find(s=>s.v===inc.severity);
                return (
                  <tr key={inc.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:"#0D3477", fontSize:12, fontFamily:"monospace" }}>{inc.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"#1E293B" }}>{inc.type}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${sv?.c||"#94A3B8"}18`, color:sv?.c||"#94A3B8", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{inc.severity}</span>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{inc.status}</span>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inc.location_text||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{inc.profiles?.full_name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{new Date(inc.created_at).toLocaleDateString("en-GB")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>New Incident Report</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Ripoti ya Tukio Jipya · GPS & timestamp auto-logged</div>
              </div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>

            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}

            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/>
                <h3 style={{ color:"#16A34A", marginBottom:4 }}>Incident Recorded!</h3>
                <p style={{ color:"#0D3477", fontWeight:700, fontSize:16 }}>{done.ref_number}</p>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Tukio limeandikwa kwenye Supabase</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Incident Type · Aina *</label>
                    <select value={form.type} onChange={upd("type")} required style={S.sel} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                      <option value="">Select type...</option>
                      {TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Severity · Ukali</label>
                    <select value={form.severity} onChange={upd("severity")} style={S.sel}>
                      {SEVERITY.map(s=><option key={s.v} value={s.v}>{s.v.charAt(0).toUpperCase()+s.v.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Title / Brief Description</label>
                    <input value={form.title} onChange={upd("title")} placeholder="e.g. Armed robbery at Town Centre" style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Location · Mahali *</label>
                    <input value={form.location_text} onChange={upd("location_text")} placeholder="e.g. Town Centre, Njombe" required style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Occurred At · Ilitokea</label>
                    <input type="datetime-local" value={form.occurred_at} onChange={upd("occurred_at")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Full Description · Maelezo Kamili *</label>
                    <textarea value={form.description} onChange={upd("description")} rows={4} required placeholder="Describe what happened in detail..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving ? "Saving to Supabase..." : "Submit Report · Wasilisha Ripoti"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
