import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import {
  Search, FileText, ShieldAlert, MapPinned,
  FolderOpen, Siren, TrendingUp, Clock,
  AlertTriangle, CheckCircle, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const kpis = [
  { value: "18", label: "Open Incidents", labelSw: "Matukio Wazi", color: "#dc2626", bg: "#fef2f2" },
  { value: "07", label: "Arrests Today",  labelSw: "Kukamatwa Leo", color: "#0D3477", bg: "#eff6ff" },
  { value: "04", label: "Detentions",     labelSw: "Vizuizi",       color: "#d97706", bg: "#fffbeb" },
  { value: "12", label: "Patrols Active", labelSw: "Doria Zinazoendelea", color: "#059669", bg: "#f0fdf4" },
  { value: "09", label: "Evidence Items", labelSw: "Vitu vya Ushahidi",   color: "#7c3aed", bg: "#f5f3ff" },
];

const actions = [
  { icon: Search,     label: "Search Person",   labelSw: "Tafuta Mtu",     path: "/person-search", color: "#0D3477" },
  { icon: FileText,   label: "New Incident",     labelSw: "Tukio Jipya",    path: "/incidents",     color: "#059669" },
  { icon: ShieldAlert,label: "Record Arrest",    labelSw: "Rekodi Kukamatwa", path: "/arrests",     color: "#dc2626" },
  { icon: MapPinned,  label: "Start Patrol",     labelSw: "Anza Doria",     path: "/patrols",       color: "#d97706" },
  { icon: FolderOpen, label: "Upload Evidence",  labelSw: "Pakia Ushahidi", path: "/evidence",      color: "#7c3aed" },
  { icon: Siren,      label: "Emergency Alert",  labelSw: "Tahadhari ya Dharura", path: "/alerts",  color: "#dc2626" },
  { icon: FileText,   label: "PF3 Form",         labelSw: "Fomu PF3",       path: "/incidents",     color: "#0891b2" },
  { icon: Activity,   label: "Daily Report",     labelSw: "Ripoti ya Kila Siku", path: "/incidents", color: "#475569" },
];

const tasks = [
  { priority: "HIGH", prioritySw: "JUU", task: "Patrol Sector A – Makambako Central", time: "Due: 14:00 Today", note: "Assigned by OCS Makambako", level: "high" },
  { priority: "MEDIUM", prioritySw: "KATI", task: "Follow Up: INC-2026-008", time: "Due: Tomorrow 09:00", note: "CID Coordination Required", level: "medium" },
  { priority: "LOW", prioritySw: "CHINI", task: "Submit Weekly Activity Report", time: "Due: Friday 17:00", note: "Station Commander Review", level: "low" },
];

const recentIncidents = [
  { id: "INC-1001", type: "Theft / Wizi",    status: "Open",         statusSw: "Wazi",         location: "Makambako Mkt", time: "08:42" },
  { id: "INC-1002", type: "Assault / Shambulio", status: "Assigned",  statusSw: "Imepewa",     location: "Njombe Rd",    time: "09:15" },
  { id: "INC-1003", type: "Burglary / Uvunjaji", status: "Investigating", statusSw: "Uchunguzi", location: "Mafinga",   time: "07:30" },
  { id: "INC-1004", type: "Disturbance / Fujo",  status: "Closed",    statusSw: "Imefungwa",   location: "Bus Stand",    time: "06:00" },
];

const chartData = [
  { day: "Mon", incidents: 4 },
  { day: "Tue", incidents: 7 },
  { day: "Wed", incidents: 3 },
  { day: "Thu", incidents: 9 },
  { day: "Fri", incidents: 6 },
  { day: "Sat", incidents: 12 },
  { day: "Sun", incidents: 5 },
];

function statusStyle(s) {
  if (s === "Open")          return { background: "#fef2f2", color: "#b91c1c" };
  if (s === "Assigned")      return { background: "#eff6ff", color: "#1d4ed8" };
  if (s === "Investigating") return { background: "#f0fdf4", color: "#166534" };
  return                            { background: "#f1f5f9", color: "#475569" };
}

export default function RegularPoliceDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      {/* COMMAND BANNER */}
      <div className="command-banner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div className="officer-section" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src="/avatars/officer-01.jpg" alt="Officer" className="officer-avatar"
            onError={e => { e.target.style.display = "none"; }} />
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>REGULAR POLICE OFFICER · AFISA WA KAWAIDA</div>
            <h2 style={{ margin: "4px 0" }}>Inspector David Mbaza</h2>
            <p style={{ opacity: 0.8, margin: "2px 0" }}>Badge: TZP-2026-00124</p>
            <p style={{ opacity: 0.65, fontSize: 13 }}>Makambako Police Station · Njombe District</p>
          </div>
        </div>
        <div className="status-grid">
          <div className="status-chip online">🟢 On Duty</div>
          <div className="status-chip gps">📍 GPS Active</div>
          <div className="status-chip device">✅ Device Verified</div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid" style={{ marginTop: 20 }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTopColor: k.color }}>
            <h1 style={{ color: k.color, fontSize: 42, fontWeight: 800, margin: 0 }}>{k.value}</h1>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{k.labelSw}</div>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="section-header" style={{ marginTop: 28 }}>
        Quick Actions · <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>Vitendo vya Haraka</span>
      </div>
      <div className="action-grid">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} className="action-tile" onClick={() => navigate(a.path)}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: a.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} color={a.color} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{a.label}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.labelSw}</div>
            </button>
          );
        })}
      </div>

      {/* TASKS + ALERT */}
      <div className="dual-grid">
        {/* TASKS */}
        <div className="panel">
          <h3 style={{ marginBottom: 4 }}>Assigned Tasks · <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Kazi Zilizopewa</span></h3>
          {tasks.map((t, i) => (
            <div key={i} className={`task-card ${t.level}`} style={{ marginTop: 14 }}>
              <div className="task-priority" style={{
                display: "inline-block", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: t.level === "high" ? "#fee2e2" : t.level === "medium" ? "#fef3c7" : "#dbeafe",
                color: t.level === "high" ? "#b91c1c" : t.level === "medium" ? "#92400e" : "#1d4ed8"
              }}>
                {t.priority} · {t.prioritySw}
              </div>
              <h4 style={{ margin: "8px 0 4px" }}>{t.task}</h4>
              <p style={{ fontSize: 13, color: "#475569", margin: "2px 0" }}><Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{t.time}</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>{t.note}</p>
            </div>
          ))}
        </div>

        {/* ALERT */}
        <div className="panel" style={{ borderTopColor: "#dc2626" }}>
          <h3 style={{ marginBottom: 4, color: "#dc2626" }}>⚠ Alert Center · <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Kituo cha Tahadhari</span></h3>
          <div className="alert-profile">
            <img src="/wanted/wanted-01.jpg" alt="Suspect" className="alert-photo"
              onError={e => { e.target.src = "/police-logo.png"; e.target.style.objectFit = "contain"; }} />
            <div className="alert-details">
              <div className="alert-badge">⚠ WANTED · ANAHITAJIKA</div>
              <h4>JUMA ABDALLAH</h4>
              <p><strong>Crime:</strong> Armed Robbery / Wizi kwa Silaha</p>
              <p><strong>Last Seen:</strong> Njombe Bus Terminal</p>
              <p style={{ color: "#94a3b8", fontSize: 12 }}>Reported 15 mins ago · <AlertTriangle size={12} style={{ verticalAlign: "middle" }} /> APPROACH WITH CAUTION</p>
              <button className="alert-action" onClick={() => navigate("/person-search")}>
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* INCIDENT CHART + TABLE */}
      <div className="dual-grid" style={{ marginTop: 0 }}>
        <div className="panel">
          <h3 style={{ marginBottom: 16 }}>7-Day Incidents · <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Matukio ya Siku 7</span></h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D3477" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D3477" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="incidents" stroke="#0D3477" strokeWidth={2} fill="url(#incGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>Recent Incidents · <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Matukio ya Hivi Karibuni</span></h3>
            <button className="primary-btn" style={{ fontSize: 12, padding: "8px 14px" }} onClick={() => navigate("/incidents")}>
              View All
            </button>
          </div>
          <table className="police-table">
            <thead>
              <tr style={{ fontSize: 12, color: "#64748b" }}>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map(inc => (
                <tr key={inc.id} style={{ fontSize: 13, cursor: "pointer" }} onClick={() => navigate("/incidents")}>
                  <td style={{ fontWeight: 700, color: "#0D3477" }}>{inc.id}</td>
                  <td>{inc.type}</td>
                  <td>
                    <span style={{ ...statusStyle(inc.status), padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {inc.status}
                    </span>
                  </td>
                  <td>{inc.location}</td>
                  <td style={{ color: "#94a3b8" }}>{inc.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
