// VehicleSearchPage
// ==================
// Officer-facing vehicle intelligence dashboard. Enter a plate, get
// everything that matters for a traffic stop in under 2 seconds:
//
//   - MUST-READ ALERT BANNER (red): stolen vehicle, expired insurance,
//     outstanding warrant on owner, fatal accident history
//   - VEHICLE PROFILE: make/model/year/color/owner from vehicles table
//   - INSURANCE COVER: company + expiry + valid/expired badge
//   - ACCIDENT HISTORY: from accident_reports (matched by plate)
//   - CITATIONS: from citations table, sortable by status
//
// Every result row is tappable → opens a drawer with the full record.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TrafficLayout from "../../layouts/TrafficLayout";
import DashboardLayout from "../../layouts/DashboardLayout";
import CIDLayout from "../../layouts/CIDLayout";
import {
  Search, Car, AlertTriangle, Shield, ShieldCheck, ShieldAlert,
  Calendar, User, Phone, FileText, MapPin, CheckCircle, Clock, X,
  CreditCard, Banknote, ChevronRight, AlertOctagon,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

function RoleLayout({ role, children, ...props }) {
  if (role === "traffic_officer") return <TrafficLayout {...props}>{children}</TrafficLayout>;
  if (role === "cid_officer" || role === "forensic_officer") return <CIDLayout {...props}>{children}</CIDLayout>;
  return <DashboardLayout {...props}>{children}</DashboardLayout>;
}

const STATUS_C = { unpaid:"#DC2626", partial:"#D97706", paid:"#059669", contested:"#7C3AED", cancelled:"#94A3B8" };
const SEVERITY_C = { minor:"#64748B", moderate:"#D97706", serious:"#DC2626", fatal:"#7C2D12" };

export default function VehicleSearchPage() {
  const { profile } = useCurrentUser();
  const nav = useNavigate();
  const [plate,    setPlate]    = useState("");
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");
  const [drawer,   setDrawer]   = useState(null); // { kind, record }

  async function doSearch(e) {
    if (e) e.preventDefault();
    const q = plate.trim();
    if (!q) return;
    setErr(""); setLoading(true); setResults(null); setDrawer(null);

    try {
      // Run all four queries in parallel. Each handles its own column
      // aliases (the schema has both old + new column names).
      const [vehResp, citResp, accResp, stolResp] = await Promise.all([
        // Vehicle profile - try both plate columns
        supabase.from("vehicles")
          .select("*")
          .or(`plate.ilike.%${q}%,plate_number.ilike.%${q}%`)
          .limit(1)
          .maybeSingle(),
        // Citations issued against this plate
        supabase.from("citations")
          .select("*, profiles!citations_issued_by_fkey(full_name,badge)")
          .ilike("vehicle_plate", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(50),
        // Accident reports linked to this plate
        supabase.from("accident_reports")
          .select("*")
          .ilike("vehicle_plate", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(20),
        // Stolen-vehicles registry independent of vehicles.is_stolen flag
        supabase.from("stolen_vehicles")
          .select("*")
          .or(`plate.ilike.%${q}%,plate_number.ilike.%${q}%`)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
      ]);

      // Compute insurance status from whichever spelling exists
      const v = vehResp.data;
      const insurance = computeInsurance(v);

      // Audit the search
      logAction({
        profile,
        action: "search_vehicle",
        entityType: "vehicle",
        entityRef: q.toUpperCase(),
        description: `Vehicle search: ${q.toUpperCase()}`,
      });

      setResults({
        plate:     q.toUpperCase(),
        vehicle:   v || null,
        citations: citResp.data || [],
        accidents: accResp.data || [],
        stolen:    stolResp.data || null,
        insurance,
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Compute alert flags ─────────────────────────────────
  const alerts = results ? computeAlerts(results) : [];
  const unpaidTotal = results
    ? results.citations
        .filter(c => c.status === "unpaid")
        .reduce((sum, c) => sum + ((c.fine_amount || 0) - (c.amount_paid || 0)), 0)
    : 0;
  const fatalCount = results ? results.accidents.filter(a => a.severity === "fatal").length : 0;

  return (
    <RoleLayout role={profile?.role} pageTitle="Vehicle Search" pageTitle2="Tafuta Gari">
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>
          Vehicle Search <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Tafuta Gari</span>
        </h1>
        <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>
          Full intelligence: vehicle profile, insurance, accidents, citations
        </p>
      </div>

      {/* Search bar */}
      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:16, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:24, marginBottom:18 }}>
        <form onSubmit={doSearch}>
          <label style={{ display:"block", fontSize:13, fontWeight:700, color:"#475569", marginBottom:10 }}>
            Plate Number · Nambari ya Gari
          </label>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 240px", display:"flex", alignItems:"center", gap:10, background:"#F8FAFC", borderRadius:10, padding:"0 16px", border:"2px solid #E2E8F0", height:52 }}>
              <Car size={20} color="#94A3B8"/>
              <input value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} placeholder="T 123 ABC" autoFocus
                style={{ border:"none", outline:"none", fontSize:18, fontWeight:800, width:"100%", background:"transparent", fontFamily:"monospace", letterSpacing:2, color:"#1E293B" }}/>
            </div>
            <button type="submit" disabled={loading || !plate.trim()}
              style={{ padding:"0 28px", height:52, background:(loading||!plate.trim())?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:(loading||!plate.trim())?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Search size={17}/> {loading ? "Searching..." : "Search · Tafuta"}
            </button>
          </div>
        </form>
        {err && (
          <div style={{ marginTop:14, background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#B91C1C", display:"flex", gap:7 }}>
            <AlertTriangle size={14}/>{err}
          </div>
        )}
      </div>

      {/* Empty state (no search yet) */}
      {!results && !loading && (
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:16, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:"56px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Car size={48} style={{ opacity:.15, marginBottom:14 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>Enter a plate number to search</div>
          <div style={{ fontSize:13, marginTop:6 }}>Weka nambari ya gari kuona historia kamili</div>
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* ── MUST-READ ALERT BANNER (red) ── */}
          {alerts.length > 0 && (
            <div style={{ background:"linear-gradient(135deg,#7F1D1D,#991B1B)", color:"white", borderRadius:14, padding:"16px 20px", marginBottom:14, boxShadow:"0 4px 14px rgba(220,38,38,.25)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
                <AlertOctagon size={22}/>
                <span style={{ fontSize:15, fontWeight:800, letterSpacing:.4 }}>MUST READ · TAHADHARI</span>
              </div>
              <ul style={{ margin:0, paddingLeft:28, fontSize:13, lineHeight:1.7 }}>
                {alerts.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {/* ── KPI strip ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
            <KPI label="Citations" value={results.citations.length} color="#0D3477"/>
            <KPI label="Unpaid (TZS)" value={unpaidTotal.toLocaleString()} color="#DC2626" mono/>
            <KPI label="Accidents" value={results.accidents.length} color="#D97706"/>
            <KPI label="Fatalities" value={fatalCount} color="#7C2D12"/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            {/* ── VEHICLE PROFILE ── */}
            <SectionCard
              icon={<Car size={16}/>}
              title="Vehicle Profile"
              subtitle="Wasifu wa Gari"
              accent="#0D3477"
            >
              {!results.vehicle ? (
                <EmptyHint icon={<Car/>} message="Vehicle not registered in database" sw="Halijasajiliwa"/>
              ) : (
                <div style={{ padding:"4px 0" }}>
                  <Row label="Plate" value={results.vehicle.plate || results.vehicle.plate_number} mono bold/>
                  <Row label="Make / Model" value={[results.vehicle.make, results.vehicle.model].filter(Boolean).join(" ") || "—"}/>
                  <Row label="Year" value={results.vehicle.year || "—"}/>
                  <Row label="Color" value={results.vehicle.color || "—"}/>
                  <Row label="VIN / Chassis" value={results.vehicle.vin || results.vehicle.chassis_number || "—"} mono small/>
                  <Row label="Type" value={results.vehicle.vehicle_type || "—"}/>
                </div>
              )}
              {results.vehicle?.owner_name && (
                <div style={{ marginTop:8, padding:"10px 12px", background:"#F8FAFC", borderRadius:8, borderLeft:"3px solid #0D3477" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.4, marginBottom:4 }}>Registered Owner</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{results.vehicle.owner_name}</div>
                  {results.vehicle.owner_phone && (
                    <div style={{ fontSize:11, color:"#64748B", display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                      <Phone size={11}/> {results.vehicle.owner_phone}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ── INSURANCE COVER ── */}
            <SectionCard
              icon={results.insurance.status === "valid" ? <ShieldCheck size={16}/> : results.insurance.status === "expired" ? <ShieldAlert size={16}/> : <Shield size={16}/>}
              title="Insurance Cover"
              subtitle="Bima"
              accent={results.insurance.status === "valid" ? "#059669" : results.insurance.status === "expired" ? "#DC2626" : "#94A3B8"}
            >
              {!results.vehicle ? (
                <EmptyHint icon={<Shield/>} message="No vehicle on file — insurance cannot be verified" sw="Hakuna taarifa za bima"/>
              ) : results.insurance.status === "unknown" ? (
                <EmptyHint icon={<Shield/>} message="No insurance data recorded for this vehicle" sw="Hakuna taarifa za bima"/>
              ) : (
                <div style={{ padding:"4px 0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{
                      background: results.insurance.status === "valid" ? "#16A34A" : "#DC2626",
                      color:"white", padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:.4,
                    }}>
                      {results.insurance.status === "valid" ? "✓ Valid" : "✗ Expired"}
                    </span>
                    {results.insurance.daysRemaining !== null && (
                      <span style={{ fontSize:11, color:"#64748B" }}>
                        {results.insurance.daysRemaining > 0
                          ? `Expires in ${results.insurance.daysRemaining} days`
                          : `Expired ${Math.abs(results.insurance.daysRemaining)} days ago`}
                      </span>
                    )}
                  </div>
                  <Row label="Insurer" value={results.insurance.company || "—"}/>
                  <Row label="Expiry Date" value={results.insurance.expiry ? new Date(results.insurance.expiry).toLocaleDateString("en-GB") : "—"}/>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── ACCIDENT DETAILS ── */}
          <ResultsCard
            icon={<AlertTriangle size={16}/>}
            title="Accident Details"
            subtitle="Ajali"
            count={results.accidents.length}
            accent="#D97706"
          >
            {results.accidents.length === 0 ? (
              <EmptyRow message="No accidents recorded for this plate" sw="Hakuna ajali zilizorekodiwa"/>
            ) : (
              results.accidents.map(a => {
                const sev = SEVERITY_C[a.severity] || "#64748B";
                return (
                  <Clickable key={a.id} onClick={() => setDrawer({ kind:"accident", record:a })}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                          <span style={{ background:`${sev}18`, color:sev, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:800, textTransform:"uppercase" }}>
                            {a.severity || "—"}
                          </span>
                          {(a.fatalities || 0) > 0 && (
                            <span style={{ background:"#7C2D12", color:"white", padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:800 }}>
                              {a.fatalities} FATAL
                            </span>
                          )}
                          {a.ref_number && (
                            <span style={{ fontFamily:"monospace", fontSize:11, color:"#94A3B8" }}>{a.ref_number}</span>
                          )}
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#1E293B", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {a.location_text || a.description || "Accident report"}
                        </div>
                        <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>
                          <Calendar size={10} style={{display:"inline",marginRight:3}}/>
                          {a.occurred_at
                            ? new Date(a.occurred_at).toLocaleString("en-GB")
                            : new Date(a.created_at).toLocaleString("en-GB")}
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94A3B8" style={{flexShrink:0}}/>
                    </div>
                  </Clickable>
                );
              })
            )}
          </ResultsCard>

          {/* ── CITATIONS ── */}
          <ResultsCard
            icon={<FileText size={16}/>}
            title="Citations"
            subtitle="Faini"
            count={results.citations.length}
            accent="#7C3AED"
          >
            {results.citations.length === 0 ? (
              <EmptyRow message="No citations recorded for this plate" sw="Hakuna faini"/>
            ) : (
              results.citations.map(c => {
                const sc = STATUS_C[c.status] || "#94A3B8";
                const balance = (c.fine_amount || 0) - (c.amount_paid || 0);
                return (
                  <Clickable key={c.id} onClick={() => setDrawer({ kind:"citation", record:c })}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                          <span style={{ background:`${sc}18`, color:sc, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:800, textTransform:"uppercase" }}>
                            {c.status}
                          </span>
                          <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:"#7C3AED" }}>{c.ref_number}</span>
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#1E293B", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {c.offense_type || "Citation"}
                        </div>
                        <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>
                          <Banknote size={10} style={{display:"inline",marginRight:3}}/>
                          TZS {(c.fine_amount || 0).toLocaleString()}
                          {balance > 0 && c.status !== "cancelled" && (
                            <span style={{ color:"#DC2626", fontWeight:700, marginLeft:8 }}>
                              · TZS {balance.toLocaleString()} owed
                            </span>
                          )}
                          <span style={{ marginLeft:8 }}>· {new Date(c.created_at).toLocaleDateString("en-GB")}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94A3B8" style={{flexShrink:0}}/>
                    </div>
                  </Clickable>
                );
              })
            )}
          </ResultsCard>
        </>
      )}

      {/* ── DETAIL DRAWER ── */}
      {drawer && <DetailDrawer item={drawer} onClose={() => setDrawer(null)}/>}
    </RoleLayout>
  );
}

// ───── Helper components ─────────────────────────────────────

function KPI({ label, value, color, mono }) {
  return (
    <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(13,52,119,0.14)", borderTop:`3px solid ${color}` }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:900, color, fontFamily:mono?"monospace":"var(--font-mono,inherit)", marginTop:3 }}>{value}</div>
    </div>
  );
}

function SectionCard({ icon, title, subtitle, accent, children }) {
  return (
    <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid rgba(13,52,119,0.14)", padding:16, borderTop:`3px solid ${accent}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, color:accent }}>
        {icon}
        <div>
          <div style={{ fontSize:13, fontWeight:800 }}>{title}</div>
          <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function ResultsCard({ icon, title, subtitle, count, accent, children }) {
  return (
    <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid rgba(13,52,119,0.14)", overflow:"hidden", marginBottom:14 }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center", borderLeft:`4px solid ${accent}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, color:accent }}>
          {icon}
          <span style={{ fontSize:13, fontWeight:800 }}>{title}</span>
          <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>· {subtitle}</span>
        </div>
        <span style={{ fontSize:11, fontWeight:700, color:"#475569" }}>{count} record{count===1?"":"s"}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Clickable({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ width:"100%", textAlign:"left", padding:"12px 16px", background:"white", border:"none", borderBottom:"1px solid #F1F5F9", cursor:"pointer", transition:"background 120ms" }}
      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
      onMouseLeave={e => e.currentTarget.style.background = "white"}>
      {children}
    </button>
  );
}

function Row({ label, value, mono, bold, small }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #F1F5F9", gap:10 }}>
      <span style={{ fontSize:11, fontWeight:600, color:"#64748B", flexShrink:0 }}>{label}</span>
      <span style={{ fontSize: small ? 11 : 12, fontWeight: bold ? 800 : 500, color:"#1E293B", fontFamily: mono ? "monospace" : "inherit", textAlign:"right", wordBreak:"break-all" }}>
        {value}
      </span>
    </div>
  );
}

function EmptyHint({ icon, message, sw }) {
  return (
    <div style={{ padding:"18px 8px", textAlign:"center", color:"#94A3B8" }}>
      <div style={{ opacity:.3, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:12, fontWeight:600 }}>{message}</div>
      <div style={{ fontSize:11, marginTop:2 }}>{sw}</div>
    </div>
  );
}

function EmptyRow({ message, sw }) {
  return (
    <div style={{ padding:"24px 18px", textAlign:"center", color:"#94A3B8" }}>
      <CheckCircle size={20} style={{ opacity:.3, marginBottom:6 }}/>
      <div style={{ fontSize:12, fontWeight:600 }}>{message}</div>
      <div style={{ fontSize:11, marginTop:2 }}>{sw}</div>
    </div>
  );
}

// ── Detail drawer (slides in from right) ──
function DetailDrawer({ item, onClose }) {
  const { kind, record } = item;
  const titles = {
    citation: { en:"Citation Details",  sw:"Maelezo ya Faini",  accent:"#7C3AED" },
    accident: { en:"Accident Details",  sw:"Maelezo ya Ajali",  accent:"#D97706" },
  };
  const t = titles[kind];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:100, display:"flex", justifyContent:"flex-end" }}>
      <div style={{ background:"#F8FAFC", width:"100%", maxWidth:480, height:"100vh", overflowY:"auto", boxShadow:"-10px 0 32px rgba(0,0,0,.18)" }}>
        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg, ${t.accent}, ${t.accent}DD)`, color:"white", padding:"22px 22px 26px", position:"relative" }}>
          <button onClick={onClose} aria-label="Close"
            style={{ position:"absolute", top:14, right:14, width:32, height:32, borderRadius:8, border:"none", background:"rgba(255,255,255,.18)", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16}/>
          </button>
          <div style={{ fontSize:18, fontWeight:800 }}>{t.en}</div>
          <div style={{ fontSize:12, opacity:.85, marginTop:2 }}>{t.sw}</div>
          {record.ref_number && (
            <div style={{ marginTop:10, display:"inline-block", background:"rgba(255,255,255,.18)", padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:700, fontFamily:"monospace" }}>
              {record.ref_number}
            </div>
          )}
        </div>

        <div style={{ padding:18 }}>
          {kind === "citation" && <CitationDetail c={record}/>}
          {kind === "accident" && <AccidentDetail a={record}/>}
        </div>
      </div>
    </div>
  );
}

function CitationDetail({ c }) {
  const sc = STATUS_C[c.status] || "#94A3B8";
  const balance = (c.fine_amount || 0) - (c.amount_paid || 0);
  return (
    <>
      {/* Status banner */}
      <div style={{ background:`${sc}14`, border:`1px solid ${sc}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, fontWeight:700, color:sc, textTransform:"uppercase" }}>{c.status}</span>
        <span style={{ fontSize:14, fontWeight:800, color:sc, fontFamily:"monospace" }}>
          TZS {(c.fine_amount || 0).toLocaleString()}
        </span>
      </div>

      <DrawerSection title="Offense">
        <DrawerRow label="Type"     value={c.offense_type}/>
        <DrawerRow label="Code"     value={c.offense_code || c.offence_code} mono/>
        <DrawerRow label="Issued"   value={new Date(c.created_at).toLocaleString("en-GB")}/>
        <DrawerRow label="Location" value={c.location_text}/>
      </DrawerSection>

      <DrawerSection title="Driver">
        <DrawerRow label="Name"    value={c.driver_name}/>
        <DrawerRow label="License" value={c.driver_license} mono/>
        <DrawerRow label="NIDA"    value={c.driver_nida}    mono/>
        {c.driver_phone && <DrawerRow label="Phone" value={c.driver_phone}/>}
      </DrawerSection>

      <DrawerSection title="Payment">
        <DrawerRow label="Fine"        value={`TZS ${(c.fine_amount||0).toLocaleString()}`}/>
        <DrawerRow label="Paid"        value={`TZS ${(c.amount_paid||0).toLocaleString()}`}/>
        <DrawerRow label="Outstanding" value={`TZS ${balance.toLocaleString()}`} highlight={balance > 0 ? "#DC2626" : "#059669"}/>
        <DrawerRow label="Due"         value={c.due_date ? new Date(c.due_date).toLocaleDateString("en-GB") : "—"}/>
      </DrawerSection>

      {c.profiles && (
        <DrawerSection title="Issued By">
          <DrawerRow label="Officer" value={c.profiles.full_name}/>
          <DrawerRow label="Badge"   value={c.profiles.badge} mono/>
        </DrawerSection>
      )}
    </>
  );
}

function AccidentDetail({ a }) {
  const sev = SEVERITY_C[a.severity] || "#64748B";
  return (
    <>
      <div style={{ background:`${sev}14`, border:`1px solid ${sev}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, fontWeight:700, color:sev, textTransform:"uppercase" }}>{a.severity || "—"}</span>
        {(a.fatalities || 0) > 0 && (
          <span style={{ fontSize:13, fontWeight:800, color:"#7C2D12" }}>
            {a.fatalities} fatality{a.fatalities === 1 ? "" : "ies"}
          </span>
        )}
      </div>

      <DrawerSection title="Incident">
        <DrawerRow label="Occurred"   value={a.occurred_at ? new Date(a.occurred_at).toLocaleString("en-GB") : new Date(a.created_at).toLocaleString("en-GB")}/>
        <DrawerRow label="Location"   value={a.location_text}/>
        <DrawerRow label="Plate"      value={a.vehicle_plate} mono bold/>
        <DrawerRow label="Severity"   value={a.severity}/>
        <DrawerRow label="Fatalities" value={a.fatalities || 0}/>
        <DrawerRow label="Injuries"   value={a.injuries || 0}/>
      </DrawerSection>

      {a.description && (
        <DrawerSection title="Description">
          <div style={{ fontSize:13, color:"#1E293B", lineHeight:1.5, whiteSpace:"pre-wrap" }}>{a.description}</div>
        </DrawerSection>
      )}

      {a.photo_urls && a.photo_urls.length > 0 && (
        <DrawerSection title={`Photos (${a.photo_urls.length})`}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {a.photo_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                style={{ width:80, height:80, borderRadius:8, overflow:"hidden", border:"1px solid #E2E8F0", display:"block" }}>
                <img src={url} alt={`evidence-${i}`} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              </a>
            ))}
          </div>
        </DrawerSection>
      )}
    </>
  );
}

function DrawerSection({ title, children }) {
  return (
    <div style={{ background:"white", borderRadius:11, border:"1px solid #E2E8F0", padding:"12px 14px", marginBottom:11 }}>
      <div style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.6, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}

function DrawerRow({ label, value, mono, bold, highlight }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #F1F5F9", gap:10 }}>
      <span style={{ fontSize:11, fontWeight:600, color:"#94A3B8" }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:bold?800:600, color:highlight || "#1E293B", fontFamily:mono?"monospace":"inherit", textAlign:"right", wordBreak:"break-word" }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ───── Helpers: alert + insurance computation ─────────────

function computeInsurance(v) {
  // Handle both naming conventions:
  //   00001: insurance_co + insurance_exp
  //   00006: insurance_company + insurance_expiry + insurance_valid
  if (!v) return { status:"unknown", company:null, expiry:null, daysRemaining:null };
  const company = v.insurance_company || v.insurance_co || null;
  const expiry  = v.insurance_expiry  || v.insurance_exp || null;
  if (!company && !expiry) return { status:"unknown", company, expiry, daysRemaining:null };
  if (!expiry) return { status:"unknown", company, expiry, daysRemaining:null };
  const now = new Date();
  const exp = new Date(expiry);
  const daysRemaining = Math.floor((exp - now) / (1000 * 60 * 60 * 24));
  return {
    status: daysRemaining > 0 ? "valid" : "expired",
    company,
    expiry,
    daysRemaining,
  };
}

function computeAlerts(results) {
  const alerts = [];
  const v = results.vehicle;

  // Stolen
  if (results.stolen) alerts.push("🚨 STOLEN — this plate is on the active stolen-vehicles registry");
  else if (v?.is_stolen || v?.stolen) alerts.push("🚨 Vehicle marked STOLEN in vehicles registry");

  // Insurance
  if (v && results.insurance.status === "expired") {
    const days = Math.abs(results.insurance.daysRemaining);
    alerts.push(`⚠ Insurance EXPIRED ${days} day${days === 1 ? "" : "s"} ago${results.insurance.company ? ` (${results.insurance.company})` : ""}`);
  }

  // Outstanding fines
  const unpaid = results.citations.filter(c => c.status === "unpaid");
  const owed = unpaid.reduce((s, c) => s + ((c.fine_amount || 0) - (c.amount_paid || 0)), 0);
  if (owed > 0) {
    alerts.push(`💰 ${unpaid.length} unpaid citation${unpaid.length === 1 ? "" : "s"} — TZS ${owed.toLocaleString()} outstanding`);
  }

  // Fatal accident
  const fatal = results.accidents.filter(a => a.severity === "fatal").length;
  if (fatal > 0) alerts.push(`☠ ${fatal} FATAL accident${fatal === 1 ? "" : "s"} on record`);

  return alerts;
}
