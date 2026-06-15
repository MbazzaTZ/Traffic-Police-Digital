import { useState } from "react";
import CIDLayout from "../../layouts/CIDLayout";
import { Search, User, AlertTriangle, FileText, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function NidaSearchPage() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function doSearch(e) {
    e.preventDefault(); if (!query.trim()) return;
    setLoading(true); setResults(null);
    const q = query.trim();
    const [arrests, suspects, wanted, cases] = await Promise.all([
      supabase.from("arrests").select("*").or(`suspect_name.ilike.%${q}%,suspect_nida.ilike.%${q}%`).limit(20),
      supabase.from("suspects").select("*, cid_cases(case_number)").or(`full_name.ilike.%${q}%,nida.ilike.%${q}%,alias.ilike.%${q}%`).limit(20),
      supabase.from("wanted_persons").select("*").or(`full_name.ilike.%${q}%,nida.ilike.%${q}%,alias.ilike.%${q}%`).limit(20),
      supabase.from("cid_cases").select("*").ilike("title",`%${q}%`).limit(10),
    ]);
    setResults({
      query:q,
      arrests:arrests.data||[], suspects:suspects.data||[],
      wanted:wanted.data||[], cases:cases.data||[],
    });
    setLoading(false);
  }

  const totalHits = results ? results.arrests.length+results.suspects.length+results.wanted.length+results.cases.length : 0;

  return (
    <CIDLayout pageTitle="NIDA Search" pageTitle2="Tafuta kwa NIDA">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Criminal Record Search <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Tafuta Rekodi</span></h1>
        <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Search by name or NIDA across arrests, suspects, wanted persons & cases</p>
      </div>

      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:28, marginBottom:20 }}>
        <form onSubmit={doSearch}>
          <label style={{ display:"block", fontSize:13, fontWeight:700, color:"#475569", marginBottom:10 }}>Name or NIDA Number · Jina au Nambari ya NIDA</label>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:"#F8FAFC", borderRadius:10, padding:"0 16px", border:"2px solid #E2E8F0", height:52 }}>
              <User size={20} color="#94A3B8"/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter name or NIDA number..."
                style={{ border:"none", outline:"none", fontSize:16, fontWeight:600, width:"100%", background:"transparent", color:"#1E293B" }}
                onFocus={e=>e.parentElement.style.borderColor="#0D3477"} onBlur={e=>e.parentElement.style.borderColor="#E2E8F0"}/>
            </div>
            <button type="submit" disabled={loading} style={{ padding:"0 32px", height:52, background:loading?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Search size={17}/> {loading?"Searching...":"Search · Tafuta"}
            </button>
          </div>
        </form>
      </div>

      {results && (
        <>
          <div style={{ background:totalHits>0?"#FFFBEB":"#F0FDF4", border:`1px solid ${totalHits>0?"#FDE68A":"#BBF7D0"}`, borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
            {totalHits>0 ? <AlertTriangle size={18} color="#D97706"/> : <Shield size={18} color="#16A34A"/>}
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:totalHits>0?"#92400E":"#166534" }}>
                {totalHits>0 ? `${totalHits} record(s) found for "${results.query}"` : `No criminal records found for "${results.query}"`}
              </div>
              <div style={{ fontSize:12, color:totalHits>0?"#B45309":"#15803D" }}>
                {results.arrests.length} arrests · {results.suspects.length} suspects · {results.wanted.length} wanted · {results.cases.length} cases
              </div>
            </div>
          </div>

          {/* Wanted - most critical first */}
          {results.wanted.length>0 && (
            <div style={{ background:"white", borderRadius:14, border:"2px solid #DC2626", overflow:"hidden", marginBottom:14 }}>
              <div style={{ background:"#FEF2F2", padding:"12px 18px", fontSize:14, fontWeight:800, color:"#DC2626", display:"flex", alignItems:"center", gap:8 }}>
                <Shield size={16}/> ⚠ WANTED PERSON MATCH · MTUHUMIWA
              </div>
              {results.wanted.map(w=>(
                <div key={w.id} style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{w.full_name} {w.alias&&<span style={{ color:"#94A3B8", fontWeight:400 }}>· "{w.alias}"</span>}</div>
                    <div style={{ fontSize:12, color:"#64748B" }}>{w.offenses||"Offenses not specified"} · NIDA: {w.nida||"Unknown"}</div>
                  </div>
                  <span style={{ background:w.danger_level==="armed"?"#7C3AED":"#DC2626", color:"white", padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"uppercase" }}>{w.danger_level}</span>
                </div>
              ))}
            </div>
          )}

          {/* Result sections */}
          {[
            { title:"Arrest Records · Rekodi za Kukamatwa", icon:Shield, color:"#D97706", items:results.arrests, render:a=>({ name:a.suspect_name, sub:`${a.charge} · NIDA: ${a.suspect_nida||"—"}`, badge:a.ref_number, status:a.status }) },
            { title:"Suspect Records · Washukiwa", icon:User, color:"#0891B2", items:results.suspects, render:s=>({ name:s.full_name, sub:`${s.cid_cases?.case_number?`Case ${s.cid_cases.case_number}`:"No case"} · NIDA: ${s.nida||"—"}`, badge:s.gender, status:s.status }) },
            { title:"Related Cases · Kesi", icon:FileText, color:"#7C3AED", items:results.cases, render:c=>({ name:c.title, sub:`${c.type} · ${c.priority} priority`, badge:c.case_number, status:c.status }) },
          ].filter(s=>s.items.length>0).map(section=>{
            const Icon = section.icon;
            return (
              <div key={section.title} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:14 }}>
                <div style={{ padding:"12px 18px", borderBottom:"1px solid #F1F5F9", fontSize:14, fontWeight:700, color:section.color, display:"flex", alignItems:"center", gap:8 }}>
                  <Icon size={16}/> {section.title} ({section.items.length})
                </div>
                {section.items.map((item,i)=>{
                  const r = section.render(item);
                  return (
                    <div key={i} style={{ padding:"12px 18px", borderBottom:i<section.items.length-1?"1px solid #F8FAFC":"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{r.name}</div>
                        <div style={{ fontSize:12, color:"#64748B" }}>{r.sub}</div>
                      </div>
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

      {!results && !loading && (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Search size={48} style={{ opacity:.15, marginBottom:14 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>Search criminal records</div>
          <div style={{ fontSize:13, marginTop:6 }}>Tafuta kwa jina au NIDA · Searches across all CID databases</div>
        </div>
      )}
    </CIDLayout>
  );
}
