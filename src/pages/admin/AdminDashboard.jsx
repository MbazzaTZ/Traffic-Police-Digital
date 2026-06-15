import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { Users, Building2, Shield, MapPin, UserPlus, Activity, Clock } from "lucide-react";

export default function AdminDashboard() {
  const nav = useNavigate();

  return (
    <AdminLayout pageTitle="Dashboard" pageTitle2="Dashibodi ya Usimamizi">

      {/* Welcome banner */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#05193E,#082A63)", borderRadius:18, padding:"22px 28px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, marginBottom:22, boxShadow:"0 8px 28px rgba(3,16,43,.35)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#FFD700,#FFA500)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:26, fontWeight:900 }}>A</span>
          </div>
          <div>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, marginBottom:3, textTransform:"uppercase" }}>System Administrator · Msimamizi wa Mfumo</div>
            <div style={{ fontSize:22, fontWeight:800 }}>Admin Officer</div>
            <div style={{ fontSize:13, opacity:.7, marginTop:3 }}>TZP-ADMIN-001 · National HQ · Full System Access</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => nav("/admin/create-user")}
            style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#FFD700", color:"#03102B", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            + Create Officer
          </button>
          <button onClick={() => nav("/admin/stations")}
            style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"rgba(255,255,255,.15)", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            + Add Station
          </button>
        </div>
      </div>

      {/* KPIs — all zero until real data */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:22 }}>
        {[
          { label:"Total Officers",    sw:"Maafisa Wote",       color:"#0D3477", icon:Users },
          { label:"Police Stations",   sw:"Vituo vya Polisi",   color:"#0D3477", icon:Building2 },
          { label:"Regions",           sw:"Mikoa",              color:"#059669", icon:MapPin },
          { label:"Active Roles",      sw:"Majukumu",           color:"#D97706", icon:Shield },
          { label:"Pending Accounts",  sw:"Akaunti Zinasubiri", color:"#DC2626", icon:Activity },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ background:"white", borderRadius:16, padding:"18px 16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.color}`, textAlign:"center" }}>
              <Icon size={22} color={k.color} style={{ marginBottom:8 }} />
              <div style={{ fontSize:34, fontWeight:900, color:k.color, lineHeight:1, marginBottom:5 }}>0</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
              <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{k.sw}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{ fontSize:16, fontWeight:700, color:"#03102B", marginBottom:12 }}>Quick Actions · Vitendo vya Haraka</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:22 }}>
        {[
          { icon:UserPlus,  label:"Create Officer",  sw:"Unda Afisa",       path:"/admin/create-user", color:"#0D3477" },
          { icon:Building2, label:"Add Station",     sw:"Ongeza Kituo",     path:"/admin/stations",    color:"#0D3477" },
          { icon:MapPin,    label:"Manage Regions",  sw:"Simamia Mikoa",    path:"/admin/regions",     color:"#059669" },
          { icon:Shield,    label:"Manage Roles",    sw:"Simamia Majukumu", path:"/admin/roles",       color:"#D97706" },
          { icon:Users,     label:"All Officers",    sw:"Maafisa Wote",     path:"/admin/officers",    color:"#0891B2" },
          { icon:Activity,  label:"System Settings", sw:"Mipangilio",       path:"/admin/settings",    color:"#475569" },
        ].map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => nav(a.path)}
              style={{ background:"white", borderRadius:14, border:"1.5px solid #E2E8F0", padding:"16px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:".18s", textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=a.color; e.currentTarget.style.boxShadow=`0 6px 18px ${a.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.04)"; }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${a.color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={22} color={a.color} />
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{a.label}</div>
              <div style={{ fontSize:10, color:"#94A3B8" }}>{a.sw}</div>
            </button>
          );
        })}
      </div>

      {/* Empty activity log */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#03102B" }}>Officers</div>
            <button onClick={() => nav("/admin/officers")} style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:"#475569" }}>View All</button>
          </div>
          <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Users size={36} style={{ opacity:.2, marginBottom:10 }} />
            <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No officers created yet</div>
            <div style={{ fontSize:12, marginTop:4 }}>Maafisa hawajafunguliwa bado</div>
            <button onClick={() => nav("/admin/create-user")} style={{ marginTop:14, padding:"8px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:12 }}>
              Create First Officer
            </button>
          </div>
        </div>

        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#03102B" }}>Recent Activity · Shughuli za Hivi Karibuni</div>
            <div style={{ fontSize:11, color:"#94A3B8" }}>System audit log</div>
          </div>
          <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Clock size={36} style={{ opacity:.2, marginBottom:10 }} />
            <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No activity yet</div>
            <div style={{ fontSize:12, marginTop:4 }}>Shughuli zitaonekana hapa · Actions will appear here</div>
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}
