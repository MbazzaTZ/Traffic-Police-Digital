import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Search, FileText, ShieldAlert, MapPinned, FolderOpen, Siren, Activity, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { TrendAreaChart, Sparkline, CHART_COLORS } from "../../../components/charts/ChartAtoms";
import { buildTrendFromRecords } from "../../../hooks/useTrendData";

const ACTIONS = [
  { icon:Search,      label:"Search Person",   sw:"Tafuta Mtu",       path:"/person-search", color:"#0D3477" },
  { icon:FileText,    label:"New Incident",    sw:"Tukio Jipya",      path:"/incidents",     color:"#059669" },
  { icon:ShieldAlert, label:"Record Arrest",   sw:"Rekodi Kukamatwa", path:"/arrests",       color:"#DC2626" },
  { icon:MapPinned,   label:"Start Patrol",    sw:"Anza Doria",       path:"/patrols",       color:"#D97706" },
  { icon:FolderOpen,  label:"Upload Evidence", sw:"Pakia Ushahidi",   path:"/evidence",      color:"#7C3AED" },
  { icon:Siren,       label:"Emergency Alert", sw:"Dharura",          path:"/alerts",        color:"#DC2626" },
  { icon:FileText,    label:"PF3 Form",        sw:"Fomu PF3",         path:"/incidents",     color:"#0891B2" },
  { icon:Activity,    label:"Daily Report",    sw:"Ripoti ya Leo",    path:"/incidents",     color:"#475569" },
];

const card = { background:"white", borderRadius:16, border:"1px solid #E2E8F0", boxShadow:"0 1px 4px rgba(0,0,0,.05)" };

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:"#94A3B8" }}>
      <Icon size={36} style={{ opacity:.25, marginBottom:10 }} />
      <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>{title}</div>
      <div style={{ fontSize:12, marginTop:4 }}>{sub}</div>
    </div>
  );
}

