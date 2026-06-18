import { useState, useEffect } from "react";
import TrafficLayout from "../../layouts/TrafficLayout";
import { Car, FileText, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { StatusPieChart, CHART_COLORS } from "../../components/charts/ChartAtoms";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";

export default function TrafficDashboard() {
  const { profile, fullName, badge, stationName } = useCurrentUser();
  const nav = useNavigate();
  const [stats, setStats] = useState({ citations:0, accidents:0, unpaid:0, today:0 });
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split("T")[0];
      const [c, a, u, t] = await Promise.all([
        supabase.from("citations").select("id", {count:"exact"}).then(r=>r.count||0),
        supabase.from("accident_reports").select("id", {count:"exact"}).then(r=>r.count||0),
        supabase.from("citations").select("id", {count:"exact"}).eq("status","unpaid").then(r=>r.count||0),
        supabase.from("citations").select("id", {count:"exact"}).gte("created_at", today).then(r=>r.count||0),
      ]);
      setStats({ citations:c, accidents:a, unpaid:u, today:t });
      // Citation status breakdown for pie chart
      const statusCounts = {};
      const allCits = await supabase.from("citations").select("status");
      (allCits.data||[]).forEach(c => { statusCounts[c.status] = (statusCounts[c.status]||0)+1; });
      const colorMap = { unpaid:CHART_COLORS.danger, paid:CHART_COLORS.success, partial:CHART_COLORS.gold, contested:CHART_COLORS.critical, cancelled:CHART_COLORS.muted };
      setStatusData(Object.entries(statusCounts).map(([name,value]) => ({ name, value, color: colorMap[name] || CHART_COLORS.navy })));
    }
    load();
  }, []);

  return (
    <TrafficLayout pageTitle="Dashboard" pageTitle2="Dashibodi ya Trafiki">
      {/* Banner */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#082A63,#0D3477)", borderRadius:16, padding:"20px 24px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14, marginBottom:20, boxShadow:"0 6px 24px rgba(3,16,43,.3)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#FCD34D,#F59E0B)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:22, fontWeight:900, color:"#03102B" }}>🚦</span>
          </div>
          <div>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Traffic Officer · Afisa wa Barabara</div>
            <div style={{ fontSize:20, fontWeight:800 }}>{fullName}</div>
            <div style={{ fontSize:12, opacity:.7, marginTop:2 }}>{badge} · {stationName||"TPDOP Traffic Unit"}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>nav("/traffic/citations")} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"#FCD34D", color:"#03102B", fontWeight:800, fontSize:12, cursor:"pointer" }}>+ New Citation</button>
          <button onClick={()=>nav("/traffic/accidents")} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"rgba(255,255,255,.15)", color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Log Accident</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total Citations",  sw:"Faini Zote",     v:stats.citations, c:"#0D3477", icon:FileText },
          { label:"Accidents",        sw:"Ajali",          v:stats.accidents, c:"#DC2626", icon:AlertTriangle },
          { label:"Unpaid Fines",     sw:"Faini Hazijalipiwa", v:stats.unpaid, c:"#D97706", icon:TrendingUp },
          { label:"Today's Citations",sw:"Faini za Leo",   v:stats.today,     c:"#059669", icon:Car },
        ].map(k=>{
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ background:"white", borderRadius:14, padding:"16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
              <Icon size={20} color={k.c} style={{ marginBottom:8 }}/>
              <div style={{ fontSize:30, fontWeight:900, color:k.c }}>{k.v}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
              <div style={{ fontSize:10, color:"#94A3B8" }}>{k.sw}</div>
            </div>
          );
        })}
      </div>

      {/* Citations by status (pie chart) + Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16, marginBottom:20 }}>
        {statusData.length > 0 && (
          <div className="glass-card" style={{ padding:18 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--navy-700,#0D3477)", marginBottom:12, fontFamily:"var(--font-serif,Georgia,serif)" }}>Citations by Status</div>
            <StatusPieChart data={statusData} height={200} dark={false} />
          </div>
        )}
        <div className="glass-card" style={{ padding:18 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--navy-700,#0D3477)", marginBottom:12, fontFamily:"var(--font-serif,Georgia,serif)" }}>Summary · Muhtasari</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ padding:14, background:"rgba(13,52,119,0.04)", borderRadius:10 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase" }}>Total Citations</div>
              <div style={{ fontSize:28, fontWeight:700, color:"#0D3477", fontFamily:"var(--font-mono,monospace)" }}>{stats.citations}</div>
            </div>
            <div style={{ padding:14, background:"rgba(220,38,38,0.04)", borderRadius:10 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase" }}>Unpaid Fines</div>
              <div style={{ fontSize:28, fontWeight:700, color:"#DC2626", fontFamily:"var(--font-mono,monospace)" }}>{stats.unpaid}</div>
            </div>
            <div style={{ padding:14, background:"rgba(217,119,6,0.04)", borderRadius:10 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase" }}>Accidents</div>
              <div style={{ fontSize:28, fontWeight:700, color:"#D97706", fontFamily:"var(--font-mono,monospace)" }}>{stats.accidents}</div>
            </div>
            <div style={{ padding:14, background:"rgba(5,150,105,0.04)", borderRadius:10 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, textTransform:"uppercase" }}>Today's Citations</div>
              <div style={{ fontSize:28, fontWeight:700, color:"#059669", fontFamily:"var(--font-mono,monospace)" }}>{stats.today}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Issue Citation",    sw:"Toa Faini",        path:"/traffic/citations",   icon:"🎫", c:"#0D3477" },
          { label:"Log Accident",      sw:"Rekodi Ajali",     path:"/traffic/accidents",   icon:"🚗", c:"#DC2626" },
          { label:"Vehicle Search",    sw:"Tafuta Gari",      path:"/traffic/vehicles",    icon:"🔍", c:"#059669" },
          { label:"Checkpoints",       sw:"Vizuizi vya Barabara", path:"/traffic/checkpoints", icon:"🛑", c:"#D97706" },
          { label:"License Check",     sw:"Leseni",           path:"/traffic/vehicles",    icon:"📋", c:"#0891B2" },
          { label:"Daily Report",      sw:"Ripoti ya Leo",    path:"/traffic/citations",   icon:"📊", c:"#475569" },
        ].map(a=>(
          <button key={a.label} onClick={()=>nav(a.path)}
            style={{ background:"white", borderRadius:14, border:"1.5px solid #E2E8F0", padding:"18px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:".15s", textAlign:"left" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=a.c;e.currentTarget.style.boxShadow=`0 4px 14px ${a.c}22`;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="";}}>
            <div style={{ width:42, height:42, borderRadius:10, background:`${a.c}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{a.icon}</div>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{a.label}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{a.sw}</div></div>
          </button>
        ))}
      </div>
    </TrafficLayout>
  );
}
