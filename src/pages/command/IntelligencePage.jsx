import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, Eye, Lock, FileText, RefreshCw, Tag, Clock, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const CLASSIFICATION = {
  restricted:  { c:"#64748B", bg:"#F1F5F9", label:"RESTRICTED",  sw:"MDHARURA" },
  confidential:{ c:"#D97706", bg:"#FFFBEB", label:"CONFIDENTIAL", sw:"SIRI" },
  secret:      { c:"#DC2626", bg:"#FEF2F2", label:"SECRET",      sw:"SIRI KUU" },
  top_secret:  { c:"#7C3AED", bg:"#F5F3FF", label:"TOP SECRET",  sw:"SIRI YA JUU" },
};
const THREAT = {
  low:      { c:"#059669", label:"LOW" },
  medium:   { c:"#D97706", label:"MEDIUM" },
  high:     { c:"#DC2626", label:"HIGH" },
  critical: { c:"#7C3AED", label:"CRITICAL" },
};
const RELIABILITY = {
  a:           { label:"A — Confirmed", c:"#059669" },
  b:           { label:"B — Probably True", c:"#0D3477" },
  c:           { label:"C — Possibly True", c:"#D97706" },
  d:           { label:"D — Doubtful", c:"#DC2626" },
  f:           { label:"F — Cannot Judge", c:"#64748B" },
  unverified:  { label:"Unverified", c:"#94A3B8" },
};
const STATUS_C = {
  active:"#0D3477", pending_review:"#D97706", verified:"#059669",
  disseminated:"#7C3AED", archived:"#64748B", expired:"#94A3B8", recalled:"#DC2626",
};
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box", background:"white", color:"#1E293B" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", color:"#1E293B", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function IntelligencePage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const [files,    setFiles]    = useState([]);
  const [cases,    setCases]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");
  const [search,   setSearch]   = useState("");
  const [fClass,   setFClass]   = useState("");
  const [fThreat,  setFThreat]  = useState("");
  const [drawer,   setDrawer]   = useState(null);

  const [form, setForm] = useState({
    title:"", classification:"confidential", threat_level:"medium",
    content:"", region:"", source:"", source_reliability:"unverified",
    subject_name:"", subject_nida:"", location_text:"", case_id:"",
    expires_at:"", tags:"", notes:"",
  });
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true); setErr("");
    try {
      const [iRes, cRes] = await Promise.all([
        supabase.from("intelligence_files")
          .select("*, cases(ref_number,title), profiles!intelligence_files_created_by_fkey(full_name,badge)")
          .order("created_at", { ascending:false })
          .limit(200),
        supabase.from("cases").select("id,ref_number,title").in("status",["open","active","investigating"]).limit(100),
      ]);
      if (iRes.error) throw iRes.error;
      setFiles(iRes.data || []);
      setCases(cRes.data || []);
    } catch (e) {
      setErr(e.message || "Could not load intelligence files");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const tagsArr = form.tags.split(",").map(t=>t.trim()).filter(Boolean);
      const payload = {
        title:             form.title,
        classification:    form.classification,
        threat_level:      form.threat_level,
        content:           form.content || null,
        region:            form.region || null,
        source:            form.source || null,
        source_reliability:form.source_reliability || "unverified",
        subject_name:      form.subject_name || null,
        subject_nida:      form.subject_nida || null,
        location_text:     form.location_text || null,
        case_id:           form.case_id || null,
        expires_at:        form.expires_at ? new Date(form.expires_at).toISOString() : null,
        tags:              tagsArr,
        notes:             form.notes || null,
        status:            "active",
        created_by:        profile?.id || null,
        station_id:        stationId || null,
        region_id:         regionId || null,
        district_id:       districtId || null,
      };
      const { data, error } = await supabase.from("intelligence_files").insert(payload).select().single();
      if (error) throw error;
      logAction({
        profile,
        action: "create_intelligence_file",
        entityType: "intelligence_file",
        entityId: data.id,
        entityRef: data.ref_number || data.intel_no,
        description: `Intel filed [${data.classification.toUpperCase()}] [${data.threat_level.toUpperCase()}]: ${form.title}${form.subject_name ? ` — Subject: ${form.subject_name}` : ""}`,
      });
      setDone(true); await load();
      setTimeout(() => {
        setModal(false); setDone(false);
        setForm({ title:"", classification:"confidential", threat_level:"medium", content:"", region:"", source:"", source_reliability:"unverified", subject_name:"", subject_nida:"", location_text:"", case_id:"", expires_at:"", tags:"", notes:"" });
      }, 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(f, status) {
    try {
      const updates = { status };
      if (status === "verified") {
        updates.reviewed_at = new Date().toISOString();
        updates.reviewed_by = profile?.id || null;
      }
      const { error } = await supabase.from("intelligence_files").update(updates).eq("id", f.id);
      if (error) throw error;
      logAction({
        profile,
        action: `intel_${status}`,
        entityType: "intelligence_file",
        entityId: f.id,
        entityRef: f.ref_number || f.intel_no,
        description: `Intel status → ${status}: ${f.title}`,
      });
      await load();
      if (drawer?.id === f.id) setDrawer({ ...f, ...updates });
    } catch (e) {
      setErr(e.message || "Could not update status");
    }
  }

  const filtered = files.filter(f => {
    const ms = !search || f.title?.toLowerCase().includes(search.toLowerCase())
      || f.subject_name?.toLowerCase().includes(search.toLowerCase())
      || f.source?.toLowerCase().includes(search.toLowerCase())
      || (f.ref_number || f.intel_no)?.toLowerCase().includes(search.toLowerCase());
    const mc = !fClass || f.classification === fClass;
    const mt = !fThreat || f.threat_level === fThreat;
    return ms && mc && mt;
  });

  return (
    <CommandLayout pageTitle="Intelligence" pageTitle2="Ujasusi">
      {/* Classification banner */}
      <div style={{ background:"#FEF2F2", border:"2px solid #DC2626", borderRadius:12, padding:"12px 18px", marginBottom:18, display:"flex", alignItems:"center", gap:12 }}>
        <Lock size={22} color="#DC2626"/>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:"#DC2626", letterSpacing:.5 }}>RESTRICTED ACCESS · UFIKIAJI MDHARURA</div>
          <div style={{ fontSize:12, color:"#B91C1C" }}>All intelligence files are classified. Access is logged. Unauthorized disclosure is a criminal offense.</div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"white", margin:0, fontFamily:"var(--font-serif,Georgia,serif)" }}>Intelligence Files <span style={{ color:"rgba(255,255,255,.4)", fontWeight:400, fontSize:16 }}>· Faili za Ujasusi</span></h1>
          <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, marginTop:3 }}>{files.length} files · {files.filter(f=>f.status==="active").length} active · {files.filter(f=>f.threat_level==="critical").length} critical threats</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} disabled={loading} style={{ padding:"9px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.04)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:loading?.6:1 }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--gold-600,#B45309)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, boxShadow:"0 1px 2px rgba(180,83,9,0.25)" }}>
            <Plus size={15}/> File Intel · Faili
          </button>
        </div>
      </div>

      {err && (
        <div style={{ background:"rgba(254,242,242,.1)", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:14, color:"#FCA5A5", fontSize:13, display:"flex", justifyContent:"space-between" }}>
          <span>{err}</span>
          <button onClick={()=>setErr("")} style={{ background:"transparent", border:"none", color:"#FCA5A5", cursor:"pointer", fontSize:16 }}>×</button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Active",    v:files.filter(f=>f.status==="active").length,           c:"#0D3477" },
          { label:"Critical",  v:files.filter(f=>f.threat_level==="critical").length,   c:"#7C3AED" },
          { label:"Verified",  v:files.filter(f=>f.status==="verified").length,         c:"#059669" },
          { label:"Top Secret",v:files.filter(f=>f.classification==="top_secret").length, c:"#DC2626" },
        ].map(k=>(
          <div key={k.label} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"14px", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:"white" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.6)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:240, display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.04)", border:"1.5px solid rgba(255,255,255,.12)", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="rgba(255,255,255,.4)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, subject, source, or ref..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent", color:"white" }}/>
        </div>
        <select value={fClass} onChange={e=>setFClass(e.target.value)} style={{ height:40, border:"1.5px solid rgba(255,255,255,.12)", borderRadius:9, padding:"0 12px", fontSize:13, background:"rgba(255,255,255,.04)", color:"white", outline:"none" }}>
          <option value="" style={{background:"#03102B"}}>All Classifications</option>
          <option value="restricted" style={{background:"#03102B"}}>Restricted</option>
          <option value="confidential" style={{background:"#03102B"}}>Confidential</option>
          <option value="secret" style={{background:"#03102B"}}>Secret</option>
          <option value="top_secret" style={{background:"#03102B"}}>Top Secret</option>
        </select>
        <select value={fThreat} onChange={e=>setFThreat(e.target.value)} style={{ height:40, border:"1.5px solid rgba(255,255,255,.12)", borderRadius:9, padding:"0 12px", fontSize:13, background:"rgba(255,255,255,.04)", color:"white", outline:"none" }}>
          <option value="" style={{background:"#03102B"}}>All Threat Levels</option>
          <option value="low" style={{background:"#03102B"}}>Low</option>
          <option value="medium" style={{background:"#03102B"}}>Medium</option>
          <option value="high" style={{background:"#03102B"}}>High</option>
          <option value="critical" style={{background:"#03102B"}}>Critical</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding:"60px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:"60px 20px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>
          <Shield size={40} style={{ opacity:.3, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,.6)" }}>{files.length===0?"No intelligence files yet":"No files match filters"}</div>
          <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>File First Intel</button>
        </div>
      ) : (
        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"rgba(255,255,255,.03)" }}>
              {["Ref","Title","Classification","Threat","Subject","Source","Status","Filed"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(f=>{
                const cls = CLASSIFICATION[f.classification] || CLASSIFICATION.confidential;
                const thr = THREAT[f.threat_level] || THREAT.medium;
                const sc = STATUS_C[f.status] || "#94A3B8";
                const rel = RELIABILITY[f.source_reliability] || RELIABILITY.unverified;
                return (
                  <tr key={f.id} style={{ borderBottom:"1px solid rgba(255,255,255,.05)", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    onClick={()=>setDrawer(f)}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#FCA5A5", fontSize:11 }}>{f.ref_number || f.intel_no}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"white", maxWidth:240, overflow:"hidden", textOverflow:"ellipsis" }}>{f.title}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:cls.bg, color:cls.c, padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:800, letterSpacing:.5 }}>{cls.label}</span>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${thr.c}18`, color:thr.c, padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700 }}>{thr.label}</span>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.7)" }}>{f.subject_name || "—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"rgba(255,255,255,.7)" }}>
                      {f.source ? <span title={rel.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ width:8, height:8, borderRadius:"50%", background:rel.c, display:"inline-block" }}/>
                        {f.source}
                      </span> : "—"}
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{f.status?.replace(/_/g," ")}</span>
                    </td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"rgba(255,255,255,.4)", whiteSpace:"nowrap" }}>{f.created_at ? new Date(f.created_at).toLocaleDateString("en-GB") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {drawer && (
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(480px, 100vw)", background:"#05193E", boxShadow:"-8px 0 32px rgba(0,0,0,.4)", zIndex:110, display:"flex", flexDirection:"column", overflowY:"auto", borderLeft:"1px solid rgba(255,255,255,.1)" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(255,255,255,.1)", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"#05193E", zIndex:1 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#FCA5A5", letterSpacing:.5, textTransform:"uppercase" }}>Intelligence File</div>
              <div style={{ fontSize:18, fontWeight:800, color:"white", fontFamily:"monospace" }}>{drawer.ref_number || drawer.intel_no}</div>
            </div>
            <button onClick={()=>setDrawer(null)} style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,.08)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}><X size={16}/></button>
          </div>
          {(() => {
            const d = drawer;
            const cls = CLASSIFICATION[d.classification] || CLASSIFICATION.confidential;
            const thr = THREAT[d.threat_level] || THREAT.medium;
            const rel = RELIABILITY[d.source_reliability] || RELIABILITY.unverified;
            const sc = STATUS_C[d.status] || "#94A3B8";
            return (
          <div style={{ padding:"18px 22px", flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"white", marginBottom:12 }}>{d.title}</div>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              <span style={{ background:cls.bg, color:cls.c, padding:"4px 11px", borderRadius:999, fontSize:10, fontWeight:800, letterSpacing:.5 }}>{cls.label}</span>
              <span style={{ background:thr.c+"18", color:thr.c, padding:"4px 11px", borderRadius:999, fontSize:11, fontWeight:700 }}>{thr.label} THREAT</span>
              <span style={{ background:sc+"18", color:sc, padding:"4px 11px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{d.status.replace(/_/g," ")}</span>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16, padding:14, background:"rgba(255,255,255,.04)", borderRadius:10 }}>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Subject</div><div style={{ fontSize:13, color:"white" }}>{d.subject_name || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>NIDA</div><div style={{ fontSize:12, color:"white", fontFamily:"monospace" }}>{d.subject_nida || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Source</div><div style={{ fontSize:13, color:"white" }}>{d.source || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Reliability</div><div style={{ fontSize:12, color:rel.c, fontWeight:600 }}>{rel.label}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Region</div><div style={{ fontSize:13, color:"white" }}>{d.region || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Location</div><div style={{ fontSize:12, color:"white" }}>{d.location_text || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Filed By</div><div style={{ fontSize:12, color:"white" }}>{d.profiles?.full_name || "—"} {d.profiles?.badge ? `· ${d.profiles.badge}` : ""}</div></div>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Filed At</div><div style={{ fontSize:12, color:"white" }}>{d.created_at ? new Date(d.created_at).toLocaleString("en-GB") : "—"}</div></div>
              {d.expires_at && <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Expires</div><div style={{ fontSize:12, color:"#FCA5A5" }}>{new Date(d.expires_at).toLocaleDateString("en-GB")}</div></div>}
              {d.cases && <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase" }}>Linked Case</div><div style={{ fontSize:12, color:"#93C5FD" }}>{d.cases.ref_number} — {d.cases.title}</div></div>}
            </div>

            {d.content && (
              <>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase", marginBottom:5 }}>Content · Maudhui</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.85)", lineHeight:1.6, marginBottom:14, padding:14, background:"rgba(255,255,255,.04)", borderRadius:8, borderLeft:"3px solid #DC2626" }}>{d.content}</div>
              </>
            )}

            {d.tags && d.tags.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}><Tag size={10}/> Tags</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {d.tags.map((t,i)=><span key={i} style={{ background:"rgba(124,58,237,.2)", color:"#C4B5FD", padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>#{t}</span>)}
                </div>
              </div>
            )}

            {d.notes && (
              <>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Notes</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", fontStyle:"italic", lineHeight:1.5 }}>{d.notes}</div>
              </>
            )}
          </div>

          );
          })()}
          {/* Action footer */}
          <div style={{ padding:"18px 22px", borderTop:"1px solid rgba(255,255,255,.1)", background:"rgba(0,0,0,.2)", display:"flex", gap:8, flexWrap:"wrap" }}>
            {drawer.status === "active" && (
              <button onClick={()=>updateStatus(drawer,"verified")} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:"#059669", color:"white", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <CheckCircle size={13}/> Verify
              </button>
            )}
            {drawer.status === "verified" && (
              <button onClick={()=>updateStatus(drawer,"disseminated")} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:"#7C3AED", color:"white", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Eye size={13}/> Disseminate
              </button>
            )}
            <button onClick={()=>updateStatus(drawer,"archived")} style={{ flex:1, padding:"10px", borderRadius:9, border:"1px solid rgba(255,255,255,.15)", background:"transparent", color:"rgba(255,255,255,.7)", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <FileText size={13}/> Archive
            </button>
            <button onClick={()=>updateStatus(drawer,"recalled")} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:"#DC2626", color:"white", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <AlertTriangle size={13}/> Recall
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>File Intelligence · Faili Ujasusi</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Classified information — handle with care</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Intel Filed!</h3><p style={{ fontSize:12, color:"#94A3B8" }}>File logged with classification + audit trail</p></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Title · Kichwa *</label>
                    <input value={form.title} onChange={upd("title")} placeholder="Brief title for the intelligence file" required style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Classification · Daraja *</label>
                    <select value={form.classification} onChange={upd("classification")} required style={S.sel}>
                      <option value="restricted">RESTRICTED</option>
                      <option value="confidential">CONFIDENTIAL</option>
                      <option value="secret">SECRET</option>
                      <option value="top_secret">TOP SECRET</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Threat Level · Hatari *</label>
                    <select value={form.threat_level} onChange={upd("threat_level")} required style={S.sel}>
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                      <option value="critical">CRITICAL</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Subject Name · Jina</label>
                    <input value={form.subject_name} onChange={upd("subject_name")} placeholder="Person of interest" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Subject NIDA</label>
                    <input value={form.subject_nida} onChange={upd("subject_nida")} placeholder="If known" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Source · Chanzo</label>
                    <input value={form.source} onChange={upd("source")} placeholder="e.g. Informant CI-001, Surveillance" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Source Reliability</label>
                    <select value={form.source_reliability} onChange={upd("source_reliability")} style={S.sel}>
                      <option value="unverified">Unverified</option>
                      <option value="a">A — Confirmed</option>
                      <option value="b">B — Probably True</option>
                      <option value="c">C — Possibly True</option>
                      <option value="d">D — Doubtful</option>
                      <option value="f">F — Cannot Judge</option>
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Region · Mkoa</label>
                    <input value={form.region} onChange={upd("region")} placeholder="e.g. Dar es Salaam" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Location · Mahali</label>
                    <input value={form.location_text} onChange={upd("location_text")} placeholder="Specific location" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Link to Case</label>
                    <select value={form.case_id} onChange={upd("case_id")} style={S.sel}>
                      <option value="">— None —</option>
                      {cases.map(c=><option key={c.id} value={c.id}>{c.ref_number} — {c.title?.slice(0,40)}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Expires · Mwisho</label>
                    <input type="date" value={form.expires_at} onChange={upd("expires_at")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Tags · Lebo (comma-separated)</label>
                    <input value={form.tags} onChange={upd("tags")} placeholder="e.g. narcotics, syndicate, region-east" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Content · Maudhui *</label>
                    <textarea value={form.content} onChange={upd("content")} rows={5} placeholder="Detailed intelligence report..." required style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Notes · Maelezo</label>
                    <textarea value={form.notes} onChange={upd("notes")} rows={2} placeholder="Handling notes, caveats..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>
                </div>
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:8 }}>
                  <Lock size={14} style={{flexShrink:0}}/>
                  Filing this intelligence creates an audit log entry with your name, badge, GPS, and device ID. Unauthorized disclosure is a criminal offense.
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Filing...":"File Intelligence · Faili Ujasusi"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </CommandLayout>
  );
}
