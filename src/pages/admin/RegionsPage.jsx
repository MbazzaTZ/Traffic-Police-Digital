import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { MapPin, Plus, X, CheckCircle, ChevronDown, ChevronRight, Building2, AlertTriangle, Home } from "lucide-react";
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
  inp: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box", background:"white" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 },
};

function AddBtn({ label, onClick, small }) {
  return (
    <button onClick={e=>{e.stopPropagation();onClick();}}
      style={{ display:"flex", alignItems:"center", gap:4, padding: small?"4px 10px":"5px 12px", borderRadius:7, border:"1px solid #0D3477", background:"#EFF6FF", color:"#0D3477", fontWeight:700, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>
      <Plus size={11}/> {label}
    </button>
  );
}

function SaveModal({ title, sub, done, saving, err, onClose, onSubmit, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"white", borderRadius:20, padding:28, width:460, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"#03102B" }}>{title}</div>
            {sub && <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
        </div>
        {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} color="#DC2626" style={{flexShrink:0}}/>{err}</div>}
        {done ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <CheckCircle size={44} color="#16A34A" style={{ marginBottom:12 }}/>
            <h3 style={{ color:"#16A34A", marginBottom:4 }}>Saved to Supabase!</h3>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {children}
            <button type="submit" disabled={saving}
              style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontSize:14, marginTop:4 }}>
              {saving?"Saving...":"Save · Hifadhi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RegionsPage() {
  const { regions, districts, wards, stations, refresh, addRegion } = useAppData();

  // Expand state: region index → expanded district id
  const [openRegion,   setOpenRegion]   = useState(null);
  const [openDistrict, setOpenDistrict] = useState(null);

  // Modal states
  const [modalRegion,   setModalRegion]   = useState(false);
  const [modalDistrict, setModalDistrict] = useState(null); // region obj
  const [modalWard,     setModalWard]     = useState(null); // district obj

  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [err,    setErr]    = useState("");

  const [formR, setFormR] = useState({ name:"", code:"", zone:"" });
  const [formD, setFormD] = useState({ name:"", code:"" });
  const [formW, setFormW] = useState({ name:"", code:"" });

  const addedRegionNames = new Set(regions.map(r=>r.name));
  const regionZone = formR.name ? Object.entries(TZ_ZONES).find(([,rs])=>rs.includes(formR.name))?.[0]||"" : "";

  function districtsOf(regionId)  { return districts.filter(d=>d.region_id===regionId); }
  function wardsOf(districtId)    { return wards.filter(w=>w.district_id===districtId); }
  function stationsOf(obj, field) { return stations.filter(s=>s[field]===obj.id); }

  function closeAll() { setDone(false); setErr(""); setSaving(false); }
  function closeRegion()   { setModalRegion(false);   setFormR({name:"",code:"",zone:""});  closeAll(); }
  function closeDistrict() { setModalDistrict(null);  setFormD({name:"",code:""});          closeAll(); }
  function closeWard()     { setModalWard(null);      setFormW({name:"",code:""});           closeAll(); }

  async function saveRegion(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try { await addRegion({...formR, zone:formR.zone||regionZone}); setDone(true); setTimeout(closeRegion, 2200); }
    catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function saveDistrict(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const r = modalDistrict;
      // quick-pick merges into formD.name already
      const { error } = await supabase.from("districts").insert({ name:formD.name, code:formD.code||null, region_id:r.id });
      if (error) throw error;
      await refresh(); setDone(true); setTimeout(closeDistrict, 2000);
    } catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function saveWard(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const d = modalWard;
      const { error } = await supabase.from("wards").insert({ name:formW.name, code:formW.code||null, district_id:d.id, region_id:d.region_id });
      if (error) throw error;
      await refresh(); setDone(true); setTimeout(closeWard, 2000);
    } catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  const totalD = districts.length;
  const totalW = wards.length;
  const totalS = stations.length;

  return (
    <AdminLayout pageTitle="Regions & Districts" pageTitle2="Mikoa, Wilaya na Kata">

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>Location Hierarchy</h1>
          <p style={{ color:"#64748B", marginTop:3 }}>Region → District → Ward · {regions.length} regions · {totalD} districts · {totalW} wards</p>
        </div>
        <button onClick={()=>{setErr("");setFormR({name:"",code:"",zone:""});setModalRegion(true);}}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16}/> Add Region
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Regions",   v:regions.length,   c:"#0D3477" },
          { label:"Districts", v:totalD,            c:"#059669" },
          { label:"Wards",     v:totalW,            c:"#7C3AED" },
          { label:"Stations",  v:totalS,            c:"#D97706" },
          { label:"Remaining", v:31-regions.length, c:"#94A3B8" },
        ].map(s=>(
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"14px 16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tree */}
      {regions.length===0 ? (
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:16, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:"70px 20px", textAlign:"center", color:"#94A3B8" }}>
          <MapPin size={44} style={{ opacity:.2, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No regions yet · Tanzania has 31 regions</div>
          <button onClick={()=>setModalRegion(true)} style={{ marginTop:16, padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Add First Region</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {regions.map((region, ri) => {
            const rDistricts  = districtsOf(region.id);
            const rStations   = stationsOf(region, "region_id");
            const isROpen     = openRegion === ri;

            return (
              <div key={region.id} className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>

                {/* ── REGION ROW ── */}
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", cursor:"pointer", borderBottom: isROpen?"1px solid #F1F5F9":"none" }}
                  onClick={()=>{ setOpenRegion(isROpen?null:ri); setOpenDistrict(null); }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MapPin size={16} color="#0D3477"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#03102B" }}>{region.name} Region</div>
                    <div style={{ fontSize:11, color:"#64748B" }}>
                      {rDistricts.length} districts · {wardsOf(rDistricts[0]?.id||"").length>0?`${wards.filter(w=>rDistricts.some(d=>d.id===w.district_id)).length} wards · `:""}{rStations.length} stations
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                    {[
                      {v:rDistricts.length,l:"Districts",c:"#059669"},
                      {v:wards.filter(w=>rDistricts.some(d=>d.id===w.district_id)).length,l:"Wards",c:"#7C3AED"},
                      {v:rStations.length,l:"Stations",c:"#D97706"},
                    ].map(s=>(
                      <div key={s.l} style={{ textAlign:"center", minWidth:44 }}>
                        <div style={{ fontSize:16, fontWeight:800, color:s.c }}>{s.v}</div>
                        <div style={{ fontSize:10, color:"#94A3B8" }}>{s.l}</div>
                      </div>
                    ))}
                    <AddBtn label="+ District" onClick={()=>{setErr("");setFormD({name:"",code:""});setModalDistrict(region);}}/>
                    {isROpen ? <ChevronDown size={16} color="#94A3B8"/> : <ChevronRight size={16} color="#94A3B8"/>}
                  </div>
                </div>

                {/* ── DISTRICTS ── */}
                {isROpen && (
                  <div style={{ padding:"8px 18px 14px 52px" }}>
                    {rDistricts.length===0 ? (
                      <div style={{ padding:"12px 0", color:"#94A3B8", fontSize:13 }}>No districts yet · Click "+ District" to add</div>
                    ) : (
                      rDistricts.map(district => {
                        const dWards    = wardsOf(district.id);
                        const dStations = stationsOf(district, "district_id");
                        const isDOpen   = openDistrict === district.id;

                        return (
                          <div key={district.id} style={{ marginBottom:6, border:"1px solid #F1F5F9", borderRadius:10, overflow:"hidden", background:"#FAFBFC" }}>

                            {/* District row */}
                            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer" }}
                              onClick={()=>setOpenDistrict(isDOpen?null:district.id)}>
                              <div style={{ width:28, height:28, borderRadius:7, background:"#F0FDF4", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <Building2 size={13} color="#059669"/>
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{district.name}</div>
                                <div style={{ fontSize:11, color:"#94A3B8" }}>{dWards.length} wards · {dStations.length} stations</div>
                              </div>
                              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                                {[{v:dWards.length,l:"Wards",c:"#7C3AED"},{v:dStations.length,l:"Stations",c:"#D97706"}].map(s=>(
                                  <div key={s.l} style={{ textAlign:"center", minWidth:36 }}>
                                    <div style={{ fontSize:14, fontWeight:800, color:s.c }}>{s.v}</div>
                                    <div style={{ fontSize:9, color:"#94A3B8" }}>{s.l}</div>
                                  </div>
                                ))}
                                <AddBtn small label="+ Ward" onClick={()=>{setErr("");setFormW({name:"",code:""});setModalWard(district);}}/>
                                {isDOpen?<ChevronDown size={14} color="#94A3B8"/>:<ChevronRight size={14} color="#94A3B8"/>}
                              </div>
                            </div>

                            {/* ── WARDS ── */}
                            {isDOpen && (
                              <div style={{ padding:"6px 14px 12px 52px", borderTop:"1px solid #F1F5F9" }}>
                                {dWards.length===0 ? (
                                  <div style={{ padding:"10px 0", color:"#94A3B8", fontSize:12 }}>No wards yet · Click "+ Ward" to add</div>
                                ) : (
                                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:6, marginTop:8 }}>
                                    {dWards.map(ward=>{
                                      const wStations = stationsOf(ward,"ward_id");
                                      return (
                                        <div key={ward.id} style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:8, padding:"9px 12px", display:"flex", alignItems:"center", gap:8 }}>
                                          <div style={{ width:24, height:24, borderRadius:6, background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                            <Home size={12} color="#7C3AED"/>
                                          </div>
                                          <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ward.name}</div>
                                            <div style={{ fontSize:10, color:"#94A3B8" }}>{wStations.length} station{wStations.length!==1?"s":""}</div>
                                          </div>
                                          {wStations.length>0 && (
                                            <span style={{ background:"#EFF6FF", color:"#0D3477", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999 }}>{wStations.length}</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add Region */}
      {modalRegion && (
        <SaveModal title="Add Region · Ongeza Mkoa" sub="Districts auto-populated from Tanzania database"
          done={done} saving={saving} err={err} onClose={closeRegion} onSubmit={saveRegion}>
          <div style={{ marginBottom:14 }}>
            <label style={S.lbl}>Region Name *</label>
            <select value={formR.name} onChange={e=>setFormR(f=>({...f,name:e.target.value}))} required style={S.sel}
              onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
              <option value="">Select Tanzania region...</option>
              {Object.keys(TZ_REGIONS).sort().map(r=>(
                <option key={r} value={r} disabled={addedRegionNames.has(r)}>{r}{addedRegionNames.has(r)?" ✓":""}</option>
              ))}
            </select>
          </div>
          {formR.name && TZ_REGIONS[formR.name] && (
            <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#0D3477", marginBottom:6 }}>DISTRICTS TO BE SAVED ({TZ_REGIONS[formR.name].length})</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {TZ_REGIONS[formR.name].map(d=><span key={d} style={{ background:"#DBEAFE", color:"#1D4ED8", padding:"2px 8px", borderRadius:999, fontSize:11 }}>{d}</span>)}
              </div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
            <div style={{ marginBottom:14 }}>
              <label style={S.lbl}>Code *</label>
              <input value={formR.code} onChange={e=>setFormR(f=>({...f,code:e.target.value}))} placeholder="e.g. NJO" required style={S.inp}
                onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.lbl}>Zone {regionZone&&<span style={{color:"#059669"}}>→ {regionZone}</span>}</label>
              <select value={formR.zone||regionZone} onChange={e=>setFormR(f=>({...f,zone:e.target.value}))} style={S.sel}>
                <option value="">Auto-detect...</option>
                {Object.keys(TZ_ZONES).map(z=><option key={z}>{z}</option>)}
              </select>
            </div>
          </div>
        </SaveModal>
      )}

      {/* Add District */}
      {modalDistrict && (
        <SaveModal title="Add District · Ongeza Wilaya" sub={`Adding to: ${modalDistrict.name} Region`}
          done={done} saving={saving} err={err} onClose={closeDistrict} onSubmit={saveDistrict}>
          {TZ_REGIONS[modalDistrict.name] && (
            <div style={{ marginBottom:14 }}>
              <label style={S.lbl}>Quick Pick</label>
              <select onChange={e=>setFormD(f=>({...f,name:e.target.value}))} style={S.sel}>
                <option value="">Select known district...</option>
                {TZ_REGIONS[modalDistrict.name]
                  .filter(d=>!districtsOf(modalDistrict.id).some(x=>x.name===d))
                  .map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <label style={S.lbl}>District Name *</label>
            <input value={formD.name} onChange={e=>setFormD(f=>({...f,name:e.target.value}))} placeholder="e.g. Makete District" required style={S.inp}
              onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={S.lbl}>Code (optional)</label>
            <input value={formD.code} onChange={e=>setFormD(f=>({...f,code:e.target.value}))} placeholder="e.g. MKT" style={S.inp}
              onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
          </div>
        </SaveModal>
      )}

      {/* Add Ward */}
      {modalWard && (
        <SaveModal title="Add Ward · Ongeza Kata" sub={`Adding to: ${modalWard.name} District`}
          done={done} saving={saving} err={err} onClose={closeWard} onSubmit={saveWard}>
          <div style={{ marginBottom:14 }}>
            <label style={S.lbl}>Ward Name · Jina la Kata *</label>
            <input value={formW.name} onChange={e=>setFormW(f=>({...f,name:e.target.value}))} placeholder="e.g. Mjimwema Ward" required style={S.inp}
              onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={S.lbl}>Code (optional)</label>
            <input value={formW.code} onChange={e=>setFormW(f=>({...f,code:e.target.value}))} placeholder="e.g. MJM" style={S.inp}
              onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
          </div>
        </SaveModal>
      )}

    </AdminLayout>
  );
}
