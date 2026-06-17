import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Lock, Plus, X, CheckCircle, AlertTriangle, Clock, UserCheck, MapPin, FileSearch } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import ResponsiveTable from "../../components/mobile/ResponsiveTable";
import PhotoUpload from "../../components/PhotoUpload";

const STATUS_C = { in_custody:"#DC2626", released:"#059669", charged:"#D97706", transferred:"#0891B2", bailed:"#7C3AED" };

// Structured grounds for detention - matches Tanzania Police Force Act
// and CPA categories. "other" reveals a free-text field.
const DETENTION_REASONS = [
  { code:"theft",            label:"Theft · Wizi" },
  { code:"assault",          label:"Assault · Shambulizi" },
  { code:"robbery",          label:"Robbery · Ujambazi" },
  { code:"burglary",         label:"Burglary · Uvunjaji" },
  { code:"drugs",            label:"Drug offense · Kosa la madawa" },
  { code:"fraud",            label:"Fraud · Udanganyifu" },
  { code:"murder",           label:"Murder · Mauaji" },
  { code:"rape",             label:"Rape / Sexual offense · Ubakaji" },
  { code:"kidnapping",       label:"Kidnapping · Utekaji" },
  { code:"domestic_violence",label:"Domestic violence · Vurugu za nyumbani" },
  { code:"public_disorder",  label:"Public disorder · Vurugu hadharani" },
  { code:"drunk_driving",    label:"Drunk driving · Uendeshaji ulevi" },
  { code:"traffic_offense",  label:"Traffic offense · Kosa la barabarani" },
  { code:"immigration",      label:"Immigration offense · Uhamiaji" },
  { code:"firearm",          label:"Firearm offense · Kosa la silaha" },
  { code:"warrant",          label:"Outstanding warrant · Hati ya kukamata" },
  { code:"suspect",          label:"Reasonable suspicion · Mashaka" },
  { code:"other",             label:"Other · Nyingine" },
];
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

// 24h custody countdown
function CustodyClock({ mustChargeBy }) {
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()),60000); return ()=>clearInterval(t); },[]);
  if (!mustChargeBy) return <span style={{ color:"#94A3B8", fontSize:12 }}>—</span>;
  const remaining = new Date(mustChargeBy).getTime() - now;
  const hrs = Math.floor(remaining/3600000);
  const mins = Math.floor((remaining%3600000)/60000);
  const expired = remaining <= 0;
  const urgent = remaining < 4*3600000 && !expired;
  const color = expired ? "#DC2626" : urgent ? "#D97706" : "#059669";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, color, fontWeight:700, fontSize:12 }}>
      <Clock size={12}/>
      {expired ? "⚠ OVERDUE" : `${hrs}h ${mins}m left`}
    </span>
  );
}

