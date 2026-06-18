import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Gavel, Plus, X, CheckCircle, AlertTriangle, Search, Calendar, Eye, FileText, MessageSquare, Paperclip, Trash2, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import { exportCourtFile } from "../../lib/pdfExport";
import { StatusPieChart, CHART_COLORS } from "../../components/charts/ChartAtoms";

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
  const { profile, stationId, regionId, fullName, stationName } = useCurrentUser();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [statusPieData, setStatusPieData] = useState([]);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  // Inline confirm dialog (replaces window.confirm).
  // confirmAction = { title, message, onConfirm, danger }
  const [confirmAction, setConfirmAction] = useState(null);
  const [drawer, setDrawer] = useState(null); // selected case for case-file drawer
  const [drawerTab, setDrawerTab] = useState("hearings"); // hearings | evidence | statements
  const [hearings, setHearings] = useState([]);
  const [hModal, setHModal] = useState(false);
  // Evidence bundle state
  const [bundle, setBundle] = useState([]);          // case_evidence rows joined with evidence
  const [evidencePool, setEvidencePool] = useState([]); // available evidence to attach
  const [eModal, setEModal] = useState(false);
  // Statements state
  const [statements, setStatements] = useState([]);
  const [sModal, setSModal] = useState(false);

  const [form, setForm] = useState({ case_number:"", court_name:"", court_type:"magistrate", accused_name:"", charges:"", filed_date:"", prosecutor:"", defence:"" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const [hForm, setHForm] = useState({ hearing_date:"", hearing_type:"mention", magistrate:"", outcome:"", next_date:"", next_hearing_type:"mention", notes:"" });
  const updH = k => e => setHForm(f=>({...f,[k]:e.target.value}));

  // Evidence attach form
  const [eForm, setEForm] = useState({ evidence_id:"", exhibit_label:"", purpose:"" });
  const updE = k => e => setEForm(f=>({...f,[k]:e.target.value}));

  // Statement form
  const [sForm, setSForm] = useState({ statement_type:"witness", deponent_name:"", deponent_nida:"", deponent_phone:"", deponent_address:"", content:"", language:"sw", sworn:false, cautioned:false, witness_bond:false });
  const updS = k => e => setSForm(f=>({...f,[k]: e.target.type==="checkbox" ? e.target.checked : e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("court_cases").select("*").order("created_at",{ascending:false}).limit(300);
    setCases(data||[]);
    // Build status pie chart data
    const statusCounts = {};
    (data||[]).forEach(c => { statusCounts[c.status] = (statusCounts[c.status]||0)+1; });
    const colorMap = { open:CHART_COLORS.info, active:CHART_COLORS.gold, concluded:CHART_COLORS.success, appealed:CHART_COLORS.critical, withdrawn:CHART_COLORS.muted, dismissed:CHART_COLORS.muted };
    setStatusPieData(Object.entries(statusCounts).map(([name,value]) => ({ name: name.replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase()), value, color: colorMap[name] || CHART_COLORS.navy })));
    setLoading(false);
  }
  async function loadHearings(caseId) {
    const { data } = await supabase.from("hearings").select("*").eq("case_id", caseId).order("hearing_date",{ascending:false});
    setHearings(data||[]);
  }
  async function loadBundle(caseId) {
    const { data } = await supabase.from("case_evidence")
      .select("*, evidence(*, profiles!evidence_collected_by_fkey(full_name))")
      .eq("court_case_id", caseId).order("created_at",{ascending:false});
    setBundle(data||[]);
  }
  async function loadEvidencePool() {
    // Show all evidence in the system — officer chooses which to attach
    const { data } = await supabase.from("evidence")
      .select("*, cases(case_number,title)")
      .order("created_at",{ascending:false}).limit(200);
    setEvidencePool(data||[]);
  }
  async function loadStatements(caseId) {
    const { data } = await supabase.from("statements")
      .select("*, profiles!statements_taken_by_fkey(full_name,badge)")
      .eq("court_case_id", caseId).order("taken_at",{ascending:false});
    setStatements(data||[]);
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

  async function attachEvidence(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("case_evidence").insert({
        court_case_id: drawer.id, evidence_id: eForm.evidence_id,
        exhibit_label: eForm.exhibit_label || null, purpose: eForm.purpose || null,
        tendered_by: profile?.id || null,
      }).select("*, evidence(ref_number, type)").single();
      if (error) throw error;
      logAction({ profile, action:"attach_evidence", entityType:"case_evidence", entityId:data.id, entityRef:drawer.ref_number, description:`Attached ${data.evidence?.ref_number} (${eForm.exhibit_label||"no label"}) to ${drawer.ref_number}` });
      setEModal(false);
      setEForm({ evidence_id:"", exhibit_label:"", purpose:"" });
      await loadBundle(drawer.id);
    } catch(err){ setErr(err.message); } finally{ setSaving(false); }
  }

  async function detachEvidence(ce) {
    setConfirmAction({
      title:"Remove evidence from case?",
      message:`This will remove ${ce.evidence?.ref_number || "this evidence"} from case ${drawer.ref_number}. The evidence record itself remains in the store.`,
      danger:true,
      onConfirm: async () => {
        await supabase.from("case_evidence").delete().eq("id", ce.id);
        logAction({ profile, action:"detach_evidence", entityType:"case_evidence", entityId:ce.id, entityRef:drawer.ref_number, description:`Detached ${ce.evidence?.ref_number||"evidence"} from ${drawer.ref_number}` });
        await loadBundle(drawer.id);
      },
    });
  }

  async function submitStatement(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("statements").insert({
        ...sForm, court_case_id: drawer.id,
        taken_by: profile?.id || null, station_id: stationId || null,
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"record_statement", entityType:"statement", entityId:data.id, entityRef:data.ref_number, description:`${sForm.statement_type} statement from ${sForm.deponent_name} on ${drawer.ref_number}` });
      setSModal(false);
      setSForm({ statement_type:"witness", deponent_name:"", deponent_nida:"", deponent_phone:"", deponent_address:"", content:"", language:"sw", sworn:false, cautioned:false, witness_bond:false });
      await loadStatements(drawer.id);
    } catch(err){ setErr(err.message); } finally{ setSaving(false); }
  }

  async function downloadCourtFile() {
    if (!drawer) return;
    try {
      await exportCourtFile(
        { caseRecord:drawer, hearings, bundle, statements },
        fullName || "—",
        stationName || "—"
      );
      logAction({
        profile, action:"export_court_file",
        entityType:"court_case", entityId:drawer.id, entityRef:drawer.ref_number,
        description:`Exported court file PDF (${hearings.length}H, ${bundle.length}E, ${statements.length}S)`,
      });
    } catch (e) {
      setErr(`Could not generate court file: ${e.message}`);
    }
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

  function openDrawer(c) {
    setDrawer(c);
    setDrawerTab("hearings");
    loadHearings(c.id);
    loadBundle(c.id);
    loadStatements(c.id);
  }

  return (
    <DashboardLayout pageTitle="Court Cases" pageTitle2="Kesi Mahakamani">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Court Cases <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Kesi Mahakamani</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{cases.length} total · {cases.filter(c=>c.status==="active").length} active hearings</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> File New Case
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {["open","active","concluded","appealed"].map(s=>(
          <div key={s} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
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

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
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
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={downloadCourtFile}
                  title="Download Court File PDF (prosecution bundle)"
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:8, border:"1px solid #0D3477", background:"#0D3477", color:"white", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                  <Download size={13}/> Court File
                </button>
                <button onClick={()=>setDrawer(null)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
              </div>
            </div>

            {drawer.status !== "concluded" && (
              <div style={{ background:"#F8FAFC", borderRadius:12, padding:14, marginBottom:16, border:"1px solid #E2E8F0" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748B", marginBottom:8 }}>QUICK VERDICT</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {VERDICTS.filter(v=>v!=="pending").map(v=>(
                    <button key={v} onClick={()=>setConfirmAction({
                      title:`Conclude case with verdict: ${v.replace(/_/g," ").toUpperCase()}?`,
                      message:`This will set the verdict to ${v.replace(/_/g," ")} and close case ${drawer.ref_number}. This is recorded in the audit log and cannot be undone from this screen.`,
                      danger:v==="guilty",
                      onConfirm: () => setVerdict(drawer, v),
                    })}
                      style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${v==="guilty"?"#DC2626":v==="not_guilty"?"#059669":"#94A3B8"}`, background:"white", color:v==="guilty"?"#DC2626":v==="not_guilty"?"#059669":"#64748B", cursor:"pointer", fontSize:11, fontWeight:700, textTransform:"capitalize" }}>
                      {v.replace(/_/g," ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer tab bar */}
            <div style={{ display:"flex", gap:4, borderBottom:"1px solid #E2E8F0", marginBottom:14 }}>
              {[
                { k:"hearings",   label:"Hearings",   icon:Calendar,       count:hearings.length },
                { k:"evidence",   label:"Evidence",   icon:Paperclip,      count:bundle.length },
                { k:"statements", label:"Statements", icon:MessageSquare,  count:statements.length },
              ].map(t=>{
                const Icon=t.icon;
                const isActive=drawerTab===t.k;
                return (
                  <button key={t.k} onClick={()=>setDrawerTab(t.k)}
                    style={{ flex:1, padding:"10px 8px", border:"none", background:"transparent", borderBottom:isActive?"2px solid #0D3477":"2px solid transparent", color:isActive?"#0D3477":"#64748B", fontWeight:isActive?700:600, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <Icon size={14}/> {t.label} <span style={{ background:isActive?"#0D3477":"#E2E8F0", color:isActive?"white":"#64748B", fontSize:10, padding:"1px 7px", borderRadius:999, fontWeight:700 }}>{t.count}</span>
                  </button>
                );
              })}
            </div>

            {/* HEARINGS TAB */}
            {drawerTab==="hearings" && <>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
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
            </>}

            {/* EVIDENCE TAB */}
            {drawerTab==="evidence" && <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:11, color:"#94A3B8" }}>Evidence tendered as exhibits in this case</span>
                <button onClick={()=>{setErr("");loadEvidencePool();setEModal(true);}} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:"#0D3477", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  <Plus size={12}/> Attach Evidence
                </button>
              </div>
              {bundle.length===0 ? (
                <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8", border:"1px dashed #E2E8F0", borderRadius:12 }}>
                  <Paperclip size={32} style={{ opacity:.3, marginBottom:8 }}/>
                  <div style={{ fontSize:13 }}>No evidence bundled to this case yet</div>
                  <div style={{ fontSize:11, marginTop:4 }}>Attach exhibits from the evidence store to build the prosecution bundle</div>
                </div>
              ) : bundle.map(ce=>{
                const ev = ce.evidence || {};
                return (
                  <div key={ce.id} style={{ background:"white", border:"1px solid #E2E8F0", borderLeft:"3px solid #D97706", borderRadius:10, padding:14, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                          {ce.exhibit_label && <span style={{ background:"#D97706", color:"white", padding:"2px 9px", borderRadius:6, fontSize:11, fontWeight:800, fontFamily:"monospace" }}>{ce.exhibit_label}</span>}
                          <span style={{ background:"#FFFBEB", color:"#92400E", padding:"2px 9px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{ev.type||"evidence"}</span>
                          <span style={{ fontSize:11, color:"#94A3B8", fontFamily:"monospace" }}>{ev.ref_number}</span>
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{ev.description||"—"}</div>
                        {ce.purpose && <div style={{ fontSize:12, color:"#475569", marginTop:4 }}><em>Purpose:</em> {ce.purpose}</div>}
                        <div style={{ fontSize:10, color:"#94A3B8", marginTop:6 }}>
                          Collected by {ev.profiles?.full_name||"—"} · Storage: {ev.storage_location||"—"} · Chain count: {ev.chain_count||1}
                        </div>
                      </div>
                      <button onClick={()=>detachEvidence(ce)} title="Remove from case" style={{ width:28, height:28, borderRadius:6, border:"1px solid #FECACA", background:"white", cursor:"pointer", color:"#DC2626", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </>}

            {/* STATEMENTS TAB */}
            {drawerTab==="statements" && <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:11, color:"#94A3B8" }}>Witness, victim, suspect & expert statements</span>
                <button onClick={()=>{setErr("");setSModal(true);}} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:"#0D3477", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  <Plus size={12}/> Record Statement
                </button>
              </div>
              {statements.length===0 ? (
                <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8", border:"1px dashed #E2E8F0", borderRadius:12 }}>
                  <MessageSquare size={32} style={{ opacity:.3, marginBottom:8 }}/>
                  <div style={{ fontSize:13 }}>No statements recorded yet</div>
                  <div style={{ fontSize:11, marginTop:4 }}>Record witness, victim, suspect or expert statements for this case</div>
                </div>
              ) : statements.map(s=>{
                const typeC = { witness:"#0891B2", victim:"#7C3AED", suspect:"#DC2626", accused:"#DC2626", expert:"#059669" }[s.statement_type] || "#64748B";
                return (
                  <div key={s.id} style={{ background:"white", border:"1px solid #E2E8F0", borderLeft:`3px solid ${typeC}`, borderRadius:10, padding:14, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, flexWrap:"wrap", gap:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ background:`${typeC}18`, color:typeC, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{s.statement_type}</span>
                        <span style={{ fontSize:10, fontFamily:"monospace", color:"#94A3B8" }}>{s.ref_number}</span>
                      </div>
                      <span style={{ fontSize:11, color:"#94A3B8" }}>{new Date(s.taken_at).toLocaleString("en-GB")}</span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{s.deponent_name}</div>
                    {s.deponent_nida && <div style={{ fontSize:11, color:"#94A3B8", fontFamily:"monospace" }}>NIDA: {s.deponent_nida}</div>}
                    {s.content && <div style={{ fontSize:12, color:"#475569", marginTop:8, padding:"8px 10px", background:"#F8FAFC", borderRadius:6, whiteSpace:"pre-wrap", maxHeight:120, overflowY:"auto" }}>{s.content}</div>}
                    <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                      {s.sworn        && <span style={{ background:"#DCFCE7", color:"#166534", padding:"2px 7px", borderRadius:999, fontSize:9, fontWeight:700 }}>SWORN</span>}
                      {s.cautioned    && <span style={{ background:"#FEF3C7", color:"#92400E", padding:"2px 7px", borderRadius:999, fontSize:9, fontWeight:700 }}>s.33 CAUTIONED</span>}
                      {s.witness_bond && <span style={{ background:"#EFF6FF", color:"#0D3477", padding:"2px 7px", borderRadius:999, fontSize:9, fontWeight:700 }}>s.34 BOND</span>}
                      <span style={{ background:"#F1F5F9", color:"#64748B", padding:"2px 7px", borderRadius:999, fontSize:9, fontWeight:700 }}>{s.language?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize:10, color:"#94A3B8", marginTop:6 }}>Taken by {s.profiles?.full_name||"—"} {s.profiles?.badge?`(${s.profiles.badge})`:""}</div>
                  </div>
                );
              })}
            </>}
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

      {/* Attach evidence modal */}
      {eModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:101, padding:20 }} onClick={e=>e.target===e.currentTarget&&setEModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Attach Evidence · Ambatisha Ushahidi</div>
              <button onClick={()=>setEModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C" }}>{err}</div>}
            <form onSubmit={attachEvidence}>
              <div style={{ marginBottom:14 }}>
                <label style={S.lbl}>Evidence Record *</label>
                <select value={eForm.evidence_id} onChange={updE("evidence_id")} required style={S.sel}>
                  <option value="">— Select evidence from store —</option>
                  {evidencePool.filter(ev => !bundle.some(b=>b.evidence_id===ev.id)).map(ev=>(
                    <option key={ev.id} value={ev.id}>
                      {ev.ref_number} · {ev.type} · {ev.description?.slice(0,50)}{ev.description?.length>50?"…":""}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize:10, color:"#94A3B8", marginTop:4 }}>{evidencePool.length===0 ? "Loading…" : `${evidencePool.length} evidence records in store. Already-attached items are hidden.`}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"0 16px" }}>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Exhibit Label</label><input value={eForm.exhibit_label} onChange={updE("exhibit_label")} placeholder="e.g. P-1, D-2" style={{ ...S.inp, fontFamily:"monospace", fontWeight:700 }}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Purpose of Tender</label><input value={eForm.purpose} onChange={updE("purpose")} placeholder="Why is this being tendered?" style={S.inp}/></div>
              </div>
              <button type="submit" disabled={saving||!eForm.evidence_id} style={{ width:"100%", height:46, background:(saving||!eForm.evidence_id)?"#94A3B8":"#D97706", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:(saving||!eForm.evidence_id)?"not-allowed":"pointer" }}>
                {saving?"Attaching...":"Attach as Exhibit"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record statement modal */}
      {sModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:101, padding:20 }} onClick={e=>e.target===e.currentTarget&&setSModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Record Statement · Sajili Maelezo</div>
                <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Police Force Act s.33 (Records of Interview) & s.34 (Witness Bonds)</div>
              </div>
              <button onClick={()=>setSModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C" }}>{err}</div>}
            <form onSubmit={submitStatement}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Statement Type *</label>
                  <select value={sForm.statement_type} onChange={updS("statement_type")} style={S.sel}>
                    {["witness","victim","suspect","accused","expert"].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Language</label>
                  <select value={sForm.language} onChange={updS("language")} style={S.sel}>
                    <option value="sw">Swahili</option><option value="en">English</option>
                  </select>
                </div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Deponent Name *</label><input value={sForm.deponent_name} onChange={updS("deponent_name")} required style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA</label><input value={sForm.deponent_nida} onChange={updS("deponent_nida")} style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Phone</label><input value={sForm.deponent_phone} onChange={updS("deponent_phone")} style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Address</label><input value={sForm.deponent_address} onChange={updS("deponent_address")} style={S.inp}/></div>
                <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                  <label style={S.lbl}>Statement Content *</label>
                  <textarea value={sForm.content} onChange={updS("content")} rows={6} required placeholder="Record the deponent's statement verbatim..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical", fontFamily:"inherit", lineHeight:1.5 }}/>
                </div>
                <div style={{ gridColumn:"1/-1", marginBottom:16, padding:"12px 14px", background:"#F8FAFC", borderRadius:9, border:"1px solid #E2E8F0" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#64748B", marginBottom:8, letterSpacing:.4 }}>LEGAL FLAGS</div>
                  <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#475569", cursor:"pointer" }}>
                      <input type="checkbox" checked={sForm.sworn} onChange={updS("sworn")} style={{ accentColor:"#059669" }}/>
                      Sworn on oath
                    </label>
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#475569", cursor:"pointer" }}>
                      <input type="checkbox" checked={sForm.cautioned} onChange={updS("cautioned")} style={{ accentColor:"#D97706" }}/>
                      s.33 caution given (suspect)
                    </label>
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#475569", cursor:"pointer" }}>
                      <input type="checkbox" checked={sForm.witness_bond} onChange={updS("witness_bond")} style={{ accentColor:"#0D3477" }}/>
                      s.34 witness bond executed
                    </label>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                {saving?"Recording...":"Record Statement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation dialog (replaces window.confirm) */}
      {confirmAction && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:120, padding:20 }} onClick={e=>e.target===e.currentTarget&&setConfirmAction(null)}>
          <div style={{ background:"white", borderRadius:14, padding:24, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:confirmAction.danger?"#FEF2F2":"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <AlertTriangle size={18} color={confirmAction.danger?"#DC2626":"#0D3477"}/>
              </div>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0F172A" }}>{confirmAction.title}</h3>
            </div>
            <p style={{ fontSize:13, color:"#64748B", lineHeight:1.5, margin:"0 0 18px" }}>{confirmAction.message}</p>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={()=>setConfirmAction(null)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={()=>{ confirmAction.onConfirm(); setConfirmAction(null); }}
                style={{ padding:"8px 16px", borderRadius:8, border:"none", background:confirmAction.danger?"#DC2626":"#0D3477", color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
