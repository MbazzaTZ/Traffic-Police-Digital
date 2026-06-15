import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, User, Lock } from "lucide-react";

export default function LoginPage() {
  const [badge, setBadge]     = useState("");
  const [pw, setPw]           = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); nav("/dashboard"); }, 1500);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#EEF2F7" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: 1,
        background: "linear-gradient(160deg, #03102B 0%, #071E4A 45%, #0D3477 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-120, right:-120, width:340, height:340, borderRadius:"50%", border:"1px solid rgba(255,255,255,.05)" }} />
        <div style={{ position:"absolute", top:-60, right:-60,  width:200, height:200, borderRadius:"50%", border:"1px solid rgba(255,255,255,.05)" }} />
        <div style={{ position:"absolute", bottom:-100, left:-100, width:300, height:300, borderRadius:"50%", border:"1px solid rgba(255,255,255,.04)" }} />

        {/* Logo — transparent PNG on dark = perfect */}
        <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:400 }}>

          {/* Glowing ring behind logo */}
          <div style={{
            width: 140, height: 140,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 70%)",
            border: "1px solid rgba(255,255,255,.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 40px rgba(255,255,255,.06)",
          }}>
            <img
              src="/police-logo-transparent.png"
              alt="Tanzania Police Force"
              style={{ width: 110, height: 110, objectFit: "contain" }}
            />
          </div>

          {/* Country */}
          <p style={{ color:"rgba(255,255,255,.4)", fontSize:11, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>
            Jamhuri ya Muungano wa Tanzania
          </p>

          {/* System name */}
          <h1 style={{ color:"white", fontSize:52, fontWeight:900, letterSpacing:-1, margin:"0 0 8px", lineHeight:1 }}>
            TPDOP
          </h1>

          <div style={{ width:48, height:3, background:"rgba(255,255,255,.2)", borderRadius:2, margin:"14px auto" }} />

          <p style={{ color:"rgba(255,255,255,.75)", fontSize:15, fontWeight:600, marginBottom:6 }}>
            Tanzania Police Digital Operations Platform
          </p>
          <p style={{ color:"rgba(255,255,255,.38)", fontSize:13, marginBottom:36 }}>
            Jukwaa la Kidijitali la Uendeshaji wa Polisi
          </p>

          {/* Feature pills */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-start", marginTop:4 }}>
            {[
              { icon:"🔒", text:"End-to-End Encrypted · Usimbaji Salama" },
              { icon:"📍", text:"Real-Time GPS Tracking · Ufuatiliaji wa GPS" },
              { icon:"🛡", text:"Audit Logged · Kila Hatua Inarekodiwa" },
              { icon:"📱", text:"Biometric 2FA · Uthibitisho wa Viumbe" },
            ].map(f => (
              <div key={f.text} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"8px 14px", borderRadius:8,
                background:"rgba(255,255,255,.06)",
                border:"1px solid rgba(255,255,255,.08)",
                width:"100%",
              }}>
                <span style={{ fontSize:14 }}>{f.icon}</span>
                <span style={{ color:"rgba(255,255,255,.6)", fontSize:12 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: 460,
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 52px",
      }}>
        <div style={{ width:"100%" }}>

          {/* Coat of Arms */}
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <img
              src="/Coat of Arms.png"
              alt="Coat of Arms of Tanzania"
              style={{ width:80, height:80, objectFit:"contain" }}
            />
          </div>

          <h2 style={{ textAlign:"center", fontSize:24, fontWeight:800, color:"#082A63", marginBottom:6 }}>
            Officer Sign In
          </h2>
          <p style={{ textAlign:"center", color:"#94A3B8", fontSize:13, marginBottom:30, lineHeight:1.5 }}>
            Enter your badge number and password<br/>to access the system
          </p>

          <form onSubmit={submit}>
            {/* Badge */}
            <div className="field">
              <label>Badge Number · Nambari ya Beji</label>
              <div className="field-wrap">
                <span className="field-icon"><User size={15} /></span>
                <input
                  value={badge} onChange={e => setBadge(e.target.value)}
                  placeholder="TZP-2026-00124"
                  required autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <label>Password · Nywila</label>
              <div className="field-wrap">
                <span className="field-icon"><Lock size={15} /></span>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="••••••••"
                  required autoComplete="current-password"
                />
                <button type="button" className="field-action" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"4px 0 22px", fontSize:13 }}>
              <label style={{ display:"flex", gap:7, alignItems:"center", cursor:"pointer", color:"#64748B" }}>
                <input type="checkbox" style={{ accentColor:"#0D3477" }} />
                Remember this device
              </label>
              <a href="#" style={{ color:"#0D3477", fontWeight:600, textDecoration:"none" }}>Forgot password?</a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width:"100%", height:50,
              background: loading ? "#94A3B8" : "#0D3477",
              color:"white", border:"none", borderRadius:12,
              fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              transition:"background .2s",
            }}>
              {loading
                ? <><span className="spinner" /> Authenticating...</>
                : <><Shield size={18} /> Access System · Ingia Mfumo</>}
            </button>
          </form>

          {/* Audit note */}
          <div style={{ marginTop:22, textAlign:"center", fontSize:11, color:"#CBD5E1", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
            <Lock size={11} />
            All access is logged · Usalama wa Serikali · Encrypted
          </div>

          {/* Bottom badge row */}
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:20 }}>
            {["🔒 Secure","📋 Audited","🇹🇿 Tanzania"].map(b => (
              <span key={b} style={{ fontSize:11, color:"#CBD5E1", display:"flex", alignItems:"center", gap:4 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
