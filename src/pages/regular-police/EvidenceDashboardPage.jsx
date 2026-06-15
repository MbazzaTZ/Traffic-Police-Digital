import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Upload, Lock, CheckCircle, Clock, ChevronRight, X, Camera, Package } from "lucide-react";

const ROWS = [
  { id:"EVD-2026-001", case:"INC-2026-002", type:"Physical", sw:"Kimwili", desc:"Mobile phone – Tecno Spark",  col:"15/06/2026 09:30", off:"Insp. Mbaza",  status:"In Custody",   sc:"badge-blue",    chain:2 },
  { id:"EVD-2026-002", case:"INC-2026-001", type:"Photo",    sw:"Picha",   desc:"CCTV footage – Market area",  col:"15/06/2026 08:50", off:"Sgt. Mwenda",   status:"Submitted",    sc:"badge-success", chain:3 },
  { id:"EVD-2026-003", case:"ARR-2026-001", type:"Weapon",   sw:"Silaha",  desc:"Machete 45cm – seized",       col:"14/06/2026 22:15", off:"Insp. Mbaza",  status:"In Custody",   sc:"badge-blue",    chain:4 },
  { id:"EVD-2026-004", case:"INC-2026-005", type:"Document", sw:"Hati",    desc:"Forged ID document",          col:"14/06/2026 19:00", off:"Cpl. Kilosa",  status:"Lab Analysis", sc:"badge-warning", chain:1 },
];

const TYPES = ["Physical Object / Kitu","Photo / Video","Document / Hati","Weapon / Silaha","Drug Sample","Digital Device","Other / Nyingine"];

export default function EvidenceDashboardPage() {
  const [modal, setModal] = useState(false);
  const [done, setDone]   = useState(false);
  const [form, setForm]   = useState({ caseId:"", type:"", desc:"", loc:"", date:"" });

  function upd(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  function submit(e) {
    e.preventDefault();
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); }, 2200);
  }

  return (
    <DashboardLayout pageTitle="Evidence" pageTitle2="Ushahidi">
      <div className="page-hd">
        <div className="page-hd-row">
          <div>
            <h1 className="page-title">Evidence <span className="page-title-sw">· Ushahidi</span></h1>
            <p className="page-sub">Chain of custody management · {ROWS.length} evidence items</p>
          </div>
          <button className="btn btn-primary" style={{ background: "#7C3AED" }} onClick={() => setModal(true)}>
            <Upload size={16} /> Upload Evidence · Pakia
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row stats-4" style={{ marginBottom: 16 }}>
        {[
          { label:"Total Items",     sw:"Jumla",          v: ROWS.length,                                        c:"#7C3AED", icon: Package },
          { label:"In Custody",      sw:"Kinachohifadhiwa", v: ROWS.filter(r=>r.status==="In Custody").length,  c:"#0D3477", icon: Lock },
          { label:"Submitted",       sw:"Waliwasilishwa", v: ROWS.filter(r=>r.status==="Submitted").length,     c:"#16A34A", icon: CheckCircle },
          { label:"Under Analysis",  sw:"Uchambuzi",      v: ROWS.filter(r=>r.status==="Lab Analysis").length,  c:"#D97706", icon: Package },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-box" style={{ borderTopColor: s.c }}>
              <Icon size={20} color={s.c} style={{ marginBottom: 6 }} />
              <div className="stat-box-value" style={{ color: s.c }}>{s.v}</div>
              <div className="stat-box-label">{s.label}</div>
              <div className="stat-box-sw">{s.sw}</div>
            </div>
          );
        })}
      </div>

      {/* CoC notice */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <Lock size={16} color="#D97706" />
        <span style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>
          Chain of Custody Active · Mnyororo wa Usimamizi · All transfers logged with officer ID, timestamp & GPS
        </span>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Evidence ID</th><th>Case ID</th><th>Type</th><th>Description</th><th>Collected</th><th>Officer</th><th>Chain #</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, color: "#7C3AED" }}>{r.id}</td>
                <td style={{ fontWeight: 600, color: "var(--blue-700)" }}>{r.case}</td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.type}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{r.sw}</div>
                </td>
                <td style={{ maxWidth: 180, fontSize: 13 }}>{r.desc}</td>
                <td style={{ fontSize: 11, color: "var(--gray-400)" }}>
                  <Clock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{r.col}
                </td>
                <td style={{ fontSize: 12 }}>{r.off}</td>
                <td style={{ textAlign: "center" }}>
                  <span className="badge badge-purple">#{r.chain}</span>
                </td>
                <td><span className={`badge ${r.sc}`}>{r.status}</span></td>
                <td><ChevronRight size={15} color="var(--gray-300)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-hd">
              <div>
                <div className="modal-title" style={{ color: "#7C3AED" }}>Upload Evidence</div>
                <div className="modal-sub">Pakia Ushahidi · Chain of Custody will be initiated</div>
              </div>
              <button className="modal-close" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            {done ? (
              <div className="success-state">
                <div className="success-icon">📁</div>
                <h3>Evidence Uploaded!</h3>
                <p>Ushahidi umepakiwa · EVD-2026-00{Math.floor(Math.random()*90+10)}</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                {[
                  { label:"Case / Incident ID", key:"caseId", ph:"e.g. INC-2026-001" },
                  { label:"Collection Location · Mahali pa Kukusanya", key:"loc", ph:"GPS or address" },
                ].map(f => (
                  <div className="form-field" key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" value={form[f.key]} onChange={upd(f.key)} placeholder={f.ph} required />
                  </div>
                ))}
                <div className="form-field">
                  <label className="form-label">Evidence Type · Aina ya Ushahidi</label>
                  <select className="form-select" value={form.type} onChange={upd("type")} required>
                    <option value="">Select type...</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Description · Maelezo</label>
                  <textarea className="form-textarea" rows={3} value={form.desc} onChange={upd("desc")} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Date Collected · Tarehe</label>
                  <input type="date" className="form-input" value={form.date} onChange={upd("date")} required />
                </div>
                {/* Upload zone */}
                <div style={{ border: "2px dashed var(--gray-200)", borderRadius: "var(--radius-md)", padding: 24, textAlign: "center", marginBottom: 16, cursor: "pointer", color: "var(--gray-400)" }}>
                  <Camera size={28} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Tap to attach photos / files · Pakia picha</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>PNG, JPG, PDF up to 10MB</div>
                </div>
                <button type="submit" className="btn" style={{ width: "100%", justifyContent: "center", height: 46, background: "#7C3AED", color: "white" }}>
                  Submit Evidence · Wasilisha Ushahidi
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
