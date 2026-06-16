import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  // Forgot password
  const [forgot,     setForgot]     = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent,  setResetSent]  = useState(false);
  const [resetErr,   setResetErr]   = useState("");
  const [resetLoad,  setResetLoad]  = useState(false);

  async function sendReset(e) {
    e.preventDefault(); setResetErr(""); setResetLoad(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (e) {
      setResetErr(e.message || "Could not send reset email.");
    } finally {
      setResetLoad(false);
    }
  }
  const [error,   setError]   = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (authErr) throw authErr;

      // Fetch profile to get role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, badge")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role || data.user.user_metadata?.role || "";
      const ROLE_HOME = { admin_officer:"/admin", igp:"/admin", digp:"/admin", traffic_officer:"/traffic", cid_officer:"/cid", forensic_officer:"/cid" };
      const dest = ROLE_HOME[role] || "/dashboard";
      nav(dest);
    } catch (e) {
      let msg = e.message || "Login failed. Check your credentials.";
      if (/email not confirmed/i.test(msg)) {
        msg = "Email not confirmed. Admin must disable email confirmation in Supabase → Authentication → Providers → Email, or confirm this user in Authentication → Users.";
      } else if (/invalid login credentials/i.test(msg)) {
        msg = "Invalid email or password. Tafadhali angalia taarifa zako.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width:"100%", height:48, border:"1.5px solid #D1D5DB",
    borderRadius:10, fontSize:14, outline:"none",
    boxSizing:"border-box", color:"#1E293B",
    padding:"0 14px", fontFamily:"inherit",
  };

  return (
    <div style={{ minHeight:"100vh", width:"100vw", display:"flex", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* LEFT */}
      <div style={{ flex:1, background:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 80px", borderRight:"1px solid #E2E8F0" }}>
        <p style={{ fontSize:22, fontWeight:800, color:"#082A63", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, textAlign:"center" }}>
          Jamhuri ya Muungano wa Tanzania
        </p>
        <p style={{ fontSize:16, fontWeight:600, color:"#64748B", letterSpacing:1.2, textTransform:"uppercase", marginBottom:32, textAlign:"center" }}>
          Wizara ya Mambo ya Ndani ya Nchi
        </p>
        <img src="/police-logo-transparent.png" alt="Jeshi la Polisi Tanzania"
          style={{ width:200, height:200, objectFit:"contain", marginBottom:24 }} />
        <h1 style={{ fontSize:36, fontWeight:900, color:"#082A63", textTransform:"uppercase", letterSpacing:1, textAlign:"center", margin:"0 0 10px" }}>
          Jeshi la Polisi Tanzania
        </h1>
        <p style={{ fontSize:14, color:"#64748B", textAlign:"center", marginBottom:0 }}>
          Tanzania Police Digital Operations Platform
        </p>
        <div style={{ width:56, height:3, background:"#082A63", borderRadius:2, marginTop:28 }} />
      </div>

      {/* RIGHT */}
      <div style={{ width:"42%", minWidth:480, background:"#EEF2F7", display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 60px" }}>
        <div style={{ width:"100%", maxWidth:420, background:"white", borderRadius:20, padding:"44px 40px", boxShadow:"0 8px 32px rgba(8,42,99,.10),0 2px 8px rgba(0,0,0,.06)", border:"1px solid #E2E8F0" }}>

          <div style={{ textAlign:"center", marginBottom:16 }}>
            <img src="/Coat of Arms.png" alt="Coat of Arms" style={{ width:76, height:76, objectFit:"contain" }} />
          </div>
          <h2 style={{ textAlign:"center", fontSize:20, fontWeight:800, color:"#082A63", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
            Ingia Kwenye Mfumo
          </h2>
          <p style={{ textAlign:"center", color:"#94A3B8", fontSize:13, marginBottom:28 }}>
            Tumia taarifa zako za kazi kuendelea
          </p>

          {error && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:18, display:"flex", gap:8, alignItems:"center" }}>
              <AlertTriangle size={15} color="#DC2626" style={{ flexShrink:0 }} />
              <span style={{ fontSize:13, color:"#B91C1C" }}>{error}</span>
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:7 }}>
                Email Address · Barua Pepe
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@polisi.go.tz"
                required
                style={inp}
                onFocus={e => e.target.style.borderColor="#082A63"}
                onBlur={e => e.target.style.borderColor="#D1D5DB"}
              />
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:7 }}>
                Password · Nenosiri
              </label>
              <div style={{ position:"relative" }}>
                <input
                  type={showPw?"text":"password"}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Weka nenosiri"
                  required
                  style={{ ...inp, padding:"0 42px 0 14px" }}
                  onFocus={e => e.target.style.borderColor="#082A63"}
                  onBlur={e => e.target.style.borderColor="#D1D5DB"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:0 }}>
                  {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, fontSize:13 }}>
              <label style={{ display:"flex", gap:7, alignItems:"center", cursor:"pointer", color:"#64748B" }}>
                <input type="checkbox" style={{ accentColor:"#082A63", width:15, height:15 }} /> Remember Me
              </label>
              <a href="#" onClick={e=>{e.preventDefault();setForgot(true);setResetEmail(email);setResetSent(false);setResetErr("");}} style={{ color:"#082A63", fontWeight:600, textDecoration:"none" }}>Forgot Password?</a>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:"100%", height:50, background:loading?"#94A3B8":"#082A63", color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"background .2s", fontFamily:"inherit" }}>
              {loading
                ? <><span style={{ width:18, height:18, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 1s linear infinite", display:"inline-block" }}/> Inaingia...</>
                : <>⊙ Login · Ingia</>}
            </button>
          </form>

          {/* Admin hint */}
          <div style={{ marginTop:20, padding:"12px 14px", background:"#F8FAFC", borderRadius:10, border:"1px solid #E2E8F0" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:4 }}>ADMIN ACCOUNT</div>
            <div style={{ fontSize:12, color:"#64748B" }}>Email: <strong style={{ color:"#082A63" }}>admin@tpdp.com</strong></div>
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Use the password set in Supabase Auth</div>
          </div>

          <p style={{ marginTop:16, textAlign:"center", fontSize:11, color:"#CBD5E1" }}>
            🔒 Mfumo huu uko salama · Matumizi yote yanarekodiwa
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgot && (
        <div style={{ position:"fixed", inset:0, background:"rgba(3,16,43,.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setForgot(false)}>
          <div style={{ background:"white", borderRadius:20, padding:32, width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#082A63", margin:0 }}>Reset Password</h2>
                <p style={{ fontSize:13, color:"#94A3B8", margin:"4px 0 0" }}>Weka upya nenosiri lako</p>
              </div>
              <button onClick={()=>setForgot(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", fontSize:16, color:"#64748B" }}>✕</button>
            </div>

            {resetSent ? (
              <div style={{ textAlign:"center", padding:"24px 0 8px" }}>
                <div style={{ width:60, height:60, borderRadius:"50%", background:"#F0FDF4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}>📧</div>
                <h3 style={{ color:"#16A34A", margin:"0 0 8px" }}>Check Your Email</h3>
                <p style={{ fontSize:13, color:"#64748B", lineHeight:1.6, margin:0 }}>
                  We sent a password reset link to <strong style={{ color:"#082A63" }}>{resetEmail}</strong>.
                  Click the link in the email to set a new password.
                </p>
                <p style={{ fontSize:12, color:"#94A3B8", marginTop:12 }}>
                  Tumetuma kiunga cha kuweka upya nenosiri kwenye barua pepe yako.
                </p>
                <button onClick={()=>setForgot(false)} style={{ marginTop:20, width:"100%", height:46, background:"#082A63", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                  Back to Login · Rudi
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize:13, color:"#64748B", lineHeight:1.6, margin:"16px 0 20px" }}>
                  Enter your registered email and we'll send you a link to reset your password.
                </p>
                {resetErr && (
                  <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
                    <AlertTriangle size={15} color="#DC2626" style={{ flexShrink:0 }}/>
                    <span style={{ fontSize:13, color:"#B91C1C" }}>{resetErr}</span>
                  </div>
                )}
                <form onSubmit={sendReset}>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:7 }}>Email Address · Barua Pepe</label>
                  <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} required placeholder="officer@polisi.go.tz"
                    style={{ width:"100%", height:48, border:"1.5px solid #D1D5DB", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", padding:"0 14px", marginBottom:20 }}
                    onFocus={e=>e.target.style.borderColor="#082A63"} onBlur={e=>e.target.style.borderColor="#D1D5DB"}/>
                  <button type="submit" disabled={resetLoad}
                    style={{ width:"100%", height:48, background:resetLoad?"#94A3B8":"#082A63", color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:resetLoad?"not-allowed":"pointer" }}>
                    {resetLoad ? "Sending..." : "Send Reset Link · Tuma Kiunga"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