export default function DetentionsPage() {
  const { profile, stationId, regionId } = useCurrentUser();
  const [detentions, setDetentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [fStatus, setFStatus] = useState("");

  const [form, setForm] = useState({
    detainee_name:"", detainee_nida:"", detainee_phone:"", detainee_address:"",
    reason_code:"", reason:"", cell_number:"",
    location_text:"", arresting_officer:"",
    arrest_id:"", notes:"", photo_urls:[],
  });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  // Optional: lookup recent arrests by suspect name to link
  const [arrestOptions, setArrestOptions] = useState([]);
  useEffect(() => {
    if (!modal || !form.detainee_name || form.detainee_name.length < 3) {
      setArrestOptions([]); return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("arrests")
        .select("id, ref_number, suspect_name, charge, created_at")
        .ilike("suspect_name", `%${form.detainee_name}%`)
        .order("created_at", { ascending:false })
        .limit(5);
      setArrestOptions(data || []);
    }, 350);
    return () => clearTimeout(t);
  }, [form.detainee_name, modal]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("detentions")
      .select("*, profiles!detentions_officer_id_fkey(full_name,badge)")
      .order("created_at",{ascending:false}).limit(200);
    setDetentions(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      // If a structured reason was picked, use its label for the human-readable
      // 'reason' column AND keep the code in reason_code. If 'other', use the
      // typed reason value as-is.
      const reasonLabel = form.reason_code && form.reason_code !== "other"
        ? DETENTION_REASONS.find(r => r.code === form.reason_code)?.label || form.reason
        : form.reason;

      const payload = {
        detainee_name:     form.detainee_name,
        detainee_nida:     form.detainee_nida || null,
        detainee_phone:    form.detainee_phone || null,
        detainee_address:  form.detainee_address || null,
        reason:            reasonLabel,
        reason_code:       form.reason_code || null,
        cell_number:       form.cell_number || null,
        location_text:     form.location_text || null,
        arresting_officer: form.arresting_officer || null,
        arrest_id:         form.arrest_id || null,
        notes:             form.notes || null,
        photo_urls:        form.photo_urls || [],
        officer_id:        profile?.id || null,
        station_id:        stationId || null,
        region_id:         regionId || null,
        status:            "in_custody",
      };
      const { data, error } = await supabase.from("detentions").insert(payload).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_detention", entityType:"detention", entityId:data.id, entityRef:data.ref_number, description:`Detained: ${data.detainee_name} - ${data.reason}` });
      setDone(true); await load();
      setTimeout(()=>{
        setModal(false); setDone(false);
        setForm({
          detainee_name:"", detainee_nida:"", detainee_phone:"", detainee_address:"",
          reason_code:"", reason:"", cell_number:"",
          location_text:"", arresting_officer:"",
          arrest_id:"", notes:"", photo_urls:[],
        });
      },2200);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function updateStatus(d, status) {
    const updates = { status };
    if (["released","charged","transferred","bailed"].includes(status)) updates.released_at = new Date().toISOString();
    await supabase.from("detentions").update(updates).eq("id", d.id);
    logAction({ profile, action:"update_detention", entityType:"detention", entityId:d.id, entityRef:d.ref_number, description:`${d.detainee_name} -> ${status}` });
    await load();
  }

  const filtered = detentions.filter(d=>!fStatus||d.status===fStatus);
  const inCustody = detentions.filter(d=>d.status==="in_custody");
  const overdue = inCustody.filter(d=>d.must_charge_by && new Date(d.must_charge_by) < new Date());

  return (
    <DashboardLayout pageTitle="Detentions" pageTitle2="Vizuizini">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Custody Register <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Vizuizini</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{inCustody.length} in custody · {overdue.length} overdue 24h limit</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> New Detention · Zuia
        </button>
      </div>

      {overdue.length > 0 && (
        <div style={{ background:"#FEF2F2", border:"2px solid #DC2626", borderRadius:12, padding:"12px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <AlertTriangle size={18} color="#DC2626"/>
          <span style={{ fontSize:13, fontWeight:700, color:"#B91C1C" }}>{overdue.length} detainee(s) past the 24-hour legal limit — must be charged or released immediately</span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          {label:"In Custody", v:inCustody.length, c:"#DC2626"},
          {label:"Overdue 24h", v:overdue.length, c:"#B91C1C"},
          {label:"Released", v:detentions.filter(d=>d.status==="released").length, c:"#059669"},
          {label:"Charged", v:detentions.filter(d=>d.status==="charged").length, c:"#D97706"},
        ].map(k=>(
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...S.sel, width:180 }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_C).map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>

      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Lock size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No detention records</div>
          </div>
        ) : (
          <ResponsiveTable
            rows={filtered}
            emptyText="No detentions on record"
            columns={[
              { key:"detainee_name", label:"Detainee", primary:true,
                render:(v,d) => (
                  <div>
                    <div style={{ fontWeight:700, color:"#1E293B" }}>{v}</div>
                    <div style={{ fontSize:11, color:"#94A3B8" }}>{d.detainee_nida || "—"}</div>
                  </div>
                ) },
              { key:"ref_number", label:"Ref",
                render:v => <span style={{ fontFamily:"monospace", fontWeight:700, color:"#DC2626", fontSize:12 }}>{v}</span> },
              { key:"reason",      label:"Reason" },
              { key:"cell_number", label:"Cell",
                render:v => v || "—" },
              { key:"detained_at", label:"Detained",
                render:v => <span style={{ fontSize:11, color:"#94A3B8" }}>{new Date(v).toLocaleString("en-GB")}</span> },
              { key:"_clock", label:"24h Clock",
                render:(_, d) => d.status==="in_custody"
                  ? <CustodyClock mustChargeBy={d.must_charge_by}/>
                  : <span style={{ color:"#94A3B8", fontSize:12 }}>closed</span> },
              { key:"status", label:"Status",
                render:v => {
                  const sc = STATUS_C[v]||"#94A3B8";
                  return <span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{v?.replace(/_/g," ")}</span>;
                } },
              { key:"_action", label:"Action",
                render:(_, d) => d.status==="in_custody" && (
                  <select onChange={e=>e.target.value&&updateStatus(d,e.target.value)} defaultValue=""
                    onClick={e=>e.stopPropagation()}
                    style={{ height:32, border:"1px solid #E2E8F0", borderRadius:7, fontSize:12, padding:"0 8px", background:"white", cursor:"pointer" }}>
                    <option value="">Update...</option>
                    <option value="charged">Charge</option>
                    <option value="released">Release</option>
                    <option value="bailed">Bail</option>
                    <option value="transferred">Transfer</option>
                  </select>
                ) },
            ]}
          />
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:520 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>New Detention · Zuia Mtu</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>24-hour custody clock starts automatically</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Detention Recorded!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  {/* ─ Detainee identity ─ */}
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Detainee Name · Jina *</label><input value={form.detainee_name} onChange={upd("detainee_name")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA</label><input value={form.detainee_nida} onChange={upd("detainee_nida")} placeholder="20-digit NIDA" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Phone · Simu</label><input value={form.detainee_phone} onChange={upd("detainee_phone")} placeholder="+255..." style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Address · Anuani</label><input value={form.detainee_address} onChange={upd("detainee_address")} placeholder="Last known residence" style={S.inp}/></div>

                  {/* ─ Reason - structured dropdown + freetext when "other" ─ */}
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Reason for Detention · Sababu *</label>
                    <select value={form.reason_code} onChange={upd("reason_code")} required style={S.sel}>
                      <option value="">— Select reason —</option>
                      {DETENTION_REASONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
                    </select>
                  </div>
                  {form.reason_code === "other" && (
                    <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                      <label style={S.lbl}>Specify · Eleza *</label>
                      <input value={form.reason} onChange={upd("reason")} required placeholder="Describe grounds for custody" style={S.inp}/>
                    </div>
                  )}

                  {/* ─ Arrest of origin ─ */}
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Linked Arrest · Kukamatwa (optional)</label>
                    {arrestOptions.length > 0 ? (
                      <select value={form.arrest_id} onChange={upd("arrest_id")} style={S.sel}>
                        <option value="">— Not linked —</option>
                        {arrestOptions.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.ref_number} · {a.suspect_name} · {a.charge} · {new Date(a.created_at).toLocaleDateString("en-GB")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ ...S.inp, display:"flex", alignItems:"center", color:"#94A3B8", fontSize:12 }}>
                        <FileSearch size={13} style={{marginRight:6}}/>
                        Type detainee name above to search recent arrests…
                      </div>
                    )}
                  </div>

                  {/* ─ Circumstances ─ */}
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}><MapPin size={11} style={{display:"inline",marginRight:3}}/>Arrest Location · Eneo</label>
                    <input value={form.location_text} onChange={upd("location_text")} placeholder="e.g. Kariakoo Market, Plot 14" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Arresting Officer · Afisa Aliyekamata</label>
                    <input value={form.arresting_officer} onChange={upd("arresting_officer")} placeholder="Name + badge" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Cell Number · Chumba</label>
                    <input value={form.cell_number} onChange={upd("cell_number")} placeholder="e.g. C-3" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Notes · Maelezo Zaidi</label>
                    <textarea value={form.notes} onChange={upd("notes")} rows={3} placeholder="Statement, behaviour, items seized, items in possession, identifying marks..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>

                  {/* ─ Photos ─ */}
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <PhotoUpload
                      folder="detentions"
                      value={form.photo_urls}
                      onChange={(urls)=>setForm(f=>({...f, photo_urls:urls}))}
                      maxFiles={6}
                      label="Photos · Picha (mugshot, injuries, seized items)"
                      hint="Tap to add photos"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Recording...":"Record Detention · Hifadhi"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
