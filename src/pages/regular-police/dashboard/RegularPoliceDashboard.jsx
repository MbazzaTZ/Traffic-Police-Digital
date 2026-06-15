import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import {
  Search, FileText, ShieldAlert, MapPinned,
  FolderOpen, Siren, Activity, ChevronRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const KPIS = [
  { v:"18", label:"Open Incidents",  sw:"Matukio Wazi",        color:"#DC2626" },
  { v:"07", label:"Arrests Today",   sw:"Kukamatwa Leo",       color:"#0D3477" },
  { v:"04", label:"Detentions",      sw:"Vizuizi",             color:"#D97706" },
  { v:"12", label:"Patrols",         sw:"Doria Zinazoendelea", color:"#059669" },
  { v:"09", label:"Evidence",        sw:"Vitu vya Ushahidi",   color:"#7C3AED" },
];

const ACTIONS = [
  { icon:Search,      label:"Search Person",   sw:"Tafuta Mtu",        path:"/person-search", color:"#0D3477" },
  { icon:FileText,    label:"New Incident",    sw:"Tukio Jipya",       path:"/incidents",     color:"#059669" },
  { icon:ShieldAlert, label:"Arrest",          sw:"Kukamatwa",         path:"/arrests",       color:"#DC2626" },
  { icon:Siren,       label:"Emergency",       sw:"Dharura",           path:"/alerts",        color:"#DC2626" },
  { icon:MapPinned,   label:"Start Patrol",    sw:"Anza Doria",        path:"/patrols",       color:"#D97706" },
  { icon:FolderOpen,  label:"Upload Evidence", sw:"Pakia Ushahidi",    path:"/evidence",      color:"#7C3AED" },
  { icon:FileText,    label:"PF3 Form",        sw:"Fomu PF3",          path:"/incidents",     color:"#0891B2" },
  { icon:Activity,    label:"Daily Report",    sw:"Ripoti ya Leo",     path:"/incidents",     color:"#475569" },
];

const TASKS = [
  { p:"HIGH PRIORITY", pc:"#B91C1C", pbg:"#FEE2E2", bdr:"#DC2626", task:"Patrol Sector A",    due:"Due: 14:00 Today",  note:"Assigned by OCS Makambako" },
  { p:"MEDIUM",        pc:"#92400E", pbg:"#FEF3C7", bdr:"#D97706", task:"Community Meeting",  due:"Due: 16:00 Today",  note:"Assigned by DCO Makambako" },
  { p:"LOW",           pc:"#1D4ED8", pbg:"#DBEAFE", bdr:"#3B82F6", task:"Station Report",     due:"Due: 18:00 Today",  note:"Assigned by OCS Makambako" },
];

const CHART = [
  {day:"Mon",n:4},{day:"Tue",n:7},{day:"Wed",n:3},
  {day:"Thu",n:9},{day:"Fri",n:6},{day:"Sat",n:12},{day:"Sun",n:5},
];

const INCIDENTS = [
  { id:"INC-1001", type:"Theft",       status:"Open",          sc:"#DC2626", sbg:"#FEF2F2", loc:"Makambako Mkt", t:"08:42" },
  { id:"INC-1002", type:"Assault",     status:"Assigned",      sc:"#1D4ED8", sbg:"#EFF6FF", loc:"Njombe Rd",     t:"09:15" },
  { id:"INC-1003", type:"Burglary",    status:"Investigating", sc:"#059669", sbg:"#F0FDF4", loc:"Mafinga",       t:"07:30" },
  { id:"INC-1004", type:"Disturbance", status:"Closed",        sc:"#64748B", sbg:"#F1F5F9", loc:"Bus Stand",     t:"06:00" },
];

const card = {
  background:"white", borderRadius:16,
  border:"1px solid #E2E8F0",
  boxShadow:"0 1px 4px rgba(0,0,0,.05)",
};

export default function RegularPoliceDashboard() {
  const nav = useNavigate();

  return (
    <DashboardLayout pageTitle="Dashboard" pageTitle2="Dashibodi">

      {/* ── COMMAND BANNER ── */}
      <div style={{
        background:"linear-gradient(135deg,#03102B 0%,#082A63 60%,#0D3477 100%)",
        borderRadius:18, padding:"20px 28px", color:"white",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        flexWrap:"wrap", gap:14, marginBottom:20,
        boxShadow:"0 8px 28px rgba(3,16,43,.35)", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />

        {/* Officer info */}
        <div style={{ display:"flex", alignItems:"center", gap:16, zIndex:1 }}>
          <div style={{
            width:70, height:70, borderRadius:"50%",
            border:"3px solid rgba(255,255,255,.3)",
            overflow:"hidden", flexShrink:0,
            background:"#14489E",
          }}>
            <img src="/avatars/officer-01.jpg" alt="Officer"
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e => { e.currentTarget.src="/police-logo.png"; e.currentTarget.style.objectFit="contain"; e.currentTarget.style.padding="8px"; }} />
          </div>
          <div>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, marginBottom:3, textTransform:"uppercase" }}>
              Regular Police Officer · Afisa wa Kawaida
            </div>
            <div style={{ fontSize:22, fontWeight:800, lineHeight:1.1 }}>Inspector David Mbaza</div>
            <div style={{ fontSize:13, opacity:.7, marginTop:3 }}>
              Badge: TZP-2026-00124 · Makambako Police Station
            </div>
          </div>
        </div>

        {/* Status chips */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", zIndex:1 }}>
          {[
            { dot:"#22C55E", label:"On Duty" },
            { dot:"#38BDF8", label:"GPS Active" },
            { dot:"#A3E635", label:"Device Verified" },
          ].map(c => (
            <div key={c.label} style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"7px 14px", borderRadius:999,
              background:"rgba(255,255,255,.1)",
              border:"1px solid rgba(255,255,255,.15)",
              fontSize:12, fontWeight:600,
            }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:c.dot, display:"inline-block" }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {KPIS.map(k => (
          <div key={k.label} style={{ ...card, padding:"18px 16px", textAlign:"center", borderTop:`4px solid ${k.color}` }}>
            <div style={{ fontSize:40, fontWeight:900, color:k.color, lineHeight:1, marginBottom:5 }}>{k.v}</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
            <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{k.sw}</div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ fontSize:18, fontWeight:700, color:"#082A63", marginBottom:12 }}>Quick Actions</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => nav(a.path)}
              style={{
                ...card, padding:"18px 10px", cursor:"pointer", border:"1.5px solid #E2E8F0",
                display:"flex", flexDirection:"column", alignItems:"center", gap:9,
                transition:".18s", textAlign:"center",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=a.color; e.currentTarget.style.boxShadow=`0 6px 18px ${a.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.05)"; }}
            >
              <div style={{ width:46, height:46, borderRadius:13, background:`${a.color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={22} color={a.color} />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{a.label}</div>
              <div style={{ fontSize:10, color:"#94A3B8" }}>{a.sw}</div>
            </button>
          );
        })}
      </div>

      {/* ── TASKS + ALERT ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>

        {/* Tasks */}
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#082A63" }}>Assigned Tasks</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Kazi Zilizopewa</div>
            </div>
          </div>
          <div style={{ padding:"14px 16px" }}>
            {TASKS.map((t,i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"14px 14px 14px 18px",
                background:"#F8FAFC", borderRadius:12,
                marginBottom: i < TASKS.length-1 ? 10 : 0,
                borderLeft:`4px solid ${t.bdr}`, cursor:"pointer",
                position:"relative",
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ marginBottom:4 }}>
                    <span style={{ fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:999, background:t.pbg, color:t.pc }}>{t.p}</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#1E293B", marginBottom:2 }}>{t.task}</div>
                  <div style={{ fontSize:12, color:"#64748B" }}>{t.due}</div>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>{t.note}</div>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </div>
            ))}
          </div>
        </div>

        {/* Alert Center */}
        <div style={{ ...card, overflow:"hidden", borderTop:"3px solid #DC2626" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#DC2626" }}>Alert Center</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Kituo cha Tahadhari</div>
            </div>
            <span style={{ background:"#FEF2F2", color:"#DC2626", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999 }}>3 Active</span>
          </div>
          <div style={{ padding:"16px" }}>
            <div style={{ background:"#FFF7F7", border:"1px solid #FECACA", borderRadius:14, padding:"14px 16px", display:"flex", gap:14 }}>
              <img src="/wanted/wanted-01.jpg" alt="Suspect"
                style={{ width:96, height:116, objectFit:"cover", borderRadius:10, flexShrink:0, border:"2px solid #FECACA" }}
                onError={e => { e.currentTarget.src="/police-logo.png"; e.currentTarget.style.objectFit="contain"; e.currentTarget.style.background="#F1F5F9"; }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"inline-block", background:"#DC2626", color:"white", fontSize:10, fontWeight:800, padding:"4px 10px", borderRadius:999, marginBottom:8 }}>
                  WANTED PERSON
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:"#082A63", marginBottom:6 }}>JUMA ABDALLAH</div>
                <div style={{ fontSize:13, color:"#475569", marginBottom:3 }}>
                  Crime: <span style={{ color:"#DC2626", fontWeight:700 }}>Armed Robbery</span>
                </div>
                <div style={{ fontSize:13, color:"#475569", marginBottom:3 }}>
                  <strong>Last Seen:</strong> Njombe Bus Terminal
                </div>
                <div style={{ fontSize:12, color:"#94A3B8", marginBottom:12 }}>
                  Reported: 15 mins ago
                </div>
                <button onClick={() => nav("/person-search")}
                  style={{
                    background:"white", border:"1.5px solid #082A63",
                    color:"#082A63", borderRadius:8, padding:"7px 16px",
                    fontSize:13, fontWeight:600, cursor:"pointer",
                  }}>
                  View Profile
                </button>
              </div>
            </div>
            {/* Dot indicators */}
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:12 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:8, height:8, borderRadius:"50%", background: i===0 ? "#082A63" : "#CBD5E1" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CHART + TABLE ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#082A63" }}>7-Day Incident Trend</div>
            <div style={{ fontSize:11, color:"#94A3B8" }}>Matukio ya Siku 7</div>
          </div>
          <div style={{ padding:"8px 16px 16px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={CHART}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#082A63" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#082A63" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize:11, fill:"#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"1px solid #E2E8F0" }} />
                <Area type="monotone" dataKey="n" name="Incidents" stroke="#082A63" strokeWidth={2.5} fill="url(#g1)" dot={{ fill:"#082A63", r:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#082A63" }}>Recent Incidents</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Matukio ya Hivi Karibuni</div>
            </div>
            <button onClick={() => nav("/incidents")}
              style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:"#475569" }}>
              View All
            </button>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC" }}>
                {["ID","Type","Status","Location","Time"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INCIDENTS.map((r,i) => (
                <tr key={r.id} onClick={() => nav("/incidents")}
                  style={{ borderBottom: i < INCIDENTS.length-1 ? "1px solid #F1F5F9" : "none", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background="#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background="white"}>
                  <td style={{ padding:"11px 14px", fontWeight:700, color:"#0D3477", fontSize:13 }}>{r.id}</td>
                  <td style={{ padding:"11px 14px", fontSize:13 }}>{r.type}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <span style={{ background:r.sbg, color:r.sc, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{r.status}</span>
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"#64748B" }}>{r.loc}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"#94A3B8" }}>{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </DashboardLayout>
  );
}
