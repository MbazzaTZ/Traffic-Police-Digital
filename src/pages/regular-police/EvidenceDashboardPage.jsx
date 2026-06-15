import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Upload, FolderOpen, X, Camera, Lock } from "lucide-react";

const TYPES = ["Physical Object / Kitu","Photo / Video","Document / Hati","Weapon / Silaha","Drug Sample","Digital Device","Other / Nyingine"];

export default function EvidenceDashboardPage() {
  const [modal, setModal] = useState(false);
  const [done, setDone]   = useState(false);
  const [evidence, setEvidence] = useState([]);
  const [form, setForm]   = useState({ caseId:"", type:"", desc:"", loc:"", date:"" });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  function submit(e) {
    e.preventDefault();
    setEvidence(p => [{ ...form, id:`EVD-${Date.now()}`, status:"In Custody", chain:1, created:new Date().toLocaleString("en-GB") }, ...p]);
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ caseId:"", type:"", desc:"", loc:"", date:"" }); }, 2000);
  }

  return (
    <DashboardLayout pageTitle="Evidence" pageTitle2="Ushahidi">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Evidence <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Ushahidi</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{evidence.length} evidence items · Chain of custody active</p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Upload size={16} /> Upload Evidence · Pakia
        </button>
      </div>

      <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"11px 16px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
        <Lock size={16} color="#D97706" />
        <span style={{ fontSize:13, color:"#92400E", fontWeight:600 }}>Chain of Custody Active · All transfers logged with officer ID, timestamp & GPS</span>
      </div>

      {evidence.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <FolderOpen size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No evidence uploaded yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Ushahidi haujapakuliwa bado</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Upload First Evidence
          </button>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                {["Evidence ID","Case ID","Type","Description","Date","Chain #","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evidence.map((ev, i) => (
                <tr key={ev.id} style={{ borderBottom:i<evidence.length-1?"1px solid #F1F5F9":"none" }}>
                  <td style={{ padding:"12px 14px", fontWeight:700, color:"#7C3AED", fontSize:13 }}>{ev.id.slice(-8)}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#0D3477", fontWeight:600 }}>{ev.caseId}</td>
                  <td style={{ padding:"12px 14px", fontSize:13 }}>{ev.type}</td>
                  <td style={{ padding:"12px 14px", fontSize:13 }}>{ev.desc}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#94A3B8" }}>{ev.created}</td>
                  <td style={{ padding:"12px 14px", textAlign:"center" }}><span style={{ background:"#F5F3FF", color:"#7C3AED", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>#{ev.chain}</span></td>
                  <td style={{ padding:"12px 14px" }}><span style={{ background:"#EFF6FF", color:"#1D4ED8", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{ev.status}</span></td>
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
                <div style={{ fontSize:18, fontWeight:800, color:"#7C3AED" }}>Upload Evidence · Pakia Ushahidi</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Chain of Custody will be initiated</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📁</div>
                <h3 style={{ color:"#16A34A" }}>Evidence Uploaded!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Ushahidi umepakiwa</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                {[
                  { label:"Case / Incident ID", key:"caseId", ph:"e.g. INC-2026-001" },
                  { label:"Collection Location · Mahali", key:"loc", ph:"GPS coordinates or address" },
                  { label:"Date Collected · Tarehe", key:"date", type:"date" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{f.label} *</label>
                    <input type={f.type||"text"} value={form[f.key]} onChange={upd(f.key)} placeholder={f.ph} required style={inp}
                      onFocus={e => e.target.style.borderColor="#7C3AED"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                  </div>
                ))}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Evidence Type *</label>
                  <select value={form.type} onChange={upd("type")} required style={{ ...inp, paddingLeft:12 }}>
                    <option value="">Select type...</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Description · Maelezo *</label>
                  <textarea value={form.desc} onChange={upd("desc")} rows={3} required style={{ ...inp, height:"auto", padding:"10px 12px" }} />
                </div>
                <div style={{ border:"2px dashed #E2E8F0", borderRadius:12, padding:20, textAlign:"center", marginBottom:16, cursor:"pointer", color:"#94A3B8" }}>
                  <Camera size={26} style={{ marginBottom:6 }} />
                  <div style={{ fontSize:13, fontWeight:600 }}>Tap to attach photos / files</div>
                  <div style={{ fontSize:11, marginTop:3 }}>PNG, JPG, PDF up to 10MB</div>
                </div>
                <button type="submit" style={{ width:"100%", height:46, background:"#7C3AED", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                  Submit Evidence · Wasilisha
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
