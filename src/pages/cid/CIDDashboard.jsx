import { useState, useEffect } from "react";
import CIDLayout from "../../layouts/CIDLayout";
import { FolderOpen, Users, Shield, FileText } from "lucide-react";
import { StatusPieChart, TrendBarChart, Sparkline, CHART_COLORS } from "../../components/charts/ChartAtoms";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";

export default function CIDDashboard() {
  const { fullName, badge } = useCurrentUser();
  const nav = useNavigate();
  const [stats, setStats] = useState({ cases:0, open:0, suspects:0, wanted:0, evidence:0 });
  const [caseTypeData, setCaseTypeData] = useState([]);
  const [dangerData, setDangerData] = useState([]);
  const [sparkData, setSparkData] = useState({});

  useEffect(()=>{
    async function load() {
      const [cases, open, wanted, evidence] = await Promise.all([
        supabase.from("cases").select("id",{count:"exact"}).then(r=>r.count||0),
        supabase.from("cases").select("id",{count:"exact"}).eq("status","open").then(r=>r.count||0),
        supabase.from("wanted_persons").select("id",{count:"exact"}).eq("status","wanted").then(r=>r.count||0),
        supabase.from("evidence").select("id",{count:"exact"}).then(r=>r.count||0),
      ]);
      setStats({ cases, open, wanted, evidence });
      // Cases by type (for pie chart)
      const allCases = await supabase.from("cases").select("type");
      const typeCounts = {};
      (allCases.data||[]).forEach(c => { typeCounts[c.type] = (typeCounts[c.type]||0)+1; });
      const typeColors = [CHART_COLORS.navy, CHART_COLORS.gold, CHART_COLORS.danger, CHART_COLORS.success, CHART_COLORS.critical, CHART_COLORS.info, CHART_COLORS.muted];
      setCaseTypeData(Object.entries(typeCounts).map(([name,value],i) => ({ name, value, color: typeColors[i % typeColors.length] })));
      // Wanted by danger level (for bar chart)
      const allWanted = await supabase.from("wanted_persons").select("danger_level");
      const dangerCounts = {};
      (allWanted.data||[]).forEach(w => { dangerCounts[w.danger_level] = (dangerCounts[w.danger_level]||0)+1; });
      const dangerColors = { low:CHART_COLORS.muted, medium:CHART_COLORS.gold, high:CHART_COLORS.danger, armed:CHART_COLORS.critical };
      setDangerData(Object.entries(dangerCounts).map(([level,count]) => ({ level: level.toUpperCase(), count, color: dangerColors[level] || CHART_COLORS.navy })));
      // Sparkline data (7-day trends)
      const sevenDaysAgo = new Date(Date.now()-7*86400000).toISOString();
      const [caseSpark, wantSpark, evSpark] = await Promise.all([
        supabase.from("cases").select("created_at").gte("created_at", sevenDaysAgo),
        supabase.from("wanted_persons").select("created_at").gte("created_at", sevenDaysAgo),
        supabase.from("evidence").select("collected_at").gte("collected_at", sevenDaysAgo),
      ]);
      const buildSpark = (recs, col) => {
        const d = {};
        for (let i=6;i>=0;i--) { const dt=new Date(Date.now()-i*86400000); d[dt.toLocaleDateString("en-GB",{weekday:"short"})]=0; }
        (recs||[]).forEach(r => { if(r[col]){const k=new Date(r[col]).toLocaleDateString("en-GB",{weekday:"short"}); if(k in d) d[k]++;} });
        return Object.entries(d).map(([date,v])=>({date,v}));
      };
      setSparkData({
        cases: buildSpark(caseSpark.data, "created_at"),
        open: buildSpark((caseSpark.data||[]).filter(c=>c.status==="open"), "created_at"),
        wanted: buildSpark(wantSpark.data, "created_at"),
        evidence: buildSpark(evSpark.data, "collected_at"),
      });
    }
    load();
  },[]);

  return (
    <CIDLayout pageTitle="Dashboard" pageTitle2="Dashibodi ya CID">
      <div style={{ background:"linear-gradient(135deg,#03102B,#082A63)", borderRadius:16, padding:"20px 24px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14, marginBottom:20, boxShadow:"0 6px 24px rgba(3,16,43,.3)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#C4B5FD,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>🔍</div>
          <div>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>CID Officer · Afisa wa CID</div>
            <div style={{ fontSize:20, fontWeight:800 }}>{fullName}</div>
            <div style={{ fontSize:12, opacity:.7, marginTop:2 }}>{badge} · Criminal Investigations Division</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>nav("/cid/cases")} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"rgba(255,255,255,.15)", color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ New Case</button>
          <button onClick={()=>nav("/cid/wanted")} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"#DC2626", color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Wanted Person</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total Cases",   sw:"Kesi Zote",    v:stats.cases,    c:"#0D3477", icon:FolderOpen, sk:"cases" },
          { label:"Open Cases",    sw:"Kesi Wazi",    v:stats.open,     c:"#DC2626", icon:FolderOpen, sk:"open" },
          { label:"Wanted",        sw:"Watuhumiwa",   v:stats.wanted,   c:"#D97706", icon:Shield, sk:"wanted" },
          { label:"Evidence Items",sw:"Ushahidi",     v:stats.evidence, c:"#059669", icon:FileText, sk:"evidence" },
        ].map(k=>{
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

      {/* Charts */}
      {(caseTypeData.length > 0 || dangerData.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          {caseTypeData.length > 0 && (
            <div className="glass-card" style={{ padding:18 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--navy-700,#0D3477)", marginBottom:12, fontFamily:"var(--font-serif,Georgia,serif)" }}>Cases by Type · Kesi kwa Aina</div>
              <StatusPieChart data={caseTypeData} height={200} dark={false} />
            </div>
          )}
          {dangerData.length > 0 && (
            <div className="glass-card" style={{ padding:18 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--navy-700,#0D3477)", marginBottom:12, fontFamily:"var(--font-serif,Georgia,serif)" }}>Wanted by Danger Level · Watuhumiwa</div>
              <TrendBarChart data={dangerData} xKey="level" yKey="count" color={CHART_COLORS.danger} height={200} dark={false} />
            </div>
          )}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Open Cases",     sw:"Fungua Kesi",   path:"/cid/cases",    icon:"📁", c:"#0D3477" },
          { label:"Wanted Persons", sw:"Watuhumiwa",    path:"/cid/wanted",   icon:"🚨", c:"#DC2626" },
          { label:"Evidence",       sw:"Ushahidi",      path:"/cid/evidence", icon:"🔬", c:"#059669" },
          { label:"Suspects",       sw:"Washukiwa",     path:"/cid/suspects", icon:"👤", c:"#D97706" },
          { label:"NIDA Search",    sw:"Tafuta NIDA",   path:"/cid/search",   icon:"🔍", c:"#0891B2" },
          { label:"Case Reports",   sw:"Ripoti za Kesi",path:"/cid/cases",    icon:"📊", c:"#475569" },
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
    </CIDLayout>
  );
}
