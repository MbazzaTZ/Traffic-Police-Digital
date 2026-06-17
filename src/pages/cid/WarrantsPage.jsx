import { useState, useEffect } from "react";
import CIDLayout from "../../layouts/CIDLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, ScrollText, UserCheck, Ban, Download, Clock, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import { exportWarrant } from "../../lib/pdfExport";

const TYPES = [
  { v:"arrest",      l:"Arrest Warrant · Hati ya Kukamata",     c:"#DC2626" },
  { v:"search",      l:"Search Warrant · Hati ya Utafutaji",    c:"#D97706" },
  { v:"seizure",     l:"Seizure Warrant · Hati ya Kukamata Mali", c:"#7C3AED" },
  { v:"bench",       l:"Bench Warrant · Hati ya Mahakama",      c:"#0891B2" },
  { v:"production",  l:"Production Warrant · Hati ya Kuwasilisha", c:"#0D3477" },
  { v:"other",       l:"Other · Nyingine",                       c:"#64748B" },
];
const STATUS_C = {
  active:"#DC2626", executed:"#059669", expired:"#94A3B8", cancelled:"#64748B", pending:"#D97706", draft:"#94A3B8",
};
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function WarrantsPage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const [warrants, setWarrants] = useState([]);
  const [cases,    setCases]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");
  const [search,   setSearch]   = useState("");
  const [fStatus,  setFStatus]  = useState("");
  const [drawer,   setDrawer]   = useState(null);
  const [form, setForm] = useState({
    type:"arrest", person_name:"", person_nida:"", court:"", judge:"",
    description:"", location:"", expires_at:"", urgent:false,
    case_id:"",
  });
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function load() {
    setLoading(true); setErr("");
    try {
      const [wRes, cRes] = await Promise.all([
        supabase.from("warrants")
          .select("*, cases(ref_number,title), profiles!warrants_executed_by_fkey(full_name,badge)")
          .order("created_at", { ascending:false })
          .limit(200),
        supabase.from("cases").select("id,ref_number,case_number,title").in("status",["open","active","investigating"]).order("created_at",{ascending:false}).limit(100),
      ]);
      if (wRes.error) throw wRes.error;
      setWarrants(wRes.data || []);
      setCases(cRes.data || []);
    } catch (e) {
      setErr(e.message || "Could not load warrants");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const payload = {
        type:         form.type,
        person_name:  form.person_name || null,
        person_nida:  form.person_nida || null,
        case_id:      form.case_id || null,
        court:        form.court,
        judge:        form.judge || null,
        description:  form.description || null,
        location:     form.location || null,
        expires_at:   form.expires_at ? new Date(form.expires_at).toISOString() : null,
        urgent:       form.urgent || false,
        status:       "active",
        issued_at:    new Date().toISOString(),
        issued_by:    profile?.id || null,
        station_id:   stationId || null,
        region_id:    regionId || null,
        district_id:  districtId || null,
      };
      const { data, error } = await supabase.from("warrants").insert(payload).select().single();
      if (error) throw error;
      logAction({
        profile,
        action: "create_warrant",
        entityType: "warrant",
        entityId: data.id,
        entityRef: data.ref_number || data.warrant_no,
        description: `Warrant issued: ${form.type.toUpperCase()} — ${form.person_name || "Unknown"} (${form.court})`,
      });
      setDone(true); await load();
      setTimeout(() => {
        setModal(false); setDone(false);
        setForm({ type:"arrest", person_name:"", person_nida:"", court:"", judge:"", description:"", location:"", expires_at:"", urgent:false, case_id:"" });
      }, 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function executeWarrant(w) {
    if (!confirm(`Mark warrant ${w.ref_number || w.warrant_no} as EXECUTED? This means the warrant has been carried out.`)) return;
    try {
      const { error } = await supabase.from("warrants").update({
        status: "executed",
        executed_at: new Date().toISOString(),
        executed_by: profile?.id || null,
      }).eq("id", w.id);
      if (error) throw error;
      logAction({
        profile,
        action: "execute_warrant",
        entityType: "warrant",
        entityId: w.id,
        entityRef: w.ref_number || w.warrant_no,
        description: `Warrant executed: ${w.type} — ${w.person_name || "Unknown"}`,
      });
      await load();
      if (drawer?.id === w.id) setDrawer({ ...w, status:"executed", executed_at:new Date().toISOString() });
    } catch (e) {
      setErr(e.message || "Could not execute warrant");
    }
  }

  async function cancelWarrant(w) {
    const reason = prompt("Reason for cancellation:");
    if (!reason) return;
    try {
      const { error } = await supabase.from("warrants").update({
        status: "cancelled",
        notes: reason,
      }).eq("id", w.id);
      if (error) throw error;
      logAction({
        profile,
        action: "cancel_warrant",
        entityType: "warrant",
        entityId: w.id,
        entityRef: w.ref_number || w.warrant_no,
        description: `Warrant cancelled: ${w.type} — ${w.person_name || "Unknown"} — Reason: ${reason}`,
      });
      await load();
      if (drawer?.id === w.id) setDrawer(null);
    } catch (e) {
      setErr(e.message || "Could not cancel warrant");
    }
  }

  async function downloadWarrantPDF(w) {
    try {
      await exportWarrant(w, profile?.full_name, profile?.stations?.name);
      logAction({
        profile,
        action: "export_warrant",
        entityType: "warrant",
        entityId: w.id,
        entityRef: w.ref_number || w.warrant_no,
        description: `Downloaded warrant: ${w.type} — ${w.person_name || "Unknown"}`,
      });
    } catch (e) {
      setErr(`Could not generate PDF: ${e.message}`);
    }
  }

  const filtered = warrants.filter(w => {
    const ms = !search || w.person_name?.toLowerCase().includes(search.toLowerCase())
      || w.person_nida?.includes(search)
      || (w.ref_number || w.warrant_no)?.includes(search)
      || w.court?.toLowerCase().includes(search.toLowerCase());
    const mst = !fStatus || w.status === fStatus;
    return ms && mst;
  });

  const isExpired = (w) => w.expires_at && new Date(w.expires_at) < new Date() && w.status === "active";
  const isExpiringSoon = (w) => {
    if (!w.expires_at || w.status !== "active") return false;
    const days = (new Date(w.expires_at) - new Date()) / 86400000;
    return days >= 0 && days <= 3;
  };

  return (
    <CIDLayout pageTitle="Warrants" pageTitle2="Hati za Mahakama">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Warrants <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Hati za Mahakama</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Court-issued warrants for arrest, search, and seizure</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} disabled={loading} style={{ padding:"9px 14px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:loading?.6:1 }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
            <Plus size={15}/> Issue Warrant · Toa Hati
          </button>
        </div>
      </div>

      {err && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:14, color:"#B91C1C", fontSize:13, display:"flex", justifyContent:"space-between" }}>
          <span>{err}</span>
          <button onClick={()=>setErr("")} style={{ background:"transparent", border:"none", color:"#B91C1C", cursor:"pointer", fontSize:16 }}>×</button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Active",     v:warrants.filter(w=>w.status==="active").length,    c:"#DC2626" },
          { label:"Executed",   v:warrants.filter(w=>w.status==="executed").length,  c:"#059669" },
          { label:"Expiring Soon", v:warrants.filter(isExpiringSoon).length,         c:"#D97706" },
          { label:"Expired",    v:warrants.filter(isExpired).length,                 c:"#94A3B8" },
        ].map(k=>(
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:240, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, NIDA, ref, or court..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, background:"white", outline:"none" }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="executed">Executed</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding:"60px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <ScrollText size={40} style={{ opacity:.2, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{warrants.length===0?"No warrants issued yet":"No warrants match filters"}</div>
          <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Issue First Warrant</button>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC" }}>
              {["Ref","Type","Person","Court","Judge","Status","Expires","Actions"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(w=>{
                const typeMeta = TYPES.find(t=>t.v===w.type) || { c:"#64748B", l:w.type };
                const sc = STATUS_C[w.status] || "#94A3B8";
                const expired = isExpired(w);
                const soon = isExpiringSoon(w);
                return (
                  <tr key={w.id} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#FAFAFE"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    onClick={()=>setDrawer(w)}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#DC2626", fontSize:12 }}>{w.ref_number || w.warrant_no}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${typeMeta.c}18`, color:typeMeta.c, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{w.type}</span>
                      {w.urgent && <span style={{ background:"#FEE2E2", color:"#991B1B", padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:700, marginLeft:4 }}>URGENT</span>}
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600 }}>
                      {w.person_name || "—"}
                      {w.person_nida && <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"monospace" }}>{w.person_nida}</div>}
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{w.court}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#64748B" }}>{w.judge || "—"}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${sc}18`, color:sc, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>
                        {expired ? "expired" : w.status}
                      </span>
                      {soon && <div style={{ fontSize:10, color:"#D97706", marginTop:2, fontWeight:600 }}><Clock size={9} style={{display:"inline"}}/> expires soon</div>}
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>
                      {w.expires_at ? new Date(w.expires_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td style={{ padding:"11px 14px" }} onClick={e=>e.stopPropagation()}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={()=>downloadWarrantPDF(w)} title="Download PDF" style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}>
                          <Download size={13}/>
                        </button>
                        {w.status === "active" && !expired && (
                          <>
                            <button onClick={()=>executeWarrant(w)} title="Mark as executed" style={{ width:30, height:30, borderRadius:7, border:"none", background:"#059669", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
                              <UserCheck size={13}/>
                            </button>
                            <button onClick={()=>cancelWarrant(w)} title="Cancel warrant" style={{ width:30, height:30, borderRadius:7, border:"none", background:"#94A3B8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
                              <Ban size={13}/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {drawer && (
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(440px, 100vw)", background:"white", boxShadow:"-8px 0 32px rgba(0,0,0,.15)", zIndex:110, display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"white", zIndex:1 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#DC2626", letterSpacing:.5, textTransform:"uppercase" }}>Warrant Details</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#0D3477", fontFamily:"monospace" }}>{drawer.ref_number || drawer.warrant_no}</div>
            </div>
            <button onClick={()=>setDrawer(null)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
          </div>
          <div style={{ padding:"18px 22px", flex:1 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Type</div><div style={{ fontSize:13, fontWeight:600, textTransform:"capitalize" }}>{drawer.type}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Status</div>
                <span style={{ background:`${STATUS_C[drawer.status]||"#94A3B8"}18`, color:STATUS_C[drawer.status]||"#94A3B8", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{drawer.status}</span>
              </div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Person</div><div style={{ fontSize:13 }}>{drawer.person_name || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>NIDA</div><div style={{ fontSize:12, fontFamily:"monospace" }}>{drawer.person_nida || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Court</div><div style={{ fontSize:13 }}>{drawer.court}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Judge</div><div style={{ fontSize:13 }}>{drawer.judge || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Issued</div><div style={{ fontSize:12 }}>{drawer.issued_at ? new Date(drawer.issued_at).toLocaleString("en-GB") : "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Expires</div><div style={{ fontSize:12 }}>{drawer.expires_at ? new Date(drawer.expires_at).toLocaleString("en-GB") : "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Executed</div><div style={{ fontSize:12 }}>{drawer.executed_at ? new Date(drawer.executed_at).toLocaleString("en-GB") : "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Urgent</div><div style={{ fontSize:13 }}>{drawer.urgent ? "⚠ YES" : "No"}</div></div>
              {drawer.location && <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Location</div><div style={{ fontSize:12 }}>{drawer.location}</div></div>}
              {drawer.cases && <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Linked Case</div><div style={{ fontSize:12, color:"#0D3477", fontWeight:600 }}>{drawer.cases.ref_number || drawer.cases.case_number} — {drawer.cases.title}</div></div>}
            </div>
            {drawer.description && (
              <>
                <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Description</div>
                <div style={{ fontSize:13, color:"#1E293B", lineHeight:1.5, marginBottom:14, background:"#F8FAFC", padding:12, borderRadius:8 }}>{drawer.description}</div>
              </>
            )}
            {drawer.notes && (
              <>
                <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Notes</div>
                <div style={{ fontSize:13, color:"#475569", lineHeight:1.5, fontStyle:"italic" }}>{drawer.notes}</div>
              </>
            )}
          </div>
          <div style={{ padding:"18px 22px", borderTop:"1px solid #E2E8F0", background:"#F8FAFC", display:"flex", gap:8 }}>
            <button onClick={()=>downloadWarrantPDF(drawer)} style={{ flex:1, padding:"11px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Download size={14}/> Download
            </button>
            {drawer.status === "active" && !isExpired(drawer) && (
              <>
                <button onClick={()=>executeWarrant(drawer)} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"#059669", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <UserCheck size={14}/> Execute
                </button>
                <button onClick={()=>cancelWarrant(drawer)} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"#94A3B8", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <Ban size={14}/> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>Issue Warrant · Toa Hati</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Court-issued warrant for arrest, search, or seizure</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Warrant Issued!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Warrant Type · Aina ya Hati *</label>
                    <select value={form.type} onChange={upd("type")} required style={S.sel}>
                      {TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Person Name · Jina *</label>
                    <input value={form.person_name} onChange={upd("person_name")} placeholder="Full name of subject" required style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>NIDA Number</label>
                    <input value={form.person_nida} onChange={upd("person_nida")} placeholder="If known" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Issuing Court · Mahakama *</label>
                    <input value={form.court} onChange={upd("court")} placeholder="e.g. Resident Magistrate Court - Dar" required style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Judge / Magistrate</label>
                    <input value={form.judge} onChange={upd("judge")} placeholder="Hon. Judge name" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Expiry Date · Mwisho</label>
                    <input type="datetime-local" value={form.expires_at} onChange={upd("expires_at")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Link to Case (optional)</label>
                    <select value={form.case_id} onChange={upd("case_id")} style={S.sel}>
                      <option value="">— None —</option>
                      {cases.map(c=><option key={c.id} value={c.id}>{c.ref_number || c.case_number} — {c.title?.slice(0,40)}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Execution Location · Mahali</label>
                    <input value={form.location} onChange={upd("location")} placeholder="Where warrant should be executed" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Description / Grounds · Sababu *</label>
                    <textarea value={form.description} onChange={upd("description")} rows={3} placeholder="Legal grounds for the warrant, offenses, particulars..." required style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1", display:"flex", alignItems:"center", gap:10 }}>
                    <input type="checkbox" id="urgent" checked={form.urgent} onChange={upd("urgent")} style={{ width:18, height:18, accentColor:"#DC2626" }}/>
                    <label htmlFor="urgent" style={{ fontSize:13, fontWeight:600, color:"#1E293B", cursor:"pointer" }}>⚠ Mark as URGENT · Hatari</label>
                  </div>
                </div>
                {form.urgent && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#B91C1C", display:"flex", gap:8 }}><AlertTriangle size={15}/> Urgent warrants are flagged for immediate execution and appear at the top of the list.</div>}
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Issuing...":"Issue Warrant · Toa Hati"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </CIDLayout>
  );
}
