import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { User, Bell, Globe, Lock, Smartphone, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [lang, setLang]  = useState("en");
  const [notifs, setNotifs] = useState({ alerts:true, messages:true, tasks:true, system:false });
  const [saved, setSaved] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  function toggle(k) { setNotifs(n => ({ ...n, [k]: !n[k] })); }

  return (
    <DashboardLayout pageTitle="Settings" pageTitle2="Mipangilio">
      <div className="page-hd">
        <h1 className="page-title">Settings <span className="page-title-sw">· Mipangilio</span></h1>
        <p className="page-sub">Account and system preferences · Mapendeleo ya Mfumo</p>
      </div>

      <div className="two-col">
        {/* Profile */}
        <div className="panel">
          <div className="panel-hd">
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <User size={18} color="var(--blue-700)" />
              <div className="card-title">Officer Profile · Wasifu wa Afisa</div>
            </div>
          </div>
          <div className="panel-body">
            {/* Avatar */}
            <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:20, padding:"14px 16px", background:"var(--gray-50)", borderRadius:"var(--radius-md)" }}>
              <img src="/avatars/officer-01.jpg" alt="Officer"
                style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover", border:"3px solid var(--blue-100)" }}
                onError={e => { e.currentTarget.style.background="var(--blue-700)"; e.currentTarget.src=""; }} />
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:"var(--blue-800)" }}>Inspector David Mbaza</div>
                <div style={{ fontSize:12, color:"var(--gray-400)", marginTop:2 }}>TZP-2026-00124 · Makambako Police Station</div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop:8 }}>Change Photo</button>
              </div>
            </div>

            {[
              { label:"Full Name · Jina Kamili",         val:"David Mbaza",               disabled:true },
              { label:"Badge Number · Nambari ya Beji",  val:"TZP-2026-00124",            disabled:true },
              { label:"Rank · Cheo",                     val:"Inspector",                  disabled:true },
              { label:"Station · Kituo",                 val:"Makambako Police Station",   disabled:true },
              { label:"Phone · Simu",                    val:"+255 712 345 678",           disabled:false },
              { label:"Email",                           val:"d.mbaza@polisi.go.tz",       disabled:false },
            ].map(f => (
              <div className="form-field" key={f.label}>
                <label className="form-label">{f.label}</label>
                <input className="form-input" defaultValue={f.val} disabled={f.disabled}
                  style={{ background: f.disabled ? "var(--gray-50)" : "white", color: f.disabled ? "var(--gray-400)" : "var(--gray-900)" }} />
              </div>
            ))}
            <p style={{ fontSize:11, color:"var(--gray-400)", marginTop:6 }}>
              ⚠ Core profile details managed by HR. Contact your OCS to update.
            </p>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Language */}
          <div className="panel">
            <div className="panel-hd">
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Globe size={18} color="var(--blue-700)" />
                <div className="card-title">Language · Lugha</div>
              </div>
            </div>
            <div className="panel-body">
              <div style={{ display:"flex", gap:10 }}>
                {[{ code:"en", name:"English" }, { code:"sw", name:"Kiswahili" }].map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    style={{
                      flex:1, padding:"12px", borderRadius:"var(--radius-md)",
                      border:`2px solid ${lang===l.code ? "var(--blue-700)" : "var(--gray-200)"}`,
                      background: lang===l.code ? "var(--blue-50)" : "white",
                      cursor:"pointer", fontWeight:700, fontSize:13,
                      color: lang===l.code ? "var(--blue-700)" : "var(--gray-500)",
                    }}>{l.name}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="panel">
            <div className="panel-hd">
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Bell size={18} color="var(--blue-700)" />
                <div className="card-title">Notifications · Arifa</div>
              </div>
            </div>
            <div className="panel-body">
              {[
                { k:"alerts",   label:"Security Alerts · Tahadhari" },
                { k:"messages", label:"Messages · Ujumbe" },
                { k:"tasks",    label:"Task Assignments · Kazi" },
                { k:"system",   label:"System Updates · Masasisho" },
              ].map(n => (
                <div key={n.k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid var(--gray-100)" }}>
                  <span style={{ fontSize:13 }}>{n.label}</span>
                  <button onClick={() => toggle(n.k)}
                    style={{ width:42, height:23, borderRadius:12, border:"none", background: notifs[n.k] ? "var(--blue-700)" : "var(--gray-200)", position:"relative", cursor:"pointer", transition:".2s", flexShrink:0 }}>
                    <span style={{ position:"absolute", top:2, left: notifs[n.k] ? 21 : 2, width:19, height:19, borderRadius:"50%", background:"white", transition:".2s", display:"block" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="panel">
            <div className="panel-hd">
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Lock size={18} color="var(--blue-700)" />
                <div className="card-title">Security · Usalama</div>
              </div>
            </div>
            <div className="panel-body" style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { icon:Smartphone, title:"Device Verified · Kifaa Kimethibitishwa", sub:"Device ID: TZP-DEV-2026-00445" },
                { icon:Lock,       title:"2FA Active · Uthibitisho wa Hatua 2",     sub:"SMS OTP on +255 712 345 ***" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.title} style={{ background:"var(--success-bg)", border:"1px solid #BBF7D0", borderRadius:"var(--radius-sm)", padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
                    <Icon size={16} color="var(--success)" />
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:"#166534" }}>{s.title}</div>
                      <div style={{ fontSize:11, color:"var(--success)" }}>{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ marginTop:24, display:"flex", justifyContent:"flex-end", alignItems:"center", gap:14 }}>
        {saved && (
          <span style={{ display:"flex", gap:6, alignItems:"center", color:"var(--success)", fontWeight:700, fontSize:13 }}>
            <CheckCircle size={16} /> Settings saved!
          </span>
        )}
        <button onClick={save} className="btn btn-primary btn-lg">
          <Save size={16} /> Save Settings · Hifadhi
        </button>
      </div>
    </DashboardLayout>
  );
}
