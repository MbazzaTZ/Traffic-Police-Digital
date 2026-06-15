import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Building2, Plus, Search, X, CheckCircle, Users, Edit, ChevronDown } from "lucide-react";
import { useAppData, TZ_REGIONS } from "../../context/AppDataContext";

const TYPES = ["Police Station","Police Post","HQ","Division HQ","Outpost"];

export default function StationsPage() {
  const { stations, addStation } = useAppData();
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(false);
  const [done, setDone]     = useState(false);
  const [form, setForm]     = useState({ name:"", code:"", type:"Police Station", region:"", district:"", phone:"", address:"", ocs_name:"" });

  const upd = k => e => {
    const val = e.target.value;
    if (k==="region") return setForm(f => ({ ...f, region:val, district:"" }));
    setForm(f => ({ ...f, [k]:val }));
  };

  const districts = form.region ? (TZ_REGIONS[form.region] || []) : [];

  const sel = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 32px 0 12px", fontSize:13, outline:"none", boxSizing:"border-box", appearance:"none", WebkitAppearance:"none", background:"white", cursor:"pointer" };
  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };
  const lbl = (t, req=true) => (
    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>
      {t} {req&&<span style={{color:"#DC2626"}}>*</span>}
    </label>
  );

  function submit(e) {
    e.preventDefault();
    addStation(form);
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ name:"", code:"", type:"Police Station", region:"", district:"", phone:"", address:"", ocs_name:"" }); }, 2200);
  }

  const filtered = stations.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.region.toLowerCase().includes(search.toLowerCase()) || s.district?.toLowerCase().includes(search.toLowerCase()));

  const TYPE_COLOR = { "HQ":"#0D3477", "Police Station":"#059669", "Police Post":"#D97706", "Division HQ":"#0891B2", "Outpost":"#475569" };

  return (
    <AdminLayout pageTitle="Stations" pageTitle2="Vituo vya Polisi">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>
            Police Stations <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Vituo</span>
          </h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{stations.length} stations registered</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Add Station
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Total",           v: stations.length,                                             c:"#0D3477" },
          { label:"HQ",              v: stations.filter(s=>s.type==="HQ").length,                   c:"#082A63" },
          { label:"Police Stations", v: stations.filter(s=>s.type==="Police Station").length,       c:"#059669" },
          { label:"Police Posts",    v: stations.filter(s=>s.type==="Police Post").length,          c:"#D97706" },
          { label:"Other",           v: stations.filter(s=>!["HQ","Police Station","Police Post"].includes(s.type)).length, c:"#475569" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 14px", height:42, marginBottom:16, maxWidth:380 }}>
        <Search size={16} color="#94A3B8" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, region or district..."
          style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Building2 size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>{stations.length===0 ? "No stations added yet" : "No stations match your search"}</div>
          <div style={{ fontSize:13, marginTop:6 }}>Vituo havijafunguliwa bado</div>
          {stations.length===0 && (
            <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
              Add First Station
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {filtered.map((s, i) => (
            <div key={i} style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden", transition:".18s", cursor:"pointer" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 20px rgba(0,0,0,.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ height:5, background:TYPE_COLOR[s.type]||"#0D3477" }} />
              <div style={{ padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#03102B" }}>{s.name}</div>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{s.code||"No code"}</div>
                  </div>
                  <span style={{ padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700, background:"#F0FDF4", color:"#16A34A" }}>Active</span>
                </div>

                <span style={{ padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:700, background:`${TYPE_COLOR[s.type]||"#0D3477"}15`, color:TYPE_COLOR[s.type]||"#0D3477", marginBottom:12, display:"inline-block" }}>
                  {s.type}
                </span>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
                  {[
                    ["Region", s.region], ["District", s.district||"—"],
                    ["OCS", s.ocs_name||"—"], ["Phone", s.phone||"—"],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:"#1E293B" }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, marginTop:8, borderTop:"1px solid #F1F5F9" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, color:"#0D3477" }}>
                    <Users size={14} />
                    <span style={{ fontSize:12, fontWeight:700 }}>0 Officers</span>
                  </div>
                  <button style={{ width:28, height:28, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}>
                    <Edit size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:"white", borderRadius:20, padding:30, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#03102B" }}>Add Police Station</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Ongeza Kituo cha Polisi</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>

            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }} />
                <h3 style={{ color:"#16A34A" }}>Station Added!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Kituo kimeongezwa · Now available when creating officers</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  {/* Name */}
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    {lbl("Station Name · Jina la Kituo")}
                    <input value={form.name} onChange={upd("name")} placeholder="e.g. Makambako Police Station" required style={inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </div>

                  {/* Type */}
                  <div style={{ marginBottom:14 }}>
                    {lbl("Type · Aina")}
                    <div style={{ position:"relative" }}>
                      <select value={form.type} onChange={upd("type")} style={sel}
                        onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                        {TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={14} color="#64748B" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    </div>
                  </div>

                  {/* Code */}
                  <div style={{ marginBottom:14 }}>
                    {lbl("Station Code · Msimbo", false)}
                    <input value={form.code} onChange={upd("code")} placeholder="e.g. TZP-NJO-001" style={inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </div>

                  {/* Region → District cascade */}
                  <div style={{ marginBottom:14 }}>
                    {lbl("Region · Mkoa")}
                    <div style={{ position:"relative" }}>
                      <select value={form.region} onChange={upd("region")} required style={sel}
                        onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                        <option value="">Select region...</option>
                        {Object.keys(TZ_REGIONS).sort().map(r=><option key={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={14} color="#64748B" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    {lbl("District · Wilaya")}
                    <div style={{ position:"relative" }}>
                      <select value={form.district} onChange={upd("district")} required disabled={!form.region}
                        style={{ ...sel, background:!form.region?"#F8FAFC":"white", color:!form.region?"#94A3B8":"#1E293B" }}
                        onFocus={e=>{ if(form.region) e.target.style.borderColor="#0D3477"; }} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                        <option value="">{form.region?"Select district...":"Select region first..."}</option>
                        {districts.map(d=><option key={d}>{d}</option>)}
                      </select>
                      <ChevronDown size={14} color={!form.region?"#CBD5E1":"#64748B"} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    {lbl("Address · Anwani", false)}
                    <input value={form.address} onChange={upd("address")} placeholder="e.g. Town Centre, Main Road" style={inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </div>

                  <div style={{ marginBottom:14 }}>
                    {lbl("Phone · Simu", false)}
                    <input value={form.phone} onChange={upd("phone")} placeholder="+255 26 278 0001" style={inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </div>

                  <div style={{ marginBottom:14 }}>
                    {lbl("OCS Name · Jina la OCS", false)}
                    <input value={form.ocs_name} onChange={upd("ocs_name")} placeholder="e.g. Inspector John Doe" style={inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </div>
                </div>

                <button type="submit" style={{ width:"100%", height:46, background:"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
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
