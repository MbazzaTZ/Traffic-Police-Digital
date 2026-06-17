import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Search, CreditCard, Car, User, Shield, FileText, AlertTriangle, CheckCircle, Phone, Globe, Fingerprint, ScanFace, Hash, UserPlus, X, Camera } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { logAction } from "../../../lib/audit";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { useAppData } from "../../../context/AppDataContext";
import PhotoUpload from "../../../components/PhotoUpload";

// 9 search methods per blueprint. Each `col` is the persons-table column we ILIKE-match.
// `biometric:true` methods route to a placeholder (AFIS / face-recognition integration not yet wired).
const METHODS = [
  { key:"name",        icon:User,         label:"Full Name",      sw:"Jina Kamili",      ph:"e.g. John Doe Mwangi",  col:"full_name" },
  { key:"nida",        icon:CreditCard,   label:"NIDA",           sw:"Nambari ya NIDA",  ph:"19901231-12345-00001-1", col:"nida" },
  { key:"plate",       icon:Car,          label:"Vehicle Plate",  sw:"Nambari ya Gari",  ph:"e.g. T 123 ABC" },
  { key:"license",     icon:CreditCard,   label:"Driver License", sw:"Leseni ya Udereva",ph:"e.g. TZ-DL-001234",     col:"driver_license" },
  { key:"tin",         icon:Hash,         label:"TIN",            sw:"Nambari ya TRA",   ph:"e.g. 123-456-789",      col:"tin" },
  { key:"passport",    icon:Globe,        label:"Passport",       sw:"Pasipoti",         ph:"e.g. AB123456",         col:"passport_no" },
  { key:"phone",       icon:Phone,        label:"Phone",          sw:"Simu",             ph:"e.g. 0712 345 678",     col:"phone" },
  { key:"fingerprint", icon:Fingerprint,  label:"Fingerprint",    sw:"Alama ya Kidole",  ph:"AFIS reference / hash", col:"fingerprint_hash", biometric:true },
  { key:"face",        icon:ScanFace,     label:"Face Match",     sw:"Picha ya Uso",     ph:"Face-recognition reference", col:"face_hash",     biometric:true },
];

