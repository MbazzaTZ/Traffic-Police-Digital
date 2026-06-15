import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Building2, Plus, Search, Edit, MapPin, Users, X, CheckCircle } from "lucide-react";

const STATIONS = [
  { name:"Makambako Police Station",  code:"TZP-NJO-001", type:"Police Station", region:"Njombe",        district:"Makete",    officers:12, ocs:"Insp. Mbaza",    status:"Active", phone:"+255 26 278 0001", addr:"Makambako Town Centre" },
  { name:"Njombe Central Station",    code:"TZP-NJO-002", type:"Police Station", region:"Njombe",        district:"Njombe Urban",officers:18,ocs:"SP Kimaro",       status:"Active", phone:"+255 26 278 0002", addr:"Njombe Town, Mkoa St" },
  { name:"Iringa HQ",                 code:"TZP-IRI-001", type:"HQ",             region:"Iringa",        district:"Iringa Urban",officers:32,ocs:"SSP Mwenda",      status:"Active", phone:"+255 26 270 0001", addr:"Iringa Town, Main Rd" },
  { name:"Mafinga Police Post",       code:"TZP-NJO-003", type:"Police Post",    region:"Njombe",        district:"Mufindi",   officers:5,  ocs:"Sgt. Kilosa",    status:"Active", phone:"+255 26 278 0003", addr:"Mafinga Town" },
  { name:"Dodoma Central HQ",         code:"TZP-DOD-001", type:"HQ",             region:"Dodoma",        district:"Dodoma Urban",officers:56,ocs:"ACP Msomi",       status:"Active", phone:"+255 26 232 0001", addr:"Dodoma, Independence Ave" },
  { name:"Temeke Police Station",     code:"TZP-DAR-004", type:"Police Station", region:"Dar es Salaam", district:"Temeke",    officers:24, ocs:"SP Amani",        status:"Active", phone:"+255 22 286 0004", addr:"Temeke, Chang'ombe Rd" },
  { name:"Mbeya Central Station",     code:"TZP-MBY-001", type:"Police Station", region:"Mbeya",         district:"Mbeya Urban",officers:21,ocs:"Insp. Nkosi",     status:"Inactive",phone:"+255 25 250 0001",addr:"Mbeya Town Centre" },
];

const TYPE_COLORS = { "HQ": "#0D3477", "Police Station": "#7C3AED", "Police Post": "#059669" };

export default function StationsPage() {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(false);
  const [done, setDone]     = useState(false);
  const [form, setForm]     = useState({ name:"", code:"", type:"Police Station", region:"", district:"", phone:"", address:"", ocs_name:"" });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const filtered = STATIONS.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.region.toLowerCase().includes(search.toLowerCase())
  );

  function submit(e) {
    e.preventDefault();
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); }, 2500);
  }

  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <AdminLayout pageTitle="Stations" pageTitle2="Vituo vya Polisi">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a0533", margin:0 }}>Police Stations · <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>Vituo vya Polisi</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{STATIONS.length} stations registered nationwide</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Add Station
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Total Stations", v: STATIONS.length,                                    c:"#7C3AED" },
          { label:"HQ",             v: STATIONS.filter(s=>s.type==="HQ").length,           c:"#0D3477" },
          { label:"Police Stations",v: STATIONS.filter(s=>s.type==="Police Station").length, c:"#059669" },
          { label:"Police Posts",   v: STATIONS.filter(s=>s.type==="Police Post").length,  c:"#D97706" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 14px", height:42, marginBottom:16, maxWidth:340 }}>
        <Search size={16} color="#94A3B8" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stations or regions..."
          style={{ border:"none", outline:"none", fontSize:13, color:"#1E293B", width:"100%", background:"transparent" }} />
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {filtered.map((s, i) => (
          <div key={i} style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:".18s", cursor:"pointer" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 20px rgba(0,0,0,.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.05)"; }}>
            {/* Color strip */}
            <div style={{ height:5, background: TYPE_COLORS[s.type] || "#7C3AED" }} />
            <div style={{ padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1a0533" }}>{s.name}</div>
                  <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{s.code}</div>
                </div>
                <span style={{ padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700,
                  background: s.status==="Active" ? "#F0FDF4" : "#FEF2F2",
                  color: s.status==="Active" ? "#16A34A" : "#DC2626" }}>
                  {s.status}
                </span>
              </div>

              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                <span style={{ padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700, background:`${TYPE_COLORS[s.type]}18`, color: TYPE_COLORS[s.type] }}>{s.type}</span>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  ["Region", s.region], ["District", s.district],
                  ["OCS", s.ocs], ["Phone", s.phone],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1E293B" }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #F1F5F9" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, color:"#7C3AED" }}>
                  <Users size={14} />
                  <span style={{ fontSize:12, fontWeight:700 }}>{s.officers} Officers</span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button style={{ width:28, height:28, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}>
                    <Edit size={13} />
                  </button>
                  <button style={{ width:28, height:28, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}>
                    <MapPin size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Station Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:"white", borderRadius:20, padding:30, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#1a0533" }}>Add Police Station</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Ongeza Kituo cha Polisi</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16} />
              </button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }} />
                <h3 style={{ color:"#16A34A", marginBottom:6 }}>Station Added!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Kituo kimeongezwa kwenye mfumo</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                {[
                  { label:"Station Name · Jina la Kituo", key:"name", placeholder:"e.g. Makambako Police Station" },
                  { label:"Station Code · Msimbo", key:"code", placeholder:"e.g. TZP-NJO-004" },
                  { label:"Address · Anwani", key:"address", placeholder:"e.g. Town Centre, Main Road" },
                  { label:"Phone · Simu", key:"phone", placeholder:"+255 26 278 0001" },
                  { label:"OCS Name · Jina la OCS", key:"ocs_name", placeholder:"e.g. Inspector John Doe" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{f.label} <span style={{ color:"#DC2626" }}>*</span></label>
                    <input value={form[f.key]} onChange={upd(f.key)} placeholder={f.placeholder} required style={inp}
                      onFocus={e => e.target.style.borderColor="#7C3AED"}
                      onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                  </div>
                ))}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  {[
                    { label:"Type · Aina", key:"type", opts:["Police Station","Police Post","HQ","Division HQ"] },
                    { label:"Region · Mkoa", key:"region", opts:["Njombe","Iringa","Dar es Salaam","Dodoma","Mbeya","Arusha","Mwanza"] },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:14 }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{f.label}</label>
                      <select value={form[f.key]} onChange={upd(f.key)} required style={{ ...inp, paddingLeft:12 }}>
                        {f.opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>District · Wilaya</label>
                  <input value={form.district} onChange={upd("district")} placeholder="e.g. Makete District" required style={inp}
                    onFocus={e => e.target.style.borderColor="#7C3AED"}
                    onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                </div>
                <button type="submit" style={{ width:"100%", height:46, background:"#7C3AED", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <Building2 size={16} /> Add Station · Ongeza Kituo
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
