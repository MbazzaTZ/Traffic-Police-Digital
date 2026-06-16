import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { User, Shield, Car, FileText, AlertTriangle, ArrowLeft, Phone, MapPin, Calendar, Briefcase } from "lucide-react";
import { supabase } from "../../lib/supabase";

const STATUS_C = { detained:"#DC2626", charged:"#D97706", released:"#059669", transferred:"#0891B2" };

export default function PersonProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [person,    setPerson]    = useState(null);
  const [arrests,   setArrests]   = useState([]);
  const [vehicles,  setVehicles]  = useState([]);
  const [citations, setCitations] = useState([]);
  const [wanted,    setWanted]    = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: p } = await supabase.from("persons").select("*, regions(name), districts(name)").eq("id", id).single();
      setPerson(p);
      if (p) {
        const [arr, veh, cit, wnt] = await Promise.all([
          supabase.from("arrests").select("*").or(`person_id.eq.${id},suspect_nida.eq.${p.nida||"___"}`).order("created_at",{ascending:false}),
          supabase.from("vehicles").select("*").eq("owner_id", id),
          supabase.from("traffic_citations").select("*").eq("person_id", id).order("created_at",{ascending:false}),
          supabase.from("wanted_persons").select("*").eq("nida", p.nida||"___").maybeSingle(),
        ]);
        setArrests(arr.data||[]); setVehicles(veh.data||[]); setCitations(cit.data||[]); setWanted(wnt.data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <DashboardLayout pageTitle="Person Profile"><div style={{ padding:"80px", textAlign:"center", color:"#94A3B8" }}>Loading...</div></DashboardLayout>;
  if (!person) return (
    <DashboardLayout pageTitle="Person Profile">
      <div style={{ padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
        <User size={44} style={{ opacity:.2, marginBottom:14 }}/>
        <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>Person not found</div>
        <button onClick={()=>nav("/person-search")} style={{ marginTop:16, padding:"9px 20px", borderRadius:9, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer" }}>Back to Search</button>
      </div>
    </DashboardLayout>
  );

  const initials = person.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase() || "?";
  const flagged = person.is_wanted || wanted || person.has_criminal_record;

  return (
    <DashboardLayout pageTitle="Person Profile" pageTitle2="Wasifu wa Mtu">
      <button onClick={()=>nav(-1)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#64748B", cursor:"pointer", fontSize:13, fontWeight:600, marginBottom:16 }}>
        <ArrowLeft size={15}/> Back
      </button>

      {(person.is_wanted || wanted) && (
        <div style={{ background:"#FEF2F2", border:"2px solid #DC2626", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <Shield size={20} color="#DC2626"/>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#DC2626" }}>⚠ WANTED PERSON · MTUHUMIWA</div>
            <div style={{ fontSize:13, color:"#B91C1C" }}>{wanted?.offenses||"This person has an active wanted notice"} {wanted?.danger_level==="armed"&&"· ARMED & DANGEROUS"}</div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:18 }}>
        {/* Bio card */}
        <div style={{ background:"white", borderRadius:18, border:"1px solid #E2E8F0", overflow:"hidden", alignSelf:"start" }}>
          <div style={{ background:`linear-gradient(135deg,#03102B,#082A63,${flagged?"#DC2626":"#0D3477"})`, padding:"28px 20px", textAlign:"center" }}>
            <div style={{ width:90, height:90, borderRadius:"50%", background:"white", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", border:"4px solid rgba(255,255,255,.3)" }}>
              {person.photo_url ? <img src={person.photo_url} alt="" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }}/> : <span style={{ fontSize:32, fontWeight:900, color:flagged?"#DC2626":"#0D3477" }}>{initials}</span>}
            </div>
            <div style={{ fontSize:19, fontWeight:800, color:"white" }}>{person.full_name}</div>
            {person.alias && <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginTop:2 }}>"{person.alias}"</div>}
            <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginTop:6, fontFamily:"monospace" }}>{person.nida||"No NIDA"}</div>
          </div>
          <div style={{ padding:"16px 20px" }}>
            {[
              [Calendar, "Date of Birth", person.dob ? new Date(person.dob).toLocaleDateString("en-GB") : "Unknown"],
              [User, "Gender", person.gender],
              [MapPin, "Nationality", person.nationality],
              [User, "Tribe · Kabila", person.tribe||"—"],
              [Phone, "Phone", person.phone||"—"],
              [FileText, "Driver License", person.driver_license||"—"],
              [Briefcase, "Occupation", person.occupation||"—"],
              [MapPin, "Region", person.regions?.name||"—"],
              [MapPin, "Address", person.address||"—"],
            ].map(([Icon,k,v],i,arr)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<arr.length-1?"1px solid #F8FAFC":"none" }}>
                <div style={{ width:30, height:30, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={14} color="#0D3477"/></div>
                <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div><div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Records */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Summary */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[
              {label:"Arrest Records", v:arrests.length,   c:"#D97706", icon:Shield},
              {label:"Vehicles",       v:vehicles.length,  c:"#0891B2", icon:Car},
              {label:"Citations",      v:citations.length, c:"#7C3AED", icon:FileText},
            ].map(k=>{
              const Icon=k.icon;
              return (
                <div key={k.label} style={{ background:"white", borderRadius:14, padding:"16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
                  <Icon size={18} color={k.c} style={{ marginBottom:6 }}/>
                  <div style={{ fontSize:26, fontWeight:900, color:k.c }}>{k.v}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
                </div>
              );
            })}
          </div>

          {/* Criminal history */}
          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ padding:"13px 18px", borderBottom:"1px solid #F1F5F9", fontSize:14, fontWeight:700, color:"#D97706", display:"flex", alignItems:"center", gap:8 }}><Shield size={16}/> Criminal History · Historia ya Uhalifu</div>
            {arrests.length===0 ? (
              <div style={{ padding:"30px", textAlign:"center", color:"#94A3B8", fontSize:13 }}>No arrest records · Hakuna rekodi za kukamatwa</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#F8FAFC" }}>{["Ref","Charge","Location","Status","Date"].map(h=><th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {arrests.map(a=>{
                    const sc=STATUS_C[a.status]||"#94A3B8";
                    return (
                      <tr key={a.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                        <td style={{ padding:"9px 14px", fontFamily:"monospace", fontWeight:700, color:"#D97706", fontSize:12 }}>{a.ref_number}</td>
                        <td style={{ padding:"9px 14px", fontSize:13 }}>{a.charge}</td>
                        <td style={{ padding:"9px 14px", fontSize:12, color:"#64748B" }}>{a.location_text||"—"}</td>
                        <td style={{ padding:"9px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{a.status}</span></td>
                        <td style={{ padding:"9px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(a.created_at).toLocaleDateString("en-GB")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Vehicles */}
          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ padding:"13px 18px", borderBottom:"1px solid #F1F5F9", fontSize:14, fontWeight:700, color:"#0891B2", display:"flex", alignItems:"center", gap:8 }}><Car size={16}/> Registered Vehicles · Magari</div>
            {vehicles.length===0 ? (
              <div style={{ padding:"30px", textAlign:"center", color:"#94A3B8", fontSize:13 }}>No vehicles registered to this person</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10, padding:14 }}>
                {vehicles.map(v=>(
                  <div key={v.id} onClick={()=>nav(`/vehicle/${v.id}`)} style={{ border:"1px solid #E2E8F0", borderRadius:10, padding:"12px 14px", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#0891B2"} onMouseLeave={e=>e.currentTarget.style.borderColor="#E2E8F0"}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:14, color:"#1E293B", background:"#F8FAFC", padding:"2px 8px", borderRadius:6 }}>{v.plate_number}</span>
                      {v.is_stolen && <span style={{ background:"#FEF2F2", color:"#DC2626", padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:700 }}>STOLEN</span>}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v.make} {v.model}</div>
                    <div style={{ fontSize:11, color:"#94A3B8" }}>{v.color} · {v.year||"—"} · {v.vehicle_type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
