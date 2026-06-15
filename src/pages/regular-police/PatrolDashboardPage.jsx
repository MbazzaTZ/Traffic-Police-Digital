import { useState, useRef } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { MapPin, Play, Square, Navigation } from "lucide-react";

export default function PatrolDashboardPage() {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [patrols, setPatrols] = useState([]);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  function startPatrol() {
    setActive(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const d = Date.now() - startRef.current;
      const h = String(Math.floor(d/3600000)).padStart(2,"0");
      const m = String(Math.floor((d%3600000)/60000)).padStart(2,"0");
      const s = String(Math.floor((d%60000)/1000)).padStart(2,"0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
  }

  function stopPatrol() {
    clearInterval(timerRef.current);
    const duration = elapsed;
    setPatrols(p => [{ id:`PAT-${Date.now()}`, start:new Date(startRef.current).toLocaleString("en-GB"), duration, status:"Completed" }, ...p]);
    setActive(false);
    setElapsed("00:00:00");
  }

  return (
    <DashboardLayout pageTitle="Patrols" pageTitle2="Doria">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Patrols <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Doria</span></h1>
        <p style={{ color:"#64748B", marginTop:3 }}>Monitor and manage patrol operations</p>
      </div>

      {/* Patrol Control */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#082A63,#0D3477)", borderRadius:18, padding:"22px 28px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:20, boxShadow:"0 8px 28px rgba(3,16,43,.3)" }}>
        <div>
          <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>Patrol Control · Udhibiti wa Doria</div>
          <div style={{ fontSize:20, fontWeight:800 }}>{active ? "Patrol in Progress..." : "No Active Patrol"}</div>
          <div style={{ fontSize:13, opacity:.7, marginTop:3 }}>
            <MapPin size={12} style={{ verticalAlign:"middle", marginRight:4 }} />
            GPS {active ? "Broadcasting" : "Ready"}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          {active && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:32, fontWeight:900, fontFamily:"monospace", letterSpacing:2 }}>{elapsed}</div>
              <div style={{ fontSize:11, opacity:.65 }}>Duration</div>
            </div>
          )}
          <button onClick={active ? stopPatrol : startPatrol}
            style={{ background:active?"#DC2626":"#16A34A", color:"white", border:"none", borderRadius:12, padding:"13px 22px", display:"flex", gap:8, alignItems:"center", fontWeight:700, fontSize:14, cursor:"pointer" }}>
            {active ? <><Square size={17}/> End Patrol</> : <><Play size={17}/> Start Patrol · Anza Doria</>}
          </button>
        </div>
      </div>

      {/* Map placeholder */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", marginBottom:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Live Map · Ramani ya Doria</div>
          {active && <span style={{ background:"#FEF2F2", color:"#DC2626", padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>🔴 LIVE</span>}
        </div>
        <div style={{ height:300, background:"linear-gradient(135deg,#f0f9f0,#d4ecd4)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
          <Navigation size={48} color="#0D3477" style={{ opacity:.25 }} />
          <div style={{ textAlign:"center", color:"#475569" }}>
            <div style={{ fontWeight:700 }}>Map Integration · Ramani</div>
            <div style={{ fontSize:12, opacity:.65 }}>Google Maps / OpenStreetMap</div>
            {active && <div style={{ marginTop:8, background:"#0D3477", color:"white", padding:"6px 16px", borderRadius:999, fontSize:12, fontWeight:700 }}>📍 BROADCASTING LOCATION</div>}
          </div>
        </div>
      </div>

      {/* Patrol History */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Patrol History · Historia ya Doria</div>
        </div>
        {patrols.length === 0 ? (
          <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Navigation size={36} style={{ opacity:.2, marginBottom:10 }} />
            <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No patrols recorded yet</div>
            <div style={{ fontSize:12, marginTop:4 }}>Doria haziajaandikwa · Start your first patrol above</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC" }}>
                {["ID","Started","Duration","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patrols.map((p, i) => (
                <tr key={p.id} style={{ borderBottom:i<patrols.length-1?"1px solid #F1F5F9":"none" }}>
                  <td style={{ padding:"12px 14px", fontWeight:700, color:"#0D3477", fontSize:13 }}>{p.id.slice(-8)}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#475569" }}>{p.start}</td>
                  <td style={{ padding:"12px 14px", fontWeight:700, fontSize:13, fontFamily:"monospace" }}>{p.duration}</td>
                  <td style={{ padding:"12px 14px" }}><span style={{ background:"#F0FDF4", color:"#16A34A", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
