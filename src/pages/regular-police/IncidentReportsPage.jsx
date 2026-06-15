import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, Search, Filter, FileText, MapPin, Clock, ChevronRight, X } from "lucide-react";

const incidents = [
  { id: "INC-2026-001", type: "Theft",       typeSw: "Wizi",         status: "Open",         location: "Makambako Market",  reported: "15/06/2026 08:42", officer: "Insp. Mbaza", severity: "medium" },
  { id: "INC-2026-002", type: "Assault",     typeSw: "Shambulio",    status: "Investigating", location: "Njombe Road",       reported: "15/06/2026 09:15", officer: "Cpl. Kilosa", severity: "high" },
  { id: "INC-2026-003", type: "Burglary",    typeSw: "Uvunjaji",     status: "Assigned",     location: "Mafinga Town",      reported: "15/06/2026 07:30", officer: "Sgt. Mwenda", severity: "high" },
  { id: "INC-2026-004", type: "Disturbance", typeSw: "Fujo",         status: "Closed",       location: "Bus Terminal",      reported: "14/06/2026 22:00", officer: "Const. Ali",  severity: "low" },
  { id: "INC-2026-005", type: "Robbery",     typeSw: "Unyang'anyi",  status: "Open",         location: "Njombe Centre",     reported: "14/06/2026 18:35", officer: "Insp. Mbaza", severity: "high" },
  { id: "INC-2026-006", type: "Missing Person", typeSw: "Mtu Aliyepotea", status: "Open",   location: "Makambako North",   reported: "14/06/2026 14:00", officer: "Cpl. Mushi",  severity: "medium" },
];

const incidentTypes = ["Theft / Wizi","Assault / Shambulio","Robbery / Unyang'anyi","Burglary / Uvunjaji","Fraud / Udanganyifu","Disturbance / Fujo","Missing Person / Mtu Aliyepotea","Other / Nyingine"];

function statusStyle(s) {
  const m = { Open: ["#fef2f2","#b91c1c"], Assigned: ["#eff6ff","#1d4ed8"], Investigating: ["#f0fdf4","#166534"], Closed: ["#f1f5f9","#475569"] };
  return m[s] || m.Closed;
}
function severityColor(s) {
  return s === "high" ? "#dc2626" : s === "medium" ? "#d97706" : "#16a34a";
}

export default function IncidentReportsPage() {
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "", location: "", description: "", date: "", time: "" });
  const [submitted, setSubmitted] = useState(false);

  const filtered = filter === "All" ? incidents : incidents.filter(i => i.status === filter);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setShowForm(false); setSubmitted(false); setForm({ type: "", location: "", description: "", date: "", time: "" }); }, 2000);
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: 0 }}>Incident Reports</h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>Ripoti za Matukio · {incidents.length} total records</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: "#0D3477", color: "white", border: "none", borderRadius: 14,
          padding: "12px 20px", display: "flex", gap: 8, alignItems: "center",
          fontWeight: 700, cursor: "pointer", fontSize: 14
        }}>
          <Plus size={18} /> New Incident · Tukio Jipya
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total", labelSw: "Jumla",      value: incidents.length,                                       color: "#0D3477" },
          { label: "Open",  labelSw: "Wazi",        value: incidents.filter(i => i.status === "Open").length,     color: "#dc2626" },
          { label: "Active",labelSw: "Zinazoendelea", value: incidents.filter(i => i.status !== "Closed").length, color: "#d97706" },
          { label: "Closed",labelSw: "Imefungwa",   value: incidents.filter(i => i.status === "Closed").length,   color: "#16a34a" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 16, padding: 20, textAlign: "center", borderTop: `4px solid ${s.color}`, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.labelSw}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["All","Open","Assigned","Investigating","Closed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? "#0D3477" : "white",
            color: filter === f ? "white" : "#475569",
            border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 16px",
            cursor: "pointer", fontWeight: 600, fontSize: 13
          }}>{f}</button>
        ))}
      </div>

      {/* TABLE */}
      <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Incident ID","Type","Status","Severity","Location","Reported","Officer",""].map(h => (
                <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inc, i) => {
              const [bg, fg] = statusStyle(inc.status);
              return (
                <tr key={inc.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0D3477", fontSize: 13 }}>{inc.id}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{inc.type}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{inc.typeSw}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: bg, color: fg, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{inc.status}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: severityColor(inc.severity), display: "inline-block", marginRight: 6 }} />
                    <span style={{ fontSize: 12, textTransform: "capitalize" }}>{inc.severity}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={13} color="#94a3b8" />{inc.location}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>
                    <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{inc.reported}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{inc.officer}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <ChevronRight size={16} color="#94a3b8" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* NEW INCIDENT MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 24, padding: 32, width: "90%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, color: "#0D3477" }}>New Incident Report</h2>
                <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>Ripoti ya Tukio Jipya</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 10, padding: 8, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40 }}>✅</div>
                <h3 style={{ color: "#16a34a", marginTop: 12 }}>Incident Recorded!</h3>
                <p style={{ color: "#94a3b8" }}>Tukio limeandikwa · ID: INC-2026-00{Math.floor(Math.random()*90+10)}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {[
                  { label: "Incident Type / Aina ya Tukio", key: "type", type: "select" },
                  { label: "Location / Mahali", key: "location", type: "text", placeholder: "e.g. Makambako Market" },
                  { label: "Date / Tarehe", key: "date", type: "date" },
                  { label: "Time / Wakati", key: "time", type: "time" },
                  { label: "Description / Maelezo", key: "description", type: "textarea" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>{f.label}</label>
                    {f.type === "select" ? (
                      <select value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} required
                        style={{ width: "100%", height: 44, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 14 }}>
                        <option value="">Select type...</option>
                        {incidentTypes.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} required rows={3}
                        style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
                    ) : (
                      <input type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} required
                        style={{ width: "100%", height: 44, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 14 }} />
                    )}
                  </div>
                ))}
                <button type="submit" style={{ width: "100%", background: "#0D3477", color: "white", border: "none", borderRadius: 12, height: 48, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8 }}>
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
