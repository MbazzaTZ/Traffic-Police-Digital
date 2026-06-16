import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Search, CreditCard, Car, User, Shield, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const METHODS = [
  { key:"name",  icon:User,       label:"Full Name",     sw:"Jina Kamili",     ph:"e.g. John Doe Mwangi" },
  { key:"nida",  icon:CreditCard, label:"NIDA",          sw:"Nambari ya NIDA", ph:"19901231-12345-00001-1" },
  { key:"plate", icon:Car,        label:"Vehicle Plate", sw:"Nambari ya Gari", ph:"e.g. T 123 ABC" },
  { key:"license", icon:CreditCard, label:"Driver License", sw:"Leseni ya Udereva", ph:"e.g. TZ-DL-001234" },
];

export default function PersonSearchPage() {
  const nav = useNavigate();
  const [method,   setMethod]   = useState(0);
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);

  async function doSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResults(null);
    const q = query.trim();
    const m = METHODS[method].key;

    if (m === "license") {
      const { data } = await supabase.from("persons").select("*").ilike("driver_license",`%${q}%`);
      setResults({ kind:"person", query:q, persons:data||[], arrests:[], suspects:[], wanted:[] });
    } else if (m === "plate") {
      const [veh, cits] = await Promise.all([
        supabase.from("vehicles").select("*").ilike("plate_number",`%${q}%`),
        supabase.from("traffic_citations").select("*").ilike("vehicle_plate",`%${q}%`).order("created_at",{ascending:false}),
      ]);
      setResults({ kind:"plate", plate:q.toUpperCase(), vehicles:veh.data||[], citations:cits.data||[] });
    } else {
      // name or nida — search arrests, suspects, wanted
      const col = m === "nida" ? "nida" : "full_name";
      const arrCol = m === "nida" ? "suspect_nida" : "suspect_name";
      const [persons, arrests, suspects, wanted] = await Promise.all([
        supabase.from("persons").select("*").ilike(col==="nida"?"nida":"full_name",`%${q}%`),
        supabase.from("arrests").select("*").ilike(arrCol,`%${q}%`).order("created_at",{ascending:false}),
        supabase.from("suspects").select("*, cid_cases(case_number)").ilike(col,`%${q}%`),
        supabase.from("wanted_persons").select("*").ilike(col,`%${q}%`),
      ]);
      setResults({ kind:"person", query:q, persons:persons.data||[], arrests:arrests.data||[], suspects:suspects.data||[], wanted:wanted.data||[] });
    }
    setLoading(false);
  }

  const M = METHODS[method];
  const hasWanted = results?.wanted?.length > 0;
  const total = results ? (results.kind==="plate" ? results.vehicles.length+results.citations.length : results.persons.length+results.arrests.length+results.suspects.length+results.wanted.length) : 0;

  return (
    <DashboardLayout pageTitle="Person Search" pageTitle2="Tafuta Mtu">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Person & Vehicle Search <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Tafuta</span></h1>
        <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Search records by name, NIDA, or vehicle plate</p>
      </div>

      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:24, marginBottom:20 }}>
        {/* Method tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:18 }}>
          {METHODS.map((mt,i)=>{
            const Icon=mt.icon;
            return (
              <button key={mt.key} onClick={()=>{setMethod(i);setResults(null);setQuery("");}}
                style={{ flex:1, padding:"12px", borderRadius:10, border:`2px solid ${method===i?"#0D3477":"#E2E8F0"}`, background:method===i?"#EFF6FF":"white", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <Icon size={18} color={method===i?"#0D3477":"#94A3B8"}/>
                <span style={{ fontSize:13, fontWeight:700, color:method===i?"#0D3477":"#475569" }}>{mt.label}</span>
                <span style={{ fontSize:10, color:"#94A3B8" }}>{mt.sw}</span>
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
                onFocus={e=>e.parentElement.style.borderColor="#0D3477"} onBlur={e=>e.parentElement.style.borderColor="#E2E8F0"}/>
            </div>
            <button type="submit" disabled={loading} style={{ padding:"0 32px", height:52, background:loading?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Search size={17}/> {loading?"Searching...":"Search"}
            </button>
          </div>
        </form>
      </div>

      {results && (
        <>
          <div style={{ background:total>0?(hasWanted?"#FEF2F2":"#FFFBEB"):"#F0FDF4", border:`1px solid ${total>0?(hasWanted?"#FECACA":"#FDE68A"):"#BBF7D0"}`, borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
            {total>0 ? <AlertTriangle size={18} color={hasWanted?"#DC2626":"#D97706"}/> : <CheckCircle size={18} color="#16A34A"/>}
            <div style={{ fontSize:14, fontWeight:700, color:total>0?(hasWanted?"#B91C1C":"#92400E"):"#166534" }}>
              {hasWanted ? `⚠ WANTED PERSON MATCH — ${total} record(s)` : total>0 ? `${total} record(s) found` : "No records found — clean"}
            </div>
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
    </DashboardLayout>
  );
}
