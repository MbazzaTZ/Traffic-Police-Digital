import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { MapPin, Plus, X, CheckCircle } from "lucide-react";

const TZ_REGIONS = ["Arusha","Dar es Salaam","Dodoma","Geita","Iringa","Kagera","Katavi","Kigoma","Kilimanjaro","Lindi","Mara","Mbeya","Morogoro","Mtwara","Mwanza","Njombe","Pemba North","Pemba South","Pwani","Rukwa","Ruvuma","Shinyanga","Simiyu","Singida","Songwe","Tabora","Tanga","Zanzibar North","Zanzibar South","Zanzibar West"];

export default function RegionsPage() {
  const [modal, setModal]   = useState(false);
  const [done, setDone]     = useState(false);
  const [regions, setRegions] = useState([]);
  const [form, setForm]     = useState({ name:"", code:"", zone:"" });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  function submit(e) {
    e.preventDefault();
    setRegions(p => [{ ...form, id:`RGN-${Date.now()}`, districts:[], stations:0, officers:0 }, ...p]);
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ name:"", code:"", zone:"" }); }, 2000);
  }

  return (
    <AdminLayout pageTitle="Regions & Districts" pageTitle2="Mikoa na Wilaya">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a0533", margin:0 }}>Regions & Districts</h1>
          <p style={{ color:"#64748B", marginTop:3 }}>Mikoa na Wilaya · Tanzania national structure · {regions.length} regions added</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Add Region
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Regions / Mikoa",  c:"#7C3AED", v:regions.length },
          { label:"Districts / Wilaya",c:"#0D3477", v:0 },
          { label:"Stations / Vituo", c:"#059669", v:0 },
          { label:"Officers / Maafisa",c:"#D97706", v:0 },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {regions.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <MapPin size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No regions added yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Mikoa haijafunguliwa bado · Tanzania has 31 regions — add them here</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Add First Region
          </button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {regions.map((r, i) => (
            <div key={i} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <MapPin size={18} color="#7C3AED" />
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#1a0533" }}>{r.name} Region</div>
                  <div style={{ fontSize:12, color:"#64748B" }}>Code: {r.code} · Zone: {r.zone || "—"}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:20 }}>
                {[["Districts","0"],["Stations","0"],["Officers","0"]].map(([k,v]) => (
                  <div key={k} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:16, fontWeight:800, color:"#7C3AED" }}>{v}</div>
                    <div style={{ fontSize:10, color:"#94A3B8" }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:440 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#1a0533" }}>Add Region · Ongeza Mkoa</div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"24px 0" }}>
                <CheckCircle size={40} color="#16A34A" style={{ marginBottom:10 }} />
                <h3 style={{ color:"#16A34A" }}>Region Added!</h3>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Region Name *</label>
                  <select value={form.name} onChange={upd("name")} required style={{ ...inp, paddingLeft:12 }}>
                    <option value="">Select Tanzania region...</option>
                    {TZ_REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                {[
                  { label:"Region Code · Msimbo", key:"code", ph:"e.g. NJO" },
                  { label:"Zone · Ukanda", key:"zone", ph:"e.g. Southern Zone" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{f.label} *</label>
                    <input value={form[f.key]} onChange={upd(f.key)} placeholder={f.ph} required style={inp}
                      onFocus={e => e.target.style.borderColor="#7C3AED"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                  </div>
                ))}
                <button type="submit" style={{ width:"100%", height:44, background:"#7C3AED", color:"white", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:14 }}>
                  Add Region · Ongeza Mkoa
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
