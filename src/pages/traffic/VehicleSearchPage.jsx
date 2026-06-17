import { useState } from "react";
import TrafficLayout from "../../layouts/TrafficLayout";
import DashboardLayout from "../../layouts/DashboardLayout";
import CIDLayout from "../../layouts/CIDLayout";
import { Search, Car, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

function RoleLayout({ role, children, ...props }) {
  if (role === "traffic_officer") return <TrafficLayout {...props}>{children}</TrafficLayout>;
  if (role === "cid_officer" || role === "forensic_officer") return <CIDLayout {...props}>{children}</CIDLayout>;
  return <DashboardLayout {...props}>{children}</DashboardLayout>;
}

export default function VehicleSearchPage() {
  const { profile } = useCurrentUser();
  const [plate,   setPlate]   = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  async function doSearch(e) {
    e.preventDefault(); if (!plate.trim()) return;
    setErr(""); setLoading(true); setResults(null);
    try {
      const [citations, accidents] = await Promise.all([
        supabase.from("traffic_citations").select("*").ilike("vehicle_plate", `%${plate.trim()}%`).order("created_at",{ascending:false}),
        supabase.from("traffic_accidents").select("*").ilike("location_text", `%${plate.trim()}%`).limit(5),
      ]);
      setResults({ citations: citations.data||[], accidents: accidents.data||[], plate: plate.trim().toUpperCase() });
    } catch(e){ setErr(e.message); } finally{ setLoading(false); }
  }

  const STATUS_C = { unpaid:"#DC2626", paid:"#059669", contested:"#D97706", cancelled:"#94A3B8" };

  return (
    <RoleLayout role={profile?.role} pageTitle="Vehicle Search" pageTitle2="Tafuta Gari">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Vehicle Search <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Tafuta Gari</span></h1>
        <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Search by plate number to view citation and accident history</p>
      </div>

      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:28, marginBottom:20 }}>
        <form onSubmit={doSearch}>
          <label style={{ display:"block", fontSize:13, fontWeight:700, color:"#475569", marginBottom:10 }}>Enter Vehicle Plate Number · Nambari ya Gari</label>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:"#F8FAFC", borderRadius:10, padding:"0 16px", border:"2px solid #E2E8F0", height:52 }}>
              <Car size={20} color="#94A3B8"/>
              <input value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} placeholder="T 123 ABC"
                style={{ border:"none", outline:"none", fontSize:18, fontWeight:800, width:"100%", background:"transparent", fontFamily:"monospace", letterSpacing:2, color:"#1E293B" }}
                onFocus={e=>e.parentElement.style.borderColor="#0D3477"} onBlur={e=>e.parentElement.style.borderColor="#E2E8F0"}/>
            </div>
            <button type="submit" disabled={loading} style={{ padding:"0 32px", height:52, background:loading?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Search size={17}/> {loading?"Searching...":"Search · Tafuta"}
            </button>
          </div>
        </form>
        {err && <div style={{ marginTop:14, background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
      </div>

      {results && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            {[
              {label:"Total Citations",     v:results.citations.length,                                     c:"#0D3477"},
              {label:"Unpaid Fines",        v:results.citations.filter(c=>c.status==="unpaid").length,      c:"#DC2626"},
              {label:"Total Fines (TZS)",   v:(results.citations.reduce((t,c)=>t+(c.fine_amount||0),0)).toLocaleString(), c:"#D97706"},
            ].map(k=>(
              <div key={k.label} style={{ background:"white", borderRadius:12, padding:"16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:900, color:k.c }}>{k.v}</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:14 }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#0D3477" }}>Citations for plate: <span style={{ fontFamily:"monospace", background:"#F8FAFC", padding:"2px 10px", borderRadius:6, border:"1px solid #E2E8F0" }}>{results.plate}</span></div>
              <span style={{ fontSize:12, color:"#94A3B8" }}>{results.citations.length} records</span>
            </div>
            {results.citations.length===0 ? (
              <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8" }}>
                <Car size={32} style={{ opacity:.2, marginBottom:10 }}/>
                <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No citations found for this plate</div>
                <div style={{ fontSize:12, marginTop:4 }}>Hakuna faini zilizorekodiwa</div>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                  {["Ref #","Offense","Fine (TZS)","Status","Location","Date"].map(h=>(
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {results.citations.map(c=>{
                    const sc = STATUS_C[c.status]||"#94A3B8";
                    return (
                      <tr key={c.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                        onMouseLeave={e=>e.currentTarget.style.background="white"}>
                        <td style={{ padding:"10px 14px", fontWeight:700, color:"#D97706", fontSize:12, fontFamily:"monospace" }}>{c.ref_number}</td>
                        <td style={{ padding:"10px 14px", fontSize:13 }}>{c.offense_type}</td>
                        <td style={{ padding:"10px 14px", fontWeight:700, fontSize:13 }}>{(c.fine_amount||0).toLocaleString()}</td>
                        <td style={{ padding:"10px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{c.status}</span></td>
                        <td style={{ padding:"10px 14px", fontSize:12, color:"#475569" }}>{c.location_text||"—"}</td>
                        <td style={{ padding:"10px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(c.created_at).toLocaleDateString("en-GB")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!results && !loading && (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Car size={48} style={{ opacity:.15, marginBottom:14 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>Enter a plate number to search</div>
          <div style={{ fontSize:13, marginTop:6 }}>Weka nambari ya gari kutafuta historia ya faini na ajali</div>
        </div>
      )}
    </RoleLayout>
  );
}
