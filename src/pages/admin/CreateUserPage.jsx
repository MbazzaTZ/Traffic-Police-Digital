import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { UserPlus, CheckCircle, AlertTriangle, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useAppData, TZ_REGIONS, RANKS, ROLES, ROLE_PERMS, DEPARTMENTS } from "../../context/AppDataContext";

const ROLE_LABELS = Object.fromEntries(ROLES.map(r => [r.v, r.l]));

const sel = {
  width:"100%", height:44, border:"1.5px solid #E2E8F0", borderRadius:10,
  padding:"0 36px 0 12px", fontSize:13, outline:"none",
  boxSizing:"border-box", fontFamily:"inherit", background:"white",
  appearance:"none", WebkitAppearance:"none", cursor:"pointer",
  color:"#1E293B",
};

const txt = {
  width:"100%", height:44, border:"1.5px solid #E2E8F0", borderRadius:10,
  padding:"0 12px", fontSize:13, outline:"none",
  boxSizing:"border-box", fontFamily:"inherit", color:"#1E293B",
};

function Sel({ label, required=true, value, onChange, options, placeholder="Select...", disabled=false }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>
        {label} {required && <span style={{ color:"#DC2626" }}>*</span>}
      </label>
      <div style={{ position:"relative" }}>
        <select value={value} onChange={onChange} required={required} disabled={disabled}
          style={{ ...sel, borderColor: disabled?"#F1F5F9":"#E2E8F0", color: disabled?"#94A3B8":"#1E293B", background: disabled?"#F8FAFC":"white" }}
          onFocus={e => { if(!disabled) e.target.style.borderColor="#0D3477"; }}
          onBlur={e => e.target.style.borderColor="#E2E8F0"}>
          <option value="">{disabled ? "Select region first..." : placeholder}</option>
          {options.map(o => typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <ChevronDown size={15} color={disabled?"#CBD5E1":"#64748B"} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
      </div>
    </div>
  );
}

function Inp({ label, required=true, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>
        {label} {required && <span style={{ color:"#DC2626" }}>*</span>}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={txt}
        onFocus={e => e.target.style.borderColor="#0D3477"}
        onBlur={e => e.target.style.borderColor="#E2E8F0"} />
    </div>
  );
}

function PwInp({ label, value, onChange, placeholder, show, toggle }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>
        {label} <span style={{ color:"#DC2626" }}>*</span>
      </label>
      <div style={{ position:"relative" }}>
        <input type={show?"text":"password"} value={value} onChange={onChange} placeholder={placeholder} required
          style={{ ...txt, paddingRight:42 }}
          onFocus={e => e.target.style.borderColor="#0D3477"}
          onBlur={e => e.target.style.borderColor="#E2E8F0"} />
        <button type="button" onClick={toggle}
          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:0 }}>
          {show ? <EyeOff size={16}/> : <Eye size={16}/>}
        </button>
      </div>
    </div>
  );
}

