import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { FileText, Plus, X, CheckCircle, AlertTriangle, Download, Stethoscope } from "lucide-react";
import PhotoUpload from "../../components/PhotoUpload";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import { exportPF3 } from "../../lib/pdfExport";

const STATUS_C = { issued:"#0891B2", examined:"#D97706", returned:"#059669", closed:"#94A3B8" };
const INCIDENT_TYPES = ["Assault","Road Traffic Accident","Gender-Based Violence","Sexual Offence","Grievous Harm","Domestic Violence","Other"];
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function PF3FormsPage() {
  const { profile, fullName, stationId, regionId, stationName } = useCurrentUser();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [fStatus, setFStatus] = useState("");

  const [form, setForm] = useState({
    patient_name:"", patient_nida:"", patient_age:"", patient_gender:"Male",
    patient_phone:"", patient_type:"victim", incident_type:"Assault",
    incident_date:"", injuries_alleged:"", hospital_name:"", notes:"",
    photo_urls:[],
  });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("pf3_forms")
      .select("*, profiles!pf3_forms_issued_by_fkey(full_name,badge)")
      .order("created_at",{ascending:false}).limit(200);
    setForms(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("pf3_forms").insert({
        ...form, patient_age:form.patient_age?parseInt(form.patient_age):null,
        incident_date:form.incident_date||null,
        issued_by:profile?.id||null, station_id:stationId||null, region_id:regionId||null, status:"issued",
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"issue_pf3", entityType:"pf3", entityId:data.id, entityRef:data.ref_number, description:`PF3 issued: ${data.patient_name} - ${data.incident_type}` });
      setDone(true); await load();
      // auto-download the form
      exportPF3({ ...data }, fullName, stationName);
      setTimeout(()=>{ setModal(false); setDone(false); setForm({ patient_name:"", patient_nida:"", patient_age:"", patient_gender:"Male", patient_phone:"", patient_type:"victim", incident_type:"Assault", incident_date:"", injuries_alleged:"", hospital_name:"", notes:"", photo_urls:[] }); },2500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  const filtered = forms.filter(f=>!fStatus||f.status===fStatus);

  return (
    <DashboardLayout pageTitle="PF3 Forms" pageTitle2="Fomu ya PF3">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>PF3 Medical Forms <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Fomu ya Matibabu</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{forms.length} issued · Police medical examination request forms</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Issue PF3 · Toa Fomu
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {Object.entries(STATUS_C).map(([s,c])=>(
          <div key={s} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:c }}>{forms.filter(f=>f.status===s).length}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B", textTransform:"capitalize" }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...S.sel, width:160 }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_C).map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Stethoscope size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No PF3 forms issued</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref #","Patient","Type","Incident","Hospital","Status","Issued","PDF"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(f=>{
                const sc=STATUS_C[f.status]||"#94A3B8";
                return (
                  <tr key={f.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#0D3477", fontSize:12 }}>{f.ref_number}</td>
                    <td style={{ padding:"11px 14px" }}><div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{f.patient_name}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{f.patient_age?`${f.patient_age}y`:""} {f.patient_gender}</div></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:"#EFF6FF", color:"#0D3477", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{f.patient_type}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{f.incident_type}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{f.hospital_name||"—"}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{f.status}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(f.created_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <button onClick={()=>exportPF3(f, f.profiles?.full_name||"Officer", "")} title="Download PF3"
                        style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}>
                        <Download size={14}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Issue PF3 Form · Toa Fomu ya PF3</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Medical examination request · downloads as PDF</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>PF3 Issued!</h3><p style={{ fontSize:13, color:"#64748B" }}>Form downloaded — give to patient for hospital</p></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Patient Name · Jina la Mgonjwa *</label><input value={form.patient_name} onChange={upd("patient_name")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA</label><input value={form.patient_nida} onChange={upd("patient_nida")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Age · Umri</label><input type="number" value={form.patient_age} onChange={upd("patient_age")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Gender · Jinsia</label><select value={form.patient_gender} onChange={upd("patient_gender")} style={S.sel}>{["Male","Female"].map(g=><option key={g}>{g}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Phone · Simu</label><input value={form.patient_phone} onChange={upd("patient_phone")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Patient Type</label><select value={form.patient_type} onChange={upd("patient_type")} style={S.sel}>{["victim","suspect","accused"].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Incident Type · Aina ya Tukio</label><select value={form.incident_type} onChange={upd("incident_type")} style={S.sel}>{INCIDENT_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Incident Date · Tarehe</label><input type="date" value={form.incident_date} onChange={upd("incident_date")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Hospital · Hospitali</label><input value={form.hospital_name} onChange={upd("hospital_name")} placeholder="Referred to..." style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Alleged Injuries · Majeraha Yanayodaiwa</label><textarea value={form.injuries_alleged} onChange={upd("injuries_alleged")} rows={3} placeholder="Describe alleged injuries to be examined..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <PhotoUpload
                      folder="pf3"
                      value={form.photo_urls}
                      onChange={(urls)=>setForm(f=>({...f, photo_urls:urls}))}
                      maxFiles={6}
                      label="Photos of Injuries · Picha za Majeraha"
                      hint="Tap to add photos (use camera)"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <FileText size={16}/> {saving?"Issuing...":"Issue & Download PF3"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
