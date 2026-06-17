import { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Save, CheckCircle, Shield, Bell, Globe, Database, Lock, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

export default function AdminSettingsPage() {
  const { profile } = useCurrentUser();
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [info,     setInfo]     = useState("");

  // Local form state — initialized from DB
  const [settings, setSettings] = useState({
    systemName: "TPDOP – Tanzania Police Digital Operations Platform",
    version: "1.0.0", sessionTimeout: "30", maxLoginAttempts: "5",
    require2fa: true, auditLogging: true, gpsTracking: true,
    emailNotifications: true, smsNotifications: true,
    maintenanceMode: false, language: "en",
  });

  // ── Load all settings from system_settings table ──
  async function load() {
    setLoading(true); setErr("");
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value, value_type");
      if (error) throw error;
      const next = { ...settings };
      (data || []).forEach(row => {
        if (!(row.key in next)) return;       // ignore unknown keys
        if (row.value_type === "boolean") {
          next[row.key] = row.value === "true";
        } else if (row.value_type === "number") {
          next[row.key] = String(row.value || "");
        } else {
          next[row.key] = row.value || "";
        }
      });
      setSettings(next);
      setInfo(`Loaded ${data?.length || 0} settings from database`);
    } catch (e) {
      setErr(e.message || "Could not load settings");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const upd = k => e => setSettings(s => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // ── Save all settings back to system_settings table (upsert by key) ──
  async function save() {
    setSaving(true); setErr(""); setInfo("");
    try {
      const rows = Object.entries(settings).map(([key, val]) => ({
        key,
        value: typeof val === "boolean" ? String(val) : String(val ?? ""),
        value_type: typeof val === "boolean" ? "boolean"
                  : typeof val === "number" ? "number"
                  : "string",
        updated_by: profile?.id || null,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("system_settings")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;

      logAction({
        profile,
        action: "update_system_settings",
        entityType: "system_settings",
        description: `Updated ${rows.length} system settings`,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setInfo(`Saved ${rows.length} settings`);
    } catch (e) {
      setErr(e.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  const section = (icon, title, sub, content) => {
    const Icon = icon;
    return (
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon size={17} color="#0D3477" />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#03102B" }}>{title}</div>
            <div style={{ fontSize:11, color:"#94A3B8" }}>{sub}</div>
          </div>
        </div>
        <div style={{ padding:20 }}>{content}</div>
      </div>
    );
  };

  const toggle = (key, label) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid #F8FAFC" }}>
      <span style={{ fontSize:13, color:"#1E293B" }}>{label}</span>
      <button onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
        style={{ width:44, height:24, borderRadius:12, border:"none", background:settings[key] ? "#0D3477" : "#E2E8F0", position:"relative", cursor:"pointer", transition:".2s", flexShrink:0 }}>
        <span style={{ position:"absolute", top:2, left:settings[key] ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"white", transition:".2s", display:"block", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }} />
      </button>
    </div>
  );

  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  return (
    <AdminLayout pageTitle="System Settings" pageTitle2="Mipangilio ya Mfumo">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>System Settings</h1>
          <p style={{ color:"#64748B", marginTop:3 }}>Mipangilio ya Mfumo · TPDOP v{settings.version || "1.0.0"}{loading ? " · loading…" : info ? ` · ${info}` : ""}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {saved && <span style={{ display:"flex", gap:6, alignItems:"center", color:"#16A34A", fontWeight:700, fontSize:13 }}><CheckCircle size={16} /> Saved!</span>}
          <button onClick={load} disabled={loading}
            style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, opacity:loading?.6:1 }}>
            <RefreshCw size={14}/> Reload
          </button>
          <button onClick={save} disabled={saving || loading}
            style={{ padding:"10px 24px", borderRadius:10, border:"none", background:saving?"#94A3B8":"#0D3477", color:"white", fontWeight:700, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
            <Save size={15} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
          <AlertCircle size={15} color="#DC2626" style={{ flexShrink:0 }}/>
          <span style={{ fontSize:13, color:"#B91C1C", flex:1 }}>{err}</span>
          <button onClick={()=>setErr("")} style={{ background:"transparent", border:"none", color:"#B91C1C", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
        <div style={{ paddingRight:8 }}>
          {section(Database, "System Information", "Taarifa za Mfumo", (
            <>
              {[["System Name","systemName","text"],["Version","version","text"],["Session Timeout (min)","sessionTimeout","number"],["Max Login Attempts","maxLoginAttempts","number"]].map(([l,k,t]) => (
                <div key={k} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{l}</label>
                  <input type={t} value={settings[k]} onChange={upd(k)} disabled={loading} style={{ ...inp, opacity:loading?.6:1 }}
                    onFocus={e => e.target.style.borderColor="#0D3477"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Default Language</label>
                <select value={settings.language} onChange={upd("language")} disabled={loading} style={{ ...inp, paddingLeft:12, opacity:loading?.6:1 }}>
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                </select>
              </div>
            </>
          ))}

          {section(Lock, "Security Settings", "Mipangilio ya Usalama", (
            <>
              {toggle("require2fa",        "Require 2FA for all officers · Thibitisho la Hatua 2")}
              {toggle("auditLogging",      "Audit logging enabled · Kumbukumbu za Shughuli")}
              {toggle("gpsTracking",       "GPS tracking active · Ufuatiliaji wa GPS")}
              {toggle("maintenanceMode",   "Maintenance mode · Hali ya Matengenezo")}
            </>
          ))}
        </div>

        <div style={{ paddingLeft:8 }}>
          {section(Bell, "Notifications", "Arifa", (
            <>
              {toggle("emailNotifications","Email notifications · Arifa za Barua Pepe")}
              {toggle("smsNotifications",  "SMS notifications · Arifa za SMS")}
            </>
          ))}

          {section(Shield, "System Status", "Hali ya Mfumo", (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Database",        status:"Operational", c:"#16A34A", bg:"#F0FDF4" },
                { label:"Authentication",  status:"Operational", c:"#16A34A", bg:"#F0FDF4" },
                { label:"GPS Service",     status: settings.gpsTracking ? "Operational" : "Disabled", c: settings.gpsTracking ? "#16A34A" : "#94A3B8", bg: settings.gpsTracking ? "#F0FDF4" : "#F8FAFC" },
                { label:"SMS Gateway",     status: settings.smsNotifications ? "Operational" : "Disabled", c: settings.smsNotifications ? "#16A34A" : "#94A3B8", bg: settings.smsNotifications ? "#F0FDF4" : "#F8FAFC" },
                { label:"Email Service",   status: settings.emailNotifications ? "Operational" : "Disabled", c: settings.emailNotifications ? "#16A34A" : "#94A3B8", bg: settings.emailNotifications ? "#F0FDF4" : "#F8FAFC" },
                { label:"Audit Logging",   status: settings.auditLogging ? "Operational" : "Disabled", c: settings.auditLogging ? "#16A34A" : "#94A3B8", bg: settings.auditLogging ? "#F0FDF4" : "#F8FAFC" },
                { label:"Maintenance Mode",status: settings.maintenanceMode ? "ACTIVE" : "Off", c: settings.maintenanceMode ? "#D97706" : "#16A34A", bg: settings.maintenanceMode ? "#FFFBEB" : "#F0FDF4" },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:s.bg, borderRadius:10, border:`1px solid ${s.c}20` }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{s.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:s.c, display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:s.c, display:"inline-block" }} />{s.status}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
