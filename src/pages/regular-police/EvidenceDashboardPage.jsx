import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Upload, FolderOpen, Lock, CheckCircle, Clock, ChevronRight, X, Camera, FileText, Package } from "lucide-react";

const evidence = [
  { id: "EVD-2026-001", caseId: "INC-2026-002", type: "Physical", typeSw: "Kimwili", description: "Mobile phone – Tecno Spark", collected: "15/06/2026 09:30", officer: "Insp. Mbaza", status: "In Custody", chain: 2 },
  { id: "EVD-2026-002", caseId: "INC-2026-001", type: "Photo",    typeSw: "Picha",   description: "CCTV footage – Market area", collected: "15/06/2026 08:50", officer: "Sgt. Mwenda",  status: "Submitted",  chain: 3 },
  { id: "EVD-2026-003", caseId: "ARR-2026-001", type: "Weapon",   typeSw: "Silaha",  description: "Machete 45cm – seized",    collected: "14/06/2026 22:15", officer: "Insp. Mbaza", status: "In Custody", chain: 4 },
  { id: "EVD-2026-004", caseId: "INC-2026-005", type: "Document", typeSw: "Hati",    description: "Forged ID document",       collected: "14/06/2026 19:00", officer: "Cpl. Kilosa", status: "Lab Analysis",chain: 1 },
];

const evidenceTypes = ["Physical Object / Kitu cha Kimwili","Photo / Video","Document / Hati","Weapon / Silaha","Drug Sample / Dawa","Digital Device / Kifaa cha Dijitali","Other / Nyingine"];

function statusStyle(s) {
  if (s === "In Custody")    return ["#eff6ff","#1d4ed8"];
  if (s === "Submitted")     return ["#f0fdf4","#166534"];
  if (s === "Lab Analysis")  return ["#fffbeb","#92400e"];
  return ["#f1f5f9","#475569"];
}

export default function EvidenceDashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ caseId: "", type: "", description: "", location: "", date: "" });

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setShowForm(false); setSubmitted(false); }, 2000);
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: 0 }}>Evidence · <span style={{ fontWeight: 500, color: "#94a3b8", fontSize: 22 }}>Ushahidi</span></h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>Chain of custody · {evidence.length} evidence items</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 14, padding: "12px 20px", display: "flex", gap: 8, alignItems: "center", fontWeight: 700, cursor: "pointer" }}>
          <Upload size={18} /> Upload Evidence · Pakia Ushahidi
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Items",    labelSw: "Jumla ya Vitu",   value: evidence.length,                                           color: "#7c3aed", icon: Package },
          { label: "In Custody",     labelSw: "Kinachohifadhiwa",value: evidence.filter(e => e.status === "In Custody").length,   color: "#0D3477", icon: Lock },
          { label: "Submitted",      labelSw: "Waliwasilishwa",  value: evidence.filter(e => e.status === "Submitted").length,    color: "#16a34a", icon: CheckCircle },
          { label: "Under Analysis", labelSw: "Uchambuzi",       value: evidence.filter(e => e.status === "Lab Analysis").length, color: "#d97706", icon: FolderOpen },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "white", borderRadius: 16, padding: 20, textAlign: "center", borderTop: `4px solid ${s.color}` }}>
              <Icon size={22} color={s.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.labelSw}</div>
            </div>
          );
        })}
      </div>

      {/* CHAIN OF CUSTODY NOTICE */}
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: 14, marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
        <Lock size={18} color="#d97706" />
        <div>
          <span style={{ fontWeight: 700, color: "#92400e", fontSize: 13 }}>Chain of Custody Active · </span>
          <span style={{ color: "#78350f", fontSize: 13 }}>All evidence transfers are logged with officer ID, timestamp, and GPS. Mara zote mabadiliko yanarekodiwa.</span>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Evidence ID","Case ID","Type","Description","Collected","Officer","Chain #","Status",""].map(h => (
                <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {evidence.map(ev => {
              const [bg, fg] = statusStyle(ev.status);
              return (
                <tr key={ev.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#7c3aed", fontSize: 13 }}>{ev.id}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#0D3477", fontWeight: 600 }}>{ev.caseId}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.type}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{ev.typeSw}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{ev.description}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>
                    <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{ev.collected}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{ev.officer}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <span style={{ background: "#f5f3ff", color: "#7c3aed", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>#{ev.chain}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: bg, color: fg, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{ev.status}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}><ChevronRight size={16} color="#94a3b8" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* UPLOAD MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 24, padding: 32, width: "90%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, color: "#7c3aed" }}>Upload Evidence</h2>
                <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>Pakia Ushahidi · Chain of Custody will be initiated</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 10, padding: 8, cursor: "pointer" }}><X size={18} /></button>
            </div>
            {submitted ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 12 }} />
                <h3 style={{ color: "#16a34a" }}>Evidence Uploaded!</h3>
                <p style={{ color: "#94a3b8" }}>Ushahidi umepakiwa · EVD-2026-00{Math.floor(Math.random()*90+10)}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {[
                  { label: "Case / Incident ID", key: "caseId", type: "text", placeholder: "e.g. INC-2026-001" },
                  { label: "Evidence Type / Aina ya Ushahidi", key: "type", type: "select" },
                  { label: "Description / Maelezo", key: "description", type: "textarea" },
                  { label: "Collection Location / Mahali pa Kukusanya", key: "location", type: "text", placeholder: "GPS or address" },
                  { label: "Date Collected / Tarehe ya Kukusanya", key: "date", type: "date" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>{f.label}</label>
                    {f.type === "select" ? (
                      <select value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} required
                        style={{ width: "100%", height: 42, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 13 }}>
                        <option value="">Select type...</option>
                        {evidenceTypes.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} rows={3} required
                        style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, fontSize: 13, boxSizing: "border-box" }} />
                    ) : (
                      <input type={f.type} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                        placeholder={f.placeholder} required
                        style={{ width: "100%", height: 42, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 13 }} />
                    )}
                  </div>
                ))}
                <div style={{ border: "2px dashed #e2e8f0", borderRadius: 14, padding: 24, textAlign: "center", marginBottom: 16, cursor: "pointer", color: "#94a3b8" }}>
                  <Camera size={32} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Tap to attach photos / files</p>
                  <p style={{ fontSize: 11 }}>Gusa kupakia picha au faili</p>
                </div>
                <button type="submit" style={{ width: "100%", background: "#7c3aed", color: "white", border: "none", borderRadius: 12, height: 48, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
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
