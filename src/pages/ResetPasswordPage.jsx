import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [pw,       setPw]       = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");
  const [ready,    setReady]    = useState(false);
  const [validLink,setValidLink]= useState(true);

  // Supabase puts the recovery session in the URL hash; the client picks it up.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    // Also check existing session (link may already be consumed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // give the hash handler a moment, then validate
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setReady(true);
            else if (!window.location.hash.includes("access_token")) setValidLink(false);
          });
        }, 1200);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (pw.length < 8) throw new Error("Password must be at least 8 characters.");
      if (pw !== confirm) throw new Error("Passwords do not match.");
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      setTimeout(async () => {
        await supabase.auth.signOut();
        nav("/");
      }, 2800);
    } catch (e) {
      setError(e.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  const inp = { width:"100%", height:48, border:"1.5px solid #D1D5DB", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", padding:"0 42px 0 14px" };

  return (
    <div style={{ minHeight:"100vh", width:"100vw", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#03102B,#082A63)", fontFamily:"'Segoe UI',system-ui,sans-serif", padding:20 }}>
      <div style={{ width:"100%", maxWidth:440, background:"white", borderRadius:20, padding:"40px 36px", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>

        <div style={{ textAlign:"center", marginBottom:24 }}>
          <img src="/Coat of Arms.png" alt="Coat of Arms" style={{ width:64, height:64, objectFit:"contain", marginBottom:10 }}/>
          <h1 style={{ fontSize:20, fontWeight:800, color:"#082A63", letterSpacing:1, textTransform:"uppercase", margin:0 }}>Set New Password</h1>
          <p style={{ fontSize:13, color:"#94A3B8", margin:"6px 0 0" }}>Weka Nenosiri Jipya</p>
        </div>

        {!validLink ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <AlertTriangle size={44} color="#DC2626" style={{ marginBottom:12 }}/>
            <h3 style={{ color:"#DC2626", margin:"0 0 8px" }}>Invalid or Expired Link</h3>
            <p style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>This reset link is invalid or has expired. Please request a new one from the login page.</p>
            <button onClick={()=>nav("/")} style={{ marginTop:18, width:"100%", height:46, background:"#082A63", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>Back to Login</button>
          </div>
        ) : done ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <CheckCircle size={52} color="#16A34A" style={{ marginBottom:14 }}/>
            <h3 style={{ color:"#16A34A", margin:"0 0 8px" }}>Password Updated!</h3>
            <p style={{ fontSize:13, color:"#64748B", lineHeight:1.6 }}>Your password has been changed successfully. Redirecting to login...</p>
            <p style={{ fontSize:12, color:"#94A3B8", marginTop:8 }}>Nenosiri limebadilishwa. Unaelekezwa kwenye ukurasa wa kuingia...</p>
          </div>
        ) : !ready ? (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <div style={{ width:40, height:40, border:"3px solid #E2E8F0", borderTopColor:"#082A63", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 14px" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize:13, color:"#64748B" }}>Verifying reset link...</p>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:18, display:"flex", gap:8, alignItems:"center" }}>
                <AlertTriangle size={15} color="#DC2626" style={{ flexShrink:0 }}/>
                <span style={{ fontSize:13, color:"#B91C1C" }}>{error}</span>
              </div>
            )}
            <form onSubmit={submit}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:7 }}>New Password · Nenosiri Jipya</label>
                <div style={{ position:"relative" }}>
                  <input type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} required placeholder="Min 8 characters"
                    style={inp} onFocus={e=>e.target.style.borderColor="#082A63"} onBlur={e=>e.target.style.borderColor="#D1D5DB"}/>
                  <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:0 }}>
                    {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom:22 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:7 }}>Confirm Password · Thibitisha</label>
                <div style={{ position:"relative" }}>
                  <input type={showPw?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Repeat new password"
                    style={inp} onFocus={e=>e.target.style.borderColor="#082A63"} onBlur={e=>e.target.style.borderColor="#D1D5DB"}/>
                  <Lock size={16} color="#94A3B8" style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)" }}/>
                </div>
                {confirm && pw !== confirm && <p style={{ fontSize:12, color:"#DC2626", margin:"6px 0 0" }}>Passwords do not match</p>}
              </div>
              <button type="submit" disabled={loading}
                style={{ width:"100%", height:50, background:loading?"#94A3B8":"#082A63", color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
                {loading ? "Updating..." : "Update Password · Hifadhi"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
