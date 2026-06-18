import { useState, useEffect } from "react";
import CIDLayout from "../../layouts/CIDLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const TYPES=["Physical Object","Photograph","Video Recording","Document","Weapon","Drug Sample","Digital Device","Clothing","Fingerprint","DNA Sample","Other"];
const STATUS_C={in_custody:"#0D3477",transferred:"#D97706",court:"#7C3AED",destroyed:"#94A3B8"};

const S={
  inp:{width:"100%",height:42,border:"1.5px solid #E2E8F0",borderRadius:9,padding:"0 12px",fontSize:13,outline:"none",boxSizing:"border-box"},
  sel:{width:"100%",height:42,border:"1.5px solid #E2E8F0",borderRadius:9,padding:"0 12px",fontSize:13,outline:"none",background:"white",boxSizing:"border-box"},
  lbl:{display:"block",fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:.4,marginBottom:5},
};

export default function EvidencePage() {
  const { profile, stationId } = useCurrentUser();
  const [evidence, setEvidence] = useState([]);
  const [cases,    setCases]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(null);
  const [err,      setErr]      = useState("");
  const [search,   setSearch]   = useState("");
  const [form, setForm] = useState({ type:"Physical Object", description:"", case_id:"", location_found:"", storage_location:"" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const [ev, cs] = await Promise.all([
      supabase.from("evidence").select("*, profiles!evidence_collected_by_fkey(full_name), cases(case_number,title)").order("created_at",{ascending:false}).limit(100),
      supabase.from("cases").select("id,case_number,title").eq("status","open").order("created_at",{ascending:false}),
    ]);
    setEvidence(ev.data||[]); setCases(cs.data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("evidence").insert({
        ...form, case_id:form.case_id||null,
        station_id:stationId||null, collected_by:profile?.id||null,
        collected_at:new Date().toISOString(), status:"in_custody", chain_count:1,
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_evidence", entityType:"evidence", entityId:data.id, entityRef:data.ref_number||data.evidence_no, description:`Evidence collected: ${data.type} — ${data.description?.slice(0,80)||"no description"}` });
      setDone(data); await load();
      setTimeout(()=>{ setModal(false); setDone(null); setForm({type:"Physical Object",description:"",case_id:"",location_found:"",storage_location:""}); },2500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  const filtered = evidence.filter(e=> !search || e.ref_number?.includes(search) || e.description?.toLowerCase().includes(search.toLowerCase()) || e.type?.toLowerCase().includes(search.toLowerCase()));

  return (
    <CIDLayout pageTitle="Evidence" pageTitle2="Ushahidi wa Kesi">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Evidence Management <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Ushahidi</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{evidence.length} items · Chain of custody active on all</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#059669", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Log Evidence · Rekodi Ushahidi
        </button>
      </div>

      <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"11px 16px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
        <Lock size={16} color="#D97706"/>
        <span style={{ fontSize:13, color:"#92400E", fontWeight:600 }}>Chain of Custody Active · All transfers logged with officer ID, timestamp & GPS coordinates</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          {label:"In Custody",   v:evidence.filter(e=>e.status==="in_custody").length,   c:"#0D3477"},
          {label:"At Court",     v:evidence.filter(e=>e.status==="court").length,         c:"#7C3AED"},
          {label:"Transferred",  v:evidence.filter(e=>e.status==="transferred").length,   c:"#D97706"},
          {label:"Total Items",  v:evidence.length,                                       c:"#059669"},
        ].map(k=>(
          <div key={k.label} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:360 }}>
        <Search size={14} color="#94A3B8"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ref, type or description..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Lock size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{evidence.length===0?"No evidence logged yet":"No results match search"}</div>
            <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#059669", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Log First Evidence</button>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref #","Type","Description","Case","Status","Chain #","Collected By","Date"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(ev=>{
                const sc=STATUS_C[ev.status]||"#94A3B8";
                return (
                  <tr key={ev.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:"#059669", fontSize:12, fontFamily:"monospace" }}>{ev.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{ev.type}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.description}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#0D3477", fontFamily:"monospace", fontWeight:700 }}>{ev.cases?.case_number||"—"}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{ev.status?.replace("_"," ")}</span></td>
                    <td style={{ padding:"11px 14px", textAlign:"center" }}><span style={{ background:"#F5F3FF", color:"#7C3AED", padding:"2px 9px", borderRadius:999, fontSize:12, fontWeight:700 }}>#{ev.chain_count}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{ev.profiles?.full_name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(ev.created_at).toLocaleDateString("en-GB")}</td>
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
              <div><div style={{ fontSize:17, fontWeight:800, color:"#059669" }}>Log Evidence · Rekodi Ushahidi</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Chain of custody initiated automatically</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Evidence Logged!</h3><p style={{ color:"#059669", fontWeight:700, fontSize:16 }}>{done.ref_number}</p><p style={{ fontSize:13, color:"#64748B" }}>Chain of custody: #1 initiated</p></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Evidence Type *</label><select value={form.type} onChange={upd("type")} required style={S.sel}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Linked Case</label><select value={form.case_id} onChange={upd("case_id")} style={S.sel}><option value="">No case linked</option>{cases.map(c=><option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>)}</select></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Description · Maelezo *</label><textarea value={form.description} onChange={upd("description")} rows={3} required placeholder="Describe the evidence in detail..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }} onFocus={e=>e.target.style.borderColor="#059669"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Found At · Mahali Palipopatikana</label><input value={form.location_found} onChange={upd("location_found")} placeholder="Location where found" style={S.inp} onFocus={e=>e.target.style.borderColor="#059669"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:16 }}><label style={S.lbl}>Storage Location</label><input value={form.storage_location} onChange={upd("storage_location")} placeholder="e.g. Evidence Room A, Shelf 3" style={S.inp}/></div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#059669", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Logging Evidence...":"Log Evidence · Hifadhi Ushahidi"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </CIDLayout>
  );
}
