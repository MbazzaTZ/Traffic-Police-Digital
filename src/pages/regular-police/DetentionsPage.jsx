import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Lock, Plus, X, CheckCircle, AlertTriangle, Clock, UserCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const STATUS_C = { in_custody:"#DC2626", released:"#059669", charged:"#D97706", transferred:"#0891B2", bailed:"#7C3AED" };
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

  const [form, setForm] = useState({ detainee_name:"", detainee_nida:"", reason:"", cell_number:"", notes:"" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

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
      const { data, error } = await supabase.from("detentions").insert({
        ...form, officer_id:profile?.id||null, station_id:stationId||null, region_id:regionId||null, status:"in_custody",
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_detention", entityType:"detention", entityId:data.id, entityRef:data.ref_number, description:`Detained: ${data.detainee_name} - ${data.reason}` });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({detainee_name:"",detainee_nida:"",reason:"",cell_number:"",notes:""}); },2200);
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
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref #","Detainee","Reason","Cell","Detained","24h Clock","Status","Action"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(d=>{
                const sc=STATUS_C[d.status]||"#94A3B8";
                return (
                  <tr key={d.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#DC2626", fontSize:12 }}>{d.ref_number}</td>
                    <td style={{ padding:"11px 14px" }}><div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{d.detainee_name}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{d.detainee_nida||"—"}</div></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", maxWidth:180 }}>{d.reason}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{d.cell_number||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{new Date(d.detained_at).toLocaleString("en-GB")}</td>
                    <td style={{ padding:"11px 14px" }}>{d.status==="in_custody" ? <CustodyClock mustChargeBy={d.must_charge_by}/> : <span style={{ color:"#94A3B8", fontSize:12 }}>closed</span>}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{d.status?.replace(/_/g," ")}</span></td>
                    <td style={{ padding:"11px 14px" }}>
                      {d.status==="in_custody" && (
                        <select onChange={e=>e.target.value&&updateStatus(d,e.target.value)} defaultValue=""
                          style={{ height:32, border:"1px solid #E2E8F0", borderRadius:7, fontSize:12, padding:"0 8px", background:"white", cursor:"pointer" }}>
                          <option value="">Update...</option>
                          <option value="charged">Charge</option>
                          <option value="released">Release</option>
                          <option value="bailed">Bail</option>
                          <option value="transferred">Transfer</option>
                        </select>
                      )}
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
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Detainee Name · Jina *</label><input value={form.detainee_name} onChange={upd("detainee_name")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA</label><input value={form.detainee_nida} onChange={upd("detainee_nida")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Cell Number · Chumba</label><input value={form.cell_number} onChange={upd("cell_number")} placeholder="e.g. C-3" style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Reason for Detention · Sababu *</label><input value={form.reason} onChange={upd("reason")} required placeholder="Grounds for custody" style={S.inp}/></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}><label style={S.lbl}>Notes</label><textarea value={form.notes} onChange={upd("notes")} rows={2} style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
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
