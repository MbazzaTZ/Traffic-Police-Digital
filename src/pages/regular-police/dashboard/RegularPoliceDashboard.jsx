import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import {
  Search, FileText, ShieldAlert, MapPinned, FolderOpen,
  Siren, Activity, AlertTriangle, Clock
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const KPIS = [
  { value: "18", label: "Open Incidents",   sw: "Matukio Wazi",     color: "#DC2626" },
  { value: "07", label: "Arrests Today",    sw: "Kukamatwa Leo",    color: "#0D3477" },
  { value: "04", label: "Detentions",       sw: "Vizuizi",          color: "#D97706" },
  { value: "12", label: "Active Patrols",   sw: "Doria Zinazoendelea", color: "#059669" },
  { value: "09", label: "Evidence Items",   sw: "Vitu vya Ushahidi", color: "#7C3AED" },
];

const ACTIONS = [
  { icon: Search,      label: "Search Person",   sw: "Tafuta Mtu",        path: "/person-search", color: "#0D3477" },
  { icon: FileText,    label: "New Incident",    sw: "Tukio Jipya",       path: "/incidents",     color: "#059669" },
  { icon: ShieldAlert, label: "Record Arrest",   sw: "Rekodi Kukamatwa",  path: "/arrests",       color: "#DC2626" },
  { icon: MapPinned,   label: "Start Patrol",    sw: "Anza Doria",        path: "/patrols",       color: "#D97706" },
  { icon: FolderOpen,  label: "Upload Evidence", sw: "Pakia Ushahidi",    path: "/evidence",      color: "#7C3AED" },
  { icon: Siren,       label: "Emergency Alert", sw: "Dharura",           path: "/alerts",        color: "#DC2626" },
  { icon: FileText,    label: "PF3 Form",        sw: "Fomu PF3",          path: "/incidents",     color: "#0891B2" },
  { icon: Activity,    label: "Daily Report",    sw: "Ripoti ya Leo",     path: "/incidents",     color: "#475569" },
];

const CHART = [
  { day: "Mon", n: 4 }, { day: "Tue", n: 7 }, { day: "Wed", n: 3 },
  { day: "Thu", n: 9 }, { day: "Fri", n: 6 }, { day: "Sat", n: 12 }, { day: "Sun", n: 5 },
];

const INCIDENTS = [
  { id: "INC-1001", type: "Theft",      status: "Open",          loc: "Makambako Mkt", t: "08:42", sc: "badge-danger" },
  { id: "INC-1002", type: "Assault",    status: "Assigned",      loc: "Njombe Rd",     t: "09:15", sc: "badge-blue" },
  { id: "INC-1003", type: "Burglary",   status: "Investigating", loc: "Mafinga",       t: "07:30", sc: "badge-success" },
  { id: "INC-1004", type: "Disturbance",status: "Closed",        loc: "Bus Stand",     t: "06:00", sc: "badge-gray" },
];

export default function RegularPoliceDashboard() {
  const nav = useNavigate();

  return (
    <DashboardLayout pageTitle="Dashboard" pageTitle2="Dashibodi">
      {/* Command Banner */}
      <div className="cmd-banner">
        <div className="cmd-officer">
          <img
            src="/avatars/officer-01.jpg"
            alt="Officer"
            className="cmd-avatar"
            onError={e => {
              e.currentTarget.src = "";
              e.currentTarget.style.background = "#14489E";
            }}
          />
          <div>
            <div className="cmd-role-tag">Regular Police Officer · Afisa wa Kawaida</div>
            <div className="cmd-name">Inspector David Mbaza</div>
            <div className="cmd-detail">Badge: TZP-2026-00124 · Makambako Police Station · Njombe District</div>
          </div>
        </div>
        <div className="cmd-chips">
          <div className="cmd-chip">🟢 On Duty</div>
          <div className="cmd-chip">📍 GPS Active</div>
          <div className="cmd-chip">✅ Device Verified</div>
          <div className="cmd-chip">🔒 Encrypted</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {KPIS.map(k => (
          <div className="kpi-card" key={k.label} style={{ borderTopColor: k.color }}>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-sw">{k.sw}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-hd">
        <div>
          <span className="section-title">Quick Actions</span>
          <span className="section-sw">Vitendo vya Haraka</span>
        </div>
      </div>

      <div className="action-grid">
        {ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} className="action-tile" onClick={() => nav(a.path)}>
              <div className="action-icon" style={{ background: a.color + "18" }}>
                <Icon size={22} color={a.color} />
              </div>
              <div className="action-label">{a.label}</div>
              <div className="action-sw">{a.sw}</div>
            </button>
          );
        })}
      </div>

      {/* Tasks + Alert */}
      <div className="two-col" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="panel-hd">
            <div>
              <div className="card-title">Assigned Tasks</div>
              <div className="card-sub">Kazi Zilizopewa</div>
            </div>
          </div>
          <div className="panel-body">
            {[
              { p: "HIGH", ps: "task-h", level: "task-high", task: "Patrol Sector A – Makambako Central", due: "Due: 14:00 Today", note: "Assigned by OCS Makambako" },
              { p: "MEDIUM", ps: "task-m", level: "task-medium", task: "Follow Up: INC-2026-008", due: "Due: Tomorrow 09:00", note: "CID Coordination Required" },
              { p: "LOW", ps: "task-l", level: "task-low", task: "Submit Weekly Activity Report", due: "Due: Friday 17:00", note: "Station Commander Review" },
            ].map((t, i) => (
              <div key={i} className={`task-card ${t.level}`}>
                <div className={`task-priority ${t.ps}`}>{t.p}</div>
                <div className="task-name">{t.task}</div>
                <div className="task-meta">
                  <Clock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{t.due} · {t.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ borderTopColor: "#DC2626" }}>
          <div className="panel-hd">
            <div>
              <div className="card-title" style={{ color: "#DC2626" }}>⚠ Alert Center</div>
              <div className="card-sub">Kituo cha Tahadhari</div>
            </div>
            <span className="badge badge-danger">3 Active</span>
          </div>
          <div className="panel-body">
            <div className="alert-profile-card">
              <img
                src="/wanted/wanted-01.jpg"
                alt="Suspect"
                className="alert-photo"
                onError={e => { e.currentTarget.src = "/police-logo.png"; e.currentTarget.style.objectFit = "contain"; e.currentTarget.style.background = "#F1F5F9"; }}
              />
              <div>
                <span className="badge badge-danger" style={{ marginBottom: 8, display: "inline-flex" }}>
                  <AlertTriangle size={11} /> WANTED · ANAHITAJIKA
                </span>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#0D3477", margin: "6px 0 4px" }}>JUMA ABDALLAH</div>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 3 }}>Armed Robbery · Wizi kwa Silaha</div>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 3 }}>Last seen: Njombe Bus Terminal</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>⚠ Approach with extreme caution · 15 mins ago</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => nav("/person-search")}>
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Table */}
      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="panel-hd">
            <div>
              <div className="card-title">7-Day Incident Trend</div>
              <div className="card-sub">Matukio ya Siku 7</div>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={CHART}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0D3477" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0D3477" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Area type="monotone" dataKey="n" name="Incidents" stroke="#0D3477" strokeWidth={2.5} fill="url(#g)" dot={{ fill: "#0D3477", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <div>
              <div className="card-title">Recent Incidents</div>
              <div className="card-sub">Matukio ya Hivi Karibuni</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav("/incidents")}>View All</button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th><th>Type</th><th>Status</th><th>Location</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {INCIDENTS.map(r => (
                <tr key={r.id} onClick={() => nav("/incidents")}>
                  <td style={{ fontWeight: 700, color: "#0D3477" }}>{r.id}</td>
                  <td>{r.type}</td>
                  <td><span className={`badge ${r.sc}`}>{r.status}</span></td>
                  <td style={{ color: "#64748B" }}>{r.loc}</td>
                  <td style={{ color: "#94A3B8" }}>{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
