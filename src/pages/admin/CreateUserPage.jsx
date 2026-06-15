import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { UserPlus, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";

const RANKS = ["Constable","Corporal","Sergeant","Staff Sergeant","Inspector","ASP","SP","SSP","ACP","DCP","SCP","Commissioner of Police","RPC","DIGP","IGP"];
const ROLES = ["regular_officer","traffic_officer","cid_officer","forensic_officer","ocs","ocd","rpc","igp","admin_officer"];
const ROLE_LABELS = { regular_officer:"Regular Officer", traffic_officer:"Traffic Officer", cid_officer:"CID Officer", forensic_officer:"Forensic Officer", ocs:"OCS – Station Commander", ocd:"OCD – District Commander", rpc:"RPC – Regional Commander", igp:"IGP – Inspector General", admin_officer:"Admin Officer" };
const DEPARTMENTS = ["Operations","CID","Traffic","Intelligence","Forensics","Community Policing","Anti-Narcotics","Cyber Crime","Human Resources","Administration","ICT","Internal Affairs","Training"];
const REGIONS = ["Dar es Salaam","Dodoma","Arusha","Mwanza","Tanga","Morogoro","Iringa","Njombe","Mbeya","Ruvuma","Lindi","Mtwara","Pwani","Kilimanjaro","Singida","Tabora","Shinyanga","Kagera","Mara","Simiyu","Geita","Katavi","Rukwa","Kigoma","Zanzibar North","Zanzibar South","Zanzibar West","Pemba North","Pemba South","Kaskazini Pemba","Kaskazini Unguja"];

const inp = (extra = {}) => ({
  width: "100%", height: 42, border: "1.5px solid #E2E8F0",
  borderRadius: 10, padding: "0 12px", fontSize: 13,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  ...extra,
});

export default function CreateUserPage() {
  const [step, setStep]       = useState(1);
  const [done, setDone]       = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [form, setForm] = useState({
    full_name: "", badge: "", rank: "", role: "", department: "",
    region: "", station: "", phone: "", email: "", nida: "",
    password: "", confirm_password: "", notes: "",
  });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) { alert("Passwords do not match"); return; }
    setDone(true);
  }

  const sectionHd = (title, sub) => (
    <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #F1F5F9" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#03102B" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{sub}</div>
    </div>
  );

  const field = (label, key, opts = {}) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: .4, marginBottom: 6 }}>{label} {opts.required !== false && <span style={{ color: "#DC2626" }}>*</span>}</label>
      {opts.type === "select" ? (
        <select value={form[key]} onChange={upd(key)} required={opts.required !== false}
          style={{ ...inp(), paddingLeft: 12 }}>
          <option value="">{opts.placeholder || "Select..."}</option>
          {opts.options.map(o => typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : opts.type === "textarea" ? (
        <textarea value={form[key]} onChange={upd(key)} rows={3} placeholder={opts.placeholder}
          style={{ ...inp({ height: "auto", padding: "10px 12px" }) }} />
      ) : opts.type === "password" ? (
        <div style={{ position: "relative" }}>
          <input type={opts.show ? "text" : "password"} value={form[key]} onChange={upd(key)} placeholder={opts.placeholder} required={opts.required !== false}
            style={{ ...inp({ paddingRight: 42 }) }}
            onFocus={e => e.target.style.borderColor = "#0D3477"}
            onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          <button type="button" onClick={opts.toggle}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}>
            {opts.show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      ) : (
        <input type={opts.type || "text"} value={form[key]} onChange={upd(key)} placeholder={opts.placeholder} required={opts.required !== false}
          style={inp()}
          onFocus={e => e.target.style.borderColor = "#0D3477"}
          onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
      )}
    </div>
  );

  if (done) return (
    <AdminLayout pageTitle="Create Officer" pageTitle2="Unda Afisa">
      <div style={{ maxWidth: 540, margin: "60px auto", background: "white", borderRadius: 20, padding: "48px 40px", textAlign: "center", border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle size={36} color="#16A34A" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#03102B", marginBottom: 8 }}>Officer Account Created!</h2>
        <p style={{ color: "#64748B", marginBottom: 6 }}>Akaunti ya Afisa Imeundwa</p>
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, margin: "20px 0", textAlign: "left" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["Full Name", form.full_name], ["Badge", form.badge],
              ["Rank", form.rank], ["Role", ROLE_LABELS[form.role] || form.role],
              ["Department", form.department], ["Region", form.region],
              ["Phone", form.phone], ["Email", form.email],
            ].map(([k, v]) => v ? (
              <div key={k}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{v}</div>
              </div>
            ) : null)}
          </div>
        </div>
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertTriangle size={15} color="#D97706" />
          <span style={{ fontSize: 12, color: "#92400E" }}>Credentials sent to officer's phone & email. First login requires password change.</span>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => { setDone(false); setForm({ full_name:"",badge:"",rank:"",role:"",department:"",region:"",station:"",phone:"",email:"",nida:"",password:"",confirm_password:"",notes:"" }); setStep(1); }}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#0D3477", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            + Create Another Officer
          </button>
          <button onClick={() => window.location.href = "/admin/officers"}
            style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            View All Officers
          </button>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout pageTitle="Create Officer" pageTitle2="Unda Akaunti ya Afisa">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#03102B", margin: 0 }}>Create Officer Account</h1>
          <p style={{ color: "#64748B", marginTop: 4 }}>Unda Akaunti ya Afisa Mpya · All fields marked * are required</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28 }}>
          {[
            { n: 1, label: "Personal Info" },
            { n: 2, label: "Assignment" },
            { n: 3, label: "Credentials" },
          ].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: step >= s.n ? "#0D3477" : "#E2E8F0",
                  color: step >= s.n ? "white" : "#94A3B8",
                  fontSize: 13, fontWeight: 800,
                }}>{step > s.n ? "✓" : s.n}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: step >= s.n ? "#03102B" : "#94A3B8" }}>Step {s.n}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.label}</div>
                </div>
              </div>
              {i < 2 && <div style={{ height: 2, flex: 1, background: step > s.n ? "#0D3477" : "#E2E8F0", margin: "0 8px" }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: "white", borderRadius: 18, padding: 28, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,.05)", marginBottom: 16 }}>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                {sectionHd("Personal Information", "Taarifa za Kibinafsi")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                  {field("Full Name", "full_name", { placeholder: "e.g. John Doe Mwangi" })}
                  {field("Badge Number", "badge", { placeholder: "e.g. TZP-2026-00201" })}
                  {field("NIDA Number", "nida", { placeholder: "19xxxxxx-xxxxx-xxxxx-x" })}
                  {field("Phone Number", "phone", { type: "tel", placeholder: "+255 712 345 678" })}
                  {field("Email Address", "email", { type: "email", placeholder: "officer@polisi.go.tz" })}
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                {sectionHd("Rank, Role & Assignment", "Cheo, Jukumu na Uwekaji")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                  {field("Rank · Cheo", "rank", { type: "select", options: RANKS })}
                  {field("Role · Jukumu", "role", { type: "select", options: ROLES.map(r => ({ v: r, l: ROLE_LABELS[r] })) })}
                  {field("Department · Idara", "department", { type: "select", options: DEPARTMENTS })}
                  {field("Region · Mkoa", "region", { type: "select", options: REGIONS })}
                  {field("Station Name · Kituo", "station", { placeholder: "e.g. Makambako Police Station" })}
                </div>

                {/* Role permissions preview */}
                {form.role && (
                  <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "14px 16px", marginTop: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0D3477", marginBottom: 8 }}>ACCESS PREVIEW · {ROLE_LABELS[form.role]?.toUpperCase()}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(form.role === "regular_officer" ? ["Person Search","Incident Reports","Arrests","Detentions","Patrol","Evidence Upload","Communications"] :
                        form.role === "traffic_officer" ? ["Vehicle Search","Driver Licenses","Traffic Citations","Accident Reports","Insurance Verification"] :
                        form.role === "cid_officer" ? ["Criminal Cases","Warrants","Investigations","Suspects","Witnesses","Evidence","Forensics","Wanted Persons"] :
                        form.role === "ocs" ? ["All Station Officers","Station Reports","Station Cases","Station Statistics","Detentions","Cells"] :
                        form.role === "admin_officer" ? ["Manage Users","Create Accounts","All Admin Activities","System Settings","Roles Management"] :
                        ["Full System Access"]).map(p => (
                          <span key={p} style={{ background: "#DBEAFE", color: "#0D3477", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{p}</span>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                {sectionHd("Login Credentials", "Taarifa za Kuingia Mfumo")}
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 8, alignItems: "center" }}>
                  <AlertTriangle size={15} color="#D97706" />
                  <span style={{ fontSize: 12, color: "#92400E" }}>Officer will be required to change password on first login. Credentials will be sent via SMS and email.</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                  {field("Password · Nywila", "password", { type: "password", show: showPw, toggle: () => setShowPw(!showPw), placeholder: "Min 8 characters" })}
                  {field("Confirm Password · Thibitisha Nywila", "confirm_password", { type: "password", show: showPw2, toggle: () => setShowPw2(!showPw2), placeholder: "Repeat password" })}
                </div>
                {field("Admin Notes (optional)", "notes", { type: "textarea", placeholder: "Any notes about this officer or account...", required: false })}

                {/* Summary review */}
                <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12 }}>ACCOUNT SUMMARY · MUHTASARI WA AKAUNTI</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      ["Name", form.full_name], ["Badge", form.badge], ["Rank", form.rank],
                      ["Role", ROLE_LABELS[form.role] || form.role], ["Department", form.department],
                      ["Region", form.region], ["Station", form.station], ["Phone", form.phone],
                    ].map(([k, v]) => v ? (
                      <div key={k} style={{ background: "white", borderRadius: 8, padding: "10px 12px", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", marginTop: 2 }}>{v}</div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
              style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 700, cursor: step === 1 ? "not-allowed" : "pointer", opacity: step === 1 ? .5 : 1, fontSize: 13 }}>
              ← Previous
            </button>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>Step {step} of 3</div>
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => s + 1)}
                style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "#0D3477", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                Next →
              </button>
            ) : (
              <button type="submit"
                style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "#059669", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={16} /> Create Officer Account
              </button>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
