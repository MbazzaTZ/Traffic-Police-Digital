import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Play, Square, MapPin, Navigation, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useGPSTracker } from "../../hooks/useGPSTracker";

export default function PatrolDashboardPage() {
  const { profile, stationId, regionId, districtId, stationName } = useCurrentUser();
  const [active,   setActive]   = useState(false);
  const [elapsed,  setElapsed]  = useState("00:00:00");
  const [patrols,  setPatrols]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeId, setActiveId] = useState(null);

  // GPS tracker - runs while on patrol
  useGPSTracker({ enabled: active, officerId: profile?.id, patrolId: activeId });
  const timerRef = useRef(null);
  const startRef = useRef(null);

  async function load() {
    setLoading(true);
    let q = supabase.from("patrols").select("*").order("start_time",{ascending:false}).limit(50);
    if (profile?.id) q = q.eq("officer_id", profile.id);
    const { data } = await q;
    setPatrols(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile?.id) load(); },[profile?.id]);

  // Cleanup interval on unmount - prevents leak if user navigates
  // away mid-patrol without clicking End Patrol
  useEffect(()=>{
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function startPatrol() {
    const { data, error } = await supabase.from("patrols").insert({
      officer_id:profile?.id||null, station_id:stationId||null,
      region_id:regionId||null, district_id:districtId||null,
      start_time:new Date().toISOString(), status:"active",
    }).select().single();
    if (error) { console.error(error); return; }
    setActiveId(data.id);
    setActive(true); startRef.current = Date.now();
    timerRef.current = setInterval(()=>{
      const d = Date.now()-startRef.current;
      const h = String(Math.floor(d/3600000)).padStart(2,"0");
      const m = String(Math.floor((d%3600000)/60000)).padStart(2,"0");
      const s = String(Math.floor((d%60000)/1000)).padStart(2,"0");
      setElapsed(`${h}:${m}:${s}`);
    },1000);
    await load();
  }

  async function endPatrol() {
    clearInterval(timerRef.current);
    const durMins = Math.floor((Date.now()-startRef.current)/60000);
    if (activeId) {
      await supabase.from("patrols").update({ end_time:new Date().toISOString(), duration_mins:durMins, status:"completed" }).eq("id", activeId);
    }
    setActive(false); setElapsed("00:00:00"); setActiveId(null);
    await load();
  }

  const today = patrols.filter(p=>new Date(p.start_time).toDateString()===new Date().toDateString());
  const totalHrs = patrols.reduce((t,p)=>t+(p.duration_mins||0),0);

  return (
    <DashboardLayout pageTitle="Patrols" pageTitle2="Doria">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Patrol Dashboard <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Doria</span></h1>
        <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{today.length} patrols today · {Math.floor(totalHrs/60)}h {totalHrs%60}m total logged</p>
      </div>

      {/* Patrol Control */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#082A63,#0D3477)", borderRadius:18, padding:"24px 28px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:20, boxShadow:"0 8px 28px rgba(3,16,43,.3)" }}>
        <div>
          <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Patrol Control · Udhibiti wa Doria</div>
          <div style={{ fontSize:20, fontWeight:800 }}>{active?"Patrol in Progress · Doria Inaendelea":"Ready to Start Patrol"}</div>
          <div style={{ fontSize:13, opacity:.7, marginTop:3, display:"flex", alignItems:"center", gap:6 }}>
            <MapPin size={13}/>{stationName||"TPDOP"} · GPS {active?"Broadcasting 🟢":"Ready"}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          {active && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, fontWeight:900, fontFamily:"monospace", letterSpacing:3 }}>{elapsed}</div>
              <div style={{ fontSize:11, opacity:.6 }}>Duration · Muda</div>
            </div>
          )}
          <button onClick={active?endPatrol:startPatrol}
            style={{ background:active?"#DC2626":"#16A34A", color:"white", border:"none", borderRadius:12, padding:"13px 24px", display:"flex", gap:9, alignItems:"center", fontWeight:800, fontSize:14, cursor:"pointer" }}>
            {active?<><Square size={17}/>End Patrol · Maliza Doria</>:<><Play size={17}/>Start Patrol · Anza Doria</>}
          </button>
        </div>
      </div>

      {/* Live stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          {label:"Patrols Today",    v:today.length,                                                 c:"#0D3477"},
          {label:"Active Now",       v:patrols.filter(p=>p.status==="active").length,                c:"#16A34A"},
          {label:"Total This Month", v:patrols.length,                                              c:"#D97706"},
          {label:"Hours Logged",     v:`${Math.floor(totalHrs/60)}h ${totalHrs%60}m`,              c:"#7C3AED"},
        ].map(k=>(
          <div key={k.label} style={{ background:"white", borderRadius:14, padding:"16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:k.label==="Hours Logged"?18:28, fontWeight:900, color:k.c, lineHeight:1.2 }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B", marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Map placeholder */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", marginBottom:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Live Map · Ramani ya Doria</div>
          {active && <span style={{ background:"#FEF2F2", color:"#DC2626", padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:8, height:8, borderRadius:"50%", background:"#DC2626", display:"inline-block", animation:"pulse 1s infinite" }}/>LIVE</span>}
        </div>
        <div style={{ height:260, background:"linear-gradient(135deg,#EFF6FF,#DBEAFE)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
          <Navigation size={44} color="#0D3477" style={{ opacity:.2 }}/>
          <div style={{ textAlign:"center", color:"#475569" }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Map Integration · Ramani</div>
            <div style={{ fontSize:13, opacity:.7 }}>Google Maps / OpenStreetMap integration</div>
            {active && <div style={{ marginTop:10, background:"#0D3477", color:"white", padding:"7px 18px", borderRadius:999, fontSize:13, fontWeight:700 }}>📍 BROADCASTING LOCATION</div>}
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Patrol History · Historia ya Doria</div>
          <div style={{ fontSize:12, color:"#94A3B8" }}>{patrols.length} patrols logged in Supabase</div>
        </div>
        {loading ? <div style={{ padding:"40px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : patrols.length===0 ? (
          <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Navigation size={36} style={{ opacity:.2, marginBottom:10 }}/>
            <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No patrols recorded yet</div>
            <div style={{ fontSize:12, marginTop:4 }}>Start your first patrol above</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC" }}>
              {["Started","Ended","Duration","Status"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {patrols.slice(0,20).map((p,i)=>(
                <tr key={p.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                  onMouseLeave={e=>e.currentTarget.style.background="white"}>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"#1E293B", fontWeight:600 }}>{new Date(p.start_time).toLocaleString("en-GB")}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{p.end_time?new Date(p.end_time).toLocaleString("en-GB"):"—"}</td>
                  <td style={{ padding:"11px 14px", fontWeight:700, fontFamily:"monospace", color:"#0D3477" }}>{p.duration_mins?`${Math.floor(p.duration_mins/60)}h ${p.duration_mins%60}m`:"Active"}</td>
                  <td style={{ padding:"11px 14px" }}><span style={{ background:p.status==="active"?"#F0FDF4":"#F8FAFC", color:p.status==="active"?"#16A34A":"#94A3B8", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
