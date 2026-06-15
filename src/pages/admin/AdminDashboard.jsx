import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { Users, Building2, Shield, MapPin, UserPlus, TrendingUp, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const KPIS = [
  { v: "1,247", label: "Total Officers",    sw: "Maafisa Wote",       color: "#7C3AED", icon: Users },
  { v: "186",   label: "Police Stations",   sw: "Vituo vya Polisi",   color: "#0D3477", icon: Building2 },
  { v: "31",    label: "Regions",           sw: "Mikoa",              color: "#059669", icon: MapPin },
  { v: "9",     label: "Active Roles",      sw: "Majukumu Yanayotumika", color: "#D97706", icon: Shield },
  { v: "23",    label: "Pending Accounts",  sw: "Akaunti Zinasubiri", color: "#DC2626", icon: AlertTriangle },
];

const RECENT_OFFICERS = [
  { name: "Constable Mary Kileo",    badge: "TZP-2026-00201", role: "Regular Officer", station: "Makambako",   status: "Active",   sc: "#059669", sbg: "#F0FDF4" },
  { name: "Sergeant John Mwamba",    badge: "TZP-2026-00198", role: "Traffic Officer", station: "Njombe",      status: "Active",   sc: "#059669", sbg: "#F0FDF4" },
  { name: "Corporal Amina Said",     badge: "TZP-2026-00195", role: "CID Officer",     station: "Iringa",      status: "Pending",  sc: "#D97706", sbg: "#FFFBEB" },
  { name: "Inspector Peter Nkosi",   badge: "TZP-2026-00189", role: "OCS",             station: "Mbeya",       status: "Active",   sc: "#059669", sbg: "#F0FDF4" },
  { name: "ASP Grace Mtui",          badge: "TZP-2026-00177", role: "OCD",             station: "Dodoma HQ",   status: "Active",   sc: "#059669", sbg: "#F0FDF4" },
];

const ACTIVITY = [
  { action: "New officer created",      detail: "Const. Mary Kileo · Makambako Station",  time: "2 mins ago",  icon: UserPlus,    color: "#059669" },
  { action: "Station updated",          detail: "Njombe Central Station — OCS assigned",  time: "15 mins ago", icon: Building2,   color: "#0D3477" },
  { action: "Role modified",            detail: "Traffic Officer — new permissions added", time: "1 hr ago",    icon: Shield,      color: "#7C3AED" },
  { action: "Account suspended",        detail: "Badge TZP-2025-00043 — Under review",    time: "2 hrs ago",   icon: AlertTriangle, color: "#DC2626" },
  { action: "Region district updated",  detail: "Ruvuma Region — 3 districts added",      time: "3 hrs ago",   icon: MapPin,      color: "#D97706" },
];

const card = { background: "white", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,.05)" };

export default function AdminDashboard() {
  const nav = useNavigate();
  return (
    <AdminLayout pageTitle="Dashboard" pageTitle2="Dashibodi ya Usimamizi">

      {/* Welcome banner */}
      <div style={{
        background: "linear-gradient(135deg,#1a0533,#2d0a52,#3d1270)",
        borderRadius: 18, padding: "22px 28px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16, marginBottom: 22,
        boxShadow: "0 8px 28px rgba(61,18,112,.35)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#FFD700,#FFA500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 26, fontWeight: 900 }}>A</span>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: .55, fontWeight: 700, letterSpacing: 1, marginBottom: 3, textTransform: "uppercase" }}>System Administrator · Msimamizi wa Mfumo</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Admin Officer</div>
            <div style={{ fontSize: 13, opacity: .7, marginTop: 3 }}>TZP-ADMIN-001 · National HQ · Full System Access</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Create Officer", path: "/admin/create-user", bg: "#FFD700", color: "#1a0533" },
            { label: "Add Station",    path: "/admin/stations",    bg: "rgba(255,255,255,.15)", color: "white" },
          ].map(b => (
            <button key={b.label} onClick={() => nav(b.path)}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: b.bg, color: b.color, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
        {KPIS.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ ...card, padding: "18px 16px", textAlign: "center", borderTop: `4px solid ${k.color}` }}>
              <Icon size={22} color={k.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 34, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 5 }}>{k.v}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{k.label}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{k.sw}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1a0533", marginBottom: 12 }}>Quick Actions · Vitendo vya Haraka</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        {[
          { icon: UserPlus,   label: "Create Officer",    sw: "Unda Afisa",         path: "/admin/create-user", color: "#7C3AED" },
          { icon: Building2,  label: "Add Station",       sw: "Ongeza Kituo",       path: "/admin/stations",    color: "#0D3477" },
          { icon: MapPin,     label: "Manage Regions",    sw: "Simamia Mikoa",      path: "/admin/regions",     color: "#059669" },
          { icon: Shield,     label: "Manage Roles",      sw: "Simamia Majukumu",   path: "/admin/roles",       color: "#D97706" },
          { icon: Users,      label: "All Officers",      sw: "Maafisa Wote",       path: "/admin/officers",    color: "#0891B2" },
          { icon: Activity,   label: "System Settings",   sw: "Mipangilio ya Mfumo",path: "/admin/settings",    color: "#475569" },
          { icon: TrendingUp, label: "Reports",           sw: "Ripoti",             path: "/admin",             color: "#059669" },
          { icon: AlertTriangle, label: "Pending Accounts", sw: "Zinasubiri",      path: "/admin/officers",    color: "#DC2626" },
        ].map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => nav(a.path)}
              style={{ ...card, padding: "16px 10px", cursor: "pointer", border: "1.5px solid #E2E8F0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: ".18s", textAlign: "center" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = a.color; e.currentTarget.style.boxShadow = `0 6px 18px ${a.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} color={a.color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{a.label}</div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>{a.sw}</div>
            </button>
          );
        })}
      </div>

      {/* Table + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent Officers */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a0533" }}>Recently Created Officers</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Maafisa Waliobuniwa Hivi Karibuni</div>
            </div>
            <button onClick={() => nav("/admin/officers")} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#475569" }}>View All</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Name","Badge","Role","Station","Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_OFFICERS.map((o, i) => (
                <tr key={i} style={{ borderBottom: i < RECENT_OFFICERS.length - 1 ? "1px solid #F1F5F9" : "none", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "11px 14px", fontWeight: 700, fontSize: 13, color: "#1E293B" }}>{o.name}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: "#7C3AED", fontWeight: 600 }}>{o.badge}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#475569" }}>{o.role}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748B" }}>{o.station}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: o.sbg, color: o.sc, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity Log */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a0533" }}>Recent Activity · Shughuli za Hivi Karibuni</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>System audit log</div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {ACTIVITY.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={a.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{a.action}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{a.detail}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
                    <Clock size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />{a.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
