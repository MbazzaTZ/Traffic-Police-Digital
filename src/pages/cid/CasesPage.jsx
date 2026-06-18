import { useState, useEffect } from "react";
import CIDLayout from "../../layouts/CIDLayout";
import { Plus, FolderOpen, X, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const TYPES=["Murder","Manslaughter","Armed Robbery","Kidnapping","Rape","Drug Trafficking","Drug Possession","Fraud","Cybercrime","Money Laundering","Terrorism","Human Trafficking","Burglary","Arson","Forgery","Corruption","Other"];
const PRIORITY_C={low:"#64748B",medium:"#D97706",high:"#DC2626",critical:"#7C3AED"};
const STATUS_C={open:"#DC2626",active:"#D97706",suspended:"#94A3B8",closed:"#059669",referred:"#0891B2"};

const S={
  inp:{width:"100%",height:42,border:"1.5px solid #E2E8F0",borderRadius:9,padding:"0 12px",fontSize:13,outline:"none",boxSizing:"border-box"},
  sel:{width:"100%",height:42,border:"1.5px solid #E2E8F0",borderRadius:9,padding:"0 12px",fontSize:13,outline:"none",background:"white",boxSizing:"border-box"},
  lbl:{display:"block",fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:.4,marginBottom:5},
};

export default function CasesPage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(null);
  const [err,     setErr]     = useState("");
  const [search,  setSearch]  = useState("");
  const [fStatus, setFStatus] = useState("");
  const [form, setForm] = useState({ title:"", type:"", description:"", priority:"medium", status:"open" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    let q = supabase.from("cases").select("*, profiles!cases_lead_officer_fkey(full_name,badge)").order("created_at",{ascending:false}).limit(100);
    if (stationId) q = q.eq("station_id", stationId);
    const { data } = await q;
    setCases(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("cases").insert({
        ...form, station_id:stationId||null, region_id:regionId||null,
        district_id:districtId||null, lead_officer:profile?.id||null, opened_at:new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_case", entityType:"case", entityId:data.id, entityRef:data.ref_number||data.case_number, description:`Opened case: ${data.title} (${data.type})` });
      setDone(data); await load();
      setTimeout(()=>{ setModal(false); setDone(null); setForm({title:"",type:"",description:"",priority:"medium",status:"open"}); },2500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  const filtered = cases.filter(c=>{
    const ms = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.includes(search) || c.type?.toLowerCase().includes(search.toLowerCase());
    const mst = !fStatus || c.status===fStatus;
    return ms && mst;
  });

  return (
    <CIDLayout pageTitle="Cases" pageTitle2="Kesi za CID">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>CID Cases <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Kesi</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{cases.length} cases · {cases.filter(c=>c.status==="open").length} open</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Open Case · Fungua Kesi
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:16 }}>
        {["open","active","suspended","closed","referred"].map(s=>(
          <div key={s} style={{ background:"white", borderRadius:12, padding:"12px", border:"1px solid #E2E8F0", borderTop:`4px solid ${STATUS_C[s]}`, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:900, color:STATUS_C[s] }}>{cases.filter(c=>c.status===s).length}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#1E293B", textTransform:"capitalize" }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search case number, title or type..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...S.sel, width:140 }}>
          <option value="">All Status</option>
          {["open","active","suspended","closed","referred"].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <FolderOpen size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{cases.length===0?"No cases opened yet":"No cases match filters"}</div>
            <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Open First Case</button>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Case #","Title","Type","Priority","Status","Lead Officer","Opened"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(c=>{
                const sc=STATUS_C[c.status]||"#94A3B8";
                const pc=PRIORITY_C[c.priority]||"#94A3B8";
                return (
                  <tr key={c.id} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:"#0D3477", fontSize:12, fontFamily:"monospace" }}>{c.case_number}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:"#1E293B", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{c.type}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${pc}18`, color:pc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{c.priority}</span></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{c.status}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{c.profiles?.full_name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(c.created_at).toLocaleDateString("en-GB")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Open New Case · Fungua Kesi Mpya</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Case number auto-generated (CID-YY-NNNNN)</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Case Opened!</h3><p style={{ color:"#0D3477", fontWeight:700, fontSize:16 }}>{done.case_number}</p></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Case Title *</label><input value={form.title} onChange={upd("title")} placeholder="Brief case title" required style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Case Type *</label><select value={form.type} onChange={upd("type")} required style={S.sel}><option value="">Select type...</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Priority · Kipaumbele</label><select value={form.priority} onChange={upd("priority")} style={S.sel}>{["low","medium","high","critical"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}><label style={S.lbl}>Description · Maelezo *</label><textarea value={form.description} onChange={upd("description")} rows={5} required placeholder="Describe the case in detail..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Opening Case...":"Open Case · Fungua Kesi"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </CIDLayout>
  );
}
