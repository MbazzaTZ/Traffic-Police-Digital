import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { Users, AlertTriangle, Shield, Activity, FileText, Bell, MapPin, TrendingUp } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";

const card = { background:"rgba(255,255,255,.04)", borderRadius:14, border:"1px solid rgba(255,255,255,.08)", padding:"18px" };
const glow = (c) => ({ boxShadow:`0 0 20px ${c}30` });

export default function CommandCenter() {
  const { fullName, badge, role } = useCurrentUser();
  const nav = useNavigate();
  const [stats,     setStats]     = useState({ officers:0, incidents:0, arrests:0, patrols:0, alerts:0, cases:0 });
  const [incidents, setIncidents] = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [patrols,   setPatrols]   = useState([]);
  const [time,      setTime]      = useState(new Date());

  useEffect(() => { const t = setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); }, []);

  async function load() {
    const today = new Date().toISOString().split("T")[0];
    const [officers, incidents, arrests, patrols, alerts, cases, recentInc, recentAlerts, activePatrols] = await Promise.all([
      supabase.from("profiles").select("id",{count:"exact"}).eq("status","active").then(r=>r.count||0),
      supabase.from("incident_reports").select("id",{count:"exact"}).eq("status","open").then(r=>r.count||0),
      supabase.from("arrests").select("id",{count:"exact"}).eq("status","detained").then(r=>r.count||0),
      supabase.from("patrols").select("id",{count:"exact"}).eq("status","active").then(r=>r.count||0),
      supabase.from("alerts").select("id",{count:"exact"}).then(r=>r.count||0),
      supabase.from("cases").select("id",{count:"exact"}).eq("status","open").then(r=>r.count||0),
      supabase.from("incident_reports").select("ref_number,type,severity,status,location_text,created_at").order("created_at",{ascending:false}).limit(8),
      supabase.from("alerts").select("*,profiles!alerts_issued_by_fkey(full_name)").order("created_at",{ascending:false}).limit(5),
      supabase.from("patrols").select("*,profiles!patrols_officer_id_fkey(full_name,badge)").eq("status","active").limit(10),
    ]);
    setStats({officers,incidents,arrests,patrols,alerts,cases});
    setIncidents(recentInc.data||[]);
    setAlerts(recentAlerts.data||[]);
    setPatrols(activePatrols.data||[]);
  }

  useEffect(() => {
    load();
    const sub = supabase.channel("command-realtime")
      .on("postgres_changes",{event:"*",schema:"public",table:"incidents"},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"alerts"},load)
      .on("postgres_changes",{event:"*",schema:"public",table:"patrols"},load)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const SEV_C = {low:"#64748B",medium:"#D97706",high:"#DC2626",critical:"#7C3AED"};
  const ALERT_C = {info:"#0891B2",warning:"#D97706",danger:"#DC2626",emergency:"#7C3AED"};

  return (
    <CommandLayout pageTitle="Command Center" pageTitle2="Makao Makuu">

      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Tanzania Police Force · Command Authority</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:"white", margin:"4px 0" }}>Command Center</h1>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>{fullName} · {badge} · {role?.replace(/_/g," ").toUpperCase()}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:32, fontWeight:900, color:"white", fontFamily:"monospace", letterSpacing:2 }}>{time.toLocaleTimeString("en-GB")}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>{time.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Active Officers",  sw:"Maafisa",        v:stats.officers,  c:"#0D3477", icon:Users },
          { label:"Open Incidents",   sw:"Matukio Wazi",   v:stats.incidents, c:"#DC2626", icon:AlertTriangle },
          { label:"Detained",         sw:"Vizuizini",      v:stats.arrests,   c:"#D97706", icon:Shield },
          { label:"Active Patrols",   sw:"Doria Zinazoendelea", v:stats.patrols, c:"#16A34A", icon:Activity },
          { label:"Open Cases",       sw:"Kesi CID",       v:stats.cases,     c:"#7C3AED", icon:FileText },
          { label:"Alerts Issued",    sw:"Tahadhari",      v:stats.alerts,    c:"#0891B2", icon:Bell },
        ].map(k=>{
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ ...card, ...glow(k.c), borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
              <Icon size={18} color={k.c} style={{ marginBottom:8, opacity:.9 }}/>
              <div style={{ fontSize:30, fontWeight:900, color:k.c, lineHeight:1 }}>{k.v}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.7)", marginTop:5 }}>{k.label}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>{k.sw}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, marginBottom:16 }}>
        {/* Live Incidents */}
        <div style={{ ...card }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"white" }}>Live Incidents · Matukio Hai</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>Real-time · updates automatically</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#DC2626", display:"inline-block" }}/>
              <span style={{ fontSize:11, color:"#FCA5A5", fontWeight:700 }}>LIVE</span>
            </div>
          </div>
          {incidents.length===0 ? (
            <div style={{ padding:"30px", textAlign:"center", color:"rgba(255,255,255,.25)" }}>
              <Activity size={28} style={{ marginBottom:8 }}/>
              <div style={{ fontSize:13 }}>No open incidents</div>
            </div>
          ) : incidents.map((inc,i)=>{
            const sc=SEV_C[inc.severity]||"#64748B";
            return (
              <div key={inc.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:i<incidents.length-1?"1px solid rgba(255,255,255,.06)":"none" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:sc, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"white", display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontFamily:"monospace", color:"rgba(255,255,255,.5)", fontSize:11 }}>{inc.ref_number}</span>
                    {inc.type}
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", display:"flex", gap:6 }}>
                    <MapPin size={10}/>{inc.location_text||"—"}
                  </div>
                </div>
                <span style={{ background:`${sc}20`, color:sc, padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{inc.severity}</span>
                <span style={{ background:"rgba(220,38,38,.15)", color:"#FCA5A5", padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:700 }}>{inc.status}</span>
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Active Patrols */}
          <div style={{ ...card, flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:12 }}>Active Patrols · Doria</div>
            {patrols.length===0 ? (
              <div style={{ padding:"20px", textAlign:"center", color:"rgba(255,255,255,.25)", fontSize:13 }}>No active patrols</div>
            ) : patrols.map((p,i)=>(
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 0", borderBottom:i<patrols.length-1?"1px solid rgba(255,255,255,.06)":"none" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#16A34A" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"white" }}>{p.profiles?.full_name||"—"}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>{p.profiles?.badge} · {new Date(p.start_time).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                <span style={{ background:"rgba(22,163,74,.2)", color:"#86EFAC", padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:700 }}>LIVE</span>
              </div>
            ))}
          </div>

          {/* Recent Alerts */}
          <div style={{ ...card, flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"white" }}>Recent Alerts</div>
              <button onClick={()=>nav("/command/alerts")} style={{ fontSize:11, color:"rgba(255,255,255,.4)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Issue New →</button>
            </div>
            {alerts.length===0 ? (
              <div style={{ padding:"20px", textAlign:"center", color:"rgba(255,255,255,.25)", fontSize:13 }}>No alerts issued</div>
            ) : alerts.map((a,i)=>{
              const ac=ALERT_C[a.type]||"#0891B2";
              return (
                <div key={a.id} style={{ display:"flex", gap:9, padding:"8px 0", borderBottom:i<alerts.length-1?"1px solid rgba(255,255,255,.06)":"none" }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:ac, marginTop:4, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"white", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.title}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>{a.profiles?.full_name||"System"} · {new Date(a.created_at).toLocaleString("en-GB")}</div>
                  </div>
                  <span style={{ background:`${ac}20`, color:ac, padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:700, flexShrink:0 }}>{a.type?.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[
          { label:"Issue Alert",     sw:"Toa Tahadhari",  icon:"🚨", path:"/command/alerts",    c:"#DC2626" },
          { label:"View Incidents",  sw:"Ona Matukio",    icon:"📋", path:"/command/incidents",  c:"#D97706" },
          { label:"Officer Roster",  sw:"Orodha ya Maafisa",icon:"👮",path:"/command/officers",  c:"#0D3477" },
          { label:"Generate Report", sw:"Tengeneza Ripoti",icon:"📊", path:"/command/reports",   c:"#7C3AED" },
        ].map(a=>(
          <button key={a.label} onClick={()=>nav(a.path)}
            style={{ ...card, cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:".15s", textAlign:"left", border:"1px solid rgba(255,255,255,.08)" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.08)";e.currentTarget.style.borderColor=a.c;}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";}}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${a.c}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{a.icon}</div>
            <div><div style={{ fontSize:13, fontWeight:700, color:"white" }}>{a.label}</div><div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{a.sw}</div></div>
          </button>
        ))}
      </div>
    </CommandLayout>
  );
}
