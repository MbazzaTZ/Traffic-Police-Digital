import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { UserX, Package, Car, Plus, X, CheckCircle, AlertTriangle, Search } from "lucide-react";
import PhotoUpload from "../../components/PhotoUpload";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

const TABS = {
  missing: {
    label:"Missing Persons", sw:"Waliopotea", icon:UserX, table:"missing_persons", color:"#7C3AED",
    statuses:{ missing:"#DC2626", found:"#059669", deceased:"#64748B", closed:"#94A3B8" },
    fields:[
      { k:"full_name", l:"Full Name · Jina", req:true, span:true },
      { k:"nida", l:"NIDA" }, { k:"age", l:"Age", type:"number" },
      { k:"gender", l:"Gender", opts:["Male","Female"] },
      { k:"last_seen_location", l:"Last Seen Location", span:true },
      { k:"last_seen_date", l:"Last Seen Date", type:"date" },
      { k:"clothing", l:"Clothing Worn" },
      { k:"reporter_name", l:"Reporter Name" }, { k:"reporter_phone", l:"Reporter Phone" },
      { k:"relationship", l:"Relationship" },
      { k:"description", l:"Description · Maelezo", span:true, area:true },
    ],
    cols:["Ref #","Name","Age/Gender","Last Seen","Date","Status"],
    row:r=>[r.ref_number, r.full_name, `${r.age||"—"}/${r.gender||"—"}`, r.last_seen_location||"—", r.last_seen_date?new Date(r.last_seen_date).toLocaleDateString("en-GB"):"—"],
    searchFields:["full_name","nida","ref_number"],
  },
  property: {
    label:"Stolen Property", sw:"Mali Iliyoibwa", icon:Package, table:"stolen_property", color:"#D97706",
    statuses:{ stolen:"#DC2626", recovered:"#059669", returned:"#0891B2", closed:"#94A3B8" },
    fields:[
      { k:"item_name", l:"Item Name · Kitu", req:true, span:true },
      { k:"category", l:"Category", opts:["Electronics","Phone","Jewellery","Documents","Cash","Livestock","Other"] },
      { k:"estimated_value", l:"Value (TZS)", type:"number" },
      { k:"serial_number", l:"Serial Number" }, { k:"imei", l:"IMEI (phones)" },
      { k:"stolen_location", l:"Stolen Location", span:true },
      { k:"stolen_date", l:"Stolen Date", type:"date" },
      { k:"owner_name", l:"Owner Name" }, { k:"owner_phone", l:"Owner Phone" },
      { k:"owner_nida", l:"Owner NIDA" },
      { k:"description", l:"Description", span:true, area:true },
    ],
    cols:["Ref #","Item","Category","Serial/IMEI","Value TZS","Status"],
    row:r=>[r.ref_number, r.item_name, r.category, r.serial_number||r.imei||"—", (r.estimated_value||0).toLocaleString()],
    searchFields:["item_name","serial_number","imei","ref_number"],
  },
  vehicle: {
    label:"Stolen Vehicles", sw:"Magari Yaliyoibwa", icon:Car, table:"stolen_vehicles", color:"#DC2626",
    statuses:{ stolen:"#DC2626", recovered:"#059669", closed:"#94A3B8" },
    fields:[
      { k:"plate_number", l:"Plate Number · Namba", req:true },
      { k:"make", l:"Make" }, { k:"model", l:"Model" },
      { k:"color", l:"Color" }, { k:"year", l:"Year", type:"number" },
      { k:"stolen_location", l:"Stolen Location", span:true },
      { k:"stolen_date", l:"Stolen Date", type:"date" },
      { k:"owner_name", l:"Owner Name" }, { k:"owner_phone", l:"Owner Phone" },
      { k:"notes", l:"Notes", span:true, area:true },
    ],
    cols:["Ref #","Plate","Make/Model","Color","Stolen","Status"],
    row:r=>[r.ref_number, r.plate_number, `${r.make||""} ${r.model||""}`, r.color||"—", r.stolen_date?new Date(r.stolen_date).toLocaleDateString("en-GB"):"—"],
    searchFields:["plate_number","make","ref_number"],
  },
};

