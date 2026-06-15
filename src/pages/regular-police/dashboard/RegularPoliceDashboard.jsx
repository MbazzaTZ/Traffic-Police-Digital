import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Search, FileText, ShieldAlert, MapPinned, FolderOpen, Siren, Activity, AlertTriangle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const S = {
  kpiGrid:  { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:22 },
  kpiCard:  { background:"white", borderRadius:16, padding:"18px 20px", border:"1px solid #E2E8F0", borderTop:"4px solid #0D3477", boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:".2s", textAlign:"center" },
  kpiValue: { fontSize:36, fontWeight:900, lineHeight:1, marginBottom:5 },
  kpiLabel: { fontSize:12, fontWeight:700, color:"#334155" },
  kpiSw:    { fontSize:10, color:"#94A3B8", marginTop:2 },

  actionGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 },
  actionTile: { background:"white", border:"1.5px solid #E2E8F0", borderRadius:14, padding:"17px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:".2s", textAlign:"center" },
  actionIcon: { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" },
  actionLbl:  { fontSize:12, fontWeight:700, color:"#1E293B" },
  actionSw:   { fontSize:10, color:"#94A3B8" },

  twoCol: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:16 },
  sectionHd: { display:"flex", alignItems:"center", gap:8, margin:"22px 0 12px" },
};

const KPIS = [
  { v:"18", label:"Open Incidents",  sw:"Matukio Wazi",         color:"#DC2626" },
  { v:"07", label:"Arrests Today",   sw:"Kukamatwa Leo",        color:"#0D3477" },
  { v:"04", label:"Detentions",      sw:"Vizuizi",              color:"#D97706" },
  { v:"12", label:"Active Patrols",  sw:"Doria Zinazoendelea",  color:"#059669" },
  { v:"09", label:"Evidence Items",  sw:"Vitu vya Ushahidi",    color:"#7C3AED" },
];

const ACTIONS = [
  { icon:Search,      label:"Search Person",   sw:"Tafuta Mtu",         path:"/person-search", color:"#0D3477" },
  { icon:FileText,    label:"New Incident",    sw:"Tukio Jipya",        path:"/incidents",     color:"#059669" },
  { icon:ShieldAlert, label:"Record Arrest",   sw:"Rekodi Kukamatwa",   path:"/arrests",       color:"#DC2626" },
  { icon:MapPinned,   label:"Start Patrol",    sw:"Anza Doria",         path:"/patrols",       color:"#D97706" },
  { icon:FolderOpen,  label:"Upload Evidence", sw:"Pakia Ushahidi",     path:"/evidence",      color:"#7C3AED" },
  { icon:Siren,       label:"Emergency Alert", sw:"Dharura",            path:"/alerts",        color:"#DC2626" },
  { icon:FileText,    label:"PF3 Form",        sw:"Fomu PF3",           path:"/incidents",     color:"#0891B2" },
  { icon:Activity,    label:"Daily Report",    sw:"Ripoti ya Leo",      path:"/incidents",     color:"#475569" },
];

const CHART = [
  {day:"Mon",n:4},{day:"Tue",n:7},{day:"Wed",n:3},
  {day:"Thu",n:9},{day:"Fri",n:6},{day:"Sat",n:12},{day:"Sun",n:5},
];

const INCIDENTS = [
  { id:"INC-1001", type:"Theft",       status:"Open",          sc:"badge-danger",  loc:"Makambako Mkt", t:"08:42" },
  { id:"INC-1002", type:"Assault",     status:"Assigned",      sc:"badge-blue",    loc:"Njombe Rd",     t:"09:15" },
  { id:"INC-1003", type:"Burglary",    status:"Investigating", sc:"badge-success", loc:"Mafinga",       t:"07:30" },
  { id:"INC-1004", type:"Disturbance", status:"Closed",        sc:"badge-gray",    loc:"Bus Stand",     t:"06:00" },
];

