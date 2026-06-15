import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { MapPin, Plus, X, CheckCircle, ChevronDown, ChevronRight, Building2 } from "lucide-react";
import { useAppData, TZ_REGIONS } from "../../context/AppDataContext";

const TZ_ZONES = {
  "Northern":  ["Arusha","Kilimanjaro","Manyara","Tanga"],
  "Eastern":   ["Dar es Salaam","Pwani","Morogoro"],
  "Southern":  ["Iringa","Njombe","Mbeya","Ruvuma","Lindi","Mtwara","Songwe","Rukwa","Katavi"],
  "Central":   ["Dodoma","Singida","Tabora"],
  "Lake":      ["Mwanza","Mara","Kagera","Simiyu","Shinyanga","Geita","Kigoma"],
  "Zanzibar":  ["Zanzibar North","Zanzibar South","Zanzibar West","Pemba North","Pemba South"],
};

export default function RegionsPage() {
  const { regions, addRegion, stations } = useAppData();
  const [modal, setModal]     = useState(false);
  const [done, setDone]       = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm]       = useState({ name:"", code:"", zone:"" });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const sel = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box", background:"white" };
  const inp = { ...sel };

  // Available zone for selected region
  const regionZone = form.name
    ? Object.entries(TZ_ZONES).find(([,rs]) => rs.includes(form.name))?.[0] || ""
    : "";

  function submit(e) {
    e.preventDefault();
    addRegion({ ...form, zone: form.zone || regionZone });
    setDone(true);
    setTimeout(() => { setModal(false); setDone(false); setForm({ name:"", code:"", zone:"" }); }, 2000);
  }

  // Already added region names
  const addedNames = new Set(regions.map(r => r.name));

  return (
    <AdminLayout pageTitle="Regions & Districts" pageTitle2="Mikoa na Wilaya">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>Regions & Districts</h1>
          <p style={{ color:"#64748B", marginTop:3 }}>Mikoa na Wilaya · {regions.length} of 31 Tanzania regions configured</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Add Region
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Regions Added",  v:regions.length,                                   c:"#0D3477" },
          { label:"Remaining",      v:31-regions.length,                                c:"#94A3B8" },
          { label:"Total Districts",v:regions.reduce((a,r)=>a+(r.districts?.length||0),0), c:"#059669" },
          { label:"Stations Linked",v:stations.length,                                  c:"#D97706" },
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
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No regions configured yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Mikoa haijasanidiwa · Tanzania has 31 regions — add them here</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Add First Region
          </button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {regions.map((r, i) => {
            const regionStations = stations.filter(s => s.region === r.name);
            return (
              <div key={r.id} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
                <button onClick={() => setExpanded(expanded===i ? null : i)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px 20px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MapPin size={18} color="#0D3477" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:"#03102B" }}>{r.name} Region</div>
                    <div style={{ fontSize:12, color:"#64748B" }}>
                      Code: {r.code||"—"} · Zone: {r.zone||"—"} · {r.districts?.length||0} Districts
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#0D3477" }}>{r.districts?.length||0}</div>
                      <div style={{ fontSize:10, color:"#94A3B8" }}>Districts</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#059669" }}>{regionStations.length}</div>
                      <div style={{ fontSize:10, color:"#94A3B8" }}>Stations</div>
                    </div>
                    {expanded===i ? <ChevronDown size={18} color="#94A3B8" /> : <ChevronRight size={18} color="#94A3B8" />}
                  </div>
                </button>

                {expanded===i && (
                  <div style={{ padding:"0 20px 16px", borderTop:"1px solid #F1F5F9" }}>
                    {/* Districts */}
                    <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"12px 0 8px", textTransform:"uppercase", letterSpacing:.5 }}>
                      Districts · Wilaya ({r.districts?.length||0})
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:14 }}>
                      {(r.districts||[]).map((d, j) => (
                        <div key={j} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"8px 10px", display:"flex", alignItems:"center", gap:6 }}>
                          <Building2 size={12} color="#0D3477" />
                          <span style={{ fontSize:11, fontWeight:600, color:"#1E293B" }}>{d}</span>
                        </div>
                      ))}
                    </div>

                    {/* Linked stations */}
                    {regionStations.length > 0 && (
                      <>
                        <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"8px 0 8px", textTransform:"uppercase", letterSpacing:.5 }}>
                          Stations in this region ({regionStations.length})
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {regionStations.map(s => (
                            <span key={s.id} style={{ background:"#EFF6FF", color:"#0D3477", padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:600 }}>
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Region Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:480 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#03102B" }}>Add Region · Ongeza Mkoa</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Districts will be auto-populated</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>

            {done ? (
              <div style={{ textAlign:"center", padding:"24px 0" }}>
                <CheckCircle size={40} color="#16A34A" style={{ marginBottom:10 }} />
                <h3 style={{ color:"#16A34A", marginBottom:4 }}>Region Added!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Districts auto-populated from Tanzania national database</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                {/* Region selector */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Region Name · Jina la Mkoa *</label>
                  <select value={form.name} onChange={upd("name")} required style={sel}
                    onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                    <option value="">Select Tanzania region...</option>
                    {Object.keys(TZ_REGIONS).sort().map(r => (
                      <option key={r} value={r} disabled={addedNames.has(r)}>
                        {r}{addedNames.has(r) ? " ✓ (already added)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-show districts preview */}
                {form.name && TZ_REGIONS[form.name] && (
                  <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#0D3477", marginBottom:6 }}>
                      AUTO-POPULATED DISTRICTS ({TZ_REGIONS[form.name].length})
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {TZ_REGIONS[form.name].map(d => (
                        <span key={d} style={{ background:"#DBEAFE", color:"#1D4ED8", padding:"2px 8px", borderRadius:999, fontSize:11 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Region Code *</label>
                    <input value={form.code} onChange={upd("code")} placeholder="e.g. NJO" required style={inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>
                      Zone · Ukanda {regionZone && <span style={{ color:"#059669" }}>→ {regionZone}</span>}
                    </label>
                    <select value={form.zone||regionZone} onChange={upd("zone")} style={sel}>
                      <option value="">Select zone...</option>
                      {Object.keys(TZ_ZONES).map(z=><option key={z}>{z}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" style={{ width:"100%", height:44, background:"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:14 }}>
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
