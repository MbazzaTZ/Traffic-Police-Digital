import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import TrafficLayout from "../../layouts/TrafficLayout";
import CIDLayout from "../../layouts/CIDLayout";
import { Car, User, FileText, AlertTriangle, ArrowLeft, Shield, Calendar, Flag } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

function RoleLayout({ role, children, ...props }) {
  if (role === "traffic_officer") return <TrafficLayout {...props}>{children}</TrafficLayout>;
  if (role === "cid_officer" || role === "forensic_officer") return <CIDLayout {...props}>{children}</CIDLayout>;
  return <DashboardLayout {...props}>{children}</DashboardLayout>;
}

export default function VehicleProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile } = useCurrentUser();
  const [vehicle,   setVehicle]   = useState(null);
  const [owner,     setOwner]     = useState(null);
  const [citations, setCitations] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).single();
      setVehicle(v);
      if (v) {
        const [own, cit] = await Promise.all([
          v.owner_id ? supabase.from("persons").select("*").eq("id", v.owner_id).maybeSingle() : Promise.resolve({data:null}),
          supabase.from("traffic_citations").select("*").ilike("vehicle_plate", v.plate_number).order("created_at",{ascending:false}),
        ]);
        setOwner(own.data); setCitations(cit.data||[]);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <RoleLayout role={profile?.role} pageTitle="Vehicle Profile"><div style={{ padding:"80px", textAlign:"center", color:"#94A3B8" }}>Loading...</div></RoleLayout>;
  if (!vehicle) return (
    <RoleLayout role={profile?.role} pageTitle="Vehicle Profile">
      <div style={{ padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
        <Car size={44} style={{ opacity:.2, marginBottom:14 }}/>
        <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>Vehicle not found</div>
      </div>
    </RoleLayout>
  );

  const unpaidFines = citations.filter(c=>c.status==="unpaid").reduce((t,c)=>t+(c.fine_amount||0),0);

  return (
    <RoleLayout role={profile?.role} pageTitle="Vehicle Profile" pageTitle2="Wasifu wa Gari">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:10, flexWrap:"wrap" }}>
        <button onClick={()=>nav(-1)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#64748B", cursor:"pointer", fontSize:13, fontWeight:600 }}>
          <ArrowLeft size={15}/> Back
        </button>

        {/* Role-aware action buttons */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {/* Regular officer: can flag for citation (escalates to traffic) */}
          {(profile?.role === "regular_officer" || profile?.role === "inspector") && vehicle && (
            <button
              onClick={() => nav("/citation-requests", { state: { prefill: {
                vehicle_plate: vehicle.plate_number,
                vehicle_id:    vehicle.id,
              }}})}
              style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"#D97706", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
              <Flag size={14}/> Flag for Citation
            </button>
          )}
          {/* Traffic officer: can issue citation directly */}
          {profile?.role === "traffic_officer" && vehicle && (
            <button
              onClick={() => nav("/traffic/citations", { state: { prefill: {
                vehicle_plate: vehicle.plate_number,
                vehicle_id:    vehicle.id,
              }}})}
              style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
              <FileText size={14}/> Issue Citation
            </button>
          )}
        </div>
      </div>

      {vehicle.is_stolen && (
        <div style={{ background:"#FEF2F2", border:"2px solid #DC2626", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <AlertTriangle size={20} color="#DC2626"/>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#DC2626" }}>⚠ STOLEN VEHICLE · GARI LILILOIBWA</div>
            <div style={{ fontSize:13, color:"#B91C1C" }}>Reported stolen {vehicle.stolen_date?`on ${new Date(vehicle.stolen_date).toLocaleDateString("en-GB")}`:""} · Detain and report immediately</div>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:18 }}>
        {/* Vehicle card */}
        <div style={{ background:"white", borderRadius:18, border:"1px solid #E2E8F0", overflow:"hidden", alignSelf:"start" }}>
          <div style={{ background:`linear-gradient(135deg,#03102B,#082A63,${vehicle.is_stolen?"#DC2626":"#0891B2"})`, padding:"28px 20px", textAlign:"center" }}>
            <Car size={40} color="white" style={{ marginBottom:10 }}/>
            <div style={{ fontFamily:"monospace", fontSize:24, fontWeight:900, color:"white", background:"rgba(255,255,255,.15)", borderRadius:8, padding:"6px 14px", display:"inline-block", letterSpacing:2 }}>{vehicle.plate_number}</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,.8)", marginTop:8 }}>{vehicle.make} {vehicle.model}</div>
          </div>
          <div style={{ padding:"16px 20px" }}>
            {[
              ["Type", vehicle.vehicle_type],
              ["Color", vehicle.color||"—"],
              ["Year", vehicle.year||"—"],
              ["Engine No", vehicle.engine_number||"—"],
              ["Chassis No", vehicle.chassis_number||"—"],
              ["Registered", vehicle.registration_date?new Date(vehicle.registration_date).toLocaleDateString("en-GB"):"—"],
            ].map(([k,v],i)=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:i<5?"1px solid #F8FAFC":"none" }}>
                <span style={{ fontSize:11, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Insurance status */}
          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"18px 20px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#0D3477", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}><Shield size={16}/> Insurance · Bima</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, color:"#64748B" }}>{vehicle.insurance_company||"No insurer on record"}</div>
                <div style={{ fontSize:12, color:"#94A3B8" }}>Expires: {vehicle.insurance_expiry?new Date(vehicle.insurance_expiry).toLocaleDateString("en-GB"):"Unknown"}</div>
              </div>
              <span style={{ background:vehicle.insurance_valid?"#F0FDF4":"#FEF2F2", color:vehicle.insurance_valid?"#16A34A":"#DC2626", padding:"6px 16px", borderRadius:999, fontSize:13, fontWeight:800 }}>
                {vehicle.insurance_valid?"✓ VALID":"✗ INVALID/EXPIRED"}
              </span>
            </div>
          </div>

          {/* Owner */}
          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"18px 20px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#0D3477", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}><User size={16}/> Registered Owner · Mmiliki</div>
            {owner ? (
              <div onClick={()=>nav(`/person/${owner.id}`)} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", padding:"8px", borderRadius:10 }}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"#0D3477", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800 }}>{owner.full_name?.split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
                <div><div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{owner.full_name}</div><div style={{ fontSize:12, color:"#94A3B8" }}>{owner.nida||"—"} · {owner.phone||"—"}</div></div>
                <span style={{ marginLeft:"auto", fontSize:12, color:"#0D3477", fontWeight:600 }}>View Profile →</span>
              </div>
            ) : (
              <div style={{ fontSize:13, color:"#64748B" }}>{vehicle.owner_name||"Owner not linked"} {vehicle.owner_phone&&`· ${vehicle.owner_phone}`}</div>
            )}
          </div>

          {/* Violations */}
          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <div style={{ padding:"13px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#7C3AED", display:"flex", alignItems:"center", gap:8 }}><FileText size={16}/> Violations · Faini ({citations.length})</div>
              {unpaidFines>0 && <span style={{ background:"#FEF2F2", color:"#DC2626", padding:"3px 12px", borderRadius:999, fontSize:12, fontWeight:700 }}>TZS {unpaidFines.toLocaleString()} unpaid</span>}
            </div>
            {citations.length===0 ? (
              <div style={{ padding:"30px", textAlign:"center", color:"#94A3B8", fontSize:13 }}>No violations on record · Clean</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#F8FAFC" }}>{["Ref","Offense","Fine","Status","Date"].map(h=><th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {citations.map(c=>(
                    <tr key={c.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                      <td style={{ padding:"9px 14px", fontFamily:"monospace", fontWeight:700, color:"#D97706", fontSize:12 }}>{c.ref_number}</td>
                      <td style={{ padding:"9px 14px", fontSize:13 }}>{c.offense_type}</td>
                      <td style={{ padding:"9px 14px", fontWeight:700, fontSize:12 }}>{(c.fine_amount||0).toLocaleString()}</td>
                      <td style={{ padding:"9px 14px" }}><span style={{ background:c.status==="paid"?"#F0FDF4":"#FEF2F2", color:c.status==="paid"?"#16A34A":"#DC2626", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{c.status}</span></td>
                      <td style={{ padding:"9px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(c.created_at).toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
