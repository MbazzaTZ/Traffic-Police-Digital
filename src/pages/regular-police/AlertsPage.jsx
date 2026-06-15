import DashboardLayout from "../../layouts/DashboardLayout";
import { AlertTriangle, Bell, Radio, CheckCircle } from "lucide-react";

const alerts = [
  { id: "ALT-001", type: "WANTED PERSON", typeSw: "ANAHITAJIKA", title: "JUMA ABDALLAH MWALIMU", desc: "Armed Robbery suspect. Last seen at Njombe Bus Terminal. Approach with extreme caution.", level: "critical", time: "15 mins ago", photo: "/wanted/wanted-01.jpg" },
  { id: "ALT-002", type: "BOLO",          typeSw: "TAFUTA GARI", title: "Vehicle: T 241 BRT – Red Toyota Premio", desc: "Linked to robbery. Driver armed. Do not attempt to stop alone.", level: "high",     time: "1 hr ago",  photo: null },
  { id: "ALT-003", type: "MISSING PERSON",typeSw: "MTU ALIYEPOTEA", title: "GRACE JOHN – 8 years old", desc: "Missing from Makambako North since 14:00. Last seen in school uniform.", level: "high",    time: "2 hrs ago", photo: "/suspects/suspect-01.jpg" },
  { id: "ALT-004", type: "BRIEFING",      typeSw: "HABARI",      title: "Station Morning Briefing – 16 June 2026", desc: "All officers report to station at 07:30 for briefing by OCS.", level: "info",     time: "3 hrs ago", photo: null },
];

const levelStyle = {
  critical: { bg: "#fef2f2", border: "#fecaca", badge: "#dc2626", icon: "🔴" },
  high:     { bg: "#fffbeb", border: "#fde68a", badge: "#d97706", icon: "🟡" },
  info:     { bg: "#eff6ff", border: "#bfdbfe", badge: "#1d4ed8", icon: "🔵" },
};

export default function AlertsPage() {
  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: 0 }}>Alerts · <span style={{ fontWeight: 500, color: "#94a3b8", fontSize: 22 }}>Tahadhari</span></h1>
          <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>Live operational alerts from Control Room · Tahadhari za Wakati Halisi</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
            🔴 {alerts.filter(a => a.level === "critical").length} Critical
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#d97706" }}>
            🟡 {alerts.filter(a => a.level === "high").length} High
          </div>
        </div>
      </div>

      {/* RADIO BANNER */}
      <div style={{ background: "linear-gradient(135deg, #082A63, #0D3477)", borderRadius: 18, padding: "16px 24px", marginBottom: 24, color: "white", display: "flex", alignItems: "center", gap: 12 }}>
        <Radio size={20} />
        <div>
          <span style={{ fontWeight: 700 }}>Control Room Live · </span>
          <span style={{ opacity: 0.8, fontSize: 13 }}>Makambako District Radio Channel 4 · All units standby</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span style={{ background: "rgba(255,255,255,.1)", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>🔴 LIVE</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {alerts.map(a => {
          const style = levelStyle[a.level] || levelStyle.info;
          return (
            <div key={a.id} style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {a.photo && (
                  <img src={a.photo} alt="Alert" style={{ width: 80, height: 100, objectFit: "cover", borderRadius: 12, border: "2px solid " + style.border }}
                    onError={e => { e.target.style.display = "none"; }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ background: style.badge, color: "white", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {style.icon} {a.type}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{a.id}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>{a.time}</span>
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#0D3477" }}>{a.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{a.desc}</p>
                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button style={{ background: "#0D3477", color: "white", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                      Acknowledge · Kubali
                    </button>
                    {a.level !== "info" && (
                      <button style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                        Escalate · Pindisha
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