export default function RegistriesPage() {
  const { profile, stationId, regionId } = useCurrentUser();
  const [tab, setTab] = useState("missing");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({});

  const C = TABS[tab];
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from(C.table).select("*").order("created_at",{ascending:false}).limit(200);
    setRecords(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined){ load(); setSearch(""); } },[tab, profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const payload = { ...form, station_id:stationId||null, region_id:regionId||null, reported_by:profile?.id||null };
      // numeric coercion
      ["age","year","estimated_value"].forEach(n=>{ if(payload[n]) payload[n]=parseInt(payload[n]); });
      ["last_seen_date","stolen_date"].forEach(d=>{ if(!payload[d]) payload[d]=null; });
      const { data, error } = await supabase.from(C.table).insert(payload).select().single();
      if (error) throw error;
      logAction({ profile, action:`report_${tab}`, entityType:tab, entityId:data.id, entityRef:data.ref_number, description:`Reported ${C.label}: ${data.full_name||data.item_name||data.plate_number}` });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({}); },2200);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function updateStatus(r, status) {
    const updates = { status };
    if (status==="found") updates.found_date = new Date().toISOString();
    if (status==="recovered") updates.recovered_date = new Date().toISOString();
    await supabase.from(C.table).update(updates).eq("id", r.id);
    logAction({ profile, action:`update_${tab}`, entityType:tab, entityId:r.id, entityRef:r.ref_number, description:`Status -> ${status}` });
    await load();
  }

  const filtered = records.filter(r=>!search || C.searchFields.some(f=>String(r[f]||"").toLowerCase().includes(search.toLowerCase())));
  const activeCount = records.filter(r=>["missing","stolen"].includes(r.status)).length;

  return (
    <DashboardLayout pageTitle="Registries" pageTitle2="Daftari">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>National Registries <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Daftari za Kitaifa</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Missing persons, stolen property & vehicles · {activeCount} active {tab} cases</p>
        </div>
        <button onClick={()=>{setErr("");setForm({});setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:C.color, color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Report · Ripoti
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {Object.entries(TABS).map(([k,t])=>{
          const Icon=t.icon;
          return (
            <button key={k} onClick={()=>setTab(k)}
              style={{ padding:"10px 18px", borderRadius:10, border:`2px solid ${tab===k?t.color:"#E2E8F0"}`, background:tab===k?`${t.color}12`:"white", color:tab===k?t.color:"#475569", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Icon size={16}/> {t.label} <span style={{ fontSize:11, opacity:.7 }}>· {t.sw}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:420 }}>
        <Search size={14} color="#94A3B8"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${C.label.toLowerCase()}...`} style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      {/* Table */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <C.icon size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No {C.label.toLowerCase()} records</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {[...C.cols,"Action"].map(h=><th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(r=>{
                const sc=C.statuses[r.status]||"#94A3B8";
                const cells=C.row(r);
                return (
                  <tr key={r.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    {cells.map((c,i)=>(
                      <td key={i} style={{ padding:"11px 14px", fontSize:i===0?12:13, fontWeight:i===0?700:i===1?600:400, color:i===0?C.color:i===1?"#1E293B":"#475569", fontFamily:i===0?"monospace":"inherit" }}>{c}</td>
                    ))}
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span></td>
                    <td style={{ padding:"11px 14px" }}>
                      {["missing","stolen"].includes(r.status) && (
                        <select onChange={e=>e.target.value&&updateStatus(r,e.target.value)} defaultValue=""
                          style={{ height:32, border:"1px solid #E2E8F0", borderRadius:7, fontSize:12, padding:"0 8px", background:"white", cursor:"pointer" }}>
                          <option value="">Update...</option>
                          {tab==="missing" ? <><option value="found">Found</option><option value="deceased">Deceased</option><option value="closed">Close</option></>
                            : <><option value="recovered">Recovered</option><option value="closed">Close</option></>}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:C.color }}>Report {C.label}</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{C.sw}</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Report Filed!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  {C.fields.map(fld=>(
                    <div key={fld.k} style={{ marginBottom:14, gridColumn:fld.span?"1/-1":"auto" }}>
                      <label style={S.lbl}>{fld.l} {fld.req&&"*"}</label>
                      {fld.area ? <textarea value={form[fld.k]||""} onChange={upd(fld.k)} rows={3} style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                        : fld.opts ? <select value={form[fld.k]||fld.opts[0]} onChange={upd(fld.k)} style={S.sel}>{fld.opts.map(o=><option key={o}>{o}</option>)}</select>
                        : <input type={fld.type||"text"} value={form[fld.k]||""} onChange={upd(fld.k)} required={fld.req} style={S.inp}/>}
                    </div>
                  ))}
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <PhotoUpload
                      folder={tab === "missing" ? "missing_persons" : tab === "property" ? "stolen_property" : "stolen_vehicles"}
                      value={form.photo_urls || []}
                      onChange={(urls)=>setForm(f=>({...f, photo_urls:urls}))}
                      maxFiles={6}
                      label={tab === "missing" ? "Photos of Missing Person · Picha za Aliyepotea" : tab === "property" ? "Photos of Property · Picha za Mali" : "Photos of Vehicle · Picha za Gari"}
                      hint="Tap to add photos (essential for identification)"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":C.color, color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Filing...":`File Report · Wasilisha`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
