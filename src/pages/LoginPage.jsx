import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, User, Lock } from "lucide-react";

export default function LoginPage() {
  const [badge, setBadge]   = useState("");
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); nav("/dashboard"); }, 1500);
  }

  return (
    <div className="auth-page">
      {/* Left — Branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <img src="/police-logo-transparent.png" alt="Tanzania Police" className="auth-brand-logo"
            onError={e => { e.currentTarget.style.display = "none"; }} />
          <div className="auth-divider" />
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Jamhuri ya Muungano wa Tanzania
          </p>
          <h1 className="auth-brand" style={{ fontSize: 46, fontWeight: 900, color: "white", letterSpacing: -1 }}>TPDOP</h1>
          <h2 style={{ color: "rgba(255,255,255,.7)", fontWeight: 600, fontSize: 15, marginTop: 6 }}>
            Tanzania Police Digital Operations Platform
          </h2>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginTop: 8 }}>
            Jukwaa la Kidijitali la Uendeshaji wa Polisi Tanzania
          </p>
          <div className="auth-divider" style={{ margin: "28px auto" }} />

          {/* Feature list */}
          {[
            "🔒 End-to-End Encrypted · Usimbaji wa Mwisho hadi Mwisho",
            "📍 Real-Time GPS Tracking · Ufuatiliaji wa GPS",
            "🛡 Audit Logged · Kila Hatua Inarekodiwa",
            "📱 Biometric 2FA · Uthibitisho wa Viumbe",
          ].map(f => (
            <div key={f} style={{ color: "rgba(255,255,255,.55)", fontSize: 12, marginTop: 8, textAlign: "left", maxWidth: 300 }}>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="auth-right">
        <div className="login-box">
          <img src="/Coat of Arms.png" alt="Coat of Arms" className="coat-arms"
            onError={e => { e.currentTarget.style.display = "none"; }} />

          <div className="login-title">Officer Sign In</div>
          <div className="login-subtitle">
            Enter your badge number and password to access the system
          </div>

          <form onSubmit={submit}>
            <div className="field">
              <label>Badge Number · Nambari ya Beji</label>
              <div className="field-wrap">
                <span className="field-icon"><User size={16} /></span>
                <input
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  placeholder="TZP-2026-00124"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="field">
              <label>Password · Nywila</label>
              <div className="field-wrap">
                <span className="field-icon"><Lock size={16} /></span>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="field-action" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-meta">
              <label>
                <input type="checkbox" style={{ accentColor: "#0D3477" }} />
                Remember this device
              </label>
              <a href="#">Forgot password?</a>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading
                ? <><span className="spinner" /> Authenticating...</>
                : <><Shield size={18} /> Access System · Ingia Mfumo</>}
            </button>
          </form>

          <div className="login-audit">
            <Lock size={11} />
            All access is logged · Usalama wa Serikali · Encrypted
          </div>
        </div>
      </div>
    </div>
  );
}
