import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Gavel, Plus, X, CheckCircle, AlertTriangle, Search, Calendar, Eye } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const STATUS_C = { open:"#0891B2", active:"#D97706", concluded:"#059669", appealed:"#7C3AED", withdrawn:"#64748B", dismissed:"#64748B" };
const VERDICTS = ["pending","guilty","not_guilty","dismissed","withdrawn"];
const COURT_TYPES = ["magistrate","resident_magistrate","district","high_court","court_of_appeal"];
const HEARING_TYPES = ["mention","plea","prosecution_evidence","defence_evidence","ruling","judgment","sentence","appeal"];
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function CourtCasesPage() {
  const { profile, stationId, regionId } = useCurrentUser();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [drawer, setDrawer] = useState(null); // selected case for hearings drawer
  const [hearings, setHearings] = useState([]);
  const [hModal, setHModal] = useState(false);

  const [form, setForm] = useState({ case_number:"", court_name:"", court_type:"magistrate", accused_name:"", charges:"", filed_date:"", prosecutor:"", defence:"" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const [hForm, setHForm] = useState({ hearing_date:"", hearing_type:"mention", magistrate:"", outcome:"", next_date:"", next_hearing_type:"mention", notes:"" });
  const updH = k => e => setHForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("court_cases").select("*").order("created_at",{ascending:false}).limit(300);
    setCases(data||[]); setLoading(false);
  }
  async function loadHearings(caseId) {
    const { data } = await supabase.from("hearings").select("*").eq("case_id", caseId).order("hearing_date",{ascending:false});
    setHearings(data||[]);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("court_cases").insert({
        ...form, filed_date:form.filed_date||null,
        station_id:stationId||null, region_id:regionId||null, investigating_officer:profile?.id||null,
        status:"open",
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"file_court_case", entityType:"court_case", entityId:data.id, entityRef:data.ref_number, description:`Filed: ${data.accused_name} - ${data.charges}` });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({ case_number:"", court_name:"", court_type:"magistrate", accused_name:"", charges:"", filed_date:"", prosecutor:"", defence:"" }); },1800);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function submitHearing(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("hearings").insert({
        ...hForm, case_id:drawer.id,
        hearing_date:hForm.hearing_date||null, next_date:hForm.next_date||null,
        recorded_by:profile?.id||null, attended:true,
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"record_hearing", entityType:"hearing", entityId:data.id, entityRef:data.ref_number, description:`Hearing for ${drawer.ref_number} - ${data.hearing_type}` });
      // If case was open, escalate to active after first hearing
      if (drawer.status === "open") await supabase.from("court_cases").update({ status:"active" }).eq("id", drawer.id);
      setHModal(false);
      setHForm({ hearing_date:"", hearing_type:"mention", magistrate:"", outcome:"", next_date:"", next_hearing_type:"mention", notes:"" });
      await loadHearings(drawer.id); await load();
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function setVerdict(c, verdict) {
    const updates = { verdict, status:"concluded", concluded_date:new Date().toISOString() };
    await supabase.from("court_cases").update(updates).eq("id", c.id);
    logAction({ profile, action:"case_verdict", entityType:"court_case", entityId:c.id, entityRef:c.ref_number, description:`Verdict: ${verdict}` });
    await load();
  }

  const filtered = cases.filter(c =>
    (!search || [c.case_number, c.accused_name, c.ref_number, c.court_name].some(f=>String(f||"").toLowerCase().includes(search.toLowerCase()))) &&
    (!fStatus || c.status===fStatus)
  );

  function openDrawer(c) { setDrawer(c); loadHearings(c.id); }

  return (
    <DashboardLayout pageTitle="Court Cases" pageTitle2="Kesi Mahakamani">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Court Cases <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Kesi Mahakamani</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{cases.length} total · {cases.filter(c=>c.status==="active").length} active hearings</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> File New Case
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {["open","active","concluded","appealed"].map(s=>(
          <div key={s} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${STATUS_C[s]}`, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:STATUS_C[s] }}>{cases.filter(c=>c.status===s).length}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B", textTransform:"capitalize" }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <div style={{ flex:1, maxWidth:380, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search case no, accused, court..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...S.sel, width:170 }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_C).map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Gavel size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No court cases</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref","Case No","Accused","Court","Charges","Filed","Status","Verdict","Action"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(c=>{
                const sc=STATUS_C[c.status]||"#94A3B8";
                return (
                  <tr key={c.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#0D3477", fontSize:12 }}>{c.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontSize:12, fontWeight:600 }}>{c.case_number||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600 }}>{c.accused_name}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{c.court_name||"—"}<div style={{ fontSize:10, color:"#94A3B8" }}>{c.court_type?.replace(/_/g," ")}</div></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", maxWidth:200 }}>{c.charges||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{c.filed_date?new Date(c.filed_date).toLocaleDateString("en-GB"):"—"}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{c.status}</span></td>
                    <td style={{ padding:"11px 14px" }}>
                      {c.verdict && c.verdict!=="pending" ? <span style={{ fontSize:11, fontWeight:700, color:c.verdict==="guilty"?"#DC2626":c.verdict==="not_guilty"?"#059669":"#64748B" }}>{c.verdict?.replace(/_/g," ")}</span> : <span style={{ color:"#94A3B8", fontSize:11 }}>—</span>}
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <button onClick={()=>openDrawer(c)} style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }} title="Hearings">
                        <Eye size={14}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New case modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>File New Court Case · Fungua Kesi</div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Case Filed!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Accused Name *</label><input value={form.accused_name} onChange={upd("accused_name")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Court Case No</label><input value={form.case_number} onChange={upd("case_number")} placeholder="e.g. MC/CRIM/123/2026" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Filed Date</label><input type="date" value={form.filed_date} onChange={upd("filed_date")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Court Name</label><input value={form.court_name} onChange={upd("court_name")} placeholder="e.g. Kisutu Resident Magistrate" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Court Type</label><select value={form.court_type} onChange={upd("court_type")} style={S.sel}>{COURT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Charges *</label><textarea value={form.charges} onChange={upd("charges")} rows={2} required style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Prosecutor</label><input value={form.prosecutor} onChange={upd("prosecutor")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Defence Counsel</label><input value={form.defence} onChange={upd("defence")} style={S.inp}/></div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Filing...":"File Case"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Hearings drawer */}
      {drawer && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", justifyContent:"flex-end", zIndex:99 }} onClick={e=>e.target===e.currentTarget&&setDrawer(null)}>
          <div style={{ background:"white", width:"100%", maxWidth:560, height:"100vh", overflowY:"auto", padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase" }}>Case {drawer.ref_number}</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#0D3477", margin:"3px 0" }}>{drawer.accused_name}</h2>
                <div style={{ fontSize:13, color:"#475569" }}>{drawer.charges}</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>{drawer.court_name} · {drawer.case_number||"no court no"}</div>
              </div>
              <button onClick={()=>setDrawer(null)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>

            {drawer.status !== "concluded" && (
              <div style={{ background:"#F8FAFC", borderRadius:12, padding:14, marginBottom:16, border:"1px solid #E2E8F0" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748B", marginBottom:8 }}>QUICK VERDICT</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {VERDICTS.filter(v=>v!=="pending").map(v=>(
                    <button key={v} onClick={()=>{ if(window.confirm(`Set verdict to ${v.replace(/_/g," ")} and conclude case?`)) setVerdict(drawer, v); }}
                      style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${v==="guilty"?"#DC2626":v==="not_guilty"?"#059669":"#94A3B8"}`, background:"white", color:v==="guilty"?"#DC2626":v==="not_guilty"?"#059669":"#64748B", cursor:"pointer", fontSize:11, fontWeight:700, textTransform:"capitalize" }}>
                      {v.replace(/_/g," ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:"#1E293B", margin:0 }}>HEARINGS · MASIKILIZO ({hearings.length})</h3>
              <button onClick={()=>{setErr("");setHModal(true);}} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:"#0D3477", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <Plus size={12}/> New Hearing
              </button>
            </div>

            {hearings.length===0 ? (
              <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8", border:"1px dashed #E2E8F0", borderRadius:12 }}>
                <Calendar size={32} style={{ opacity:.3, marginBottom:8 }}/>
                <div style={{ fontSize:13 }}>No hearings recorded yet</div>
              </div>
            ) : hearings.map(h=>(
              <div key={h.id} style={{ background:"white", border:"1px solid #E2E8F0", borderLeft:"3px solid #0D3477", borderRadius:10, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ background:"#EFF6FF", color:"#0D3477", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{h.hearing_type?.replace(/_/g," ")}</span>
                  <span style={{ fontSize:11, color:"#94A3B8" }}>{h.hearing_date?new Date(h.hearing_date).toLocaleString("en-GB"):"—"}</span>
                </div>
                {h.magistrate && <div style={{ fontSize:12, color:"#475569" }}><strong>Magistrate:</strong> {h.magistrate}</div>}
                {h.outcome && <div style={{ fontSize:13, color:"#1E293B", marginTop:6 }}>{h.outcome}</div>}
                {h.next_date && <div style={{ fontSize:11, color:"#D97706", marginTop:6, fontWeight:600 }}>📅 Next: {new Date(h.next_date).toLocaleDateString("en-GB")} ({h.next_hearing_type?.replace(/_/g," ")})</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hearing modal */}
      {hModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:101, padding:20 }} onClick={e=>e.target===e.currentTarget&&setHModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Record Hearing · Sajili Kusikilizwa</div>
              <button onClick={()=>setHModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C" }}>{err}</div>}
            <form onSubmit={submitHearing}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Hearing Date *</label><input type="datetime-local" value={hForm.hearing_date} onChange={updH("hearing_date")} required style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Type</label><select value={hForm.hearing_type} onChange={updH("hearing_type")} style={S.sel}>{HEARING_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
                <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Magistrate</label><input value={hForm.magistrate} onChange={updH("magistrate")} style={S.inp}/></div>
                <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Outcome</label><textarea value={hForm.outcome} onChange={updH("outcome")} rows={2} placeholder="What happened in this hearing..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Next Hearing Date</label><input type="datetime-local" value={hForm.next_date} onChange={updH("next_date")} style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Next Type</label><select value={hForm.next_hearing_type} onChange={updH("next_hearing_type")} style={S.sel}>{HEARING_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
              </div>
              <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                {saving?"Recording...":"Record Hearing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