export default function PersonSearchPage() {
  const nav = useNavigate();
  const { profile } = useCurrentUser();
  const { regions, districts } = useAppData();
  const [method,   setMethod]   = useState(0);
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);

  // Add Person flow
  const [addModal, setAddModal] = useState(false);
  const [addForm,  setAddForm]  = useState(initAddForm());
  const [adding,   setAdding]   = useState(false);
  const [addErr,   setAddErr]   = useState("");
  const [addDone,  setAddDone]  = useState(null);

  function initAddForm() {
    return {
      full_name:"", alias:"", nida:"", driver_license:"", passport_no:"",
      phone:"", dob:"", gender:"Male", nationality:"Tanzanian", tribe:"",
      address:"", region_id:"", district_id:"", occupation:"",
      notes:"", photo_urls:[],
    };
  }

  function openAddPerson() {
    setAddErr(""); setAddDone(null);
    // Pre-fill the relevant field with whatever the officer was searching for
    const M = METHODS[method];
    const f = initAddForm();
    if (M.col && query.trim()) f[M.col] = query.trim();
    setAddForm(f);
    setAddModal(true);
  }
  const updAdd = k => e => setAddForm(f => ({ ...f, [k]: e.target.value }));

  // Districts cascading from selected region
  const addDistricts = addForm.region_id ? districts.filter(d => d.region_id === addForm.region_id) : [];

  async function submitAddPerson(e) {
    e.preventDefault();
    setAdding(true); setAddErr("");
    try {
      if (!addForm.full_name.trim()) throw new Error("Full name is required");
      // Convert empty FK strings to null so Supabase accepts the UUID column
      const payload = { ...addForm, created_by: profile?.id || null };
      ["region_id","district_id","dob","nida","driver_license","passport_no","phone","address","tribe","occupation","alias","notes"].forEach(k => {
        if (payload[k] === "") payload[k] = null;
      });
      const { data, error } = await supabase.from("persons").insert(payload).select().single();
      if (error) throw error;

      logAction({
        profile, action:"add_person",
        entityType:"person", entityId: data.id,
        entityRef: data.nida || data.full_name,
        description: `Added person to database: ${data.full_name}`,
      });

      setAddDone(data);
    } catch (e) {
      setAddErr(e.message || "Could not add person");
    } finally {
      setAdding(false);
    }
  }

  function closeAddModal() {
    setAddModal(false);
    setAddForm(initAddForm());
    setAddDone(null);
  }

  async function doSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResults(null);
    const q = query.trim();
    const M = METHODS[method];

    // 1) Plate: search vehicles + citations (different shape of result)
    if (M.key === "plate") {
      const [veh, cits] = await Promise.all([
        supabase.from("vehicles").select("*").ilike("plate_number",`%${q}%`),
        supabase.from("citations").select("*").ilike("vehicle_plate",`%${q}%`).order("created_at",{ascending:false}),
      ]);
      setResults({ kind:"plate", plate:q.toUpperCase(), vehicles:veh.data||[], citations:cits.data||[] });
      logAction({ profile, action:"search_person", entityType:"search", description:`Searched ${M.label}: ${q}` });
      setLoading(false);
      return;
    }

    // 2) Biometric placeholders: tell the officer integration is pending, but still try
    //    a literal hash lookup so manually-set fingerprint/face hashes still work.
    if (M.biometric) {
      const { data } = await supabase.from("persons").select("*").ilike(M.col, `%${q}%`);
      setResults({
        kind:"person", query:q, biometric:true, method:M.key,
        persons:data||[], arrests:[], suspects:[], wanted:[],
      });
      logAction({ profile, action:"search_person", entityType:"search", description:`Searched ${M.label}: ${q}` });
      setLoading(false);
      return;
    }

    // 3) Name / NIDA — also cross-check arrests / suspects / wanted (officer scenario)
    if (M.key === "name" || M.key === "nida") {
      const arrCol = M.key === "nida" ? "suspect_nida" : "suspect_name";
      const [persons, arrests, suspects, wanted] = await Promise.all([
        supabase.from("persons").select("*").ilike(M.col, `%${q}%`),
        supabase.from("arrests").select("*").ilike(arrCol, `%${q}%`).order("created_at",{ascending:false}),
        supabase.from("suspects").select("*, cid_cases(case_number)").ilike(M.col, `%${q}%`),
        supabase.from("wanted_persons").select("*").ilike(M.col, `%${q}%`),
      ]);
      setResults({ kind:"person", query:q, persons:persons.data||[], arrests:arrests.data||[], suspects:suspects.data||[], wanted:wanted.data||[] });
      logAction({ profile, action:"search_person", entityType:"search", description:`Searched ${M.label}: ${q}` });
      setLoading(false);
      return;
    }

    // 4) All other persons-only searches: license / tin / passport / phone
    const { data } = await supabase.from("persons").select("*").ilike(M.col, `%${q}%`);
    setResults({ kind:"person", query:q, persons:data||[], arrests:[], suspects:[], wanted:[] });
    logAction({ profile, action:"search_person", entityType:"search", description:`Searched ${M.label}: ${q}` });
    setLoading(false);
  }

  const M = METHODS[method];
  const hasWanted = results?.wanted?.length > 0;
  const total = results ? (results.kind==="plate" ? results.vehicles.length+results.citations.length : results.persons.length+results.arrests.length+results.suspects.length+results.wanted.length) : 0;

  return (
    <DashboardLayout pageTitle="Person Search" pageTitle2="Tafuta Mtu">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Person & Vehicle Search <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Tafuta</span></h1>
        <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>9 search methods: Name · NIDA · Plate · Driver License · TIN · Passport · Phone · Fingerprint · Face</p>
      </div>

      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:24, marginBottom:20 }}>
        {/* Method tabs - 3-col grid handles 9 methods cleanly */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8, marginBottom:18 }}>
          {METHODS.map((mt,i)=>{
            const Icon=mt.icon;
            return (
              <button key={mt.key} type="button" onClick={()=>{setMethod(i);setResults(null);setQuery("");}}
                style={{ padding:"12px", borderRadius:10, border:`2px solid ${method===i?"#0D3477":"#E2E8F0"}`, background:method===i?"#EFF6FF":"white", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5, position:"relative" }}>
                <Icon size={18} color={method===i?"#0D3477":"#94A3B8"}/>
                <span style={{ fontSize:13, fontWeight:700, color:method===i?"#0D3477":"#475569" }}>{mt.label}</span>
                <span style={{ fontSize:10, color:"#94A3B8" }}>{mt.sw}</span>
                {mt.biometric && <span style={{ position:"absolute", top:6, right:8, background:"#FEF3C7", color:"#92400E", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:999 }}>BETA</span>}
              </button>
            );
          })}
        </div>

        <form onSubmit={doSearch}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:"#F8FAFC", borderRadius:10, padding:"0 16px", border:"2px solid #E2E8F0", height:52 }}>
              <M.icon size={20} color="#94A3B8"/>
              <input value={query} onChange={e=>setQuery(M.key==="plate"?e.target.value.toUpperCase():e.target.value)} placeholder={M.ph}
                style={{ border:"none", outline:"none", fontSize:16, fontWeight:600, width:"100%", background:"transparent", color:"#1E293B", fontFamily:M.key==="plate"?"monospace":"inherit" }}
                onFocus={e=>{ if(e.target.parentElement) e.target.parentElement.style.borderColor="#0D3477"; }}
                onBlur={e=>{ if(e.target.parentElement) e.target.parentElement.style.borderColor="#E2E8F0"; }}/>
            </div>
            <button type="submit" disabled={loading} style={{ padding:"0 32px", height:52, background:loading?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Search size={17}/> {loading?"Searching...":"Search"}
            </button>
          </div>
        </form>
      </div>

      {results && (
        <>
          {results.biometric && (
            <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
              <Fingerprint size={16} color="#92400E"/>
              <div style={{ fontSize:12, color:"#92400E", lineHeight:1.5 }}>
                <strong>Biometric search (BETA).</strong> Full AFIS / face-recognition integration is pending — this currently matches stored hashes in the persons registry. Results may be limited until biometric capture is rolled out.
              </div>
            </div>
          )}

          <div style={{ background:total>0?(hasWanted?"#FEF2F2":"#FFFBEB"):"#F0FDF4", border:`1px solid ${total>0?(hasWanted?"#FECACA":"#FDE68A"):"#BBF7D0"}`, borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {total>0 ? <AlertTriangle size={18} color={hasWanted?"#DC2626":"#D97706"}/> : <CheckCircle size={18} color="#16A34A"/>}
            <div style={{ fontSize:14, fontWeight:700, color:total>0?(hasWanted?"#B91C1C":"#92400E"):"#166534", flex:1, minWidth:200 }}>
              {hasWanted ? `⚠ WANTED PERSON MATCH — ${total} record(s)` : total>0 ? `${total} record(s) found` : "No records found — clean"}
            </div>
            {/* Add Person button: shown when zero results, and only for non-plate searches
                (plate searches are about vehicles, not persons). */}
            {total === 0 && results.kind !== "plate" && (
              <button onClick={openAddPerson}
                style={{ padding:"8px 14px", borderRadius:9, border:"1px solid #0D3477", background:"#0D3477", color:"white", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <UserPlus size={14}/> Add Person to Database
              </button>
            )}
          </div>

          {results.kind==="plate" ? (
            <>
              {results.vehicles && results.vehicles.length > 0 && (
                <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:14 }}>
                  <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", fontSize:14, fontWeight:700, color:"#0891B2" }}>Vehicle Records ({results.vehicles.length})</div>
                  {results.vehicles.map(v=>(
                    <div key={v.id} onClick={()=>nav(`/vehicle/${v.id}`)} style={{ padding:"12px 18px", borderBottom:"1px solid #F8FAFC", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{v.plate_number} {v.is_stolen&&<span style={{ color:"#DC2626", fontSize:11 }}>· STOLEN</span>}</div>
                        <div style={{ fontSize:12, color:"#94A3B8" }}>{v.make} {v.model} · {v.color} · Owner: {v.owner_name||"—"}</div>
                      </div>
                      <span style={{ fontSize:12, color:"#0D3477", fontWeight:600 }}>View Profile →</span>
                    </div>
                  ))}
                </div>
              )}
            <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", fontSize:14, fontWeight:700, color:"#0D3477" }}>
                Citations for {results.plate} ({results.citations.length})
              </div>
              {results.citations.length===0 ? (
                <div style={{ padding:"40px", textAlign:"center", color:"#94A3B8" }}>No citations found for this plate</div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#F8FAFC" }}>
                    {["Ref","Offense","Fine TZS","Status","Date"].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {results.citations.map(c=>(
                      <tr key={c.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                        <td style={{ padding:"10px 14px", fontFamily:"monospace", fontWeight:700, color:"#D97706", fontSize:12 }}>{c.ref_number}</td>
                        <td style={{ padding:"10px 14px", fontSize:13 }}>{c.offense_type}</td>
                        <td style={{ padding:"10px 14px", fontWeight:700 }}>{(c.fine_amount||0).toLocaleString()}</td>
                        <td style={{ padding:"10px 14px" }}><span style={{ background:c.status==="paid"?"#F0FDF4":"#FEF2F2", color:c.status==="paid"?"#16A34A":"#DC2626", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{c.status}</span></td>
                        <td style={{ padding:"10px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(c.created_at).toLocaleDateString("en-GB")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            </>
          ) : (
            <>
              {results.persons && results.persons.length > 0 && (
                <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:14 }}>
                  <div style={{ padding:"12px 18px", borderBottom:"1px solid #F1F5F9", fontSize:14, fontWeight:700, color:"#0D3477", display:"flex", alignItems:"center", gap:8 }}><User size={16}/> Person Records ({results.persons.length})</div>
                  {results.persons.map(p=>(
                    <div key={p.id} onClick={()=>nav(`/person/${p.id}`)} style={{ padding:"12px 18px", borderBottom:"1px solid #F8FAFC", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:38, height:38, borderRadius:"50%", background:p.is_wanted?"#DC2626":"#0D3477", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:13 }}>{p.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{p.full_name} {p.is_wanted&&<span style={{ color:"#DC2626", fontSize:11 }}>· WANTED</span>}</div>
                          <div style={{ fontSize:12, color:"#94A3B8" }}>{p.nida||"No NIDA"} · {p.phone||"—"}</div>
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:"#0D3477", fontWeight:600 }}>View Profile →</span>
                    </div>
                  ))}
                </div>
              )}

              {hasWanted && (
                <div style={{ background:"white", borderRadius:14, border:"2px solid #DC2626", overflow:"hidden", marginBottom:14 }}>
                  <div style={{ background:"#FEF2F2", padding:"12px 18px", fontSize:14, fontWeight:800, color:"#DC2626", display:"flex", alignItems:"center", gap:8 }}><Shield size={16}/> WANTED PERSONS</div>
                  {results.wanted.map(w=>(
                    <div key={w.id} style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{w.full_name} {w.alias&&<span style={{ color:"#94A3B8", fontWeight:400 }}>· "{w.alias}"</span>}</div>
                        <div style={{ fontSize:12, color:"#64748B" }}>{w.offenses||"—"} · NIDA: {w.nida||"Unknown"}</div>
                      </div>
                      <span style={{ background:w.danger_level==="armed"?"#7C3AED":"#DC2626", color:"white", padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"uppercase" }}>{w.danger_level}</span>
                    </div>
                  ))}
                </div>
              )}

              {[
                { title:"Arrest Records", icon:Shield, color:"#D97706", items:results.arrests, render:a=>({ name:a.suspect_name, sub:`${a.charge} · NIDA: ${a.suspect_nida||"—"}`, badge:a.ref_number, status:a.status }) },
                { title:"Suspect Records", icon:User, color:"#0891B2", items:results.suspects, render:s=>({ name:s.full_name, sub:`${s.cid_cases?.case_number?`Case ${s.cid_cases.case_number}`:"No case"}`, badge:s.gender, status:s.status }) },
              ].filter(s=>s.items.length>0).map(section=>{
                const Icon=section.icon;
                return (
                  <div key={section.title} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:14 }}>
                    <div style={{ padding:"12px 18px", borderBottom:"1px solid #F1F5F9", fontSize:14, fontWeight:700, color:section.color, display:"flex", alignItems:"center", gap:8 }}><Icon size={16}/> {section.title} ({section.items.length})</div>
                    {section.items.map((item,i)=>{
                      const r=section.render(item);
                      return (
                        <div key={i} style={{ padding:"12px 18px", borderBottom:i<section.items.length-1?"1px solid #F8FAFC":"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div><div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{r.name}</div><div style={{ fontSize:12, color:"#64748B" }}>{r.sub}</div></div>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            {r.badge && <span style={{ fontFamily:"monospace", fontSize:11, color:"#94A3B8" }}>{r.badge}</span>}
                            {r.status && <span style={{ background:"#F1F5F9", color:"#475569", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {!results && !loading && (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Search size={48} style={{ opacity:.15, marginBottom:14 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>Search by {M.label}</div>
          <div style={{ fontSize:13, marginTop:6 }}>Results from arrests, suspects, wanted persons & citations</div>
        </div>
      )}

      {/* ─── ADD PERSON MODAL ─── */}
      {addModal && (
        <div onClick={e=>e.target===e.currentTarget && !adding && closeAddModal()}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:14 }}>
          <div style={{ background:"white", borderRadius:18, padding:24, width:"100%", maxWidth:640, maxHeight:"92vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                <div style={{ width:42, height:42, borderRadius:11, background:"#0D3477", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <UserPlus size={20} color="white"/>
                </div>
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Add Person · Ongeza Mtu</div>
                  <div style={{ fontSize:12, color:"#64748B", marginTop:1 }}>This person will be searchable immediately</div>
                </div>
              </div>
              <button onClick={closeAddModal} aria-label="Close" style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
            </div>

            {addDone ? (
              // Success state - jump to person profile or close
              <div style={{ textAlign:"center", padding:"22px 0" }}>
                <CheckCircle size={50} color="#16A34A" style={{ marginBottom:12 }}/>
                <h3 style={{ margin:"0 0 6px", color:"#16A34A" }}>Person Added</h3>
                <p style={{ fontSize:13, color:"#64748B", marginBottom:18 }}>
                  <strong>{addDone.full_name}</strong> is now in the database.
                </p>
                <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                  <button onClick={() => { closeAddModal(); nav(`/person/${addDone.id}`); }}
                    style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"#0D3477", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    Open Profile
                  </button>
                  <button onClick={closeAddModal}
                    style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitAddPerson}>
                {addErr && (
                  <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7, alignItems:"center" }}>
                    <AlertTriangle size={14}/>{addErr}
                  </div>
                )}

                {/* Identity */}
                <SectionTitle>Identity · Utambulisho</SectionTitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <Field label="Full Name *" col2>
                    <input value={addForm.full_name} onChange={updAdd("full_name")} required style={S.inp} autoFocus/>
                  </Field>
                  <Field label="Alias / Nickname">
                    <input value={addForm.alias} onChange={updAdd("alias")} placeholder="if known" style={S.inp}/>
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" value={addForm.dob} onChange={updAdd("dob")} style={S.inp}/>
                  </Field>
                  <Field label="Gender">
                    <select value={addForm.gender} onChange={updAdd("gender")} style={S.sel}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </Field>
                  <Field label="Nationality">
                    <input value={addForm.nationality} onChange={updAdd("nationality")} style={S.inp}/>
                  </Field>
                </div>

                {/* ID numbers */}
                <SectionTitle>Documents · Vitambulisho</SectionTitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <Field label="NIDA">
                    <input value={addForm.nida} onChange={updAdd("nida")} placeholder="20-digit NIDA" style={{ ...S.inp, fontFamily:"monospace" }}/>
                  </Field>
                  <Field label="Driver License">
                    <input value={addForm.driver_license} onChange={updAdd("driver_license")} style={{ ...S.inp, fontFamily:"monospace" }}/>
                  </Field>
                  <Field label="Passport">
                    <input value={addForm.passport_no} onChange={updAdd("passport_no")} style={{ ...S.inp, fontFamily:"monospace" }}/>
                  </Field>
                  <Field label="Phone">
                    <input value={addForm.phone} onChange={updAdd("phone")} placeholder="+255..." style={S.inp}/>
                  </Field>
                </div>

                {/* Location */}
                <SectionTitle>Address · Anuani</SectionTitle>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <Field label="Region">
                    <select value={addForm.region_id} onChange={e => setAddForm(f=>({...f, region_id:e.target.value, district_id:""}))} style={S.sel}>
                      <option value="">— Not set —</option>
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="District">
                    <select value={addForm.district_id} onChange={updAdd("district_id")}
                      disabled={!addForm.region_id} style={{ ...S.sel, opacity:addForm.region_id?1:.5 }}>
                      <option value="">{addForm.region_id ? "— Not set —" : "Select region first"}</option>
                      {addDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Street Address" col2>
                    <input value={addForm.address} onChange={updAdd("address")} placeholder="Last known address" style={S.inp}/>
                  </Field>
                  <Field label="Tribe">
                    <input value={addForm.tribe} onChange={updAdd("tribe")} style={S.inp}/>
                  </Field>
                  <Field label="Occupation">
                    <input value={addForm.occupation} onChange={updAdd("occupation")} style={S.inp}/>
                  </Field>
                </div>

                {/* Photos */}
                <SectionTitle><Camera size={12} style={{display:"inline", marginRight:5}}/>Photos · Picha</SectionTitle>
                <div style={{ marginBottom:13 }}>
                  <PhotoUpload
                    folder="persons"
                    value={addForm.photo_urls}
                    onChange={(urls)=>setAddForm(f=>({...f, photo_urls:urls}))}
                    maxFiles={6}
                    label="Face, NIDA card, driver license, vehicle"
                    hint="Tap to capture (face + ID is best)"
                  />
                </div>

                {/* Notes */}
                <div style={{ marginBottom:16 }}>
                  <label style={S.lbl}>Notes · Maelezo</label>
                  <textarea value={addForm.notes} onChange={updAdd("notes")} rows={2} placeholder="Where and how the officer encountered this person..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                </div>

                <button type="submit" disabled={adding || !addForm.full_name.trim()}
                  style={{ width:"100%", height:48, background:(adding||!addForm.full_name.trim())?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:(adding||!addForm.full_name.trim())?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <UserPlus size={16}/> {adding ? "Adding..." : "Add to Database"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─ Helpers used only in the Add Person modal ─
const S = {
  inp: { width:"100%", height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel: { width:"100%", height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:0.4, marginBottom:5 },
};
function SectionTitle({ children }) {
  return <div style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.6, margin:"4px 0 10px", paddingBottom:6, borderBottom:"1px solid #F1F5F9" }}>{children}</div>;
}
function Field({ label, col2, children }) {
  return (
    <div style={{ marginBottom:13, gridColumn: col2 ? "1/-1" : "auto" }}>
      <label style={S.lbl}>{label}</label>
      {children}
    </div>
  );
}
