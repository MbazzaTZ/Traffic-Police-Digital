import { useState, useEffect } from "react";
import TrafficLayout from "../../layouts/TrafficLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const TYPES = ["Minor","Serious","Fatal","Hit and Run","Multiple Vehicle","Single Vehicle","Pedestrian","Cyclist"];
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function AccidentsPage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const [accidents, setAccidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(null);
  const [err,       setErr]       = useState("");
  const [search,    setSearch]    = useState("");
  const [form, setForm] = useState({ type:"Minor", location_text:"", vehicles_count:1, casualties:0, fatalities:0, description:"" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("accident_reports").select("*, profiles!accident_reports_reported_by_fkey(full_name,badge)").order("created_at",{ascending:false}).limit(100);
    setAccidents(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("accident_reports").insert({
        ...form, vehicles_count:parseInt(form.vehicles_count)||0,
        casualties:parseInt(form.casualties)||0, fatalities:parseInt(form.fatalities)||0,
        station_id:stationId||null, region_id:regionId||null, district_id:districtId||null,
        reported_by:profile?.id||null, status:"reported", occurred_at:new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      setDone(data); await load();
      setTimeout(()=>{ setModal(false); setDone(null); setForm({type:"Minor",location_text:"",vehicles_count:1,casualties:0,fatalities:0,description:""}); },2500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  const filtered = accidents.filter(a=> !search || a.location_text?.toLowerCase().includes(search.toLowerCase()) || a.type?.toLowerCase().includes(search.toLowerCase()) || a.ref_number?.includes(search));
  const TYPE_C = { Minor:"#D97706", Serious:"#DC2626", Fatal:"#7C3AED" };

  return (
    <TrafficLayout pageTitle="Accidents" pageTitle2="Ripoti za Ajali">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Traffic Accidents <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Ajali</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{accidents.length} reported · {accidents.filter(a=>a.fatalities>0).length} fatal</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Log Accident · Rekodi Ajali
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          {label:"Total",     v:accidents.length,                                   c:"#0D3477"},
          {label:"Fatal",     v:accidents.filter(a=>a.type==="Fatal"||a.fatalities>0).length, c:"#7C3AED"},
          {label:"Serious",   v:accidents.filter(a=>a.type==="Serious").length,    c:"#DC2626"},
          {label:"Casualties",v:accidents.reduce((t,a)=>t+(a.casualties||0),0),    c:"#D97706"},
        ].map(k=>(
          <div key={k.label} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:340 }}>
        <Search size={14} color="#94A3B8"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search location, type, ref..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🚗</div>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{accidents.length===0?"No accidents recorded yet":"No results match search"}</div>
            <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Log First Accident</button>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref #","Type","Location","Vehicles","Casualties","Fatalities","Reported By","Date"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(a=>{
                const tc = TYPE_C[a.type]||"#D97706";
                return (
                  <tr key={a.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:"#DC2626", fontSize:12, fontFamily:"monospace" }}>{a.ref_number||"—"}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${tc}18`, color:tc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{a.type}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.location_text}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:"#1E293B", textAlign:"center" }}>{a.vehicles_count}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:a.casualties>0?"#D97706":"#94A3B8", textAlign:"center" }}>{a.casualties}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:700, color:a.fatalities>0?"#DC2626":"#94A3B8", textAlign:"center" }}>{a.fatalities}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{a.profiles?.full_name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{new Date(a.created_at).toLocaleDateString("en-GB")}</td>
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
              <div><div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>Log Accident · Rekodi Ajali</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Timestamp and officer ID logged automatically</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Accident Logged!</h3><p style={{ color:"#DC2626", fontWeight:700 }}>{done.ref_number}</p></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Accident Type *</label><select value={form.type} onChange={upd("type")} required style={S.sel}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Location · Mahali *</label><input value={form.location_text} onChange={upd("location_text")} placeholder="e.g. Morogoro Road, Dar" required style={S.inp} onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Vehicles Involved</label><input type="number" min="0" value={form.vehicles_count} onChange={upd("vehicles_count")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Casualties (Injured)</label><input type="number" min="0" value={form.casualties} onChange={upd("casualties")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Fatalities (Deaths)</label><input type="number" min="0" value={form.fatalities} onChange={upd("fatalities")} style={{ ...S.inp, borderColor:parseInt(form.fatalities)>0?"#DC2626":"#E2E8F0" }}/></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}><label style={S.lbl}>Description · Maelezo *</label><textarea value={form.description} onChange={upd("description")} rows={4} required placeholder="Describe what happened..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }} onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                </div>
                {parseInt(form.fatalities)>0 && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#B91C1C", display:"flex", gap:8, alignItems:"center" }}><AlertTriangle size={15}/>⚠ Fatal accident — this report will be escalated to OCS automatically</div>}
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Saving...":"Log Accident · Hifadhi"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </TrafficLayout>
  );
}
