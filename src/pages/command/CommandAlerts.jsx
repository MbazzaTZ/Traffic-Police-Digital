import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { Bell, Siren, AlertTriangle, Info, Shield, Plus, X, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const TYPE_CONFIG = {
  info:      { color:"#0891B2", icon:Info,           label:"Information" },
  warning:   { color:"#D97706", icon:AlertTriangle,  label:"Warning" },
  danger:    { color:"#DC2626", icon:Shield,         label:"Danger" },
  emergency: { color:"#7C3AED", icon:Siren,          label:"Emergency" },
};
const card = { background:"rgba(255,255,255,.04)", borderRadius:14, border:"1px solid rgba(255,255,255,.08)" };

export default function CommandAlerts() {
  const { profile, regionId } = useCurrentUser();
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [form, setForm] = useState({ title:"", body:"", type:"info", priority:"normal", is_national:true });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("alerts").select("*, profiles!alerts_issued_by_fkey(full_name,badge)").order("created_at",{ascending:false}).limit(100);
    setAlerts(data||[]); setLoading(false);
  }
  useEffect(()=>{
    load();
    const sub = supabase.channel("cmd-alerts").on("postgres_changes",{event:"*",schema:"public",table:"alerts"},load).subscribe();
    return ()=>supabase.removeChannel(sub);
  },[]);

  async function submit(e) {
    e.preventDefault(); setSaving(true);
    try {
      await supabase.from("alerts").insert({
        ...form, issued_by:profile?.id||null,
        target_region:form.is_national?null:regionId||null,
        expires_at:new Date(Date.now()+7*86400000).toISOString(),
      });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({title:"",body:"",type:"info",priority:"normal",is_national:true}); },2000);
    } finally { setSaving(false); }
  }

  return (
    <CommandLayout pageTitle="Issue Alerts" pageTitle2="Toa Tahadhari">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", margin:0 }}>Alert Command</h1>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, marginTop:3 }}>{alerts.length} issued · {alerts.filter(a=>a.is_national).length} national broadcasts</p>
        </div>
        <button onClick={()=>setModal(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16}/> Issue National Alert
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {Object.entries(TYPE_CONFIG).map(([t,cfg])=>{
          const Icon=cfg.icon;
          return (
            <div key={t} style={{ ...card, padding:"16px", textAlign:"center", borderTop:`3px solid ${cfg.color}` }}>
              <Icon size={20} color={cfg.color} style={{ marginBottom:6 }}/>
              <div style={{ fontSize:28, fontWeight:900, color:cfg.color }}>{alerts.filter(a=>a.type===t).length}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.7)" }}>{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {loading ? <div style={{ padding:"50px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>Loading...</div>
      : alerts.length===0 ? (
        <div style={{ ...card, padding:"60px 20px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>
          <Bell size={40} style={{ opacity:.3, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600 }}>No alerts issued yet</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {alerts.map(a=>{
            const cfg=TYPE_CONFIG[a.type]||TYPE_CONFIG.info;
            const Icon=cfg.icon;
            return (
              <div key={a.id} style={{ ...card, padding:"16px 18px", borderLeft:`4px solid ${cfg.color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ display:"flex", gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`${cfg.color}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={18} color={cfg.color}/>
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:"white" }}>{a.title}</div>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,.6)", margin:"4px 0 8px", lineHeight:1.5 }}>{a.body}</p>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ background:`${cfg.color}25`, color:cfg.color, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>{cfg.label}</span>
                        {a.is_national && <span style={{ background:"rgba(59,130,246,.2)", color:"#93C5FD", padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>🇹🇿 NATIONAL</span>}
                        <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{(a.acknowledged_by||[]).length} acknowledged</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", whiteSpace:"nowrap" }}>{new Date(a.created_at).toLocaleString("en-GB")}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"#0A1428", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:28, width:"100%", maxWidth:520 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"white" }}>Issue Alert · Toa Tahadhari</div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,.08)", border:"none", cursor:"pointer", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#86EFAC" }}>Alert Broadcast!</h3><p style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>Delivered to all officers in real-time</p></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:.4, marginBottom:8 }}>Alert Type</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                    {Object.entries(TYPE_CONFIG).map(([t,cfg])=>{
                      const Icon=cfg.icon;
                      return (
                        <button key={t} type="button" onClick={()=>setForm(f=>({...f,type:t}))}
                          style={{ padding:"10px 6px", borderRadius:9, border:`2px solid ${form.type===t?cfg.color:"rgba(255,255,255,.1)"}`, background:form.type===t?`${cfg.color}25`:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <Icon size={16} color={cfg.color}/><span style={{ fontSize:10, fontWeight:700, color:cfg.color }}>{t.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {["title","body"].map(field=>(
                  <div key={field} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>{field==="title"?"Title *":"Message *"}</label>
                    {field==="title" ? (
                      <input value={form.title} onChange={upd("title")} required placeholder="Alert title..."
                        style={{ width:"100%", height:42, border:"1.5px solid rgba(255,255,255,.12)", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box", background:"rgba(255,255,255,.04)", color:"white" }}/>
                    ) : (
                      <textarea value={form.body} onChange={upd("body")} rows={4} required placeholder="Alert details..."
                        style={{ width:"100%", border:"1.5px solid rgba(255,255,255,.12)", borderRadius:9, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box", resize:"vertical", background:"rgba(255,255,255,.04)", color:"white" }}/>
                    )}
                  </div>
                ))}
                <label style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.is_national} onChange={upd("is_national")} style={{ width:16, height:16, accentColor:"#3B82F6" }}/>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,.7)" }}>🇹🇿 National — broadcast to ALL officers countrywide</span>
                </label>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#475569":TYPE_CONFIG[form.type].color, color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Broadcasting...":"Issue Alert · Toa Tahadhari"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </CommandLayout>
  );
}
