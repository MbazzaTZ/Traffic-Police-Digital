import { useState, useEffect, useRef } from "react";
import TrafficLayout from "../../layouts/TrafficLayout";
import { Play, Square, Plus, Minus, Car, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function CheckpointsPage() {
  const { profile, stationName } = useCurrentUser();
  const [active,    setActive]    = useState(false);
  const [elapsed,   setElapsed]   = useState("00:00:00");
  const [counters,  setCounters]  = useState({ passed:0, checked:0, cited:0, arrested:0 });
  const [sessions,  setSessions]  = useState([]);
  const [location,  setLocation]  = useState("");
  const timerRef = useRef(null);
  const startRef = useRef(null);

  function startCP() {
    if (!location.trim()) { alert("Enter checkpoint location first"); return; }
    setActive(true); startRef.current = Date.now();
    timerRef.current = setInterval(()=>{
      const d = Date.now()-startRef.current;
      const h = String(Math.floor(d/3600000)).padStart(2,"0");
      const m = String(Math.floor((d%3600000)/60000)).padStart(2,"0");
      const s = String(Math.floor((d%60000)/1000)).padStart(2,"0");
      setElapsed(`${h}:${m}:${s}`);
    },1000);
  }

  async function stopCP() {
    clearInterval(timerRef.current);
    const duration = elapsed;
    const session = { location, duration, ...counters, date:new Date().toLocaleString("en-GB") };
    setSessions(p=>[session,...p]);
    setActive(false); setElapsed("00:00:00"); setCounters({passed:0,checked:0,cited:0,arrested:0});
  }

  const adj = (key,delta) => () => setCounters(c=>({...c,[key]:Math.max(0,c[key]+delta)}));

  const Counter = ({ label, sw, k, color }) => (
    <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:18, textAlign:"center", borderTop:`4px solid ${color}` }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#475569", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:11, color:"#94A3B8", marginBottom:14 }}>{sw}</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
        <button onClick={adj(k,-1)} disabled={!active} style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #E2E8F0", background:"white", cursor:active?"pointer":"not-allowed", fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", color:"#DC2626", opacity:active?1:.4 }}><Minus size={16}/></button>
        <div style={{ fontSize:40, fontWeight:900, color, minWidth:60, lineHeight:1 }}>{counters[k]}</div>
        <button onClick={adj(k,1)} disabled={!active} style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #E2E8F0", background:active?color:"white", cursor:active?"pointer":"not-allowed", fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", color:active?"white":"#94A3B8", opacity:active?1:.4 }}><Plus size={16}/></button>
      </div>
    </div>
  );

  return (
    <TrafficLayout pageTitle="Checkpoints" pageTitle2="Vizuizi vya Barabara">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Road Checkpoints <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Vizuizi</span></h1>
        <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Log and track roadblock operations in real-time</p>
      </div>

      {/* Control panel */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#082A63)", borderRadius:16, padding:"22px 24px", color:"white", marginBottom:20, boxShadow:"0 6px 24px rgba(3,16,43,.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Checkpoint Control · Udhibiti wa Kizuizi</div>
            {!active ? (
              <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Enter checkpoint location (e.g. Morogoro Road Junction)"
                style={{ width:"100%", height:42, borderRadius:9, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.1)", color:"white", fontSize:14, padding:"0 14px", outline:"none", boxSizing:"border-box" }}/>
            ) : (
              <div>
                <div style={{ fontSize:14, opacity:.8 }}>📍 {location}</div>
                <div style={{ fontSize:32, fontWeight:900, fontFamily:"monospace", letterSpacing:3, marginTop:4 }}>{elapsed}</div>
              </div>
            )}
          </div>
          <button onClick={active?stopCP:startCP}
            style={{ padding:"13px 28px", borderRadius:12, border:"none", background:active?"#DC2626":"#16A34A", color:"white", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            {active ? <><Square size={18}/> End Checkpoint</> : <><Play size={18}/> Start Checkpoint · Anza Kizuizi</>}
          </button>
        </div>
      </div>

      {/* Counters */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <Counter label="Vehicles Passed"   sw="Magari Yaliyopita"   k="passed"   color="#0D3477"/>
        <Counter label="Vehicles Checked"  sw="Magari Yaliyokaguliwa" k="checked" color="#059669"/>
        <Counter label="Citations Issued"  sw="Faini Zilizotolewa"  k="cited"    color="#D97706"/>
        <Counter label="Arrests Made"      sw="Watu Waliokamatwa"   k="arrested" color="#DC2626"/>
      </div>

      {!active && (
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#92400E" }}>
          ℹ️ Enter a location above and click "Start Checkpoint" to begin logging. Counters will activate during an active checkpoint.
        </div>
      )}

      {/* Session history */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0D3477" }}>Checkpoint History · Historia</div>
          <div style={{ fontSize:12, color:"#94A3B8" }}>{sessions.length} sessions today</div>
        </div>
        {sessions.length===0 ? (
          <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🛑</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No checkpoint sessions yet</div>
            <div style={{ fontSize:12, marginTop:4 }}>Sessions appear here after you end a checkpoint</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC" }}>
              {["Location","Duration","Passed","Checked","Cited","Arrested","Date"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sessions.map((s,i)=>(
                <tr key={i} style={{ borderBottom:"1px solid #F1F5F9" }}>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"#1E293B" }}>{s.location}</td>
                  <td style={{ padding:"11px 14px", fontWeight:700, fontFamily:"monospace", color:"#0D3477" }}>{s.duration}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700 }}>{s.passed}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700, color:"#059669" }}>{s.checked}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700, color:"#D97706" }}>{s.cited}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700, color:"#DC2626" }}>{s.arrested}</td>
                  <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TrafficLayout>
  );
}
