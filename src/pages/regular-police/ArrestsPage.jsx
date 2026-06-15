import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, MapPin, Clock, ChevronRight, X, AlertTriangle } from "lucide-react";

const ROWS = [
  { id:"ARR-2026-001", name:"JUMA ABDALLAH MWALIMU", nida:"19850615-12345-00001-2", charge:"Armed Robbery / Wizi kwa Silaha", date:"15/06/2026", time:"10:22", loc:"Njombe Bus Terminal", off:"Insp. Mbaza", status:"Detained",          sc:"badge-danger"  },
  { id:"ARR-2026-002", name:"PETER JOHN MHAGAMA",    nida:"19780910-11111-00003-3", charge:"Fraud / Udanganyifu",            date:"14/06/2026", time:"16:45", loc:"Makambako Market",   off:"Sgt. Mwenda",  status:"Released on Bail",  sc:"badge-success" },
  { id:"ARR-2026-003", name:"HASSAN OMAR NGOWI",     nida:"19950220-22222-00004-1", charge:"Assault / Shambulio",            date:"14/06/2026", time:"22:10", loc:"Njombe Centre",      off:"Cpl. Kilosa",  status:"Remanded",           sc:"badge-warning" },
  { id:"ARR-2026-004", name:"FATUMA SALIM RASHID",   nida:"19891107-33333-00005-2", charge:"Drug Possession / Dawa za Kulevya",date:"13/06/2026",time:"07:55",loc:"Mafinga Highway",  off:"Const. Ali",   status:"Court Referred",     sc:"badge-blue"    },
];

export default function ArrestsPage() {
  const [modal, setModal] = useState(false);
  const [done, setDone]   = useState(false);
  const [form, setForm]   = useState({ name:"", nida:"", charge:"", location:"", date:"", time:"", notes:"" });

  function upd(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  function submit(e) {
    e.preventDefault();
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); }, 2200);
  }

  return (
    <DashboardLayout pageTitle="Arrests" pageTitle2="Kukamatwa">
      <div className="page-hd">
        <div className="page-hd-row">
          <div>
            <h1 className="page-title">Arrests <span className="page-title-sw">· Kukamatwa</span></h1>
            <p className="page-sub">Record and manage arrests · {ROWS.length} records</p>
          </div>
          <button className="btn btn-danger" onClick={() => setModal(true)}>
            <Plus size={16} /> Record Arrest · Rekodi Kukamatwa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row stats-4" style={{ marginBottom: 18 }}>
        {[
          { label:"Total Arrests",    sw:"Jumla",          v: ROWS.length,                                          c:"#0D3477" },
          { label:"In Detention",     sw:"Waliozuiwa",     v: ROWS.filter(r=>r.status==="Detained").length,         c:"#DC2626" },
          { label:"Remanded",         sw:"Waliohifadhiwa", v: ROWS.filter(r=>r.status==="Remanded").length,         c:"#D97706" },
          { label:"Released",         sw:"Walioachuliwa",  v: ROWS.filter(r=>r.status==="Released on Bail").length, c:"#16A34A" },
        ].map(s => (
          <div key={s.label} className="stat-box" style={{ borderTopColor: s.c }}>
            <div className="stat-box-value" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-box-label">{s.label}</div>
            <div className="stat-box-sw">{s.sw}</div>
          </div>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Arrest ID</th><th>Suspect</th><th>Charge</th><th>Date & Time</th><th>Location</th><th>Officer</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, color: "#DC2626" }}>{r.id}</td>
                <td>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue-800)" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)" }}>NIDA: {r.nida}</div>
                </td>
                <td style={{ maxWidth: 200 }}>{r.charge}</td>
                <td style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  <div>{r.date}</div><div style={{ color: "var(--gray-400)" }}>{r.time}</div>
                </td>
                <td style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  <MapPin size={12} style={{ verticalAlign: "middle", marginRight: 3, color: "var(--gray-400)" }} />{r.loc}
                </td>
                <td style={{ fontSize: 12 }}>{r.off}</td>
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
                <div className="modal-title" style={{ color: "#DC2626" }}>Record Arrest</div>
                <div className="modal-sub">Rekodi ya Kukamatwa · All details are audit-logged</div>
              </div>
              <button className="modal-close" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            {done ? (
              <div className="success-state">
                <div className="success-icon">🛡️</div>
                <h3>Arrest Recorded!</h3>
                <p>Kukamatwa kumerekodiwa · ARR-2026-00{Math.floor(Math.random()*90+10)}</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span style={{ fontSize: 12, color: "#B91C1C", fontWeight: 600 }}>All arrests are GPS-logged with officer ID and timestamp</span>
                </div>
                {[
                  { label:"Suspect Full Name · Jina la Mshukiwa", key:"name",     type:"text", ph:"Full name as per NIDA" },
                  { label:"NIDA Number",                           key:"nida",     type:"text", ph:"19xxxxxx-xxxxx-xxxxx-x" },
                  { label:"Charge · Mashtaka",                    key:"charge",   type:"text", ph:"e.g. Armed Robbery" },
                  { label:"Location of Arrest · Mahali",          key:"location", type:"text", ph:"e.g. Njombe Bus Terminal" },
                ].map(f => (
                  <div className="form-field" key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" value={form[f.key]} onChange={upd(f.key)} placeholder={f.ph} required />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-field">
                    <label className="form-label">Date · Tarehe</label>
                    <input type="date" className="form-input" value={form.date} onChange={upd("date")} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Time · Wakati</label>
                    <input type="time" className="form-input" value={form.time} onChange={upd("time")} required />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Notes · Maelezo</label>
                  <textarea className="form-textarea" rows={3} value={form.notes} onChange={upd("notes")} />
                </div>
                <button type="submit" className="btn btn-danger" style={{ width: "100%", justifyContent: "center", height: 46 }}>
                  Confirm Arrest · Thibitisha Kukamatwa
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
