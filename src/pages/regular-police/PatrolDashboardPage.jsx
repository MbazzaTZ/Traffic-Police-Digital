import { useState, useRef } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { MapPin, Play, Square, CheckCircle, Navigation, Shield, AlertTriangle } from "lucide-react";

const SECTORS = [
  { id:"SEC-A", name:"Sector A – Makambako Central",     off:"Insp. Mbaza",  start:"08:00", status:"Active",    sc:"badge-success" },
  { id:"SEC-B", name:"Sector B – Market & Bus Terminal", off:"Cpl. Kilosa",  start:"08:00", status:"Active",    sc:"badge-success" },
  { id:"SEC-C", name:"Sector C – Northern Residential",  off:"Sgt. Mwenda",  start:"—",     status:"Standby",   sc:"badge-warning" },
  { id:"SEC-D", name:"Sector D – Industrial Area",       off:"Const. Ali",   start:"06:00", status:"Completed", sc:"badge-gray" },
];

const CPS = [
  { id:"CP-001", loc:"Makambako Bypass Junction", time:"09:15", v:24, inc:0, sc:"badge-success" },
  { id:"CP-002", loc:"Njombe Road Entry",         time:"08:30", v:41, inc:1, sc:"badge-success" },
  { id:"CP-003", loc:"Mafinga Turnoff",           time:"07:00", v:18, inc:0, sc:"badge-gray" },
];

export default function PatrolDashboardPage() {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");
  const timerRef = useRef(null);

  function startPatrol() {
    setActive(true);
    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      const d = Date.now() - t0;
      const h = String(Math.floor(d/3600000)).padStart(2,"0");
      const m = String(Math.floor((d%3600000)/60000)).padStart(2,"0");
      const s = String(Math.floor((d%60000)/1000)).padStart(2,"0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
  }

  function stopPatrol() {
    clearInterval(timerRef.current);
    setActive(false);
    setElapsed("00:00:00");
  }

  return (
    <DashboardLayout pageTitle="Patrols" pageTitle2="Doria">
      <div className="page-hd">
        <h1 className="page-title">Patrols <span className="page-title-sw">· Doria</span></h1>
        <p className="page-sub">Monitor and manage patrol operations across sectors</p>
      </div>

      {/* Patrol Control Banner */}
      <div className="cmd-banner" style={{ marginBottom: 18 }}>
        <div>
          <div className="cmd-role-tag">MY PATROL STATUS · HALI YA DORIA YANGU</div>
          <div className="cmd-name">Sector A – Makambako Central</div>
          <div className="cmd-detail">
            <MapPin size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
            GPS Active · Makambako Police Station · Njombe District
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {active && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", letterSpacing: 2 }}>{elapsed}</div>
              <div style={{ fontSize: 11, opacity: .65 }}>Patrol Duration · Muda wa Doria</div>
            </div>
          )}
          <button
            onClick={active ? stopPatrol : startPatrol}
            style={{
              background: active ? "#DC2626" : "#16A34A",
              color: "white", border: "none", borderRadius: "var(--radius-md)",
              padding: "14px 24px", display: "flex", gap: 8, alignItems: "center",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>
            {active ? <><Square size={18} /> End Patrol</> : <><Play size={18} /> Start Patrol · Anza Doria</>}
          </button>
        </div>
        {active && (
          <div style={{ position: "absolute", bottom: 18, left: 28, display: "flex", gap: 10 }}>
            {["📍 GPS Tracking Active", "🔴 LIVE BROADCAST", "📡 Reporting to Station"].map(c => (
              <div key={c} className="cmd-chip">{c}</div>
            ))}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="stats-row stats-4" style={{ marginBottom: 18 }}>
        {[
          { label:"Active Patrols",   sw:"Doria Zinazoendelea", v: SECTORS.filter(s=>s.status==="Active").length,  c:"#16A34A", icon: Navigation },
          { label:"Sectors Total",    sw:"Sekta Zote",          v: SECTORS.length,                                 c:"#0D3477", icon: MapPin },
          { label:"Checkpoints",      sw:"Vizuizi",             v: CPS.length,                                     c:"#D97706", icon: Shield },
          { label:"Incidents Found",  sw:"Matukio Yaliyopatikana", v: CPS.reduce((a,c)=>a+c.inc,0),              c:"#DC2626", icon: AlertTriangle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-box" style={{ borderTopColor: s.c }}>
              <Icon size={20} color={s.c} style={{ marginBottom: 6 }} />
              <div className="stat-box-value" style={{ color: s.c }}>{s.v}</div>
              <div className="stat-box-label">{s.label}</div>
              <div className="stat-box-sw">{s.sw}</div>
            </div>
          );
        })}
      </div>

      <div className="two-col">
        {/* Map placeholder */}
        <div className="panel">
          <div className="panel-hd">
            <div className="card-title">Live Patrol Map · Ramani ya Doria</div>
            {active && <span className="badge badge-danger">🔴 LIVE</span>}
          </div>
          <div style={{
            height: 320,
            background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12
          }}>
            <MapPin size={52} color="#0D3477" style={{ opacity: .3 }} />
            <div style={{ textAlign: "center", color: "#475569" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Interactive Map</div>
              <div style={{ fontSize: 12, opacity: .65 }}>Google Maps / OpenStreetMap integration</div>
              <div style={{ fontSize: 11, opacity: .45, marginTop: 4 }}>-9.043°S, 34.897°E · Makambako</div>
            </div>
            {active && (
              <div style={{ background: "#0D3477", color: "white", padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                📍 BROADCASTING YOUR LOCATION
              </div>
            )}
          </div>
        </div>

        {/* Sectors */}
        <div className="panel">
          <div className="panel-hd">
            <div className="card-title">Patrol Sectors · Sekta za Doria</div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SECTORS.map(s => (
              <div key={s.id} style={{ background: "var(--gray-50)", borderRadius: "var(--radius-sm)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue-700)" }}>{s.id}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>Start: {s.start} · {s.off}</div>
                </div>
                <span className={`badge ${s.sc}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkpoints */}
      <div className="tbl-wrap" style={{ marginTop: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--gray-100)" }}>
          <span className="card-title">Today's Checkpoints · Vizuizi vya Leo</span>
        </div>
        <table className="tbl">
          <thead>
            <tr><th>ID</th><th>Location</th><th>Start Time</th><th>Vehicles</th><th>Incidents</th><th>Status</th></tr>
          </thead>
          <tbody>
            {CPS.map(cp => (
              <tr key={cp.id}>
                <td style={{ fontWeight: 700, color: "var(--blue-700)" }}>{cp.id}</td>
                <td>{cp.loc}</td>
                <td style={{ color: "var(--gray-500)" }}>{cp.time}</td>
                <td style={{ fontWeight: 700 }}>{cp.v}</td>
                <td>
                  {cp.inc > 0
                    ? <span className="badge badge-danger">{cp.inc}</span>
                    : <CheckCircle size={17} color="#16A34A" />}
                </td>
                <td><span className={`badge ${cp.sc}`}>{cp.inc > 0 ? "Incident" : "Clear"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