export default function RegularPoliceDashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState({ incidents:0, arrests:0, detentions:0, evidence:0 });
  const [incidentTrend, setIncidentTrend] = useState([]);
  const [sparkData, setSparkData] = useState({});

  useEffect(() => {
    async function load() {
      const sevenDaysAgo = new Date(Date.now() - 7*86400000).toISOString();
      const [inc, arr, det, evd] = await Promise.all([
        supabase.from("incident_reports").select("created_at").gte("created_at", sevenDaysAgo),
        supabase.from("arrests").select("created_at").gte("created_at", sevenDaysAgo),
        supabase.from("detentions").select("created_at").gte("created_at", sevenDaysAgo),
        supabase.from("evidence").select("collected_at").gte("collected_at", sevenDaysAgo),
      ]);
      const incTrend = buildTrendFromRecords(inc.data, "created_at");
      setIncidentTrend(incTrend);
      setStats({
        incidents: (inc.data||[]).length,
        arrests: (arr.data||[]).length,
        detentions: (det.data||[]).length,
        evidence: (evd.data||[]).length,
      });
      setSparkData({
        incidents: incTrend,
        arrests: buildTrendFromRecords(arr.data, "created_at"),
        detentions: buildTrendFromRecords(det.data, "created_at"),
        evidence: buildTrendFromRecords(evd.data, "collected_at"),
      });
    }
    load();
  }, []);

  return (
    <DashboardLayout pageTitle="Dashboard" pageTitle2="Dashibodi">

      {/* Command Banner */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#082A63,#0D3477)", borderRadius:18, padding:"22px 28px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:20, boxShadow:"0 8px 28px rgba(3,16,43,.35)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,.03)" }} />
        <div style={{ display:"flex", alignItems:"center", gap:16, zIndex:1 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", border:"3px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ color:"white", fontSize:22, fontWeight:900 }}>P</span>
          </div>
          <div>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, marginBottom:3, textTransform:"uppercase" }}>Regular Police Officer · Afisa wa Kawaida</div>
            <div style={{ fontSize:20, fontWeight:800, lineHeight:1.1 }}>Welcome, Officer</div>
            <div style={{ fontSize:13, opacity:.7, marginTop:3 }}>Tanzania Police Force · TPDOP</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", zIndex:1 }}>
          {["🟢 On Duty","📍 GPS Active","✅ Device Verified"].map(c => (
            <div key={c} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:999, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.14)", fontSize:12, fontWeight:600 }}>{c}</div>
          ))}
        </div>
      </div>

      {/* KPI Cards — all zero */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {[
          { v:"0", label:"Open Incidents",  sw:"Matukio Wazi",        color:"#DC2626" },
          { v:"0", label:"Arrests Today",   sw:"Kukamatwa Leo",       color:"#0D3477" },
          { v:"0", label:"Detentions",      sw:"Vizuizi",             color:"#D97706" },
          { v:"0", label:"Active Patrols",  sw:"Doria Zinazoendelea", color:"#059669" },
          { v:"0", label:"Evidence Items",  sw:"Vitu vya Ushahidi",   color:"#7C3AED" },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding:"18px 16px", textAlign:"center", borderTop:`4px solid ${k.color}` }}>
            <div style={{ fontSize:38, fontWeight:900, color:k.color, lineHeight:1, marginBottom:5 }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
            <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{k.sw}</div>
          </div>
        ))}
      </div>

      {/* KPI tiles with sparklines */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          { label:"Incidents (7d)",  sw:"Matukio",    v:stats.incidents,  c:"#DC2626", icon:AlertTriangle, sk:"incidents" },
          { label:"Arrests (7d)",    sw:"Kukamatwa",  v:stats.arrests,    c:"#D97706", icon:ShieldAlert,   sk:"arrests" },
          { label:"Detentions (7d)", sw:"Vizuizini",  v:stats.detentions, c:"#0891B2", icon:FileText,      sk:"detentions" },
          { label:"Evidence (7d)",   sw:"Ushahidi",   v:stats.evidence,   c:"#7C3AED", icon:FolderOpen,    sk:"evidence" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass-card is-light" style={{ borderTop:`3px solid ${k.c}`, textAlign:"center", padding:"16px 14px" }}>
              <Icon size={20} color={k.c} style={{ marginBottom:6 }}/>
              <div style={{ fontSize:"clamp(26px,4vw,30px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-900,#0F172A)" }}>{k.label}</div>
              <div style={{ fontSize:10, color:"var(--ink-500,#64748B)" }}>{k.sw}</div>
              {sparkData[k.sk] && sparkData[k.sk].length > 0 && (
                <div style={{ height:22, marginTop:6, opacity:0.7 }}>
                  <Sparkline data={sparkData[k.sk]} color={k.c} height={22} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 7-day incident trend */}
      {incidentTrend.length > 0 && (
        <div className="glass-card" style={{ padding:18, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--navy-700,#0D3477)", marginBottom:12, fontFamily:"var(--font-serif,Georgia,serif)" }}>7-Day Incident Trend · Mwelekeo wa Matukio</div>
          <TrendAreaChart data={incidentTrend} xKey="date" yKey="v" color={CHART_COLORS.danger} height={160} dark={false} />
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ fontSize:16, fontWeight:700, color:"#082A63", marginBottom:12 }}>
        Quick Actions <span style={{ fontSize:13, color:"#94A3B8", fontWeight:500 }}>· Vitendo vya Haraka</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => nav(a.path)}
              style={{ ...card, padding:"16px 10px", cursor:"pointer", border:"1.5px solid #E2E8F0", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:".18s", textAlign:"center" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=a.color; e.currentTarget.style.boxShadow=`0 6px 18px ${a.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.05)"; }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${a.color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={22} color={a.color} />
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{a.label}</div>
              <div style={{ fontSize:10, color:"#94A3B8" }}>{a.sw}</div>
            </button>
          );
        })}
      </div>

      {/* Tasks + Alerts — empty */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Assigned Tasks</div>
            <div style={{ fontSize:11, color:"#94A3B8" }}>Kazi Zilizopewa</div>
          </div>
          <EmptyState icon={FileText} title="No tasks assigned" sub="Hakuna kazi zilizopewa" />
        </div>

        <div style={{ ...card, overflow:"hidden", borderTop:"3px solid #DC2626" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#DC2626" }}>Alert Center</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Kituo cha Tahadhari</div>
            </div>
          </div>
          <EmptyState icon={AlertTriangle} title="No active alerts" sub="Hakuna tahadhari" />
        </div>
      </div>

      {/* Recent Incidents — empty */}
      <div style={{ ...card, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Recent Incidents</div>
            <div style={{ fontSize:11, color:"#94A3B8" }}>Matukio ya Hivi Karibuni</div>
          </div>
          <button onClick={() => nav("/incidents")} style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:"#475569" }}>View All</button>
        </div>
        <EmptyState icon={FileText} title="No incidents recorded yet" sub="Matukio hayajaandikwa bado · Start by creating a new incident" />
      </div>

    </DashboardLayout>
  );
}
