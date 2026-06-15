import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Plus, Shield, Clock, MapPin, ChevronRight, X, AlertTriangle } from "lucide-react";

const arrests = [
  { id: "ARR-2026-001", name: "JUMA ABDALLAH MWALIMU", nida: "19850615-12345-00001-2", charge: "Armed Robbery / Wizi kwa Silaha", date: "15/06/2026", time: "10:22", location: "Njombe Bus Terminal", officer: "Insp. Mbaza", status: "Detained", bail: false },
  { id: "ARR-2026-002", name: "PETER JOHN MHAGAMA",    nida: "19780910-11111-00003-3", charge: "Fraud / Udanganyifu",            date: "14/06/2026", time: "16:45", location: "Makambako Market",   officer: "Sgt. Mwenda",  status: "Released on Bail", bail: true },
  { id: "ARR-2026-003", name: "HASSAN OMAR NGOWI",     nida: "19950220-22222-00004-1", charge: "Assault / Shambulio",            date: "14/06/2026", time: "22:10", location: "Njombe Centre",      officer: "Cpl. Kilosa",  status: "Remanded",    bail: false },
  { id: "ARR-2026-004", name: "FATUMA SALIM RASHID",   nida: "19891107-33333-00005-2", charge: "Possession of Drugs / Dawa za Kulevya", date: "13/06/2026", time: "07:55", location: "Mafinga Highway", officer: "Const. Ali", status: "Court Referred", bail: false },
];

function statusStyle(s) {
  if (s === "Detained")         return ["#fef2f2","#b91c1c"];
  if (s === "Released on Bail") return ["#f0fdf4","#166534"];
  if (s === "Remanded")         return ["#fffbeb","#92400e"];
  return                               ["#eff6ff","#1d4ed8"];
}

export default function ArrestsPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", nida: "", charge: "", location: "", date: "", time: "", notes: "" });

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setShowForm(false); setSubmitted(false); }, 2000);
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: 0 }}>Arrests · <span style={{ fontWeight: 500, color: "#94a3b8", fontSize: 22 }}>Kukamatwa</span></h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>Record and manage arrests · {arrests.length} records</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: "#dc2626", color: "white", border: "none", borderRadius: 14, padding: "12px 20px", display: "flex", gap: 8, alignItems: "center", fontWeight: 700, cursor: "pointer" }}>
          <Plus size={18} /> Record Arrest · Kamatwa
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Arrests",   labelSw: "Jumla",         value: arrests.length,                                              color: "#0D3477" },
          { label: "In Detention",    labelSw: "Waliozuiwa",    value: arrests.filter(a => a.status === "Detained").length,         color: "#dc2626" },
          { label: "Remanded",        labelSw: "Waliohifadhiwa",value: arrests.filter(a => a.status === "Remanded").length,         color: "#d97706" },
          { label: "Released",        labelSw: "Walioachuliwa", value: arrests.filter(a => a.bail).length,                         color: "#16a34a" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 16, padding: 20, textAlign: "center", borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.labelSw}</div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Arrest ID","Suspect","Charge","Date & Time","Location","Officer","Status",""].map(h => (
                <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {arrests.map(a => {
              const [bg, fg] = statusStyle(a.status);
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#dc2626", fontSize: 13 }}>{a.id}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0D3477" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>NIDA: {a.nida}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{a.charge}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>
                    <div>{a.date}</div>
                    <div style={{ color: "#94a3b8" }}>{a.time}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>
                    <MapPin size={13} color="#94a3b8" style={{ verticalAlign: "middle", marginRight: 4 }} />{a.location}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{a.officer}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: bg, color: fg, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{a.status}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}><ChevronRight size={16} color="#94a3b8" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ARREST FORM MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 24, padding: 32, width: "90%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, color: "#dc2626" }}>Record Arrest</h2>
                <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>Rekodi ya Kukamatwa</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 10, padding: 8, cursor: "pointer" }}><X size={18} /></button>
            </div>

            {submitted ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Shield size={48} color="#16a34a" style={{ marginBottom: 12 }} />
                <h3 style={{ color: "#16a34a" }}>Arrest Recorded!</h3>
                <p style={{ color: "#94a3b8" }}>Kukamatwa kumerekodiwa · ARR-2026-00{Math.floor(Math.random()*90+10)}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12, marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>All arrests are logged with GPS, timestamp, and officer ID</span>
                </div>
                {[
                  { label: "Suspect Full Name / Jina Kamili la Mshukiwa", key: "name", type: "text", placeholder: "Full name as per NIDA" },
                  { label: "NIDA Number / Nambari ya NIDA", key: "nida", type: "text", placeholder: "19xxxxxx-xxxxx-xxxxx-x" },
                  { label: "Charge / Mashtaka", key: "charge", type: "text", placeholder: "e.g. Armed Robbery" },
                  { label: "Location of Arrest / Mahali pa Kukamatwa", key: "location", type: "text", placeholder: "e.g. Njombe Bus Terminal" },
                  { label: "Date / Tarehe", key: "date", type: "date" },
                  { label: "Time / Wakati", key: "time", type: "time" },
                  { label: "Notes / Maelezo Zaidi", key: "notes", type: "textarea" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} rows={3}
                        style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, fontSize: 13, boxSizing: "border-box" }} />
                    ) : (
                      <input type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                        placeholder={f.placeholder} required={f.key !== "notes"}
                        style={{ width: "100%", height: 42, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 13 }} />
                    )}
                  </div>
                ))}
                <button type="submit" style={{ width: "100%", background: "#dc2626", color: "white", border: "none", borderRadius: 12, height: 48, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8 }}>
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
