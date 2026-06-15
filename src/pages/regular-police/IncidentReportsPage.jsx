import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, MapPin, Clock, ChevronRight, X } from "lucide-react";

const ROWS = [
  { id:"INC-2026-001", type:"Theft",        sw:"Wizi",         status:"Open",          sClass:"badge-danger",  loc:"Makambako Market",  rep:"15/06/2026 08:42", off:"Insp. Mbaza",  sev:"high" },
  { id:"INC-2026-002", type:"Assault",      sw:"Shambulio",    status:"Investigating", sClass:"badge-success", loc:"Njombe Road",       rep:"15/06/2026 09:15", off:"Cpl. Kilosa",  sev:"high" },
  { id:"INC-2026-003", type:"Burglary",     sw:"Uvunjaji",     status:"Assigned",      sClass:"badge-blue",    loc:"Mafinga Town",      rep:"15/06/2026 07:30", off:"Sgt. Mwenda",  sev:"high" },
  { id:"INC-2026-004", type:"Disturbance",  sw:"Fujo",         status:"Closed",        sClass:"badge-gray",    loc:"Bus Terminal",      rep:"14/06/2026 22:00", off:"Const. Ali",   sev:"low"  },
  { id:"INC-2026-005", type:"Robbery",      sw:"Unyang'anyi",  status:"Open",          sClass:"badge-danger",  loc:"Njombe Centre",     rep:"14/06/2026 18:35", off:"Insp. Mbaza",  sev:"high" },
  { id:"INC-2026-006", type:"Missing",      sw:"Mtu Aliyepotea",status:"Open",         sClass:"badge-danger",  loc:"Makambako North",   rep:"14/06/2026 14:00", off:"Cpl. Mushi",   sev:"medium"},
];

const TYPES = ["Theft / Wizi","Assault / Shambulio","Robbery / Unyang'anyi","Burglary / Uvunjaji","Fraud / Udanganyifu","Disturbance / Fujo","Missing Person","Accident / Ajali","Other / Nyingine"];

function SevDot({ s }) {
  const c = s === "high" ? "#DC2626" : s === "medium" ? "#D97706" : "#16A34A";
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block", marginRight: 6 }} />;
}

export default function IncidentReportsPage() {
  const [filter, setFilter] = useState("All");
  const [modal, setModal]   = useState(false);
  const [done, setDone]     = useState(false);
  const [form, setForm]     = useState({ type:"", location:"", date:"", time:"", description:"" });

  const rows = filter === "All" ? ROWS : ROWS.filter(r => r.status === filter);

  function upd(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  function submit(e) {
    e.preventDefault();
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ type:"", location:"", date:"", time:"", description:"" }); }, 2200);
  }

  const counts = {
    total: ROWS.length,
    open:  ROWS.filter(r => r.status === "Open").length,
    active:ROWS.filter(r => r.status !== "Closed").length,
    closed:ROWS.filter(r => r.status === "Closed").length,
  };

  return (
    <DashboardLayout pageTitle="Incident Reports" pageTitle2="Ripoti za Matukio">
      <div className="page-hd">
        <div className="page-hd-row">
          <div>
            <h1 className="page-title">Incident Reports <span className="page-title-sw">· Ripoti za Matukio</span></h1>
            <p className="page-sub">{ROWS.length} total records · Makambako Police Station</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> New Incident · Tukio Jipya
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row stats-4" style={{ marginBottom: 18 }}>
        {[
          { label:"Total",  sw:"Jumla",           v: counts.total,  c:"#0D3477" },
          { label:"Open",   sw:"Wazi",            v: counts.open,   c:"#DC2626" },
          { label:"Active", sw:"Zinazoendelea",   v: counts.active, c:"#D97706" },
          { label:"Closed", sw:"Imefungwa",       v: counts.closed, c:"#16A34A" },
        ].map(s => (
          <div key={s.label} className="stat-box" style={{ borderTopColor: s.c }}>
            <div className="stat-box-value" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-box-label">{s.label}</div>
            <div className="stat-box-sw">{s.sw}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-row">
        {["All","Open","Assigned","Investigating","Closed"].map(f => (
          <button key={f} className={`filter-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Incident ID</th><th>Type</th><th>Status</th><th>Severity</th>
              <th>Location</th><th>Reported</th><th>Officer</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, color: "var(--blue-700)" }}>{r.id}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.type}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{r.sw}</div>
                </td>
                <td><span className={`badge ${r.sClass}`}>{r.status}</span></td>
                <td><SevDot s={r.sev} /><span style={{ fontSize: 12, textTransform: "capitalize" }}>{r.sev}</span></td>
                <td style={{ color: "var(--gray-500)" }}>
                  <MapPin size={12} style={{ verticalAlign: "middle", marginRight: 4, color: "var(--gray-400)" }} />
                  {r.loc}
                </td>
                <td style={{ fontSize: 12, color: "var(--gray-400)" }}>
                  <Clock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{r.rep}
                </td>
                <td style={{ fontSize: 12 }}>{r.off}</td>
                <td><ChevronRight size={15} color="var(--gray-300)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <div className="modal-hd">
              <div>
                <div className="modal-title">New Incident Report</div>
                <div className="modal-sub">Ripoti ya Tukio Jipya · GPS logged automatically</div>
              </div>
              <button className="modal-close" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            {done ? (
              <div className="success-state">
                <div className="success-icon">✅</div>
                <h3>Incident Recorded!</h3>
                <p>Tukio limeandikwa · ID: INC-2026-00{Math.floor(Math.random()*90+10)}</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="form-field">
                  <label className="form-label">Incident Type · Aina ya Tukio</label>
                  <select className="form-select" value={form.type} onChange={upd("type")} required>
                    <option value="">Select type...</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Location · Mahali</label>
                  <input className="form-input" value={form.location} onChange={upd("location")} placeholder="e.g. Makambako Market" required />
                </div>
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
                  <label className="form-label">Description · Maelezo</label>
                  <textarea className="form-textarea" rows={4} value={form.description} onChange={upd("description")} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", height: 46, fontSize: 14 }}>
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
