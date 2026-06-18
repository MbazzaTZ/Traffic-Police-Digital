import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { UserPlus, CheckCircle, AlertTriangle, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useAppData, RANKS, ROLES, ROLE_PERMS, DEPARTMENTS } from "../../context/AppDataContext";

const ROLE_LABELS = Object.fromEntries(ROLES.map(r => [r.v, r.l]));

const S = {
  sel: { width:"100%", height:44, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 36px 0 12px", fontSize:13, outline:"none", boxSizing:"border-box", background:"white", appearance:"none", WebkitAppearance:"none", cursor:"pointer", color:"#1E293B" },
  inp: { width:"100%", height:44, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box", color:"#1E293B" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 },
};

function Field({ label, required=true, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={S.lbl}>{label} {required && <span style={{ color:"#DC2626" }}>*</span>}</label>
      {children}
    </div>
  );
}

function SelWrap({ value, onChange, children, disabled }) {
  return (
    <div style={{ position:"relative" }}>
      <select value={value} onChange={onChange} disabled={disabled}
        style={{ ...S.sel, background:disabled?"#F8FAFC":"white", color:disabled?"#94A3B8":"#1E293B" }}
        onFocus={e=>{ if(!disabled) e.target.style.borderColor="#0D3477"; }}
        onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
        {children}
      </select>
      <ChevronDown size={15} color={disabled?"#CBD5E1":"#64748B"} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
    </div>
  );
}

export default function CreateUserPage() {
  const nav = useNavigate();
  const { regions, districtsForRegion, stationsForLocation, addOfficer, loading, refresh } = useAppData();
  useEffect(() => { refresh?.(); }, []);

  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [createdOfficer, setCreatedOfficer] = useState(null);

  const [form, setForm] = useState({
    full_name:"", badge:"", phone:"", email:"",
    rank:"", role:"", department:"",
    region:"", district:"", station_id:"",
    password:"", confirm_password:"", notes:"",
  });

  const upd = k => e => {
    const v = e.target.value;
    if (k==="region")   return setForm(f=>({ ...f, region:v, district:"", station_id:"" }));
    if (k==="district") return setForm(f=>({ ...f, district:v, station_id:"" }));
    setForm(f=>({ ...f, [k]:v }));
  };

  const availableDistricts = districtsForRegion(form.region);
  // Filter stations by region only — district may not be selected yet, and a
  // station should be assignable to anyone in the region.
  const availableStations  = stationsForLocation(form.region);
  const selectedStation    = availableStations.find(s=>s.id===form.station_id);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (form.password !== form.confirm_password) { setErr("Passwords do not match · Nywila hazilingani"); return; }
    if (form.password.length < 8) { setErr("Password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      const officer = await addOfficer(form);
      setCreatedOfficer(officer);
      setDone(true);
    } catch (e) {
      setErr(e.message || "Failed to create officer. Check Supabase logs.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDone(false); setStep(1); setErr(""); setCreatedOfficer(null);
    setForm({ full_name:"", badge:"", phone:"", email:"", rank:"", role:"", department:"", region:"", district:"", station_id:"", password:"", confirm_password:"", notes:"" });
  }

  if (done) return (
    <AdminLayout pageTitle="Create Officer">
      <div style={{ maxWidth:560, margin:"60px auto", background:"white", borderRadius:20, padding:"48px 40px", textAlign:"center", border:"1px solid #E2E8F0", boxShadow:"0 4px 20px rgba(0,0,0,.08)" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"#F0FDF4", border:"2px solid #BBF7D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle size={36} color="#16A34A" />
        </div>
        <h2 style={{ fontSize:22, fontWeight:700, color:"var(--navy-900,#03102B)", fontFamily:"var(--font-serif,Georgia,serif)", marginBottom:6 }}>Officer Created in Supabase!</h2>
        <p style={{ color:"#64748B", fontSize:13, marginBottom:20 }}>Akaunti ya Afisa Imeundwa · Saved to database</p>
        <div style={{ background:"#F8FAFC", borderRadius:12, padding:16, marginBottom:16, textAlign:"left" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["Full Name",form.full_name],["Badge",form.badge],["Rank",form.rank],["Role",ROLE_LABELS[form.role]],["Department",form.department],["Region",form.region],["District",form.district],["Station",selectedStation?.name||"—"],["Phone",form.phone],["Email",form.email]].filter(([,v])=>v).map(([k,v])=>(
              <div key={k}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div><div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v}</div></div>
            ))}
          </div>
        </div>
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", marginBottom:20, display:"flex", gap:8, alignItems:"center" }}>
          <AlertTriangle size={15} color="#D97706" />
          <span style={{ fontSize:12, color:"#92400E" }}>Officer must change password on first login. Check email for credentials.</span>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={reset} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>+ Create Another</button>
          <button onClick={()=>nav("/admin/officers")} style={{ padding:"10px 24px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontWeight:700, cursor:"pointer", fontSize:13 }}>View All Officers</button>
        </div>
      </div>
    </AdminLayout>
  );

  const card = { background:"white", borderRadius:18, padding:28, border:"1px solid #E2E8F0", boxShadow:"0 1px 4px rgba(0,0,0,.05)", marginBottom:16 };

  return (
    <AdminLayout pageTitle="Create Officer" pageTitle2="Unda Akaunti ya Afisa">
      <div style={{ maxWidth:860, margin:"0 auto" }}>
        <div style={{ marginBottom:22 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>Create Officer Account</h1>
          <p style={{ color:"#64748B", marginTop:4 }}>Saves directly to Supabase · Fields marked <span style={{ color:"#DC2626" }}>*</span> required</p>
        </div>

        {/* Steps */}
        <div style={{ display:"flex", marginBottom:28 }}>
          {[{n:1,label:"Personal Info"},{n:2,label:"Assignment"},{n:3,label:"Credentials"}].map((s,i)=>(
            <div key={s.n} style={{ display:"flex", alignItems:"center", flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:step>=s.n?"#0D3477":"#E2E8F0", color:step>=s.n?"white":"#94A3B8", fontSize:13, fontWeight:800 }}>{step>s.n?"✓":s.n}</div>
                <div><div style={{ fontSize:12, fontWeight:700, color:step>=s.n?"#03102B":"#94A3B8" }}>Step {s.n}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{s.label}</div></div>
              </div>
              {i<2 && <div style={{ height:2, flex:1, background:step>s.n?"#0D3477":"#E2E8F0", margin:"0 8px" }} />}
            </div>
          ))}
        </div>

        {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}><AlertTriangle size={15} color="#DC2626"/><span style={{ fontSize:13, color:"#B91C1C" }}>{err}</span></div>}

        <form onSubmit={handleSubmit}>
          <div style={card}>

            {/* STEP 1 */}
            {step===1 && (
              <>
                <div style={{ marginBottom:20, paddingBottom:12, borderBottom:"2px solid #F1F5F9" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#03102B" }}>Personal Information · Taarifa za Kibinafsi</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  <Field label="Full Name · Jina Kamili">
                    <input value={form.full_name} onChange={upd("full_name")} placeholder="e.g. John Doe Mwangi" required style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </Field>
                  <Field label="Badge Number · Nambari ya Beji">
                    <input value={form.badge} onChange={upd("badge")} placeholder="e.g. TZP-2026-00201" required style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </Field>
                  <Field label="Phone · Simu">
                    <input value={form.phone} onChange={upd("phone")} placeholder="+255 712 345 678" type="tel" required style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </Field>
                  <Field label="Email Address">
                    <input value={form.email} onChange={upd("email")} placeholder="officer@polisi.go.tz" type="email" required style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </Field>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step===2 && (
              <>
                <div style={{ marginBottom:20, paddingBottom:12, borderBottom:"2px solid #F1F5F9" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#03102B" }}>Rank, Role & Assignment · Cheo, Jukumu na Uwekaji</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  <Field label="Rank · Cheo">
                    <SelWrap value={form.rank} onChange={upd("rank")}>
                      <option value="">Select rank...</option>
                      {RANKS.map(r=><option key={r}>{r}</option>)}
                    </SelWrap>
                  </Field>
                  <Field label="Role · Jukumu">
                    <SelWrap value={form.role} onChange={upd("role")}>
                      <option value="">Select role...</option>
                      {ROLES.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}
                    </SelWrap>
                  </Field>
                  <Field label="Department · Idara">
                    <SelWrap value={form.department} onChange={upd("department")}>
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                    </SelWrap>
                  </Field>
                </div>

                {/* Location cascade */}
                <div style={{ borderTop:"2px solid #F1F5F9", paddingTop:18, marginTop:4 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0D3477", marginBottom:14 }}>📍 Location Assignment · Uwekaji wa Eneo</div>
                  {loading && <div style={{ color:"#94A3B8", fontSize:13, marginBottom:14 }}>Loading regions from Supabase...</div>}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 18px" }}>
                    {/* Region */}
                    <Field label="Region · Mkoa">
                      <SelWrap value={form.region} onChange={upd("region")}>
                        <option value="">Select region...</option>
                        {regions.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
                      </SelWrap>
                      {regions.length===0 && !loading && (
                        <div style={{ marginTop:5, fontSize:11, color:"#D97706" }}>⚠ No regions yet — <span style={{ cursor:"pointer", textDecoration:"underline", color:"#0D3477" }} onClick={()=>nav("/admin/regions")}>Add regions first</span></div>
                      )}
                    </Field>

                    {/* District */}
                    <Field label="District · Wilaya">
                      <SelWrap value={form.district} onChange={upd("district")} disabled={!form.region}>
                        <option value="">{form.region?"Select district...":"Select region first..."}</option>
                        {availableDistricts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
                      </SelWrap>
                    </Field>

                    {/* Station */}
                    <Field label="Station · Kituo">
                      <SelWrap value={form.station_id} onChange={upd("station_id")} disabled={!form.region}>
                        <option value="">
                          {!form.region ? "Select region first..." : availableStations.length===0 ? "No stations in this region" : "Select station..."}
                        </option>
                        {availableStations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                      </SelWrap>
                      {form.region && availableStations.length===0 && (
                        <div style={{ marginTop:5, fontSize:11, color:"#D97706" }}>
                          ⚠ No stations in {form.region} · <span style={{ cursor:"pointer", textDecoration:"underline", color:"#0D3477" }} onClick={()=>nav("/admin/stations")}>Add a station first</span>
                        </div>
                      )}
                      {selectedStation && (
                        <div style={{ marginTop:6, background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"7px 12px", display:"flex", gap:7, alignItems:"center" }}>
                          <CheckCircle size={13} color="#16A34A"/><span style={{ fontSize:12, color:"#166534", fontWeight:600 }}>{selectedStation.name}</span>
                        </div>
                      )}
                    </Field>
                  </div>
                </div>

                {/* Permissions preview */}
                {form.role && (
                  <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:12, padding:"14px 16px", marginTop:8 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#0D3477", marginBottom:8 }}>ACCESS PREVIEW · {ROLE_LABELS[form.role]?.toUpperCase()}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {(ROLE_PERMS[form.role]||["Full System Access"]).map(p=>(
                        <span key={p} style={{ background:"#DBEAFE", color:"#1D4ED8", padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 3 */}
            {step===3 && (
              <>
                <div style={{ marginBottom:20, paddingBottom:12, borderBottom:"2px solid #F1F5F9" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#03102B" }}>Login Credentials · Taarifa za Kuingia</div>
                </div>
                <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", marginBottom:18, display:"flex", gap:8, alignItems:"center" }}>
                  <AlertTriangle size={15} color="#D97706"/>
                  <span style={{ fontSize:12, color:"#92400E" }}>A Supabase auth user will be created. Officer must change password on first login.</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  <Field label="Password · Nywila">
                    <div style={{ position:"relative" }}>
                      <input type={showPw?"text":"password"} value={form.password} onChange={upd("password")} placeholder="Min 8 characters" required style={{ ...S.inp, paddingRight:42 }} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                      <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:0 }}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                    </div>
                  </Field>
                  <Field label="Confirm Password · Thibitisha">
                    <div style={{ position:"relative" }}>
                      <input type={showPw2?"text":"password"} value={form.confirm_password} onChange={upd("confirm_password")} placeholder="Repeat password" required style={{ ...S.inp, paddingRight:42 }} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                      <button type="button" onClick={()=>setShowPw2(!showPw2)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:0 }}>{showPw2?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                    </div>
                  </Field>
                </div>
                <Field label="Admin Notes (optional)" required={false}>
                  <textarea value={form.notes} onChange={upd("notes")} rows={3} placeholder="Any notes about this officer..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                </Field>

                {/* Summary */}
                <div style={{ background:"#F8FAFC", borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:12 }}>ACCOUNT SUMMARY · MUHTASARI</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {[["Name",form.full_name],["Badge",form.badge],["Rank",form.rank],["Role",ROLE_LABELS[form.role]],["Department",form.department],["Region",form.region],["District",form.district],["Station",selectedStation?.name||"—"],["Email",form.email]].filter(([,v])=>v).map(([k,v])=>(
                      <div key={k} style={{ background:"white", borderRadius:8, padding:"10px 12px", border:"1px solid #E2E8F0" }}>
                        <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize:12, fontWeight:600, color:"#1E293B", marginTop:2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Nav buttons */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <button type="button" onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1}
              style={{ padding:"10px 24px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontWeight:700, cursor:step===1?"not-allowed":"pointer", opacity:step===1?.5:1, fontSize:13 }}>
              ← Previous
            </button>
            <div style={{ fontSize:12, color:"#94A3B8" }}>Step {step} of 3</div>
            {step<3 ? (
              <button type="button" onClick={()=>setStep(s=>s+1)}
                style={{ padding:"10px 28px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
                Next →
              </button>
            ) : (
              <button type="submit" disabled={saving}
                style={{ padding:"10px 28px", borderRadius:10, border:"none", background:saving?"#94A3B8":"#059669", color:"white", fontWeight:700, cursor:saving?"not-allowed":"pointer", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
                {saving ? <><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 1s linear infinite", display:"inline-block" }}/> Saving to Supabase...</> : <><UserPlus size={16}/> Create Officer Account</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
