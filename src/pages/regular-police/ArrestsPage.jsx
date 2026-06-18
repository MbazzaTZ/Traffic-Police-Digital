import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, Shield, X, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import ResponsiveTable from "../../components/mobile/ResponsiveTable";

const CHARGES = ["Armed Robbery","Theft","Assault","Murder","Drug Trafficking","Drug Possession","Fraud","Forgery","Rape","Kidnapping","Burglary","Vandalism","Drunk Driving","Traffic Offense","Immigration Offense","Other"];
const STATUS_C = { detained:"#DC2626", charged:"#D97706", released:"#059669", transferred:"#0891B2" };

const S = {
  inp: { width:"100%", height:44, border:"1.5px solid var(--border-strong,#CBD5E1)", borderRadius:10, padding:"0 14px", fontSize:14, outline:"none", boxSizing:"border-box", color:"var(--ink-900,#0F172A)", background:"rgba(255,255,255,0.85)", fontFamily:"inherit", transition:"border-color 180ms, box-shadow 180ms" },
  sel: { width:"100%", height:44, border:"1.5px solid var(--border-strong,#CBD5E1)", borderRadius:10, padding:"0 14px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box", color:"var(--ink-900,#0F172A)", fontFamily:"inherit" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"var(--ink-700,#334155)", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 },
};

export default function ArrestsPage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const [arrests,  setArrests]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState("");
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(null);
  const [err,      setErr]      = useState("");
  const [search,   setSearch]   = useState("");
  const [form, setForm] = useState({ suspect_name:"", suspect_nida:"", suspect_dob:"", suspect_gender:"Male", charge:"", charge_details:"", location_text:"" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    let q = supabase.from("arrests").select("*, profiles!arrests_arrested_by_fkey(full_name,badge)").order("created_at",{ascending:false}).limit(100);
    if (stationId) q = q.eq("station_id", stationId);
    const { data, error } = await q;
    if (error) { console.error(error); setLoadErr('Could not load data: ' + error.message); } else setLoadErr('');
    setArrests(data||[]);
    setLoading(false);
  }

  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("arrests").insert({
        ...form,
        suspect_dob:  form.suspect_dob || null,
        station_id:   stationId  || null,
        region_id:    regionId   || null,
        district_id:  districtId || null,
        arrested_by:  profile?.id || null,
        status:       "detained",
        arrested_at:  new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_arrest", entityType:"arrest", entityId:data.id, entityRef:data.ref_number, description:`Arrest recorded: ${data.suspect_name} - ${data.charge}` });
      setDone(data);
      await load();
      setTimeout(()=>{ setModal(false); setDone(null); setForm({suspect_name:"",suspect_nida:"",suspect_dob:"",suspect_gender:"Male",charge:"",charge_details:"",location_text:""}); }, 2500);
    } catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  const filtered = arrests.filter(a => !search || a.suspect_name?.toLowerCase().includes(search.toLowerCase()) || a.ref_number?.includes(search) || a.charge?.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout pageTitle="Arrests" pageTitle2="Kukamatwa">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Arrests <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Kukamatwa</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{arrests.length} total · {arrests.filter(a=>a.status==="detained").length} detained</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Record Arrest
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Detained",    v:arrests.filter(a=>a.status==="detained").length,    c:"#DC2626" },
          { label:"Charged",     v:arrests.filter(a=>a.status==="charged").length,     c:"#D97706" },
          { label:"Released",    v:arrests.filter(a=>a.status==="released").length,    c:"#059669" },
          { label:"Transferred", v:arrests.filter(a=>a.status==="transferred").length, c:"#0891B2" },
        ].map(k=>(
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:340 }}>
        <Search size={14} color="#94A3B8"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, ref or charge..."
          style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      {loadErr && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", gap:10 }}>
          <span style={{ fontSize:13, color:"#B91C1C" }}>{loadErr}</span>
          <button onClick={()=>setLoadErr("")} style={{ background:"transparent", border:"none", color:"#B91C1C", cursor:"pointer", fontSize:13, fontWeight:700 }}>×</button>
        </div>
      )}
      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        ) : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Shield size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{arrests.length===0?"No arrests recorded yet":"No arrests match search"}</div>
            <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Record First Arrest</button>
          </div>
        ) : (
          <ResponsiveTable
            rows={filtered}
            emptyText="No arrests recorded yet"
            columns={[
              { key:"suspect_name", label:"Suspect", primary:true,
                render:(v,a) => (
                  <div>
                    <div style={{ fontWeight:700, color:"#1E293B" }}>{v}</div>
                    <div style={{ fontSize:11, color:"#94A3B8" }}>{a.suspect_nida || "NIDA not provided"}</div>
                  </div>
                ) },
              { key:"ref_number", label:"Ref",
                render:v => <span style={{ fontWeight:700, color:"#DC2626", fontSize:12, fontFamily:"monospace" }}>{v}</span> },
              { key:"charge",       label:"Charge" },
              { key:"profiles",     label:"Arrested By",
                render:v => v?.full_name || "—" },
              { key:"location_text",label:"Location" },
              { key:"status",       label:"Status",
                render:v => {
                  const sc = STATUS_C[v] || "#94A3B8";
                  return <span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{v}</span>;
                } },
              { key:"created_at",   label:"Date",
                render:v => <span style={{ fontSize:11, color:"#94A3B8" }}>{new Date(v).toLocaleDateString("en-GB")}</span> },
            ]}
          />
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>Record Arrest · Rekodi Kukamatwa</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>GPS, timestamp and officer ID logged automatically</div>
              </div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/>
                <h3 style={{ color:"#16A34A", marginBottom:4 }}>Arrest Recorded!</h3>
                <p style={{ color:"#DC2626", fontWeight:700, fontSize:16 }}>{done.ref_number}</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Suspect Full Name · Jina la Mshukiwa *</label>
                    <input value={form.suspect_name} onChange={upd("suspect_name")} placeholder="Full name as per NIDA" required style={S.inp} onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>NIDA Number</label>
                    <input value={form.suspect_nida} onChange={upd("suspect_nida")} placeholder="19xxxxxx-xxxxx-xxxxx-x" style={S.inp} onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Date of Birth</label>
                    <input type="date" value={form.suspect_dob} onChange={upd("suspect_dob")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Gender · Jinsia</label>
                    <select value={form.suspect_gender} onChange={upd("suspect_gender")} style={S.sel}>
                      {["Male","Female","Other"].map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Charge · Mashtaka *</label>
                    <select value={form.charge} onChange={upd("charge")} required style={S.sel} onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                      <option value="">Select charge...</option>
                      {CHARGES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Location of Arrest · Mahali *</label>
                    <input value={form.location_text} onChange={upd("location_text")} placeholder="e.g. Town Centre" required style={S.inp} onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Charge Details · Maelezo</label>
                    <textarea value={form.charge_details} onChange={upd("charge_details")} rows={3} placeholder="Additional details about the charge..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Saving to Supabase...":"Confirm Arrest · Thibitisha Kukamatwa"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
