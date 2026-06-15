import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Building2, Plus, Search, X, CheckCircle } from "lucide-react";

const REGIONS = ["Dar es Salaam","Dodoma","Arusha","Mwanza","Tanga","Morogoro","Iringa","Njombe","Mbeya","Ruvuma","Lindi","Mtwara","Pwani","Kilimanjaro","Singida","Tabora","Shinyanga","Kagera","Mara","Simiyu","Geita","Katavi","Rukwa","Kigoma"];

export default function StationsPage() {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(false);
  const [done, setDone]     = useState(false);
  const [stations, setStations] = useState([]);
  const [form, setForm]     = useState({ name:"", code:"", type:"Police Station", region:"", district:"", phone:"", address:"", ocs_name:"" });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  function submit(e) {
    e.preventDefault();
    setStations(p => [{ ...form, id:`STN-${Date.now()}`, officers:0, status:"Active" }, ...p]);
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ name:"", code:"", type:"Police Station", region:"", district:"", phone:"", address:"", ocs_name:"" }); }, 2000);
  }

  const filtered = stations.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.region.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout pageTitle="Stations" pageTitle2="Vituo vya Polisi">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a0533", margin:0 }}>Police Stations <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Vituo</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{stations.length} stations registered</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Add Station
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Total Stations",  c:"#7C3AED" },
          { label:"HQ",             c:"#0D3477" },
          { label:"Police Stations", c:"#059669" },
          { label:"Police Posts",   c:"#D97706" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>0</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 14px", height:42, marginBottom:16, maxWidth:340 }}>
        <Search size={16} color="#94A3B8" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stations or regions..."
          style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Building2 size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No stations added yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Vituo havijafunguliwa bado · Add your first police station</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Add First Station
          </button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {filtered.map((s, i) => (
            <div key={i} style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
              <div style={{ height:4, background:"#7C3AED" }} />
              <div style={{ padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#1a0533" }}>{s.name}</div>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{s.code}</div>
                  </div>
                  <span style={{ background:"#F0FDF4", color:"#16A34A", padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700 }}>{s.status}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Region",s.region],["District",s.district],["Type",s.type],["Officers","0"]].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:"#1E293B" }}>{v||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:"white", borderRadius:20, padding:30, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:22 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#1a0533" }}>Add Police Station</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Ongeza Kituo cha Polisi</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }} />
                <h3 style={{ color:"#16A34A" }}>Station Added!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Kituo kimeongezwa</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                {[
                  { label:"Station Name · Jina la Kituo", key:"name", ph:"e.g. Makambako Police Station" },
                  { label:"Station Code · Msimbo", key:"code", ph:"e.g. TZP-NJO-001" },
                  { label:"Address · Anwani", key:"address", ph:"e.g. Town Centre, Main Road" },
                  { label:"Phone · Simu", key:"phone", ph:"+255 26 278 0001" },
                  { label:"OCS Name · Jina la OCS", key:"ocs_name", ph:"e.g. Inspector John Doe" },
                  { label:"District · Wilaya", key:"district", ph:"e.g. Makete District" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{f.label} *</label>
                    <input value={form[f.key]} onChange={upd(f.key)} placeholder={f.ph} required style={inp}
                      onFocus={e => e.target.style.borderColor="#7C3AED"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                  </div>
                ))}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Type · Aina *</label>
                    <select value={form.type} onChange={upd("type")} style={{ ...inp, paddingLeft:12 }}>
                      {["Police Station","Police Post","HQ","Division HQ"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Region · Mkoa *</label>
                    <select value={form.region} onChange={upd("region")} required style={{ ...inp, paddingLeft:12 }}>
                      <option value="">Select region...</option>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" style={{ width:"100%", height:46, background:"#7C3AED", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                  Add Station · Ongeza Kituo
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
