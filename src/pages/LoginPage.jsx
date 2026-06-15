import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

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

  const input = {
    width: "100%", height: 48,
    border: "1.5px solid #D1D5DB",
    borderRadius: 10, fontSize: 14,
    outline: "none", boxSizing: "border-box",
    color: "#1E293B", padding: "0 14px",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ══ LEFT — branding ══ */}
      <div style={{
        flex: 1,
        background: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 80px",
        borderRight: "1px solid #E2E8F0",
      }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#082A63", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4, textAlign: "center" }}>
          Jamhuri ya Muungano wa Tanzania
        </p>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: 1, textTransform: "uppercase", marginBottom: 32, textAlign: "center" }}>
          Wizara ya Mambo ya Ndani ya Nchi
        </p>

        <img
          src="/police-logo-transparent.png"
          alt="Jeshi la Polisi Tanzania"
          style={{ width: 200, height: 200, objectFit: "contain", marginBottom: 24 }}
        />

        <h1 style={{
          fontSize: 36, fontWeight: 900, color: "#082A63",
          textTransform: "uppercase", letterSpacing: 1,
          textAlign: "center", margin: "0 0 10px",
        }}>
          Jeshi la Polisi Tanzania
        </h1>

        <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 0 }}>
          Tanzania Police Digital Operations Platform
        </p>

        <div style={{ width: 56, height: 3, background: "#082A63", borderRadius: 2, marginTop: 28 }} />
      </div>

      {/* ══ RIGHT — login form ══ */}
      <div style={{
        width: "42%",
        minWidth: 480,
        background: "#EEF2F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 60px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 20,
          padding: "44px 40px",
          boxShadow: "0 8px 32px rgba(8,42,99,.10), 0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid #E2E8F0",
        }}>
          {/* Coat of Arms */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <img src="/Coat of Arms.png" alt="Coat of Arms"
              style={{ width: 76, height: 76, objectFit: "contain" }} />
          </div>

          <h2 style={{
            textAlign: "center", fontSize: 20, fontWeight: 800,
            color: "#082A63", letterSpacing: 1,
            textTransform: "uppercase", marginBottom: 6,
          }}>
            Ingia Kwenye Mfumo
          </h2>
          <p style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, marginBottom: 28 }}>
            Tumia taarifa zako za kazi kuendelea
          </p>

          <form onSubmit={submit}>
            {/* Badge */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                Service / Badge Number
              </label>
              <input
                value={badge} onChange={e => setBadge(e.target.value)}
                placeholder="Weka namba ya utambuliSho"
                required style={input}
                onFocus={e => e.target.style.borderColor = "#082A63"}
                onBlur={e => e.target.style.borderColor = "#D1D5DB"}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="Weka nenosiri"
                  required style={{ ...input, padding: "0 42px 0 14px" }}
                  onFocus={e => e.target.style.borderColor = "#082A63"}
                  onBlur={e => e.target.style.borderColor = "#D1D5DB"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", padding: 0 }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, fontSize: 13 }}>
              <label style={{ display: "flex", gap: 7, alignItems: "center", cursor: "pointer", color: "#64748B" }}>
                <input type="checkbox" style={{ accentColor: "#082A63", width: 15, height: 15 }} />
                Remember Me
              </label>
              <a href="#" style={{ color: "#082A63", fontWeight: 600, textDecoration: "none" }}>
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: "100%", height: 50,
              background: loading ? "#94A3B8" : "#082A63",
              color: "white", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "background .2s", fontFamily: "inherit",
            }}>
              {loading ? <><span className="spinner" /> Inaingia...</> : <>⊙ Login</>}
            </button>
          </form>

          <p style={{ marginTop: 22, textAlign: "center", fontSize: 11, color: "#CBD5E1" }}>
            🔒 Mfumo huu uko salama · Matumizi yote yanarekodiwa
          </p>
        </div>
      </div>
    </div>
  );
}
