import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, FileText, X } from "lucide-react";

const TYPES = ["Theft / Wizi","Assault / Shambulio","Robbery / Unyang'anyi","Burglary / Uvunjaji","Fraud / Udanganyifu","Disturbance / Fujo","Missing Person / Mtu Aliyepotea","Accident / Ajali","Other / Nyingine"];

export default function IncidentReportsPage() {
  const [modal, setModal] = useState(false);
  const [done, setDone]   = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [form, setForm]   = useState({ type:"", location:"", date:"", time:"", description:"" });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const newInc = { ...form, id:`INC-${Date.now()}`, status:"Open", officer:"Current Officer", created: new Date().toLocaleString("en-GB") };
    setIncidents(p => [newInc, ...p]);
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ type:"", location:"", date:"", time:"", description:"" }); }, 2000);
  }

  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  return (
    <DashboardLayout pageTitle="Incident Reports" pageTitle2="Ripoti za Matukio">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Incident Reports <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Ripoti</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{incidents.length} records</p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> New Incident · Tukio Jipya
        </button>
      </div>

      {incidents.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <FileText size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No incidents recorded yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Matukio hayajaandikwa bado</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Record First Incident
          </button>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                {["ID","Type","Status","Location","Date & Time","Officer"].map(h => (
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc, i) => (
                <tr key={inc.id} style={{ borderBottom:i<incidents.length-1?"1px solid #F1F5F9":"none" }}
                  onMouseEnter={e => e.currentTarget.style.background="#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background="white"}>
                  <td style={{ padding:"12px 14px", fontWeight:700, color:"#0D3477", fontSize:13 }}>{inc.id.slice(-8)}</td>
                  <td style={{ padding:"12px 14px", fontSize:13 }}>{inc.type}</td>
                  <td style={{ padding:"12px 14px" }}><span style={{ background:"#FEF2F2", color:"#DC2626", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{inc.status}</span></td>
                  <td style={{ padding:"12px 14px", fontSize:13, color:"#475569" }}>{inc.location}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#94A3B8" }}>{inc.created}</td>
                  <td style={{ padding:"12px 14px", fontSize:12 }}>{inc.officer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:"white", borderRadius:20, padding:30, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#0D3477" }}>New Incident Report</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Ripoti ya Tukio Jipya · GPS logged automatically</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                <h3 style={{ color:"#16A34A" }}>Incident Recorded!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Tukio limeandikwa</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                {[
                  { label:"Incident Type · Aina ya Tukio", key:"type", type:"select" },
                  { label:"Location · Mahali", key:"location", ph:"e.g. Town Centre" },
                  { label:"Date · Tarehe", key:"date", type:"date" },
                  { label:"Time · Wakati", key:"time", type:"time" },
                  { label:"Description · Maelezo", key:"description", type:"textarea" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{f.label} <span style={{ color:"#DC2626" }}>*</span></label>
                    {f.type==="select" ? (
                      <select value={form[f.key]} onChange={upd(f.key)} required style={{ ...inp, paddingLeft:12 }}>
                        <option value="">Select type...</option>
                        {TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : f.type==="textarea" ? (
                      <textarea value={form[f.key]} onChange={upd(f.key)} rows={3} required style={{ ...inp, height:"auto", padding:"10px 12px" }} />
                    ) : (
                      <input type={f.type||"text"} value={form[f.key]} onChange={upd(f.key)} placeholder={f.ph} required style={inp}
                        onFocus={e => e.target.style.borderColor="#0D3477"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                    )}
                  </div>
                ))}
                <button type="submit" style={{ width:"100%", height:46, background:"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                  Submit Report · Wasilisha Ripoti
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
