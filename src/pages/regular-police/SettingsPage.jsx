import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { User, Shield, Bell, Globe, Lock, Smartphone, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [lang, setLang] = useState("en");
  const [notifications, setNotifications] = useState({ alerts: true, messages: true, tasks: true, system: false });
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: 0 }}>Settings · <span style={{ fontWeight: 500, color: "#94a3b8", fontSize: 22 }}>Mipangilio</span></h1>
        <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>Account and system preferences</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* PROFILE */}
        <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
            <User size={20} color="#0D3477" />
            <h3 style={{ margin: 0, color: "#0D3477" }}>Officer Profile · Wasifu wa Afisa</h3>
          </div>
          {[
            { label: "Full Name / Jina Kamili", value: "David Mbaza", disabled: true },
            { label: "Badge Number / Nambari ya Beji", value: "TZP-2026-00124", disabled: true },
            { label: "Rank / Cheo", value: "Inspector", disabled: true },
            { label: "Station / Kituo", value: "Makambako Police Station", disabled: true },
            { label: "Phone / Simu", value: "+255 712 345 678", disabled: false },
            { label: "Email", value: "d.mbaza@polisi.go.tz", disabled: false },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>{f.label.toUpperCase()}</label>
              <input defaultValue={f.value} disabled={f.disabled}
                style={{ width: "100%", height: 40, border: "1px solid #e2e8f0", borderRadius: 10, padding: "0 12px", fontSize: 13, background: f.disabled ? "#f8fafc" : "white", color: f.disabled ? "#94a3b8" : "#1e293b", boxSizing: "border-box" }} />
            </div>
          ))}
          <p style={{ fontSize: 12, color: "#94a3b8" }}>⚠ Profile details managed by HR. Contact your OCS to update.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* LANGUAGE */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <Globe size={20} color="#0D3477" />
              <h3 style={{ margin: 0, color: "#0D3477" }}>Language · Lugha</h3>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ code: "en", label: "English" }, { code: "sw", label: "Kiswahili" }].map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${lang === l.code ? "#0D3477" : "#e2e8f0"}`, background: lang === l.code ? "#eff6ff" : "white", cursor: "pointer", fontWeight: 700, color: lang === l.code ? "#0D3477" : "#475569" }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <Bell size={20} color="#0D3477" />
              <h3 style={{ margin: 0, color: "#0D3477" }}>Notifications · Arifa</h3>
            </div>
            {[
              { key: "alerts", label: "Security Alerts · Tahadhari za Usalama" },
              { key: "messages", label: "Messages · Ujumbe" },
              { key: "tasks", label: "Task Assignments · Kazi Zilizopewa" },
              { key: "system", label: "System Updates · Masasisho ya Mfumo" },
            ].map(n => (
              <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 14 }}>{n.label}</span>
                <button onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: notifications[n.key] ? "#0D3477" : "#e2e8f0", position: "relative", cursor: "pointer", transition: ".2s" }}>
                  <span style={{ position: "absolute", top: 2, left: notifications[n.key] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: ".2s" }} />
                </button>
              </div>
            ))}
          </div>

          {/* SECURITY */}
          <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <Lock size={20} color="#0D3477" />
              <h3 style={{ margin: 0, color: "#0D3477" }}>Security · Usalama</h3>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Smartphone size={16} color="#16a34a" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#166534" }}>Device Verified · Kifaa Kimethibitishwa</div>
                  <div style={{ fontSize: 12, color: "#16a34a" }}>Device ID: TZP-DEV-2026-00445</div>
                </div>
              </div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Shield size={16} color="#16a34a" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#166534" }}>2FA Active · Uthibitisho wa Hatua 2</div>
                  <div style={{ fontSize: 12, color: "#16a34a" }}>SMS OTP on +255 712 345 ***</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAVE */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", fontWeight: 700, fontSize: 14 }}>
            <CheckCircle size={18} /> Settings saved!
          </div>
        )}
        <button onClick={save} style={{ background: "#0D3477", color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
          <Save size={16} /> Save Settings · Hifadhi Mipangilio
        </button>
      </div>
    </DashboardLayout>
  );
}