export default function RegularPoliceDashboard() {
  const nav = useNavigate();

  return (
    <DashboardLayout pageTitle="Dashboard" pageTitle2="Dashibodi">

      {/* Command Banner */}
      <div style={{
        background:"linear-gradient(135deg,#03102B,#082A63,#0D3477)",
        borderRadius:20, padding:"22px 28px", color:"white",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        flexWrap:"wrap", gap:16, marginBottom:22,
        boxShadow:"0 10px 30px rgba(5,25,62,.3)", position:"relative", overflow:"hidden"
      }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,.03)" }} />
        <div style={{ display:"flex", alignItems:"center", gap:18, zIndex:1 }}>
          <img src="/police-logo.png" alt="Officer"
            style={{ width:68, height:68, borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(255,255,255,.2)", flexShrink:0 }} />
          <div>
            <div style={{ fontSize:10, fontWeight:700, opacity:.55, letterSpacing:1, marginBottom:4 }}>REGULAR POLICE OFFICER · AFISA WA KAWAIDA</div>
            <div style={{ fontSize:22, fontWeight:800, lineHeight:1.1 }}>Inspector David Mbaza</div>
            <div style={{ fontSize:13, opacity:.7, marginTop:4 }}>Badge: TZP-2026-00124 · Makambako Police Station · Njombe District</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", zIndex:1 }}>
          {["🟢 On Duty","📍 GPS Active","✅ Device Verified","🔒 Encrypted"].map(c => (
            <div key={c} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:999, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.14)", fontSize:12, fontWeight:600 }}>{c}</div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={S.kpiGrid}>
        {KPIS.map(k => (
          <div key={k.label} style={{ ...S.kpiCard, borderTopColor: k.color }}>
            <div style={{ ...S.kpiValue, color: k.color }}>{k.v}</div>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={S.kpiSw}>{k.sw}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={S.sectionHd}>
        <span style={{ fontSize:16, fontWeight:700, color:"#082A63" }}>Quick Actions</span>
        <span style={{ fontSize:12, color:"#94A3B8" }}>· Vitendo vya Haraka</span>
      </div>
      <div style={S.actionGrid}>
        {ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} style={S.actionTile} onClick={() => nav(a.path)}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.borderColor=a.color; e.currentTarget.style.boxShadow=`0 8px 20px ${a.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.boxShadow=""; }}>
              <div style={{ ...S.actionIcon, background: a.color + "18" }}>
                <Icon size={22} color={a.color} />
              </div>
              <div style={S.actionLbl}>{a.label}</div>
              <div style={S.actionSw}>{a.sw}</div>
            </button>
          );
        })}
      </div>

      {/* Tasks + Alert */}
      <div style={S.twoCol}>
        <div className="panel">
          <div className="panel-hd">
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Assigned Tasks</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Kazi Zilizopewa</div>
            </div>
          </div>
          <div className="panel-body">
            {[
              { p:"HIGH",   ps:"#FEE2E2", pc:"#B91C1C", level:"task-high",   task:"Patrol Sector A – Makambako Central", due:"Due: 14:00 Today",    note:"Assigned by OCS Makambako" },
              { p:"MEDIUM", ps:"#FEF3C7", pc:"#92400E", level:"task-medium", task:"Follow Up: INC-2026-008",             due:"Due: Tomorrow 09:00", note:"CID Coordination Required" },
              { p:"LOW",    ps:"#DBEAFE", pc:"#1D4ED8", level:"task-low",    task:"Submit Weekly Activity Report",        due:"Due: Friday 17:00",   note:"Station Commander Review" },
            ].map((t,i) => (
              <div key={i} className={`task-card ${t.level}`}>
                <span style={{ display:"inline-block", padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:800, background:t.ps, color:t.pc, marginBottom:6 }}>{t.p}</span>
                <div style={{ fontSize:13, fontWeight:700, color:"#1E293B", marginBottom:3 }}>{t.task}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>
                  <Clock size={11} style={{ verticalAlign:"middle", marginRight:3 }} />{t.due} · {t.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ borderTopColor:"#DC2626" }}>
          <div className="panel-hd">
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#DC2626" }}>⚠ Alert Center</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Kituo cha Tahadhari</div>
            </div>
            <span className="badge badge-danger">3 Active</span>
          </div>
          <div className="panel-body">
            <div className="alert-profile-card">
              <img src="/wanted/wanted-01.jpg" alt="Suspect" className="alert-photo"
                onError={e => { e.currentTarget.src="/police-logo.png"; e.currentTarget.style.objectFit="contain"; }} />
              <div>
                <span className="badge badge-danger" style={{ marginBottom:8, display:"inline-flex" }}>
                  <AlertTriangle size={11} /> WANTED · ANAHITAJIKA
                </span>
                <div style={{ fontWeight:800, fontSize:16, color:"#0D3477", margin:"6px 0 4px" }}>JUMA ABDALLAH</div>
                <div style={{ fontSize:13, color:"#475569", marginBottom:3 }}>Armed Robbery · Wizi kwa Silaha</div>
                <div style={{ fontSize:13, color:"#475569", marginBottom:3 }}>Last seen: Njombe Bus Terminal</div>
                <div style={{ fontSize:11, color:"#94A3B8" }}>⚠ Approach with caution · 15 mins ago</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop:10 }} onClick={() => nav("/person-search")}>
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Incidents */}
      <div style={S.twoCol}>
        <div className="panel" style={{ marginTop:0 }}>
          <div className="panel-hd">
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>7-Day Incident Trend</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Matukio ya Siku 7</div>
            </div>
          </div>
          <div style={{ padding:"4px 16px 16px" }}>
            <ResponsiveContainer width="100%" height={185}>
              <AreaChart data={CHART}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0D3477" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0D3477" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize:11, fill:"#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"1px solid #E2E8F0" }} />
                <Area type="monotone" dataKey="n" name="Incidents" stroke="#0D3477" strokeWidth={2.5} fill="url(#g1)" dot={{ fill:"#0D3477", r:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel" style={{ marginTop:0 }}>
          <div className="panel-hd">
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Recent Incidents</div>
              <div style={{ fontSize:11, color:"#94A3B8" }}>Matukio ya Hivi Karibuni</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav("/incidents")}>View All</button>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Status</th><th>Location</th><th>Time</th></tr>
            </thead>
            <tbody>
              {INCIDENTS.map(r => (
                <tr key={r.id} onClick={() => nav("/incidents")}>
                  <td style={{ fontWeight:700, color:"#0D3477" }}>{r.id}</td>
                  <td>{r.type}</td>
                  <td><span className={`badge ${r.sc}`}>{r.status}</span></td>
                  <td style={{ color:"#64748B" }}>{r.loc}</td>
                  <td style={{ color:"#94A3B8" }}>{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </DashboardLayout>
  );
}
