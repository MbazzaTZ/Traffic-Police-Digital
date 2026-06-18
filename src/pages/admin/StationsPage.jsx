import { useState, useMemo } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Building2, Plus, Search, X, CheckCircle, Users, Edit, Trash2, ChevronDown, AlertTriangle, Filter, MapPin } from "lucide-react";
import { useAppData, STATION_TYPES } from "../../context/AppDataContext";

const PAGE_SIZE = 25;

const S = {
  inp: { width:"100%", height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel: { height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 28px 0 10px", fontSize:13, outline:"none", background:"white", appearance:"none", WebkitAppearance:"none", cursor:"pointer" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"var(--ink-700,#334155)", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 },
};

const TYPE_COLOR = {
  "Police Station":"#059669","Police Post":"#D97706","Police HQ":"#0D3477",
  "Division HQ":"#0891B2","Outpost":"#475569","Marine Post":"#0EA5E9",
  "Railway Post":"#7C3AED","Airport Post":"#DC2626",
  "police_station":"#059669","police_post":"#D97706",
};

function ChevSel({ value, onChange, children, style={} }) {
  return (
    <div style={{ position:"relative", ...style }}>
      <select value={value} onChange={onChange} style={{ ...S.sel, width:"100%", paddingRight:28 }}
        onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}>
        {children}
      </select>
      <ChevronDown size={13} color="#64748B" style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
    </div>
  );
}

export default function StationsPage() {
  const { regions, districts, wards, stations, addStation, refresh } = useAppData();

  // ── Filters ──
  const [search,      setSearch]      = useState("");
  const [fRegion,     setFRegion]     = useState("");
  const [fDistrict,   setFDistrict]   = useState("");
  const [fWard,       setFWard]       = useState("");
  const [fType,       setFType]       = useState("");
  const [fStatus,     setFStatus]     = useState("");
  const [page,        setPage]        = useState(1);

  // ── Modal ──
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState("");
  const [view,    setView]    = useState("table"); // "table" | "card"

  const [form, setForm] = useState({
    name:"", code:"", type:"Police Station",
    region:"", district:"", ward:"",
    phone:"", address:"", ocs_name:"",
  });

  const upd = k => e => {
    const v = e.target.value;
    if (k==="region")   return setForm(f=>({...f,region:v,district:"",ward:""}));
    if (k==="district") return setForm(f=>({...f,district:v,ward:""}));
    setForm(f=>({...f,[k]:v}));
  };

  // Cascading filter dropdowns
  const filterDistricts = fRegion
    ? districts.filter(d=>{ const r=regions.find(x=>x.name===fRegion); return r&&d.region_id===r.id; })
    : [];
  const filterWards = fDistrict
    ? wards.filter(w=>{ const d=districts.find(x=>x.name===fDistrict); return d&&w.district_id===d.id; })
    : [];

  // Form cascading
  const formDistricts = form.region ? districts.filter(d=>{ const r=regions.find(x=>x.name===form.region); return r&&d.region_id===r.id; }) : [];
  const formWards     = form.district ? wards.filter(w=>{ const d=districts.find(x=>x.name===form.district); return d&&w.district_id===d.id; }) : [];

  // ── Filtered + paginated list ──
  const filtered = useMemo(() => {
    let list = stations;
    if (search)    list = list.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase())||s.code?.toLowerCase().includes(search.toLowerCase()));
    if (fRegion)   { const r=regions.find(x=>x.name===fRegion);   if (r) list=list.filter(s=>s.region_id===r.id); }
    if (fDistrict) { const d=districts.find(x=>x.name===fDistrict); if (d) list=list.filter(s=>s.district_id===d.id); }
    if (fWard)     { const w=wards.find(x=>x.name===fWard);         if (w) list=list.filter(s=>s.ward_id===w.id); }
    if (fType)     list = list.filter(s=>s.type===fType||s.type?.replace(/_/g," ")===fType.toLowerCase().replace(/_/g," "));
    if (fStatus)   list = list.filter(s=>s.status===fStatus);
    return list;
  }, [stations, search, fRegion, fDistrict, fWard, fType, fStatus, regions, districts, wards]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function resetFilters() { setSearch(""); setFRegion(""); setFDistrict(""); setFWard(""); setFType(""); setFStatus(""); setPage(1); }
  const hasFilter = search||fRegion||fDistrict||fWard||fType||fStatus;

  function getName(table, id) {
    if (!id) return "—";
    if (table==="regions")   return regions.find(x=>x.id===id)?.name||"—";
    if (table==="districts") return districts.find(x=>x.id===id)?.name||"—";
    if (table==="wards")     return wards.find(x=>x.id===id)?.name||"—";
    return "—";
  }

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try { await addStation(form); setDone(true); setTimeout(()=>{setModal(false);setDone(false);setForm({name:"",code:"",type:"Police Station",region:"",district:"",ward:"",phone:"",address:"",ocs_name:""});},2200); }
    catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  const stats = [
    { label:"Total",          v:stations.length,                                                     c:"#0D3477" },
    { label:"Police Stations",v:stations.filter(s=>s.type==="police_station"||s.type==="Police Station").length, c:"#059669" },
    { label:"Police Posts",   v:stations.filter(s=>s.type==="police_post"||s.type==="Police Post").length,       c:"#D97706" },
    { label:"HQ",             v:stations.filter(s=>s.type?.includes("HQ")||s.type?.includes("hq")).length,       c:"#082A63" },
    { label:"Showing",        v:filtered.length,                                                     c:"#7C3AED" },
  ];

  return (
    <AdminLayout pageTitle="Stations" pageTitle2="Vituo vya Polisi">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>Police Stations · <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>Vituo</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{stations.length} stations total · {filtered.length} shown</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ display:"flex", border:"1px solid #E2E8F0", borderRadius:9, overflow:"hidden" }}>
            {["table","card"].map(v=>(
              <button key={v} onClick={()=>setView(v)}
                style={{ padding:"8px 14px", border:"none", background:view===v?"#0D3477":"white", color:view===v?"white":"#64748B", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                {v==="table"?"☰ Table":"⊞ Cards"}
              </button>
            ))}
          </div>
          <button onClick={()=>{setErr("");setModal(true);}}
            style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
            <Plus size={15}/> Add Station
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:18 }}>
        {stats.map(s=>(
          <div key={s.label} style={{ background:"white", borderRadius:12, padding:"13px 14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:"14px 16px", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
          <Filter size={14} color="#64748B"/>
          <span style={{ fontSize:13, fontWeight:700, color:"#475569" }}>Filter Stations</span>
          {hasFilter && <button onClick={resetFilters} style={{ marginLeft:"auto", fontSize:12, color:"#DC2626", fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>✕ Clear all</button>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr", gap:10 }}>
          {/* Search */}
          <div style={{ position:"relative" }}>
            <Search size={14} color="#94A3B8" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search name or code..."
              style={{ ...S.inp, paddingLeft:32 }}/>
          </div>

          {/* Region filter */}
          <ChevSel value={fRegion} onChange={e=>{setFRegion(e.target.value);setFDistrict("");setFWard("");setPage(1);}}>
            <option value="">All Regions</option>
            {regions.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
          </ChevSel>

          {/* District filter */}
          <ChevSel value={fDistrict} onChange={e=>{setFDistrict(e.target.value);setFWard("");setPage(1);}} style={{ opacity:fRegion?1:.5 }}>
            <option value="">{fRegion?"All Districts":"Select region"}</option>
            {filterDistricts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
          </ChevSel>

          {/* Ward filter */}
          <ChevSel value={fWard} onChange={e=>{setFWard(e.target.value);setPage(1);}} style={{ opacity:fDistrict?1:.5 }}>
            <option value="">{fDistrict?"All Wards":"Select district"}</option>
            {filterWards.map(w=><option key={w.id} value={w.name}>{w.name}</option>)}
          </ChevSel>

          {/* Type filter */}
          <ChevSel value={fType} onChange={e=>{setFType(e.target.value);setPage(1);}}>
            <option value="">All Types</option>
            {STATION_TYPES.map(t=><option key={t}>{t}</option>)}
          </ChevSel>

          {/* Status filter */}
          <ChevSel value={fStatus} onChange={e=>{setFStatus(e.target.value);setPage(1);}}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </ChevSel>
        </div>
      </div>

      {/* ── TABLE VIEW ── scalable to 1000+ ── */}
      {view==="table" && (
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
          {/* Sticky header */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:800 }}>
              <thead>
                <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0", position:"sticky", top:0 }}>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>#</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap", minWidth:200 }}>Station Name</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>Type</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>Region</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>District</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>Ward</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>Code</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>Status</th>
                  <th style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length===0 ? (
                  <tr><td colSpan={9} style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8" }}>
                    <Building2 size={32} style={{ opacity:.2, display:"block", margin:"0 auto 10px" }}/>
                    {stations.length===0?"No stations added yet":"No stations match your filters"}
                  </td></tr>
                ) : paged.map((s, i)=>{
                  const rowNum = (page-1)*PAGE_SIZE + i + 1;
                  const tColor = TYPE_COLOR[s.type] || "#475569";
                  return (
                    <tr key={s.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                      onMouseLeave={e=>e.currentTarget.style.background="white"}>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#94A3B8", fontWeight:600 }}>{rowNum}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:tColor, flexShrink:0 }}/>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{s.name}</div>
                            {s.address && <div style={{ fontSize:11, color:"#94A3B8" }}>{s.address}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ background:`${tColor}18`, color:tColor, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                          {s.type?.replace(/_/g," ")||"—"}
                        </span>
                      </td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", whiteSpace:"nowrap" }}>{getName("regions",s.region_id)}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", whiteSpace:"nowrap" }}>{getName("districts",s.district_id)}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", whiteSpace:"nowrap" }}>{getName("wards",s.ward_id)}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#64748B", fontFamily:"monospace" }}>{s.code||"—"}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ background:s.status==="active"?"#F0FDF4":"#F8FAFC", color:s.status==="active"?"#16A34A":"#94A3B8", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>
                          {s.status||"active"}
                        </span>
                      </td>
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ display:"flex", gap:5 }}>
                          <button style={{ width:28, height:28, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}><Edit size={13}/></button>
                          <button style={{ width:28, height:28, borderRadius:7, border:"1px solid #FEE2E2", background:"#FEF2F2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#DC2626" }}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding:"12px 16px", borderTop:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, color:"#64748B" }}>
                Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length} stations
              </div>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:page===1?"not-allowed":"pointer", fontSize:13, opacity:page===1?.5:1 }}>
                  ← Prev
                </button>
                {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                  let p = i+1;
                  if (totalPages>7) { if (i<3) p=i+1; else if (i===3) p="..."; else p=totalPages-(6-i); }
                  return p==="..." ? (
                    <span key={i} style={{ padding:"6px 10px", fontSize:13, color:"#94A3B8" }}>…</span>
                  ) : (
                    <button key={i} onClick={()=>setPage(p)}
                      style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${page===p?"#0D3477":"#E2E8F0"}`, background:page===p?"#0D3477":"white", color:page===p?"white":"#475569", cursor:"pointer", fontSize:13, fontWeight:page===p?700:400 }}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:page===totalPages?"not-allowed":"pointer", fontSize:13, opacity:page===totalPages?.5:1 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CARD VIEW ── */}
      {view==="card" && (
        <>
          {paged.length===0 ? (
            <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
              <Building2 size={40} style={{ opacity:.2, marginBottom:12 }}/>
              <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{stations.length===0?"No stations added yet":"No stations match your filters"}</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
              {paged.map(s=>{
                const tColor = TYPE_COLOR[s.type]||"#475569";
                return (
                  <div key={s.id} className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden", transition:".15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,.09)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                    <div style={{ height:4, background:tColor }}/>
                    <div style={{ padding:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:"#03102B", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                          <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>{s.code||"No code"}</div>
                        </div>
                        <span style={{ background:`${tColor}15`, color:tColor, padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:700, whiteSpace:"nowrap", marginLeft:8, height:"fit-content" }}>
                          {s.type?.replace(/_/g," ")||"Station"}
                        </span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                        {[
                          ["Region",   getName("regions",s.region_id)],
                          ["District", getName("districts",s.district_id)],
                          ["Ward",     getName("wards",s.ward_id)],
                          ["Phone",    s.phone||"—"],
                        ].map(([k,v])=>(
                          <div key={k}>
                            <div style={{ fontSize:9, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div>
                            <div style={{ fontSize:12, fontWeight:600, color:"#1E293B", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #F1F5F9" }}>
                        <span style={{ background:s.status==="active"?"#F0FDF4":"#F8FAFC", color:s.status==="active"?"#16A34A":"#94A3B8", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>
                          {s.status||"active"}
                        </span>
                        <div style={{ display:"flex", gap:5 }}>
                          <button style={{ width:28, height:28, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}><Edit size={13}/></button>
                          <button style={{ width:28, height:28, borderRadius:7, border:"1px solid #FEE2E2", background:"#FEF2F2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#DC2626" }}><Trash2 size={13}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Pagination for cards too */}
          {totalPages>1 && (
            <div style={{ marginTop:14, display:"flex", justifyContent:"center", gap:6 }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{ padding:"7px 16px", borderRadius:9, border:"1px solid #E2E8F0", background:"white", cursor:page===1?"not-allowed":"pointer", fontSize:13, opacity:page===1?.5:1 }}>← Prev</button>
              <span style={{ padding:"7px 14px", fontSize:13, color:"#64748B" }}>Page {page} of {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ padding:"7px 16px", borderRadius:9, border:"1px solid #E2E8F0", background:"white", cursor:page===totalPages?"not-allowed":"pointer", fontSize:13, opacity:page===totalPages?.5:1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── ADD STATION MODAL ── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#03102B" }}>Add Police Station · Ongeza Kituo</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Saves directly to Supabase</div>
              </div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>

            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} color="#DC2626" style={{flexShrink:0}}/>{err}</div>}

            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/>
                <h3 style={{ color:"#16A34A", marginBottom:4 }}>Station Added!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Kituo kimeongezwa kwenye Supabase</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  {/* Name - full width */}
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Station Name · Jina la Kituo *</label>
                    <input value={form.name} onChange={upd("name")} placeholder="e.g. Makambako Police Station" required style={S.inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>

                  {/* Type */}
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Type · Aina *</label>
                    <ChevSel value={form.type} onChange={upd("type")} style={{ width:"100%" }}>
                      {STATION_TYPES.map(t=><option key={t}>{t}</option>)}
                    </ChevSel>
                  </div>

                  {/* Code */}
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Station Code</label>
                    <input value={form.code} onChange={upd("code")} placeholder="e.g. TZP-NJO-001" style={S.inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>

                  {/* Region */}
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Region · Mkoa *</label>
                    <ChevSel value={form.region} onChange={upd("region")} style={{ width:"100%" }}>
                      <option value="">Select region...</option>
                      {regions.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
                    </ChevSel>
                  </div>

                  {/* District */}
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>District · Wilaya *</label>
                    <ChevSel value={form.district} onChange={upd("district")} style={{ width:"100%", opacity:form.region?1:.6 }}>
                      <option value="">{form.region?"Select district...":"Select region first"}</option>
                      {formDistricts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
                    </ChevSel>
                  </div>

                  {/* Ward */}
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Ward · Kata</label>
                    <ChevSel value={form.ward} onChange={upd("ward")} style={{ width:"100%", opacity:form.district?1:.6 }}>
                      <option value="">{form.district?"Select ward (optional)":"Select district first"}</option>
                      {formWards.map(w=><option key={w.id} value={w.name}>{w.name}</option>)}
                    </ChevSel>
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Phone · Simu</label>
                    <input value={form.phone} onChange={upd("phone")} placeholder="+255 26 278 0001" style={S.inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>

                  {/* Address - full width */}
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Address · Anwani</label>
                    <input value={form.address} onChange={upd("address")} placeholder="e.g. Town Centre, Main Road" style={S.inp}
                      onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                  </div>
                </div>

                <button type="submit" disabled={saving}
                  style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <Building2 size={16}/> {saving?"Saving to Supabase...":"Add Station · Ongeza Kituo"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
