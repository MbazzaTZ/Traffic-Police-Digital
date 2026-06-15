import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { MapPin, Play, Square, Clock, Shield, AlertTriangle, CheckCircle, Navigation } from "lucide-react";

const sectors = [
  { id: "SEC-A", name: "Sector A – Makambako Central", status: "Active", officer: "Insp. Mbaza", start: "08:00", lat: -9.043, lng: 34.897 },
  { id: "SEC-B", name: "Sector B – Market & Bus Terminal", status: "Active", officer: "Cpl. Kilosa", start: "08:00", lat: -9.050, lng: 34.899 },
  { id: "SEC-C", name: "Sector C – Northern Residential", status: "Standby", officer: "Sgt. Mwenda", start: "—", lat: -9.035, lng: 34.893 },
  { id: "SEC-D", name: "Sector D – Industrial Area",     status: "Completed", officer: "Const. Ali",  start: "06:00", lat: -9.055, lng: 34.905 },
];

const checkpoints = [
  { id: "CP-001", location: "Makambako Bypass Junction", time: "09:15", vehicles: 24, incidents: 0, status: "Active" },
  { id: "CP-002", location: "Njombe Road Entry",         time: "08:30", vehicles: 41, incidents: 1, status: "Active" },
  { id: "CP-003", location: "Mafinga Turnoff",           time: "07:00", vehicles: 18, incidents: 0, status: "Completed" },
];

function statusStyle(s) {
  if (s === "Active")    return ["#f0fdf4", "#16a34a"];
  if (s === "Standby")   return ["#fffbeb", "#d97706"];
  if (s === "Completed") return ["#f1f5f9", "#475569"];
  return ["#f1f5f9", "#475569"];
}

export default function PatrolDashboardPage() {
  const [patrolActive, setPatrolActive] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [timer, setTimer] = useState(null);

  function startPatrol() {
    setPatrolActive(true);
    const start = Date.now();
    const t = setInterval(() => {
      const diff = Date.now() - start;
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    setTimer(t);
  }

  function stopPatrol() {
    setPatrolActive(false);
    clearInterval(timer);
    setElapsed("00:00:00");
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: 0 }}>Patrols · <span style={{ fontWeight: 500, color: "#94a3b8", fontSize: 22 }}>Doria</span></h1>
        <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>Monitor and manage patrol operations</p>
      </div>

      {/* PATROL CONTROL */}
      <div style={{
        background: "linear-gradient(135deg, #082A63, #0D3477, #14489E)",
        borderRadius: 24, padding: 28, marginBottom: 24, color: "white"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>MY PATROL STATUS · HALI YA DORIA YANGU</div>
            <h2 style={{ margin: 0, fontSize: 24 }}>Sector A – Makambako Central</h2>
            <p style={{ opacity: 0.8, margin: "6px 0 0", fontSize: 14 }}>
              <MapPin size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              GPS Active · Makambako Police Station
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {patrolActive && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace" }}>{elapsed}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Patrol Duration</div>
              </div>
            )}
            <button onClick={patrolActive ? stopPatrol : startPatrol}
              style={{
                background: patrolActive ? "#dc2626" : "#16a34a",
                color: "white", border: "none", borderRadius: 16,
                padding: "14px 24px", display: "flex", gap: 8, alignItems: "center",
                fontWeight: 700, fontSize: 16, cursor: "pointer"
              }}>
              {patrolActive ? <><Square size={20} /> End Patrol</> : <><Play size={20} /> Start Patrol · Anza Doria</>}
            </button>
          </div>
        </div>

        {patrolActive && (
          <div style={{ marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {["📍 GPS Tracking Active","🔴 LIVE","📡 Reporting to Station"].map(s => (
              <div key={s} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>{s}</div>
            ))}
          </div>
        )}
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Active Patrols",  labelSw: "Doria Zinazoendelea", value: sectors.filter(s => s.status === "Active").length, color: "#16a34a", icon: Navigation },
          { label: "Sectors Covered",labelSw: "Sekta Zilizofunikwa",  value: sectors.length,                                    color: "#0D3477", icon: MapPin },
          { label: "Checkpoints",    labelSw: "Vizuizi",              value: checkpoints.length,                                color: "#d97706", icon: Shield },
          { label: "Incidents Found",labelSw: "Matukio Yaliyopatikana", value: checkpoints.reduce((a,c) => a + c.incidents, 0), color: "#dc2626", icon: AlertTriangle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "white", borderRadius: 16, padding: 20, textAlign: "center", borderTop: `4px solid ${s.color}` }}>
              <Icon size={24} color={s.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.labelSw}</div>
            </div>
          );
        })}
      </div>

      {/* MAP PLACEHOLDER + SECTORS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* MAP */}
        <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#0D3477" }}>Live Patrol Map · Ramani ya Doria</h3>
            <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>🔴 LIVE</span>
          </div>
          <div style={{
            height: 340, background: "linear-gradient(135deg, #e8f4e8, #c8dfc8)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12
          }}>
            <MapPin size={48} color="#0D3477" style={{ opacity: 0.4 }} />
            <div style={{ textAlign: "center", color: "#475569" }}>
              <p style={{ fontWeight: 700 }}>Interactive Map</p>
              <p style={{ fontSize: 13, opacity: 0.7 }}>Google Maps / OpenStreetMap integration</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>GPS coordinates: -9.043°S, 34.897°E</p>
            </div>
            {patrolActive && (
              <div style={{ background: "#0D3477", color: "white", padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, animation: "pulse 2s infinite" }}>
                📍 YOUR LOCATION BROADCASTING
              </div>
            )}
          </div>
        </div>

        {/* SECTORS */}
        <div style={{ background: "white", borderRadius: 20, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#0D3477" }}>Patrol Sectors · Sekta za Doria</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sectors.map(s => {
              const [bg, fg] = statusStyle(s.status);
              return (
                <div key={s.id} style={{ background: "#f8fafc", borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0D3477" }}>{s.id}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Started: {s.start} · {s.officer}
                    </div>
                  </div>
                  <span style={{ background: bg, color: fg, padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{s.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHECKPOINTS */}
      <div style={{ background: "white", borderRadius: 20, marginTop: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0D3477" }}>Today's Checkpoints · Vizuizi vya Leo</h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID","Location","Start Time","Vehicles","Incidents","Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checkpoints.map(cp => {
              const [bg, fg] = statusStyle(cp.status);
              return (
                <tr key={cp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0D3477", fontSize: 13 }}>{cp.id}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{cp.location}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{cp.time}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700 }}>{cp.vehicles}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {cp.incidents > 0
                      ? <span style={{ background: "#fef2f2", color: "#dc2626", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{cp.incidents}</span>
                      : <CheckCircle size={18} color="#16a34a" />}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: bg, color: fg, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{cp.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
