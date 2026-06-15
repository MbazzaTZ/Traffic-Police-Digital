import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1400);
  }

  return (
    <div className="auth-container">
      <div className="auth-shell">

        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="gov-header">
            <h3>JAMHURI YA MUUNGANO WA TANZANIA</h3>
            <p>United Republic of Tanzania</p>
          </div>
          <div className="hero-card">
            <img src="/police-logo-transparent.png" alt="TPF" className="police-logo" />
            <h1>TPDOP</h1>
            <p className="hero-subtitle">Tanzania Police Digital Operations Platform</p>
            <p className="hero-subtitle" style={{ marginTop: 8, fontSize: 13, color: "#999" }}>
              Jukwaa la Kidijitali la Uendeshaji wa Polisi Tanzania
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="login-card">

            <img src="/Coat of Arms.png" alt="Coat of Arms" className="coat-logo" />
            <h2>Officer Login</h2>
            <p className="login-desc">Enter your badge number and password</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Badge Number</label>
                <div className="password-wrapper">
                  <input
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    placeholder="e.g. TZP-2026-00124"
                    required
                  />
                  <span className="password-toggle" style={{ pointerEvents: "none" }}>
                    <User size={18} color="#999" />
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="checkbox" /> Remember this device
                </label>
                <a href="#">Forgot password?</a>
              </div>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? (
                  <span className="loader" style={{ width: 22, height: 22, margin: 0, borderWidth: 3 }} />
                ) : (
                  <><Shield size={20} /> Access System</>
                )}
              </button>
            </form>

            <p style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#999" }}>
              <Lock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Secured · Encrypted · Audited — All access is logged
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