export default function CreateUserPage() {
  const nav = useNavigate();
  const { stations, addOfficer } = useAppData();

  const [step, setStep]   = useState(1);
  const [done, setDone]   = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [form, setForm] = useState({
    full_name:"", badge:"", nida:"", phone:"", email:"",
    rank:"", role:"", department:"",
    region:"", district:"", station_id:"",
    password:"", confirm_password:"", notes:"",
  });

  const upd = k => e => {
    const val = e.target.value;
    // Cascade: region change → clear district + station
    if (k === "region") return setForm(f => ({ ...f, region:val, district:"", station_id:"" }));
    // District change → clear station
    if (k === "district") return setForm(f => ({ ...f, district:val, station_id:"" }));
    setForm(f => ({ ...f, [k]:val }));
  };

  // Derived: districts for selected region
  const availableDistricts = form.region ? (TZ_REGIONS[form.region] || []) : [];

  // Stations filtered by selected region (and district if picked)
  const availableStations = stations.filter(s => {
    if (!form.region) return false;
    const regionMatch = s.region === form.region;
    const districtMatch = !form.district || s.district === form.district;
    return regionMatch && districtMatch;
  });

  // Selected station object
  const selectedStation = stations.find(s => s.id === form.station_id);

  function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      alert("Passwords do not match · Nywila hazilingani");
      return;
    }
    addOfficer({ ...form, station_name: selectedStation?.name || "" });
    setDone(true);
  }

  function reset() {
    setDone(false);
    setStep(1);
    setForm({ full_name:"", badge:"", nida:"", phone:"", email:"", rank:"", role:"", department:"", region:"", district:"", station_id:"", password:"", confirm_password:"", notes:"" });
  }

  const card = { background:"white", borderRadius:18, padding:28, border:"1px solid #E2E8F0", boxShadow:"0 1px 4px rgba(0,0,0,.05)", marginBottom:16 };
  const sHd = (t, s) => (
    <div style={{ marginBottom:20, paddingBottom:12, borderBottom:"2px solid #F1F5F9" }}>
      <div style={{ fontSize:15, fontWeight:700, color:"#03102B" }}>{t}</div>
      <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{s}</div>
    </div>
  );

  if (done) return (
    <AdminLayout pageTitle="Create Officer" pageTitle2="Unda Afisa">
      <div style={{ maxWidth:560, margin:"60px auto", background:"white", borderRadius:20, padding:"48px 40px", textAlign:"center", border:"1px solid #E2E8F0", boxShadow:"0 4px 20px rgba(0,0,0,.08)" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"#F0FDF4", border:"2px solid #BBF7D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle size={36} color="#16A34A" />
        </div>
        <h2 style={{ fontSize:22, fontWeight:800, color:"#03102B", marginBottom:6 }}>Officer Account Created!</h2>
        <p style={{ color:"#64748B", fontSize:13, marginBottom:20 }}>Akaunti ya Afisa Imeundwa</p>

        <div style={{ background:"#F8FAFC", borderRadius:12, padding:16, marginBottom:16, textAlign:"left" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              ["Full Name", form.full_name], ["Badge", form.badge],
              ["Rank", form.rank], ["Role", ROLE_LABELS[form.role]],
              ["Department", form.department], ["Region", form.region],
              ["District", form.district], ["Station", selectedStation?.name || "—"],
              ["Phone", form.phone], ["Email", form.email],
            ].filter(([,v]) => v).map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", marginBottom:20, display:"flex", gap:8, alignItems:"center" }}>
          <AlertTriangle size={15} color="#D97706" />
          <span style={{ fontSize:12, color:"#92400E" }}>Credentials will be sent to officer's phone & email. First login requires password change.</span>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={reset} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            + Create Another Officer
          </button>
          <button onClick={() => nav("/admin/officers")} style={{ padding:"10px 24px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            View All Officers
          </button>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout pageTitle="Create Officer" pageTitle2="Unda Akaunti ya Afisa">
      <div style={{ maxWidth:860, margin:"0 auto" }}>

        <div style={{ marginBottom:22 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>Create Officer Account</h1>
          <p style={{ color:"#64748B", marginTop:4 }}>Unda Akaunti ya Afisa Mpya · Fields marked <span style={{ color:"#DC2626" }}>*</span> are required</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:"flex", marginBottom:28 }}>
          {[{ n:1, label:"Personal Info" },{ n:2, label:"Assignment" },{ n:3, label:"Credentials" }].map((s,i) => (
            <div key={s.n} style={{ display:"flex", alignItems:"center", flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:step>=s.n?"#0D3477":"#E2E8F0", color:step>=s.n?"white":"#94A3B8", fontSize:13, fontWeight:800 }}>
                  {step>s.n?"✓":s.n}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:step>=s.n?"#03102B":"#94A3B8" }}>Step {s.n}</div>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>{s.label}</div>
                </div>
              </div>
              {i<2 && <div style={{ height:2, flex:1, background:step>s.n?"#0D3477":"#E2E8F0", margin:"0 8px" }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={card}>

            {/* ── STEP 1: Personal Info ── */}
            {step===1 && (
              <>
                {sHd("Personal Information","Taarifa za Kibinafsi")}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  <Inp label="Full Name · Jina Kamili" value={form.full_name} onChange={upd("full_name")} placeholder="e.g. John Doe Mwangi" />
                  <Inp label="Badge Number · Nambari ya Beji" value={form.badge} onChange={upd("badge")} placeholder="e.g. TZP-2026-00201" />
                  <Inp label="NIDA Number · Nambari ya NIDA" value={form.nida} onChange={upd("nida")} placeholder="19xxxxxx-xxxxx-xxxxx-x" required={false} />
                  <Inp label="Phone Number · Simu" value={form.phone} onChange={upd("phone")} placeholder="+255 712 345 678" type="tel" />
                  <Inp label="Email Address" value={form.email} onChange={upd("email")} placeholder="officer@polisi.go.tz" type="email" />
                </div>
              </>
            )}

            {/* ── STEP 2: Assignment ── */}
            {step===2 && (
              <>
                {sHd("Rank, Role & Station Assignment","Cheo, Jukumu na Uwekaji wa Kituo")}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  <Sel label="Rank · Cheo" value={form.rank} onChange={upd("rank")} options={RANKS} placeholder="Select rank..." />
                  <Sel label="Role · Jukumu" value={form.role} onChange={upd("role")} options={ROLES} placeholder="Select role..." />
                  <Sel label="Department · Idara" value={form.department} onChange={upd("department")} options={DEPARTMENTS} placeholder="Select department..." />
                </div>

                {/* Location cascade */}
                <div style={{ borderTop:"2px solid #F1F5F9", paddingTop:18, marginTop:6, marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0D3477", marginBottom:14 }}>
                    📍 Location Assignment · Uwekaji wa Eneo
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 18px" }}>

                    {/* 1. Region */}
                    <Sel
                      label="Region · Mkoa"
                      value={form.region}
                      onChange={upd("region")}
                      options={Object.keys(TZ_REGIONS).sort()}
                      placeholder="Select region..."
                    />

                    {/* 2. District — unlocks after region */}
                    <Sel
                      label="District · Wilaya"
                      value={form.district}
                      onChange={upd("district")}
                      options={availableDistricts}
                      placeholder={form.region ? "Select district..." : "Select region first..."}
                      disabled={!form.region}
                    />

                    {/* 3. Station — pulls from created stations */}
                    <div style={{ marginBottom:16 }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>
                        Station · Kituo <span style={{ color:"#DC2626" }}>*</span>
                      </label>
                      <div style={{ position:"relative" }}>
                        <select
                          value={form.station_id}
                          onChange={upd("station_id")}
                          required
                          disabled={!form.region}
                          style={{ ...sel, borderColor:!form.region?"#F1F5F9":"#E2E8F0", color:!form.region?"#94A3B8":"#1E293B", background:!form.region?"#F8FAFC":"white" }}
                          onFocus={e => { if(form.region) e.target.style.borderColor="#0D3477"; }}
                          onBlur={e => e.target.style.borderColor="#E2E8F0"}
                        >
                          <option value="">
                            {!form.region
                              ? "Select region first..."
                              : availableStations.length === 0
                                ? "No stations in this region yet — add stations first"
                                : "Select station..."}
                          </option>
                          {availableStations.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                          ))}
                        </select>
                        <ChevronDown size={15} color={!form.region?"#CBD5E1":"#64748B"} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                      </div>
                      {form.region && availableStations.length === 0 && (
                        <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:11, color:"#D97706" }}>⚠ No stations found for {form.region}{form.district?` / ${form.district}`:""}</span>
                          <button type="button" onClick={() => nav("/admin/stations")}
                            style={{ fontSize:11, color:"#0D3477", fontWeight:700, background:"none", border:"none", cursor:"pointer", textDecoration:"underline", padding:0 }}>
                            + Add Station
                          </button>
                        </div>
                      )}
                      {selectedStation && (
                        <div style={{ marginTop:6, background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"8px 12px", display:"flex", gap:8, alignItems:"center" }}>
                          <CheckCircle size={14} color="#16A34A" />
                          <span style={{ fontSize:12, color:"#166534", fontWeight:600 }}>{selectedStation.name} · {selectedStation.type} · {selectedStation.region}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role permissions preview */}
                {form.role && (
                  <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:12, padding:"14px 16px", marginTop:8 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#0D3477", marginBottom:8 }}>
                      ACCESS PREVIEW · {ROLE_LABELS[form.role]?.toUpperCase()}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {(ROLE_PERMS[form.role] || ["Full System Access"]).map(p => (
                        <span key={p} style={{ background:"#DBEAFE", color:"#1D4ED8", padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 3: Credentials ── */}
            {step===3 && (
              <>
                {sHd("Login Credentials","Taarifa za Kuingia Mfumo")}
                <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", marginBottom:20, display:"flex", gap:8, alignItems:"center" }}>
                  <AlertTriangle size={15} color="#D97706" />
                  <span style={{ fontSize:12, color:"#92400E" }}>Officer must change password on first login. Credentials sent via SMS and email.</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  <PwInp label="Password · Nywila" value={form.password} onChange={upd("password")} placeholder="Min 8 characters" show={showPw} toggle={() => setShowPw(!showPw)} />
                  <PwInp label="Confirm Password · Thibitisha" value={form.confirm_password} onChange={upd("confirm_password")} placeholder="Repeat password" show={showPw2} toggle={() => setShowPw2(!showPw2)} />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Admin Notes (optional)</label>
                  <textarea value={form.notes} onChange={upd("notes")} rows={3} placeholder="Any notes about this officer..."
                    style={{ width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box", resize:"vertical" }}
                    onFocus={e => e.target.style.borderColor="#0D3477"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                </div>

                {/* Account Summary */}
                <div style={{ background:"#F8FAFC", borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:12 }}>ACCOUNT SUMMARY · MUHTASARI WA AKAUNTI</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {[
                      ["Name", form.full_name], ["Badge", form.badge], ["Rank", form.rank],
                      ["Role", ROLE_LABELS[form.role]], ["Department", form.department],
                      ["Region", form.region], ["District", form.district],
                      ["Station", selectedStation?.name||"—"], ["Phone", form.phone],
                    ].filter(([,v]) => v).map(([k,v]) => (
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

          {/* Navigation */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <button type="button" onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1}
              style={{ padding:"10px 24px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontWeight:700, cursor:step===1?"not-allowed":"pointer", opacity:step===1?.5:1, fontSize:13 }}>
              ← Previous
            </button>
            <div style={{ fontSize:12, color:"#94A3B8" }}>Step {step} of 3</div>
            {step<3 ? (
              <button type="button" onClick={() => setStep(s=>s+1)}
                style={{ padding:"10px 28px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
                Next →
              </button>
            ) : (
              <button type="submit"
                style={{ padding:"10px 28px", borderRadius:10, border:"none", background:"#059669", color:"white", fontWeight:700, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
                <UserPlus size={16} /> Create Officer Account
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
