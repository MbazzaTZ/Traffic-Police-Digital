import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, Shield, X, AlertTriangle } from "lucide-react";

export default function ArrestsPage() {
  const [modal, setModal] = useState(false);
  const [done, setDone]   = useState(false);
  const [arrests, setArrests] = useState([]);
  const [form, setForm]   = useState({ name:"", nida:"", charge:"", location:"", date:"", time:"", notes:"" });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  function submit(e) {
    e.preventDefault();
    setArrests(p => [{ ...form, id:`ARR-${Date.now()}`, status:"Detained", created:new Date().toLocaleString("en-GB") }, ...p]);
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ name:"", nida:"", charge:"", location:"", date:"", time:"", notes:"" }); }, 2000);
  }

  return (
    <DashboardLayout pageTitle="Arrests" pageTitle2="Kukamatwa">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Arrests <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Kukamatwa</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{arrests.length} records</p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Record Arrest
        </button>
      </div>

      {arrests.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Shield size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No arrests recorded</div>
          <div style={{ fontSize:13, marginTop:6 }}>Kukamatwa hakujaandikwa bado</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Record First Arrest
          </button>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                {["ID","Suspect","Charge","Location","Date","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arrests.map((a, i) => (
                <tr key={a.id} style={{ borderBottom:i<arrests.length-1?"1px solid #F1F5F9":"none" }}>
                  <td style={{ padding:"12px 14px", fontWeight:700, color:"#DC2626", fontSize:13 }}>{a.id.slice(-8)}</td>
                  <td style={{ padding:"12px 14px", fontWeight:700, fontSize:13, color:"#0D3477" }}>{a.name}</td>
                  <td style={{ padding:"12px 14px", fontSize:13 }}>{a.charge}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#475569" }}>{a.location}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#94A3B8" }}>{a.date} {a.time}</td>
                  <td style={{ padding:"12px 14px" }}><span style={{ background:"#FEF2F2", color:"#DC2626", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:"white", borderRadius:20, padding:30, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#DC2626" }}>Record Arrest · Rekodi Kukamatwa</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>All arrests are GPS-logged with timestamp</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <Shield size={48} color="#16A34A" style={{ marginBottom:12 }} />
                <h3 style={{ color:"#16A34A" }}>Arrest Recorded!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Kukamatwa kumerekodiwa</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span style={{ fontSize:12, color:"#B91C1C", fontWeight:600 }}>All arrests are GPS-logged with officer ID and timestamp</span>
                </div>
                {[
                  { label:"Suspect Full Name · Jina la Mshukiwa", key:"name", ph:"Full name as per NIDA" },
                  { label:"NIDA Number", key:"nida", ph:"19xxxxxx-xxxxx-xxxxx-x" },
                  { label:"Charge · Mashtaka", key:"charge", ph:"e.g. Armed Robbery" },
                  { label:"Location of Arrest · Mahali", key:"location", ph:"e.g. Town Centre" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{f.label} *</label>
                    <input value={form[f.key]} onChange={upd(f.key)} placeholder={f.ph} required style={inp}
                      onFocus={e => e.target.style.borderColor="#DC2626"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                  </div>
                ))}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Date *</label>
                    <input type="date" value={form.date} onChange={upd("date")} required style={inp} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Time *</label>
                    <input type="time" value={form.time} onChange={upd("time")} required style={inp} />
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Notes · Maelezo</label>
                  <textarea value={form.notes} onChange={upd("notes")} rows={3} style={{ ...inp, height:"auto", padding:"10px 12px" }} />
                </div>
                <button type="submit" style={{ width:"100%", height:46, background:"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                  Confirm Arrest · Thibitisha
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
