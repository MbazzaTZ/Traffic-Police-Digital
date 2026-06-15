import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { User, Bell, Globe, Lock, Smartphone, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [lang, setLang]   = useState("en");
  const [notifs, setNotifs] = useState({ alerts:true, messages:true, tasks:true, system:false });
  const [saved, setSaved]   = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  const toggle = k => () => setNotifs(n => ({ ...n, [k]: !n[k] }));
  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  return (
    <DashboardLayout pageTitle="Settings" pageTitle2="Mipangilio">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Settings <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Mipangilio</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>Account and system preferences</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {saved && <span style={{ display:"flex", gap:6, alignItems:"center", color:"#16A34A", fontWeight:700, fontSize:13 }}><CheckCircle size={16} /> Saved!</span>}
          <button onClick={save} style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
            <Save size={15} /> Save Settings
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Profile */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
            <User size={17} color="#0D3477" />
            <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Officer Profile · Wasifu wa Afisa</div>
          </div>
          <div style={{ padding:20 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20, padding:"14px", background:"#F8FAFC", borderRadius:12 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"#0D3477", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ color:"white", fontSize:20, fontWeight:900 }}>P</span>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:"#082A63" }}>Police Officer</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>TPDOP System · Active</div>
              </div>
            </div>
            {[
              { label:"Full Name · Jina Kamili", val:"—", disabled:true },
              { label:"Badge Number · Nambari ya Beji", val:"—", disabled:true },
              { label:"Rank · Cheo", val:"—", disabled:true },
              { label:"Station · Kituo", val:"—", disabled:true },
              { label:"Phone · Simu", val:"", disabled:false, ph:"+255 ..." },
              { label:"Email", val:"", disabled:false, ph:"officer@polisi.go.tz" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:13 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>{f.label}</label>
                <input defaultValue={f.val} placeholder={f.ph} disabled={f.disabled} style={{ ...inp, background:f.disabled?"#F8FAFC":"white", color:f.disabled?"#94A3B8":"#1E293B" }} />
              </div>
            ))}
            <p style={{ fontSize:11, color:"#94A3B8" }}>⚠ Core profile details managed by HR. Contact Admin to update.</p>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Language */}
          <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
              <Globe size={17} color="#0D3477" />
              <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Language · Lugha</div>
            </div>
            <div style={{ padding:16, display:"flex", gap:10 }}>
              {[{ code:"en", name:"English" },{ code:"sw", name:"Kiswahili" }].map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  style={{ flex:1, padding:"11px", borderRadius:10, border:`2px solid ${lang===l.code?"#0D3477":"#E2E8F0"}`, background:lang===l.code?"#EFF6FF":"white", cursor:"pointer", fontWeight:700, fontSize:13, color:lang===l.code?"#0D3477":"#475569" }}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
              <Bell size={17} color="#0D3477" />
              <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Notifications · Arifa</div>
            </div>
            <div style={{ padding:"4px 16px 12px" }}>
              {[
                { k:"alerts",   label:"Security Alerts · Tahadhari" },
                { k:"messages", label:"Messages · Ujumbe" },
                { k:"tasks",    label:"Task Assignments · Kazi" },
                { k:"system",   label:"System Updates · Masasisho" },
              ].map(n => (
                <div key={n.k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid #F8FAFC" }}>
                  <span style={{ fontSize:13 }}>{n.label}</span>
                  <button onClick={toggle(n.k)} style={{ width:42, height:23, borderRadius:12, border:"none", background:notifs[n.k]?"#0D3477":"#E2E8F0", position:"relative", cursor:"pointer", transition:".2s", flexShrink:0 }}>
                    <span style={{ position:"absolute", top:2, left:notifs[n.k]?21:2, width:19, height:19, borderRadius:"50%", background:"white", transition:".2s", display:"block", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
              <Lock size={17} color="#0D3477" />
              <div style={{ fontSize:14, fontWeight:700, color:"#082A63" }}>Security · Usalama</div>
            </div>
            <div style={{ padding:16, display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { icon:Smartphone, title:"Device Verification · Thibitisha Kifaa", sub:"Register this device for secure access" },
                { icon:Lock,       title:"Two-Factor Auth · Uthibitisho wa Hatua 2", sub:"Enable SMS OTP for extra security" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.title} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
                    <Icon size={16} color="#64748B" />
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:"#1E293B" }}>{s.title}</div>
                      <div style={{ fontSize:11, color:"#94A3B8" }}>{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
