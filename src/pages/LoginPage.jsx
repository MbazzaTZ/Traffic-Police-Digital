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

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "#F0F4F8",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── LEFT — White branding panel ── */}
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

        {/* Gov header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#082A63", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Jamhuri ya Muungano wa Tanzania
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: 1, textTransform: "uppercase" }}>
            Wizara ya Mambo ya Ndani ya Nchi
          </p>
        </div>

        {/* Police logo — large, clean */}
        <img
          src="/police-logo-transparent.png"
          alt="Jeshi la Polisi Tanzania"
          style={{
            width: 220,
            height: 220,
            objectFit: "contain",
            marginBottom: 28,
          }}
        />

        {/* Force name */}
        <h1 style={{
          fontSize: 38,
          fontWeight: 900,
          color: "#082A63",
          textAlign: "center",
          letterSpacing: 1,
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}>
          Jeshi la Polisi Tanzania
        </h1>

        <p style={{
          fontSize: 14,
          color: "#64748B",
          textAlign: "center",
          marginBottom: 48,
        }}>
          Tanzania Police Digital Operations Platform
        </p>

        {/* Divider */}
        <div style={{ width: 60, height: 3, background: "#082A63", borderRadius: 2, marginBottom: 36 }} />


      </div>

      {/* ── RIGHT — Login card ── */}
      <div style={{
        width: 440,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        background: "#F0F4F8",
      }}>

        <div style={{
          width: "100%",
          background: "white",
          borderRadius: 20,
          padding: "40px 36px",
          boxShadow: "0 8px 32px rgba(8,42,99,.12), 0 2px 8px rgba(0,0,0,.06)",
          border: "1px solid #E2E8F0",
        }}>

          {/* Coat of Arms */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <img
              src="/Coat of Arms.png"
              alt="Coat of Arms"
              style={{ width: 72, height: 72, objectFit: "contain" }}
            />
          </div>

          {/* Title */}
          <h2 style={{
            textAlign: "center",
            fontSize: 20,
            fontWeight: 800,
            color: "#082A63",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 6,
          }}>
            Ingia Kwenye Mfumo
          </h2>
          <p style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, marginBottom: 28 }}>
            Tumia taarifa zako za kazi kuendelea
          </p>

          <form onSubmit={submit}>

            {/* Badge */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Service / Badge Number
              </label>
              <input
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="Weka namba ya utambuliSho"
                required
                style={{
                  width: "100%", height: 46,
                  padding: "0 14px",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: 10, fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                  color: "#1E293B",
                  transition: "border-color .2s",
                }}
                onFocus={e => e.target.style.borderColor = "#082A63"}
                onBlur={e => e.target.style.borderColor = "#D1D5DB"}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Weka nenosiri"
                  required
                  style={{
                    width: "100%", height: 46,
                    padding: "0 42px 0 14px",
                    border: "1.5px solid #D1D5DB",
                    borderRadius: 10, fontSize: 14,
                    outline: "none", boxSizing: "border-box",
                    color: "#1E293B",
                    transition: "border-color .2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#082A63"}
                  onBlur={e => e.target.style.borderColor = "#D1D5DB"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: "#94A3B8",
                    display: "flex", padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, fontSize: 13 }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", color: "#64748B" }}>
                <input type="checkbox" style={{ accentColor: "#082A63" }} />
                Remember Me
              </label>
              <a href="#" style={{ color: "#082A63", fontWeight: 600, textDecoration: "none" }}>
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 50,
                background: loading ? "#94A3B8" : "#082A63",
                color: "white", border: "none",
                borderRadius: 10, fontSize: 15,
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10,
                transition: "background .2s",
              }}
            >
              {loading
                ? <><span className="spinner" /> Inaingia...</>
                : <>⊙ Login</>}
            </button>
          </form>

          {/* Footer */}
          <p style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "#CBD5E1" }}>
            🔒 Mfumo huu uko salama · Matumizi yote yanarekodiwa
          </p>
        </div>
      </div>
    </div>
  );
}
