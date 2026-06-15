import DashboardLayout from "../../layouts/DashboardLayout";
import { AlertTriangle, Radio, CheckCircle } from "lucide-react";

const ALERTS = [
  {
    id:"ALT-001", level:"critical", type:"WANTED PERSON", typeSw:"ANAHITAJIKA",
    title:"JUMA ABDALLAH MWALIMU",
    body:"Armed Robbery suspect. Last seen at Njombe Bus Terminal. Approach with extreme caution — may be armed.",
    photo:"/wanted/wanted-01.jpg", time:"15 mins ago",
  },
  {
    id:"ALT-002", level:"high", type:"BOLO – VEHICLE",   typeSw:"TAFUTA GARI",
    title:"T 241 BRT – Red Toyota Premio",
    body:"Linked to armed robbery. Driver may be armed. Do not attempt to stop alone. Coordinate with dispatch.",
    photo:null, time:"1 hr ago",
  },
  {
    id:"ALT-003", level:"high", type:"MISSING PERSON",   typeSw:"MTU ALIYEPOTEA",
    title:"GRACE JOHN – 8 years old",
    body:"Missing from Makambako North since 14:00. Last seen in blue school uniform. Parents at station.",
    photo:"/suspects/suspect-01.jpg", time:"2 hrs ago",
  },
  {
    id:"ALT-004", level:"info", type:"STATION BRIEFING", typeSw:"HABARI",
    title:"Morning Briefing – 16 June 2026",
    body:"All officers report to Makambako Station at 07:30 for briefing by OCS. Attendance mandatory.",
    photo:null, time:"3 hrs ago",
  },
];

const LVL = {
  critical: { bg:"#FEF2F2", border:"#FECACA", badge:"badge-danger",  icon:"🔴" },
  high:     { bg:"#FFFBEB", border:"#FDE68A", badge:"badge-warning", icon:"🟡" },
  info:     { bg:"#EFF6FF", border:"#BFDBFE", badge:"badge-blue",    icon:"🔵" },
};

export default function AlertsPage() {
  return (
    <DashboardLayout pageTitle="Alerts" pageTitle2="Tahadhari">
      <div className="page-hd">
        <div className="page-hd-row">
          <div>
            <h1 className="page-title">Alert Center <span className="page-title-sw">· Kituo cha Tahadhari</span></h1>
            <p className="page-sub">Live operational alerts from Control Room · Tahadhari za Wakati Halisi</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span className="badge badge-danger">{ALERTS.filter(a=>a.level==="critical").length} Critical</span>
            <span className="badge badge-warning">{ALERTS.filter(a=>a.level==="high").length} High</span>
          </div>
        </div>
      </div>

      {/* Radio banner */}
      <div style={{ background:"linear-gradient(135deg, var(--blue-950), var(--blue-800))", borderRadius:"var(--radius-md)", padding:"14px 20px", marginBottom:20, color:"white", display:"flex", alignItems:"center", gap:12 }}>
        <Radio size={18} />
        <div>
          <span style={{ fontWeight:700 }}>Control Room Live · </span>
          <span style={{ opacity:.7, fontSize:13 }}>Makambako District Radio Channel 4 · All units standby</span>
        </div>
        <span className="badge badge-danger" style={{ marginLeft:"auto" }}>🔴 LIVE</span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {ALERTS.map(a => {
          const s = LVL[a.level];
          return (
            <div key={a.id} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:"var(--radius-lg)", padding:20 }}>
              <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                {a.photo && (
                  <img src={a.photo} alt="Alert"
                    style={{ width:80, height:100, objectFit:"cover", borderRadius:"var(--radius-sm)", border:`1.5px solid ${s.border}`, flexShrink:0 }}
                    onError={e => { e.currentTarget.style.display="none"; }} />
                )}
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                    <span className={`badge ${s.badge}`}>{s.icon} {a.type}</span>
                    <span style={{ fontSize:11, color:"var(--gray-400)" }}>{a.id}</span>
                    <span style={{ fontSize:11, color:"var(--gray-400)", marginLeft:"auto" }}>{a.time}</span>
                  </div>
                  <div style={{ fontWeight:800, fontSize:18, color:"var(--blue-800)", marginBottom:6 }}>{a.title}</div>
                  <p style={{ fontSize:13, color:"var(--gray-500)", lineHeight:1.6, marginBottom:12 }}>{a.body}</p>
                  <div style={{ display:"flex", gap:10 }}>
                    <button className="btn btn-primary btn-sm">
                      <CheckCircle size={14} /> Acknowledge · Kubali
                    </button>
                    {a.level !== "info" && (
                      <button className="btn btn-ghost btn-sm">
                        <AlertTriangle size={14} /> Escalate · Pindisha
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
