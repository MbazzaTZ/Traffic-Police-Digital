import { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, RefreshCw, FileText, Award, Calendar, TrendingUp, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import { useAppData } from "../../context/AppDataContext";
import { TrendBarChart, StatusPieChart, CHART_COLORS } from "../../components/charts/ChartAtoms";

const TYPES = [
  { v:"leave",            l:"Leave · Likizo",           icon:Calendar,   c:"#0D3477" },
  { v:"transfer",         l:"Transfer · Uhamisho",       icon:TrendingUp, c:"#0891B2" },
  { v:"promotion",        l:"Promotion · Kuendelezwa",   icon:Award,      c:"#059669" },
  { v:"demotion",         l:"Demotion · Kushushwa",      icon:TrendingUp, c:"#D97706" },
  { v:"training",         l:"Training · Mafunzo",        icon:FileText,   c:"#7C3AED" },
  { v:"certification",    l:"Certification · Cheti",     icon:Award,      c:"#0D3477" },
  { v:"disciplinary",     l:"Disciplinary · Nidhamu",    icon:AlertTriangle, c:"#DC2626" },
  { v:"commendation",     l:"Commendation · Sifa",       icon:Award,      c:"#059669" },
  { v:"medical",          l:"Medical · Matibabu",        icon:FileText,   c:"#0891B2" },
  { v:"performance_review",l:"Performance Review",       icon:TrendingUp, c:"#0D3477" },
  { v:"suspension",       l:"Suspension · Kusimamishwa",  icon:Shield,     c:"#DC2626" },
  { v:"resignation",      l:"Resignation · Kujiuzulu",    icon:FileText,   c:"#64748B" },
  { v:"retirement",       l:"Retirement · Kustaafu",      icon:Calendar,   c:"#64748B" },
  { v:"other",            l:"Other · Nyingine",           icon:FileText,   c:"#94A3B8" },
];
const STATUS_C = {
  active:"#0D3477", pending:"#D97706", approved:"#059669", rejected:"#DC2626",
  completed:"#0891B2", expired:"#94A3B8", cancelled:"#64748B", archived:"#94A3B8",
};
const SEVERITY_C = {
  low:"#059669", normal:"#0D3477", high:"#D97706", critical:"#DC2626",
};

const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function HRPage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const { officers } = useAppData();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");
  const [search,   setSearch]   = useState("");
  const [fType,    setFType]    = useState("");
  const [fStatus,  setFStatus]  = useState("");
  const [drawer,   setDrawer]   = useState(null);
  const [typeChartData, setTypeChartData] = useState([]);
  const [statusPieData, setStatusPieData] = useState([]);
  const [form, setForm] = useState({
    officer_id:"", type:"leave", title:"", description:"",
    start_date:"", end_date:"", severity:"normal", status:"active", notes:"",
  });
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true); setErr("");
    try {
      let q = supabase.from("hr_records")
        .select("*, profiles!hr_records_officer_id_fkey(full_name,badge,rank,role,stations(name)), profiles!hr_records_created_by_fkey(full_name)")
        .order("created_at", { ascending:false })
        .limit(300);
      const { data, error } = await q;
      if (error) throw error;
      setRecords(data || []);
      // Build charts
      const typeCounts = {};
      const statCounts = {};
      (data || []).forEach(r => {
        typeCounts[r.type] = (typeCounts[r.type]||0)+1;
        statCounts[r.status] = (statCounts[r.status]||0)+1;
      });
      const typeColors = TYPES.reduce((acc, t) => { acc[t.v] = t.c; return acc; }, {});
      setTypeChartData(Object.entries(typeCounts).map(([type,count]) => ({ type: type.replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase()), count, color: typeColors[type] || CHART_COLORS.navy })));
      const statColors = { active:CHART_COLORS.navy, pending:CHART_COLORS.gold, approved:CHART_COLORS.success, rejected:CHART_COLORS.danger, completed:CHART_COLORS.info, expired:CHART_COLORS.muted, cancelled:CHART_COLORS.muted, archived:CHART_COLORS.muted };
      setStatusPieData(Object.entries(statCounts).map(([name,value]) => ({ name: name.replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase()), value, color: statColors[name] || CHART_COLORS.navy })));
    } catch (e) {
      setErr(e.message || "Could not load HR records");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const payload = {
        officer_id:  form.officer_id,
        type:        form.type,
        title:       form.title || null,
        description: form.description || null,
        start_date:  form.start_date || null,
        end_date:    form.end_date || null,
        severity:    form.severity,
        status:      form.status,
        notes:       form.notes || null,
        date:        form.start_date || new Date().toISOString().slice(0,10),
        created_by:  profile?.id || null,
        station_id:  stationId || null,
        region_id:   regionId || null,
        district_id: districtId || null,
      };
      const { data, error } = await supabase.from("hr_records").insert(payload).select().single();
      if (error) throw error;
      const officerName = officers.find(o=>o.id===form.officer_id)?.full_name || "Unknown";
      logAction({
        profile,
        action: "create_hr_record",
        entityType: "hr_record",
        entityId: data.id,
        description: `HR record [${form.type}] for ${officerName}: ${form.title || "No title"}`,
      });
      setDone(true); await load();
      setTimeout(() => {
        setModal(false); setDone(false);
        setForm({ officer_id:"", type:"leave", title:"", description:"", start_date:"", end_date:"", severity:"normal", status:"active", notes:"" });
      }, 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function approveRecord(r) {
    try {
      const { error } = await supabase.from("hr_records").update({
        status: "approved",
        approved_by: profile?.id || null,
        approved_at: new Date().toISOString(),
      }).eq("id", r.id);
      if (error) throw error;
      logAction({
        profile,
        action: "approve_hr_record",
        entityType: "hr_record",
        entityId: r.id,
        description: `Approved HR record: ${r.title || r.type} for ${r.profiles?.full_name || "officer"}`,
      });
      await load();
      if (drawer?.id === r.id) setDrawer(null);
    } catch (e) {
      setErr(e.message || "Could not approve");
    }
  }

  async function rejectRecord(r) {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      const { error } = await supabase.from("hr_records").update({
        status: "rejected",
        notes: reason,
      }).eq("id", r.id);
      if (error) throw error;
      logAction({
        profile,
        action: "reject_hr_record",
        entityType: "hr_record",
        entityId: r.id,
        description: `Rejected HR record: ${r.title || r.type} — ${reason}`,
      });
      await load();
      if (drawer?.id === r.id) setDrawer(null);
    } catch (e) {
      setErr(e.message || "Could not reject");
    }
  }

  const filtered = records.filter(r => {
    const officerName = r.profiles?.full_name || "";
    const ms = !search || officerName.toLowerCase().includes(search.toLowerCase())
      || r.title?.toLowerCase().includes(search.toLowerCase())
      || r.type?.toLowerCase().includes(search.toLowerCase())
      || r.profiles?.badge?.toLowerCase().includes(search.toLowerCase());
    const mt = !fType || r.type === fType;
    const mst = !fStatus || r.status === fStatus;
    return ms && mt && mst;
  });

  return (
    <AdminLayout pageTitle="HR Records" pageTitle2="Rekodi za Wafanyakazi">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-900,#03102B)", margin:0, fontFamily:"var(--font-serif,Georgia,serif)" }}>Human Resources <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Wafanyakazi</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Officer leave, transfers, training, disciplinary, and performance records</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} disabled={loading} style={{ padding:"9px 14px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:loading?.6:1 }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--gold-600,#B45309)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, boxShadow:"0 1px 2px rgba(180,83,9,0.25)" }}>
            <Plus size={15}/> New Record
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
          { label:"Total Records",   v:records.length,                                          c:"#0D3477" },
          { label:"Pending Approval", v:records.filter(r=>r.status==="pending").length,          c:"#D97706" },
          { label:"On Leave",         v:records.filter(r=>r.type==="leave" && r.status==="active").length, c:"#0891B2" },
          { label:"Disciplinary",     v:records.filter(r=>r.type==="disciplinary").length,       c:"#DC2626" },
        ].map(k=>(
          <div key={k.label} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {(typeChartData.length > 0 || statusPieData.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          {typeChartData.length > 0 && (
            <div className="glass-card" style={{ padding:18 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--navy-700,#0D3477)", marginBottom:12, fontFamily:"var(--font-serif,Georgia,serif)" }}>Records by Type · kwa Aina</div>
              <TrendBarChart data={typeChartData} xKey="type" yKey="count" color={CHART_COLORS.navy} height={200} dark={false} horizontal={true} />
            </div>
          )}
          {statusPieData.length > 0 && (
            <div className="glass-card" style={{ padding:18 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--navy-700,#0D3477)", marginBottom:12, fontFamily:"var(--font-serif,Georgia,serif)" }}>Records by Status · kwa Hali</div>
              <StatusPieChart data={statusPieData} height={200} dark={false} />
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:240, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search officer, badge, title, or type..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={{ height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, background:"white", outline:"none" }}>
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t.v} value={t.v}>{t.l.split(" · ")[0]}</option>)}
        </select>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, background:"white", outline:"none" }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding:"60px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <FileText size={40} style={{ opacity:.2, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{records.length===0?"No HR records yet":"No records match filters"}</div>
          <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Create First Record</button>
        </div>
      ) : (
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC" }}>
              {["Officer","Type","Title","Severity","Status","Date","Created By","Actions"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(r => {
                const typeMeta = TYPES.find(t=>t.v===r.type) || { c:"#64748B", l:r.type };
                const sc = STATUS_C[r.status] || "#94A3B8";
                const sevC = SEVERITY_C[r.severity] || "#94A3B8";
                return (
                  <tr key={r.id} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#FAFAFE"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    onClick={()=>setDrawer(r)}>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600 }}>
                      {r.profiles?.full_name || "—"}
                      <div style={{ fontSize:10, color:"#94A3B8" }}>{r.profiles?.badge || ""} · {r.profiles?.rank || ""}</div>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${typeMeta.c}18`, color:typeMeta.c, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{r.type.replace(/_/g," ")}</span>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:13, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={r.title}>{r.title || "—"}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${sevC}18`, color:sevC, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.severity}</span>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${sc}18`, color:sc, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>
                      {r.start_date ? new Date(r.start_date).toLocaleDateString("en-GB") : r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—"}
                      {r.end_date && <div style={{ fontSize:10 }}>→ {new Date(r.end_date).toLocaleDateString("en-GB")}</div>}
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#64748B" }}>
                      {r.profiles && r.profiles.length > 0 && r.profiles[1]?.full_name ? r.profiles[1].full_name : "—"}
                    </td>
                    <td style={{ padding:"11px 14px" }} onClick={e=>e.stopPropagation()}>
                      {r.status === "pending" && (
                        <div style={{ display:"flex", gap:5 }}>
                          <button onClick={()=>approveRecord(r)} title="Approve" style={{ width:28, height:28, borderRadius:7, border:"none", background:"#059669", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
                            <CheckCircle size={13}/>
                          </button>
                          <button onClick={()=>rejectRecord(r)} title="Reject" style={{ width:28, height:28, borderRadius:7, border:"none", background:"#DC2626", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
                            <X size={13}/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {drawer && (() => {
        const r = drawer;
        const typeMeta = TYPES.find(t=>t.v===r.type) || { c:"#64748B", l:r.type };
        const sc = STATUS_C[r.status] || "#94A3B8";
        const sevC = SEVERITY_C[r.severity] || "#94A3B8";
        const officer = r.profiles && r.profiles[0] ? r.profiles[0] : null;
        const createdBy = r.profiles && r.profiles[1] ? r.profiles[1] : null;
        return (
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(440px, 100vw)", background:"white", boxShadow:"-8px 0 32px rgba(0,0,0,.15)", zIndex:110, display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"white", zIndex:1 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#0D3477", letterSpacing:.5, textTransform:"uppercase" }}>HR Record</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#03102B" }}>{r.title || r.type.replace(/_/g," ")}</div>
            </div>
            <button onClick={()=>setDrawer(null)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
          </div>
          <div style={{ padding:"18px 22px", flex:1 }}>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              <span style={{ background:`${typeMeta.c}18`, color:typeMeta.c, padding:"4px 11px", borderRadius:999, fontSize:11, fontWeight:700 }}>{typeMeta.l.split(" · ")[0]}</span>
              <span style={{ background:`${sevC}18`, color:sevC, padding:"4px 11px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.severity}</span>
              <span style={{ background:`${sc}18`, color:sc, padding:"4px 11px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16, padding:14, background:"#F8FAFC", borderRadius:10 }}>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Officer</div><div style={{ fontSize:13, fontWeight:600 }}>{officer?.full_name || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Badge</div><div style={{ fontSize:12, fontFamily:"monospace" }}>{officer?.badge || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Rank</div><div style={{ fontSize:12 }}>{officer?.rank || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Station</div><div style={{ fontSize:12 }}>{officer?.stations?.name || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Start Date</div><div style={{ fontSize:12 }}>{r.start_date ? new Date(r.start_date).toLocaleDateString("en-GB") : "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>End Date</div><div style={{ fontSize:12 }}>{r.end_date ? new Date(r.end_date).toLocaleDateString("en-GB") : "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Created By</div><div style={{ fontSize:12 }}>{createdBy?.full_name || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Created At</div><div style={{ fontSize:12 }}>{r.created_at ? new Date(r.created_at).toLocaleString("en-GB") : "—"}</div></div>
              {r.approved_by && <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Approved At</div><div style={{ fontSize:12, color:"#059669" }}>{r.approved_at ? new Date(r.approved_at).toLocaleString("en-GB") : "—"}</div></div>}
            </div>
            {r.description && (
              <>
                <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Description</div>
                <div style={{ fontSize:13, color:"#1E293B", lineHeight:1.5, marginBottom:14, padding:12, background:"#F8FAFC", borderRadius:8 }}>{r.description}</div>
              </>
            )}
            {r.notes && (
              <>
                <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Notes</div>
                <div style={{ fontSize:12, color:"#475569", fontStyle:"italic", lineHeight:1.5 }}>{r.notes}</div>
              </>
            )}
          </div>
          {r.status === "pending" && (
            <div style={{ padding:"18px 22px", borderTop:"1px solid #E2E8F0", background:"#F8FAFC", display:"flex", gap:8 }}>
              <button onClick={()=>approveRecord(r)} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"#059669", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <CheckCircle size={14}/> Approve
              </button>
              <button onClick={()=>rejectRecord(r)} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <X size={14}/> Reject
              </button>
            </div>
          )}
        </div>
        );
      })()}

      {/* Create Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>New HR Record · Rekodi Mpya</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Leave, transfer, training, disciplinary, etc.</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Record Created!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Officer · Afisa *</label>
                    <select value={form.officer_id} onChange={upd("officer_id")} required style={S.sel}>
                      <option value="">Select officer...</option>
                      {officers.filter(o=>o.status==="active").map(o=><option key={o.id} value={o.id}>{o.full_name} · {o.badge} · {o.rank}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Record Type · Aina *</label>
                    <select value={form.type} onChange={upd("type")} required style={S.sel}>
                      {TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Severity · Muhimu</label>
                    <select value={form.severity} onChange={upd("severity")} style={S.sel}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Title · Kichwa</label>
                    <input value={form.title} onChange={upd("title")} placeholder="Brief title for the record" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Start Date · Tarehe ya Mwanzo</label>
                    <input type="date" value={form.start_date} onChange={upd("start_date")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>End Date · Tarehe ya Mwisho</label>
                    <input type="date" value={form.end_date} onChange={upd("end_date")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Status · Hali</label>
                    <select value={form.status} onChange={upd("status")} style={S.sel}>
                      <option value="active">Active</option>
                      <option value="pending">Pending Approval</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Description · Maelezo</label>
                    <textarea value={form.description} onChange={upd("description")} rows={3} placeholder="Details of the record..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Notes · Maelezo ya Ziada</label>
                    <textarea value={form.notes} onChange={upd("notes")} rows={2} placeholder="Additional notes, comments..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Saving...":"Create Record · Unda"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
