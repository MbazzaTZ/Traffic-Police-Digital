import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Bell, AlertTriangle, Info, Shield, Siren, CheckCircle, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const TYPE_CONFIG = {
  info:      { color:"#0891B2", bg:"#EFF6FF", icon:Info,          label:"Information" },
  warning:   { color:"#D97706", bg:"#FFFBEB", icon:AlertTriangle,  label:"Warning" },
  danger:    { color:"#DC2626", bg:"#FEF2F2", icon:Shield,         label:"Danger" },
  emergency: { color:"#7C3AED", bg:"#F5F3FF", icon:Siren,          label:"🚨 EMERGENCY" },
};

export default function AlertsPage() {
  const { profile, stationId, regionId } = useCurrentUser();
  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [compose,  setCompose]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [filter,   setFilter]   = useState("all");
  const [form, setForm] = useState({ title:"", body:"", type:"info", priority:"normal", is_national:false });
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.type==="checkbox"?e.target.checked:e.target.value }));

  const isAdmin = ["admin_officer","igp","digp","rpc","ocd","ocs"].includes(profile?.role);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("alerts")
      .select("*, profiles!alerts_issued_by_fkey(full_name,badge,role)")
      .order("created_at", { ascending:false }).limit(100);
    setAlerts(data||[]);
    setLoading(false);
  }

  useEffect(() => {
    if (profile !== undefined) load();
    // Real-time
    const sub = supabase.channel("alerts-realtime")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"alerts" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [profile]);

  async function submit(e) {
    e.preventDefault(); setSaving(true);
    try {
      await supabase.from("alerts").insert({
        ...form, issued_by:profile?.id||null,
        target_region:form.is_national?null:regionId||null,
        target_station:form.is_national?null:stationId||null,
        expires_at:new Date(Date.now()+7*86400000).toISOString(),
      });
      setDone(true); await load();
      setTimeout(() => { setCompose(false); setDone(false); setForm({title:"",body:"",type:"info",priority:"normal",is_national:false}); }, 2000);
    } finally { setSaving(false); }
  }

  async function acknowledge(alertId) {
    const { data:al } = await supabase.from("alerts").select("acknowledged_by").eq("id",alertId).single();
    const current = al?.acknowledged_by || [];
    if (!current.includes(profile?.id)) {
      await supabase.from("alerts").update({ acknowledged_by:[...current, profile?.id] }).eq("id", alertId);
      await load();
    }
  }

  const filtered = alerts.filter(a => filter==="all" || a.type===filter);
  const unread = alerts.filter(a => !(a.acknowledged_by||[]).includes(profile?.id));

  return (
    <DashboardLayout pageTitle="Alerts" pageTitle2="Tahadhari">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Alert Center <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Kituo cha Tahadhari</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{unread.length} unread · {alerts.filter(a=>a.type==="emergency").length} emergencies · Real-time</p>
        </div>
        {isAdmin && (
          <button onClick={()=>setCompose(true)}
            style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
            <Plus size={15}/> Issue Alert · Toa Tahadhari
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          const count = alerts.filter(a=>a.type===type).length;
          return (
            <div key={type} onClick={()=>setFilter(filter===type?"all":type)}
              style={{ background:filter===type?cfg.bg:"white", borderRadius:12, padding:"14px", border:`1.5px solid ${filter===type?cfg.color:"#E2E8F0"}`, textAlign:"center", cursor:"pointer", transition:".15s" }}>
              <Icon size={20} color={cfg.color} style={{ marginBottom:6 }}/>
              <div style={{ fontSize:24, fontWeight:900, color:cfg.color }}>{count}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"#1E293B" }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Alerts list */}
      {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
      : filtered.length===0 ? (
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Bell size={40} style={{ opacity:.2, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{alerts.length===0?"No alerts issued yet":"No alerts match filter"}</div>
          <div style={{ fontSize:13, marginTop:4 }}>Hakuna tahadhari · Alerts from Control Room appear here in real-time</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(alert => {
            const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            const acked = (alert.acknowledged_by||[]).includes(profile?.id);
            const isEmergency = alert.type==="emergency";
            return (
              <div key={alert.id} style={{ background:"white", borderRadius:14, border:`2px solid ${isEmergency?cfg.color:"#E2E8F0"}`, overflow:"hidden", boxShadow:isEmergency?"0 4px 20px rgba(124,58,237,.2)":"none" }}>
                {isEmergency && <div style={{ background:cfg.color, color:"white", padding:"5px 16px", fontSize:11, fontWeight:800, letterSpacing:1, textAlign:"center", animation:"pulse 1.5s infinite" }}>🚨 EMERGENCY ALERT · TAHADHARI YA DHARURA 🚨</div>}
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>
                <div style={{ padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={20} color={cfg.color}/>
                      </div>
                      <div>
                        <div style={{ fontSize:15, fontWeight:800, color:"#1E293B", marginBottom:2 }}>{alert.title}</div>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <span style={{ background:cfg.bg, color:cfg.color, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>{cfg.label}</span>
                          {alert.is_national && <span style={{ background:"#EFF6FF", color:"#0D3477", padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>🇹🇿 NATIONAL</span>}
                          {alert.priority!=="normal" && <span style={{ background:"#FEF2F2", color:"#DC2626", padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>{alert.priority.toUpperCase()}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", flex:"column", alignItems:"flex-end", gap:6 }}>
                      <div style={{ fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{new Date(alert.created_at).toLocaleString("en-GB")}</div>
                      <button onClick={()=>acknowledge(alert.id)} disabled={acked}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:7, border:"none", background:acked?"#F0FDF4":"#EFF6FF", color:acked?"#16A34A":"#0D3477", cursor:acked?"default":"pointer", fontSize:11, fontWeight:700 }}>
                        <CheckCircle size={12}/> {acked?"Acknowledged":"Acknowledge"}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:"#475569", lineHeight:1.6, margin:"8px 0 10px", paddingLeft:52 }}>{alert.body}</p>
                  <div style={{ paddingLeft:52, display:"flex", gap:12, fontSize:11, color:"#94A3B8" }}>
                    <span>By: {alert.profiles?.full_name||"System"}</span>
                    <span>·</span>
                    <span>Acknowledged by: {(alert.acknowledged_by||[]).length} officers</span>
                    {alert.expires_at && <><span>·</span><span>Expires: {new Date(alert.expires_at).toLocaleDateString("en-GB")}</span></>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose Modal (admin only) */}
      {compose && isAdmin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setCompose(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:520 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>Issue Alert · Toa Tahadhari</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Real-time delivery to all connected officers</div></div>
              <button onClick={()=>setCompose(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Alert Issued!</h3><p style={{ fontSize:13, color:"#64748B" }}>All connected officers notified in real-time</p></div>
            ) : (
              <form onSubmit={submit}>
                {/* Type */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:8 }}>Alert Type *</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                    {Object.entries(TYPE_CONFIG).map(([t,cfg])=>{
                      const Icon=cfg.icon;
                      return (
                        <button key={t} type="button" onClick={()=>setForm(f=>({...f,type:t}))}
                          style={{ padding:"10px 6px", borderRadius:9, border:`2px solid ${form.type===t?cfg.color:"#E2E8F0"}`, background:form.type===t?cfg.bg:"white", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <Icon size={16} color={cfg.color}/><span style={{ fontSize:10, fontWeight:700, color:cfg.color }}>{t.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>Title · Kichwa *</label>
                  <input value={form.title} onChange={upd("title")} placeholder="Alert title..." required
                    style={{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}
                    onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>Message · Ujumbe *</label>
                  <textarea value={form.body} onChange={upd("body")} rows={4} required placeholder="Alert details..."
                    style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box", resize:"vertical" }}
                    onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <input type="checkbox" id="national" checked={form.is_national} onChange={upd("is_national")} style={{ width:16, height:16, accentColor:"#0D3477" }}/>
                  <label htmlFor="national" style={{ fontSize:13, color:"#475569", cursor:"pointer" }}>🇹🇿 National alert — broadcast to ALL officers countrywide</label>
                </div>
                <button type="submit" disabled={saving}
                  style={{ width:"100%", height:46, background:saving?"#94A3B8":TYPE_CONFIG[form.type]?.color||"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Broadcasting...":"Issue Alert · Toa Tahadhari"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
