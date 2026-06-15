import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { User, Shield, MapPin, Phone, Mail, Calendar, Edit, CheckCircle, Key, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const ROLE_LABELS = { regular_officer:"Regular Officer", traffic_officer:"Traffic Officer", cid_officer:"CID Officer", forensic_officer:"Forensic Officer", ocs:"OCS – Station Commander", ocd:"OCD – District Commander", rpc:"RPC – Regional Commander", igp:"Inspector General", admin_officer:"Admin Officer" };
const ROLE_COLORS = { regular_officer:"#0D3477", traffic_officer:"#D97706", cid_officer:"#7C3AED", ocs:"#059669", admin_officer:"#DC2626" };

export default function MyProfilePage() {
  const { user, profile, loading, fullName, badge, role, stationName, regionName, districtName } = useCurrentUser();
  const [editMode,  setEditMode]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);
  const [err,       setErr]       = useState("");
  const [pwModal,   setPwModal]   = useState(false);
  const [pwForm,    setPwForm]    = useState({ current:"", newPw:"", confirm:"" });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwDone,    setPwDone]    = useState(false);
  const [pwErr,     setPwErr]     = useState("");
  const [form,      setForm]      = useState({ phone:"", email:"" });

  useEffect(() => {
    if (profile) setForm({ phone:profile.phone||"", email:profile.email||"" });
  }, [profile]);

  async function saveProfile(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ phone:form.phone||null, email:form.email||null, updated_at:new Date().toISOString() }).eq("id", user?.id);
      if (error) throw error;
      setDone(true); setEditMode(false);
      setTimeout(()=>setDone(false), 3000);
    } catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault(); setPwErr(""); setPwSaving(true);
    try {
      if (pwForm.newPw !== pwForm.confirm) throw new Error("Passwords do not match");
      if (pwForm.newPw.length < 8) throw new Error("Password must be at least 8 characters");
      const { error } = await supabase.auth.updateUser({ password:pwForm.newPw });
      if (error) throw error;
      setPwDone(true);
      setTimeout(()=>{ setPwModal(false); setPwDone(false); setPwForm({current:"",newPw:"",confirm:""}); }, 2500);
    } catch(e) { setPwErr(e.message); } finally { setPwSaving(false); }
  }

  const roleColor = ROLE_COLORS[role] || "#0D3477";
  const initials = fullName?.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase() || "?";

  if (loading) return (
    <DashboardLayout pageTitle="My Profile">
      <div style={{ padding:"80px", textAlign:"center", color:"#94A3B8" }}>Loading profile...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout pageTitle="My Profile" pageTitle2="Wasifu Wangu">

      {done && (
        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"10px 16px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
          <CheckCircle size={16} color="#16A34A"/><span style={{ fontSize:13, color:"#166534", fontWeight:600 }}>Profile updated successfully!</span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:20 }}>
        {/* Profile Card */}
        <div>
          <div style={{ background:"white", borderRadius:18, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:14 }}>
            <div style={{ background:`linear-gradient(135deg,#03102B,#082A63,${roleColor})`, padding:"28px 20px", textAlign:"center" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:"white", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", border:"4px solid rgba(255,255,255,.3)" }}>
                <span style={{ fontSize:28, fontWeight:900, color:roleColor }}>{initials}</span>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color:"white" }}>{fullName}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginTop:4 }}>{badge}</div>
              <div style={{ marginTop:10, display:"inline-block", padding:"4px 14px", borderRadius:999, background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.25)" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"white" }}>{ROLE_LABELS[role]||role}</span>
              </div>
            </div>
            <div style={{ padding:"16px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}><Shield size={15} color="#0D3477"/></div>
                <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>RANK · CHEO</div><div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{profile?.rank||"—"}</div></div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}><MapPin size={15} color="#0D3477"/></div>
                <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>STATION · KITUO</div><div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{stationName||"—"}</div></div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}><MapPin size={15} color="#059669"/></div>
                <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>REGION · MKOA</div><div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{regionName||"—"}</div></div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}><Calendar size={15} color="#0D3477"/></div>
                <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>JOINED · ALIJIUNGA</div><div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{profile?.created_at?new Date(profile.created_at).toLocaleDateString("en-GB"):"—"}</div></div>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>Account Status</div>
              <div style={{ fontSize:12, color:"#94A3B8" }}>Hali ya Akaunti</div>
            </div>
            <span style={{ background:profile?.status==="active"?"#F0FDF4":"#FEF2F2", color:profile?.status==="active"?"#16A34A":"#DC2626", padding:"5px 14px", borderRadius:999, fontSize:13, fontWeight:800, textTransform:"uppercase" }}>
              {profile?.status||"active"}
            </span>
          </div>
        </div>

        {/* Edit panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Personal info */}
          <div style={{ background:"white", borderRadius:18, border:"1px solid #E2E8F0", padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:14, borderBottom:"2px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#03102B" }}>Personal Information · Taarifa Binafsi</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Contact details can be updated · Core details managed by HR</div>
              </div>
              <button onClick={()=>setEditMode(!editMode)}
                style={{ padding:"7px 16px", borderRadius:9, border:"1px solid #E2E8F0", background:editMode?"#0D3477":"white", color:editMode?"white":"#475569", fontWeight:600, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                <Edit size={13}/>{editMode?"Cancel":"Edit"}
              </button>
            </div>

            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}

            <form onSubmit={saveProfile}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { label:"Full Name · Jina Kamili",    value:fullName||"—",            editable:false, icon:User },
                  { label:"Badge Number · Beji",         value:badge||"—",               editable:false, icon:Shield },
                  { label:"Rank · Cheo",                 value:profile?.rank||"—",       editable:false, icon:Shield },
                  { label:"Department · Idara",          value:profile?.department||"—", editable:false, icon:Shield },
                  { label:"NIDA Number",                 value:profile?.nida||"—",       editable:false, icon:User },
                ].map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label}>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>{f.label}</label>
                      <div style={{ display:"flex", alignItems:"center", gap:8, height:42, background:"#F8FAFC", borderRadius:9, padding:"0 12px", border:"1px solid #E2E8F0" }}>
                        <Icon size={14} color="#94A3B8"/>
                        <span style={{ fontSize:13, color:"#475569" }}>{f.value}</span>
                      </div>
                      <div style={{ fontSize:10, color:"#94A3B8", marginTop:3 }}>Managed by HR — contact Admin to update</div>
                    </div>
                  );
                })}

                {/* Editable fields */}
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>Phone · Simu</label>
                  {editMode ? (
                    <div style={{ display:"flex", alignItems:"center", gap:8, height:42, borderRadius:9, border:"1.5px solid #0D3477", padding:"0 12px" }}>
                      <Phone size={14} color="#0D3477"/>
                      <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+255 ..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:8, height:42, background:"#F8FAFC", borderRadius:9, padding:"0 12px", border:"1px solid #E2E8F0" }}>
                      <Phone size={14} color="#94A3B8"/><span style={{ fontSize:13, color:"#1E293B" }}>{profile?.phone||"Not set"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>Email</label>
                  {editMode ? (
                    <div style={{ display:"flex", alignItems:"center", gap:8, height:42, borderRadius:9, border:"1.5px solid #0D3477", padding:"0 12px" }}>
                      <Mail size={14} color="#0D3477"/>
                      <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} type="email" placeholder="email@polisi.go.tz" style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:8, height:42, background:"#F8FAFC", borderRadius:9, padding:"0 12px", border:"1px solid #E2E8F0" }}>
                      <Mail size={14} color="#94A3B8"/><span style={{ fontSize:13, color:"#1E293B" }}>{profile?.email||user?.email||"Not set"}</span>
                    </div>
                  )}
                </div>
              </div>

              {editMode && (
                <div style={{ marginTop:16, display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <button type="button" onClick={()=>setEditMode(false)} style={{ padding:"9px 20px", borderRadius:9, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontWeight:600, cursor:"pointer", fontSize:13 }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding:"9px 24px", borderRadius:9, border:"none", background:saving?"#94A3B8":"#0D3477", color:"white", fontWeight:700, cursor:saving?"not-allowed":"pointer", fontSize:13 }}>
                    {saving?"Saving...":"Save Changes · Hifadhi"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Security */}
          <div style={{ background:"white", borderRadius:18, border:"1px solid #E2E8F0", padding:24 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#03102B", marginBottom:16, paddingBottom:12, borderBottom:"2px solid #F1F5F9" }}>Security · Usalama</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid #F8FAFC" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}><Key size={16} color="#0D3477"/></div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>Password · Nywila</div>
                  <div style={{ fontSize:12, color:"#94A3B8" }}>Change your login password</div>
                </div>
              </div>
              <button onClick={()=>setPwModal(true)} style={{ padding:"8px 18px", borderRadius:9, border:"1px solid #0D3477", background:"white", color:"#0D3477", fontWeight:700, cursor:"pointer", fontSize:12 }}>Change Password</button>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"#F0FDF4", display:"flex", alignItems:"center", justifyContent:"center" }}><Shield size={16} color="#16A34A"/></div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>Login Session · Kipindi cha Kuingia</div>
                  <div style={{ fontSize:12, color:"#94A3B8" }}>Supabase Auth · {user?.email}</div>
                </div>
              </div>
              <span style={{ background:"#F0FDF4", color:"#16A34A", padding:"5px 12px", borderRadius:999, fontSize:12, fontWeight:700 }}>✓ Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {pwModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}
          onClick={e=>e.target===e.currentTarget&&setPwModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:440 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#03102B" }}>Change Password · Badilisha Nywila</div>
              <button onClick={()=>setPwModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>
            {pwErr && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C" }}>{pwErr}</div>}
            {pwDone ? (
              <div style={{ textAlign:"center", padding:"24px 0" }}><CheckCircle size={44} color="#16A34A" style={{ marginBottom:10 }}/><h3 style={{ color:"#16A34A" }}>Password Changed!</h3></div>
            ) : (
              <form onSubmit={changePassword}>
                {[
                  { label:"New Password · Nywila Mpya", key:"newPw", ph:"Min 8 characters" },
                  { label:"Confirm Password · Thibitisha", key:"confirm", ph:"Repeat new password" },
                ].map(f=>(
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 }}>{f.label} *</label>
                    <input type="password" value={pwForm[f.key]} onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} required
                      style={{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                ))}
                <button type="submit" disabled={pwSaving} style={{ width:"100%", height:44, background:pwSaving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:pwSaving?"not-allowed":"pointer", marginTop:4 }}>
                  {pwSaving?"Changing...":"Change Password · Badilisha"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
