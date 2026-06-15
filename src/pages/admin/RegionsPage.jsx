import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { MapPin, Plus, X, CheckCircle, ChevronDown, ChevronRight, Building2, AlertTriangle } from "lucide-react";
import { useAppData, TZ_REGIONS } from "../../context/AppDataContext";
import { supabase } from "../../lib/supabase";

const TZ_ZONES = {
  "Northern":  ["Arusha","Kilimanjaro","Tanga"],
  "Eastern":   ["Dar es Salaam","Pwani","Morogoro"],
  "Southern":  ["Iringa","Njombe","Mbeya","Ruvuma","Lindi","Mtwara","Songwe","Rukwa","Katavi"],
  "Central":   ["Dodoma","Singida","Tabora"],
  "Lake":      ["Mwanza","Mara","Kagera","Simiyu","Shinyanga","Geita","Kigoma"],
  "Zanzibar":  ["Zanzibar North","Zanzibar South","Zanzibar West","Pemba North","Pemba South"],
};

const S = {
  sel: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box", background:"white" },
  inp: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 },
};

export default function RegionsPage() {
  const { regions, districts, stations, addRegion, refresh } = useAppData();

  const [modal, setModal]         = useState(false);      // add region
  const [distModal, setDistModal] = useState(null);       // add district: holds region object
  const [expanded, setExpanded]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(false);
  const [distDone, setDistDone]   = useState(false);
  const [err, setErr]             = useState("");

  const [form, setForm]         = useState({ name:"", code:"", zone:"" });
  const [distForm, setDistForm] = useState({ name:"", code:"" });

  const upd  = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const updD = k => e => setDistForm(f => ({ ...f, [k]: e.target.value }));

  const regionZone = form.name
    ? Object.entries(TZ_ZONES).find(([,rs]) => rs.includes(form.name))?.[0] || ""
    : "";

  const addedNames = new Set(regions.map(r => r.name));

  // Districts belonging to a region (from Supabase districts table)
  function regionDistricts(regionId) {
    return districts.filter(d => d.region_id === regionId);
  }

  // Stations belonging to a region
  function regionStations(regionId) {
    return stations.filter(s => s.region_id === regionId);
  }

  // ── Add Region ──
  async function submitRegion(e) {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      await addRegion({ ...form, zone: form.zone || regionZone });
      setDone(true);
      setTimeout(() => { setModal(false); setDone(false); setForm({ name:"", code:"", zone:"" }); }, 2200);
    } catch (e) {
      setErr(e.message || "Failed to add region");
    } finally {
      setSaving(false);
    }
  }

  // ── Add District to existing region ──
  async function submitDistrict(e) {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      const { error } = await supabase
        .from("districts")
        .insert({ name: distForm.name, code: distForm.code || null, region_id: distModal.id });
      if (error) throw error;
      await refresh();
      setDistDone(true);
      setTimeout(() => { setDistModal(null); setDistDone(false); setDistForm({ name:"", code:"" }); }, 2000);
    } catch (e) {
      setErr(e.message || "Failed to add district");
    } finally {
      setSaving(false);
    }
  }

  const totalDistricts = districts.length;

  return (
    <AdminLayout pageTitle="Regions & Districts" pageTitle2="Mikoa na Wilaya">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>Regions & Districts</h1>
          <p style={{ color:"#64748B", marginTop:3 }}>Mikoa na Wilaya · {regions.length} of 31 Tanzania regions · {totalDistricts} districts total</p>
        </div>
        <button onClick={() => { setErr(""); setModal(true); }}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Add Region
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Regions Added",   v:regions.length,     c:"#0D3477" },
          { label:"Remaining",       v:31-regions.length,  c:"#94A3B8" },
          { label:"Total Districts", v:totalDistricts,     c:"#059669" },
          { label:"Stations",        v:stations.length,    c:"#D97706" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Regions list */}
      {regions.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <MapPin size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No regions configured yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Tanzania has 31 regions — add them here</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Add First Region
          </button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {regions.map((r, i) => {
            const rDistricts = regionDistricts(r.id);
            const rStations  = regionStations(r.id);
            const isOpen     = expanded === i;

            return (
              <div key={r.id} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>

                {/* Region row */}
                <button onClick={() => setExpanded(isOpen ? null : i)}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px 20px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MapPin size={18} color="#0D3477" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:"#03102B" }}>{r.name} Region</div>
                    <div style={{ fontSize:12, color:"#64748B" }}>
                      Code: {r.code || "—"} · {rDistricts.length} Districts · {rStations.length} Stations
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#0D3477" }}>{rDistricts.length}</div>
                      <div style={{ fontSize:10, color:"#94A3B8" }}>Districts</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#059669" }}>{rStations.length}</div>
                      <div style={{ fontSize:10, color:"#94A3B8" }}>Stations</div>
                    </div>
                    {isOpen ? <ChevronDown size={18} color="#94A3B8" /> : <ChevronRight size={18} color="#94A3B8" />}
                  </div>
                </button>

                {/* Expanded: districts + stations */}
                {isOpen && (
                  <div style={{ padding:"0 20px 18px", borderTop:"1px solid #F1F5F9" }}>

                    {/* Districts header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"14px 0 10px" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5 }}>
                        Districts · Wilaya ({rDistricts.length})
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setErr(""); setDistForm({ name:"", code:"" }); setDistModal(r); }}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, border:"1px solid #0D3477", background:"#EFF6FF", color:"#0D3477", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                        <Plus size={13} /> Add District
                      </button>
                    </div>

                    {/* Districts grid */}
                    {rDistricts.length === 0 ? (
                      <div style={{ background:"#F8FAFC", borderRadius:10, padding:"16px", textAlign:"center", color:"#94A3B8", marginBottom:12 }}>
                        <Building2 size={22} style={{ opacity:.3, marginBottom:6 }} />
                        <div style={{ fontSize:13, color:"#64748B" }}>No districts yet — click "Add District" above</div>
                      </div>
                    ) : (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:14 }}>
                        {rDistricts.map(d => (
                          <div key={d.id} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"9px 12px", display:"flex", alignItems:"center", gap:7 }}>
                            <Building2 size={13} color="#0D3477" style={{ flexShrink:0 }} />
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{d.name}</div>
                              {d.code && <div style={{ fontSize:10, color:"#94A3B8" }}>{d.code}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stations in region */}
                    {rStations.length > 0 && (
                      <>
                        <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
                          Stations in this Region ({rStations.length})
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {rStations.map(s => (
                            <span key={s.id} style={{ background:"#EFF6FF", color:"#0D3477", padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:600 }}>
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

      {/* ── ADD REGION MODAL ── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:500, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#03102B" }}>Add Region · Ongeza Mkoa</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Districts auto-populated from Tanzania database</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>

            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7, alignItems:"center" }}><AlertTriangle size={14} color="#DC2626"/>{err}</div>}

            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <CheckCircle size={44} color="#16A34A" style={{ marginBottom:12 }} />
                <h3 style={{ color:"#16A34A", marginBottom:4 }}>Region Added!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Districts saved to Supabase automatically</p>
              </div>
            ) : (
              <form onSubmit={submitRegion}>
                {/* Region picker */}
                <div style={{ marginBottom:14 }}>
                  <label style={S.lbl}>Region Name · Jina la Mkoa *</label>
                  <select value={form.name} onChange={upd("name")} required style={S.sel}
                    onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                    <option value="">Select Tanzania region...</option>
                    {Object.keys(TZ_REGIONS).sort().map(r => (
                      <option key={r} value={r} disabled={addedNames.has(r)}>
                        {r}{addedNames.has(r) ? " ✓ already added" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Districts preview */}
                {form.name && TZ_REGIONS[form.name] && (
                  <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#0D3477", marginBottom:7 }}>
                      DISTRICTS TO BE SAVED ({TZ_REGIONS[form.name].length})
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
                    <label style={S.lbl}>Region Code *</label>
                    <input value={form.code} onChange={upd("code")} placeholder="e.g. NJO" required style={S.inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>
                      Zone · Ukanda {regionZone && <span style={{ color:"#059669", fontWeight:400 }}>→ {regionZone}</span>}
                    </label>
                    <select value={form.zone || regionZone} onChange={upd("zone")} style={S.sel}>
                      <option value="">Auto-detect...</option>
                      {Object.keys(TZ_ZONES).map(z => <option key={z}>{z}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={saving}
                  style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontSize:14 }}>
                  {saving ? "Saving to Supabase..." : "Add Region · Ongeza Mkoa"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── ADD DISTRICT MODAL ── */}
      {distModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:460 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#03102B" }}>Add District</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>
                  Adding to: <strong style={{ color:"#0D3477" }}>{distModal.name} Region</strong>
                </div>
              </div>
              <button onClick={() => setDistModal(null)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>

            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7, alignItems:"center" }}><AlertTriangle size={14} color="#DC2626"/>{err}</div>}

            {distDone ? (
              <div style={{ textAlign:"center", padding:"24px 0" }}>
                <CheckCircle size={44} color="#16A34A" style={{ marginBottom:10 }} />
                <h3 style={{ color:"#16A34A", marginBottom:4 }}>District Added!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Saved to Supabase · Wilaya imeongezwa</p>
              </div>
            ) : (
              <form onSubmit={submitDistrict}>
                {/* Quick select from TZ_REGIONS reference */}
                {TZ_REGIONS[distModal.name] && (
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Quick Pick from Tanzania Database</label>
                    <select onChange={e => setDistForm(f => ({ ...f, name: e.target.value }))} style={S.sel}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
                      <option value="">Select known district...</option>
                      {TZ_REGIONS[distModal.name]
                        .filter(d => !regionDistricts(distModal.id).some(x => x.name === d))
                        .map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>Or type a custom district name below</div>
                  </div>
                )}

                <div style={{ marginBottom:14 }}>
                  <label style={S.lbl}>District Name · Jina la Wilaya *</label>
                  <input value={distForm.name} onChange={updD("name")} placeholder="e.g. Makete District" required style={S.inp}
                    onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                </div>

                <div style={{ marginBottom:18 }}>
                  <label style={S.lbl}>District Code (optional)</label>
                  <input value={distForm.code} onChange={updD("code")} placeholder="e.g. MKT" style={S.inp}
                    onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
                </div>

                <button type="submit" disabled={saving}
                  style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <Building2 size={16} /> {saving ? "Saving..." : "Add District · Ongeza Wilaya"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
