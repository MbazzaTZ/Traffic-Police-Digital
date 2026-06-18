import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TrafficLayout from "../../layouts/TrafficLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, Download, FileText, Banknote, UserSearch, Loader, MapPin, Car } from "lucide-react";
import { exportCitation, exportReport } from "../../lib/pdfExport";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useAppData } from "../../context/AppDataContext";
import { logAction } from "../../lib/audit";
import ResponsiveTable from "../../components/mobile/ResponsiveTable";
import PhotoUpload from "../../components/PhotoUpload";

// Common vehicle makes in Tanzania (most-seen brands first).
// Officers can still type 'Other' for unusual makes.
const MAKES = [
  "Toyota","Nissan","Honda","Suzuki","Mitsubishi","Mazda","Subaru","Isuzu","Hino","Scania",
  "Mercedes-Benz","BMW","Volkswagen","Ford","Land Rover","Range Rover","Hyundai","Kia",
  "Daihatsu","TVS","Bajaj","Boxer","Sanlg","Other",
];

// Standard color palette (UN-ECE color names + Swahili)
const COLORS = [
  { v:"White",   sw:"Nyeupe" },
  { v:"Black",   sw:"Nyeusi" },
  { v:"Silver",  sw:"Fedha"  },
  { v:"Grey",    sw:"Kijivu" },
  { v:"Red",     sw:"Nyekundu"},
  { v:"Blue",    sw:"Bluu"   },
  { v:"Green",   sw:"Kijani" },
  { v:"Yellow",  sw:"Manjano"},
  { v:"Brown",   sw:"Kahawia"},
  { v:"Gold",    sw:"Dhahabu"},
  { v:"Beige",   sw:"Beige"  },
  { v:"Orange",  sw:"Chungwa"},
  { v:"Maroon",  sw:"Maroon" },
  { v:"Other",   sw:"Nyingine"},
];

const S = {
  inp: { width:"100%", height:44, border:"1.5px solid var(--border-strong,#CBD5E1)", borderRadius:10, padding:"0 14px", fontSize:14, outline:"none", boxSizing:"border-box", color:"var(--ink-900,#0F172A)", background:"rgba(255,255,255,0.85)", fontFamily:"inherit", transition:"border-color 180ms, box-shadow 180ms" },
  sel: { width:"100%", height:44, border:"1.5px solid var(--border-strong,#CBD5E1)", borderRadius:10, padding:"0 14px", fontSize:14, outline:"none", background:"white", boxSizing:"border-box", color:"var(--ink-900,#0F172A)", fontFamily:"inherit" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"var(--ink-700,#334155)", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 },
};

export default function CitationsPage() {
  const nav = useNavigate();
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const { regions, districts, wards } = useAppData();
  const [citations, setCitations] = useState([]);
  const [schedule,  setSchedule]  = useState([]); // live fine_schedule
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(null);
  const [err,       setErr]       = useState("");
  const [search,    setSearch]    = useState("");
  const [form, setForm] = useState({
    driver_name:"", driver_license:"", driver_nida:"", driver_phone:"",
    vehicle_plate:"", vehicle_type:"Car", vehicle_make:"", vehicle_color:"",
    offense_type:"", offense_code:"", fine_amount:0, fine_schedule_id:"",
    region_id:"", district_id:"", ward_id:"", location_text:"",
    photo_urls:[],
  });

  // Lookup state
  const [nidaLookup,   setNidaLookup]    = useState({ status:"idle", match:null });   // idle | searching | found | applied | none
  const [licenseLookup,setLicenseLookup] = useState({ status:"idle", match:null });
  const [plateLookup,  setPlateLookup]   = useState({ status:"idle", match:null });

  // Cascading geo dropdowns derived from form state
  const formDistricts = form.region_id ? districts.filter(d => d.region_id === form.region_id) : [];
  const formWards     = form.district_id ? wards.filter(w => w.district_id === form.district_id) : [];

  const upd = k => e => {
    const v = e.target.value;
    if (k==="fine_schedule_id") {
      const it = schedule.find(s=>s.id===v);
      return setForm(f=>({
        ...f,
        fine_schedule_id: v,
        offense_type: it?.offense_name || "",
        offense_code: it?.code         || "",   // for citations.offense_code + .offence_code
        fine_amount:  it?.fine_amount  || 0,
      }));
    }
    setForm(f=>({...f,[k]:v}));
  };

  // Reset child selectors when parent changes (region -> district -> ward)
  function pickRegion(rid) {
    setForm(f => ({ ...f, region_id: rid, district_id:"", ward_id:"" }));
  }
  function pickDistrict(did) {
    setForm(f => ({ ...f, district_id: did, ward_id:"" }));
  }

  // ── NIDA driver lookup ──
  // When the officer types 8+ characters of NIDA, search the persons table
  // for a match. If found, offer to auto-fill the form.
  useEffect(() => {
    if (!modal) return;
    const nida = form.driver_nida.trim();
    if (nida.length < 8) {
      setNidaLookup({ status:"idle", match:null });
      return;
    }
    setNidaLookup({ status:"searching", match:null });
    const t = setTimeout(async () => {
      const { data } = await supabase.from("persons")
        .select("id, full_name, nida, driver_license, phone")
        .ilike("nida", `%${nida}%`)
        .limit(1);
      if (data && data.length > 0) {
        setNidaLookup({ status:"found", match: data[0] });
      } else {
        setNidaLookup({ status:"none", match:null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.driver_nida, modal]);

  function applyNidaMatch() {
    if (!nidaLookup.match) return;
    setForm(f => ({
      ...f,
      driver_name:    nidaLookup.match.full_name    || f.driver_name,
      driver_license: nidaLookup.match.driver_license || f.driver_license,
      driver_phone:   nidaLookup.match.phone          || f.driver_phone,
    }));
    setNidaLookup({ status:"applied", match:nidaLookup.match });
  }

  // ── License driver lookup ──
  // When the officer types 4+ characters of a driver license, search persons
  // for a match. Mirrors the NIDA flow - useful when the officer only has
  // the license in hand (a common traffic-stop scenario).
  useEffect(() => {
    if (!modal) return;
    const lic = form.driver_license.trim();
    if (lic.length < 4) {
      setLicenseLookup({ status:"idle", match:null });
      return;
    }
    setLicenseLookup({ status:"searching", match:null });
    const t = setTimeout(async () => {
      const { data } = await supabase.from("persons")
        .select("id, full_name, nida, driver_license, phone")
        .ilike("driver_license", `%${lic}%`)
        .limit(1);
      if (data && data.length > 0) {
        setLicenseLookup({ status:"found", match: data[0] });
      } else {
        setLicenseLookup({ status:"none", match:null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.driver_license, modal]);

  function applyLicenseMatch() {
    if (!licenseLookup.match) return;
    setForm(f => ({
      ...f,
      driver_name:    licenseLookup.match.full_name    || f.driver_name,
      driver_nida:    licenseLookup.match.nida          || f.driver_nida,
      driver_phone:   licenseLookup.match.phone         || f.driver_phone,
    }));
    setLicenseLookup({ status:"applied", match:licenseLookup.match });
  }

  // ── Plate vehicle lookup ──
  // When the officer types 5+ characters of plate, search vehicles table.
  // If found, offer to auto-fill make/color/type + last-known driver if any.
  useEffect(() => {
    if (!modal) return;
    const plate = form.vehicle_plate.trim().toUpperCase();
    if (plate.length < 5) {
      setPlateLookup({ status:"idle", match:null });
      return;
    }
    setPlateLookup({ status:"searching", match:null });
    const t = setTimeout(async () => {
      const { data } = await supabase.from("vehicles")
        .select("id, plate_number, plate, make, model, color, vehicle_type, type, owner_name, owner_nida, owner_phone")
        .or(`plate_number.ilike.%${plate}%,plate.ilike.%${plate}%`)
        .limit(1);
      if (data && data.length > 0) {
        setPlateLookup({ status:"found", match: data[0] });
      } else {
        setPlateLookup({ status:"none", match:null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.vehicle_plate, modal]);

  function applyPlateMatch() {
    if (!plateLookup.match) return;
    const m = plateLookup.match;
    const makeCombined = [m.make, m.model].filter(Boolean).join(" ");
    setForm(f => ({
      ...f,
      vehicle_make:  makeCombined  || f.vehicle_make,
      vehicle_color: m.color       || f.vehicle_color,
      vehicle_type:  m.vehicle_type || m.type || f.vehicle_type,
      // If the form has no driver info yet, fall back to registered owner
      driver_name:   f.driver_name   || m.owner_name  || "",
      driver_nida:   f.driver_nida   || m.owner_nida  || "",
      driver_phone:  f.driver_phone  || m.owner_phone || "",
    }));
    setPlateLookup({ status:"applied", match:m });
  }

  async function load() {
    setLoading(true);
    let q = supabase.from("citations").select("*, profiles!citations_issued_by_fkey(full_name,badge)").order("created_at",{ascending:false}).limit(100);
    if (stationId) q = q.eq("station_id", stationId);
    const [cits, sched] = await Promise.all([
      q,
      supabase.from("fine_schedule").select("*").eq("active", true).order("code"),
    ]);
    if (cits.error) { console.error(cits.error); setErr("Could not load citations: " + cits.error.message); }
    setCitations(cits.data||[]);
    setSchedule(sched.data||[]);
    setLoading(false);
  }

  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      // Use form geo if officer picked it, otherwise fall back to officer's station context.
      const finalRegionId   = form.region_id   || regionId   || null;
      const finalDistrictId = form.district_id || districtId || null;

      // Convert empty FK strings → null so UUID columns don't reject them.
      const payload = { ...form };
      ["fine_schedule_id","region_id","district_id","ward_id"].forEach(k => {
        if (payload[k] === "") payload[k] = null;
      });

      // Build the base insert. The form may include columns the schema doesn't
      // have yet (driver_phone, ward_id added in migration 00011). If the server
      // rejects with "Could not find the 'X' column", we strip that column and
      // retry. This lets the form work BEFORE the migration is applied AND
      // AFTER, with no coordinated deploy.
      const baseInsert = {
        ...payload,
        fine_amount:   parseInt(form.fine_amount) || 0,
        fine_currency: "TZS",
        // Some installations have offense_code (American), others offence_code
        // (British, the original from 00001). Send BOTH - the retry loop will
        // strip whichever the schema cache doesn't know.
        offense_code:  form.offense_code || null,
        offence_code:  form.offense_code || null,
        station_id:    stationId || null,
        region_id:     finalRegionId,
        district_id:   finalDistrictId,
        officer_id:    profile?.id || null,  // RLS policy checks officer_id = auth.uid()
        issued_by:     profile?.id || null,  // downstream queries read this
        status:        "unpaid",
        due_date:      new Date(Date.now() + 30*86400000).toISOString(),
      };

      // Retry loop: each iteration strips one missing-column at a time.
      // Hard cap at 5 retries so a real (non-schema) error can't loop forever.
      let attempt = { ...baseInsert };
      let data, error;
      const droppedCols = [];
      for (let i = 0; i < 5; i++) {
        const r = await supabase.from("citations").insert(attempt).select().single();
        data = r.data; error = r.error;
        if (!error) break;
        // Match PostgREST schema-cache errors of the form:
        //   "Could not find the 'XYZ' column of 'citations' in the schema cache"
        const m = /the '([a-z_]+)' column of '([a-z_]+)' in the schema cache/i.exec(error.message);
        if (!m) break; // some other error - stop retrying
        const col = m[1];
        if (!(col in attempt)) break; // sanity check
        delete attempt[col];
        droppedCols.push(col);
      }
      if (droppedCols.length) {
        console.warn(
          `citations insert: stripped missing columns [${droppedCols.join(", ")}]. ` +
          `Run migration 00011_citations_driver_phone.sql to enable: driver_phone, ward_id.`
        );
      }
      if (error) throw error;
      logAction({ profile, action:"issue_citation", entityType:"citation", entityId:data.id, entityRef:data.ref_number, description:`Citation: ${data.vehicle_plate} - ${data.offense_type} - TZS ${data.fine_amount}` });
      setDone(data); await load();
      setTimeout(()=>{
        setModal(false); setDone(null);
        setNidaLookup({ status:"idle", match:null });
        setLicenseLookup({ status:"idle", match:null });
        setPlateLookup({ status:"idle", match:null });
        setForm({
          driver_name:"", driver_license:"", driver_nida:"", driver_phone:"",
          vehicle_plate:"", vehicle_type:"Car", vehicle_make:"", vehicle_color:"",
          offense_type:"", offense_code:"", fine_amount:0, fine_schedule_id:"",
          region_id:"", district_id:"", ward_id:"", location_text:"",
          photo_urls:[],
        });
      },2500);
    } catch(e){setErr(e.message);} finally{setSaving(false);}
  }

  const filtered = citations.filter(c=> !search || c.driver_name?.toLowerCase().includes(search.toLowerCase()) || c.vehicle_plate?.toLowerCase().includes(search.toLowerCase()) || c.ref_number?.includes(search));

  const STATUS_C = { unpaid:"#DC2626", partial:"#D97706", paid:"#059669", contested:"#7C3AED", cancelled:"#94A3B8" };

  return (
    <TrafficLayout pageTitle="Citations" pageTitle2="Faini za Trafiki">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", margin:0, fontFamily:"var(--font-serif,Georgia,serif)" }}>Traffic Citations <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Faini</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{citations.length} total · TZS {citations.reduce((a,c)=>a+(c.fine_paid?0:c.fine_amount||0),0).toLocaleString()} unpaid</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>exportReport("Traffic Citations Report",
            ["Ref","Driver","Plate","Offense","Fine TZS","Status","Date"],
            filtered.map(c=>[c.ref_number,c.driver_name,c.vehicle_plate,c.offense_type,(c.fine_amount||0).toLocaleString(),c.status,new Date(c.created_at).toLocaleDateString("en-GB")]),
            `${filtered.length} citations`)}
            disabled={filtered.length===0}
            style={{ padding:"9px 16px", borderRadius:10, border:"1px solid var(--navy-700,#0D3477)", background:"var(--glass-bg-light,rgba(255,255,255,0.72))", color:"var(--navy-700,#0D3477)", fontWeight:700, cursor:filtered.length===0?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, opacity:filtered.length===0?.5:1 }}>
            <FileText size={15}/> Export PDF
          </button>
          <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--gold-600,#B45309)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, boxShadow:"0 1px 2px rgba(180,83,9,0.25)" }}>
            <Plus size={15}/> Issue Citation · Toa Faini
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Unpaid", v:citations.filter(c=>c.status==="unpaid").length, c:"#DC2626" },
          { label:"Paid",   v:citations.filter(c=>c.status==="paid").length,   c:"#059669" },
          { label:"Today",  v:citations.filter(c=>new Date(c.created_at).toDateString()===new Date().toDateString()).length, c:"#D97706" },
          { label:"Total Fine (TZS)", v:`${(citations.reduce((a,c)=>a+(c.fine_amount||0),0)/1000).toFixed(0)}K`, c:"#0D3477" },
        ].map(k=>(
          <div key={k.label} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:900, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:360 }}>
        <Search size={14} color="#94A3B8"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search plate, driver, ref..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      {err && !modal && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", gap:10 }}>
          <span style={{ fontSize:13, color:"#B91C1C" }}>{err}</span>
          <button onClick={()=>setErr("")} style={{ background:"transparent", border:"none", color:"#B91C1C", cursor:"pointer", fontSize:13, fontWeight:700 }}>×</button>
        </div>
      )}

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎫</div>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No citations issued yet</div>
            <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#D97706", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Issue First Citation</button>
          </div>
        ) : (
          <ResponsiveTable
            rows={filtered}
            onRowClick={null}
            emptyText="No citations issued yet"
            columns={[
              { key:"driver_name", label:"Driver", primary:true },
              { key:"ref_number",   label:"Ref",
                render:v => <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#D97706" }}>{v}</span> },
              { key:"control_number", label:"Control No",
                render:v => v ? <span style={{ fontFamily:"monospace", fontSize:11, color:"#64748B" }}>{v}</span> : "—" },
              { key:"vehicle_plate",  label:"Plate",
                render:v => <span style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", padding:"2px 8px", borderRadius:6, fontSize:12, fontWeight:700, fontFamily:"monospace" }}>{v}</span> },
              { key:"offense_type",   label:"Offense" },
              { key:"fine_amount",    label:"Fine (TZS)",
                render:v => <span style={{ fontFamily:"monospace", fontWeight:700 }}>{(v||0).toLocaleString()}</span> },
              { key:"amount_paid",    label:"Paid (TZS)",
                render:v => <span style={{ fontFamily:"monospace", fontWeight:700, color:"#16A34A" }}>{(v||0).toLocaleString()}</span> },
              { key:"balance",        label:"Balance",
                render:(_, row) => {
                  const balance = (row.fine_amount||0) - (row.amount_paid||0);
                  return <span style={{ fontFamily:"monospace", fontWeight:700, color:balance>0?"#DC2626":"#16A34A" }}>{Math.max(0,balance).toLocaleString()}</span>;
                } },
              { key:"status",         label:"Status",
                render:v => {
                  const sc = STATUS_C[v]||"#94A3B8";
                  return <span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{v}</span>;
                } },
              { key:"created_at",     label:"Date",
                render:v => <span style={{ fontSize:11, color:"#94A3B8" }}>{new Date(v).toLocaleDateString("en-GB")}</span> },
              { key:"_actions",       label:"Actions",
                render:(_, c) => {
                  const balance = (c.fine_amount||0) - (c.amount_paid||0);
                  const canPay = c.status!=="paid" && c.status!=="cancelled" && balance>0;
                  return (
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={(e)=>{e.stopPropagation();exportCitation(c, c.profiles?.full_name||"Officer");}} title="Download citation PDF"
                        style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#D97706" }}>
                        <Download size={14}/>
                      </button>
                      {canPay && (
                        <button onClick={(e)=>{e.stopPropagation();nav("/traffic/payments");}} title="Record payment"
                          style={{ width:30, height:30, borderRadius:7, border:"1px solid #BBF7D0", background:"#F0FDF4", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#16A34A" }}>
                          <Banknote size={14}/>
                        </button>
                      )}
                    </div>
                  );
                } },
            ]}
          />
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#D97706" }}>Issue Traffic Citation · Toa Faini</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Saves directly to Supabase with officer ID + timestamp</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/>
                <h3 style={{ color:"#16A34A", marginBottom:4 }}>Citation Issued!</h3>
                <p style={{ color:"#D97706", fontWeight:700, fontSize:16 }}>{done.ref_number}</p>
                <p style={{ color:"#64748B", fontSize:13 }}>Fine: TZS {(done.fine_amount||0).toLocaleString()}</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>Driver Information</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  {/* NIDA first - drives the lookup */}
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>NIDA Number {nidaLookup.status==="searching" && <Loader size={11} style={{display:"inline",marginLeft:5,animation:"spin 1s linear infinite"}}/>}</label>
                    <input value={form.driver_nida} onChange={upd("driver_nida")} placeholder="19xxxxxx... — type to look up driver" style={{ ...S.inp, fontFamily:"monospace" }}/>
                    {nidaLookup.status==="found" && (
                      <div style={{ marginTop:6, padding:"7px 10px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:12, color:"#166534" }}>
                          <strong>{nidaLookup.match.full_name}</strong>
                          {nidaLookup.match.driver_license && <span style={{ color:"#65A30D", marginLeft:8 }}>· DL {nidaLookup.match.driver_license}</span>}
                        </div>
                        <button type="button" onClick={applyNidaMatch} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#16A34A", color:"white", fontSize:11, fontWeight:700, cursor:"pointer" }}>Use This Driver</button>
                      </div>
                    )}
                    {nidaLookup.status==="applied" && (
                      <div style={{ marginTop:6, padding:"6px 10px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, fontSize:11, color:"#1E40AF", display:"flex", alignItems:"center", gap:6 }}>
                        <CheckCircle size={12}/> Driver auto-filled from database
                      </div>
                    )}
                    {nidaLookup.status==="none" && form.driver_nida.length >= 8 && (
                      <div style={{ marginTop:6, padding:"5px 10px", fontSize:11, color:"#94A3B8" }}>No match in database — fill manually</div>
                    )}
                  </div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Driver Name *</label><input value={form.driver_name} onChange={upd("driver_name")} placeholder="Full name" required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>License Number {licenseLookup.status==="searching" && <Loader size={11} style={{display:"inline",marginLeft:5,animation:"spin 1s linear infinite"}}/>}</label>
                    <input value={form.driver_license} onChange={upd("driver_license")} placeholder="e.g. TZ-DL-001234 — type to look up" style={{ ...S.inp, fontFamily:"monospace" }}/>
                    {licenseLookup.status==="found" && (
                      <div style={{ marginTop:6, padding:"7px 10px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:12, color:"#166534" }}>
                          <strong>{licenseLookup.match.full_name}</strong>
                          {licenseLookup.match.nida && <span style={{ color:"#65A30D", marginLeft:8 }}>· NIDA {licenseLookup.match.nida.slice(0,8)}…</span>}
                        </div>
                        <button type="button" onClick={applyLicenseMatch} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#16A34A", color:"white", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Use This Driver</button>
                      </div>
                    )}
                    {licenseLookup.status==="applied" && (
                      <div style={{ marginTop:6, padding:"6px 10px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, fontSize:11, color:"#1E40AF", display:"flex", alignItems:"center", gap:6 }}>
                        <CheckCircle size={12}/> Driver auto-filled from license
                      </div>
                    )}
                    {licenseLookup.status==="none" && form.driver_license.length >= 4 && (
                      <div style={{ marginTop:6, padding:"5px 10px", fontSize:11, color:"#94A3B8" }}>No match — fill manually</div>
                    )}
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Driver Phone</label><input value={form.driver_phone} onChange={upd("driver_phone")} placeholder="+255 ..." style={S.inp}/></div>
                </div>

                <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5, margin:"6px 0 10px" }}>Vehicle Information</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Plate Number * {plateLookup.status==="searching" && <Loader size={11} style={{display:"inline",marginLeft:5,animation:"spin 1s linear infinite"}}/>}</label>
                    <input value={form.vehicle_plate} onChange={(e)=>upd("vehicle_plate")({target:{value:e.target.value.toUpperCase()}})} placeholder="e.g. T 123 ABC — type to look up vehicle" required style={{ ...S.inp, fontFamily:"monospace", fontWeight:700, textTransform:"uppercase" }}/>
                    {plateLookup.status==="found" && (
                      <div style={{ marginTop:6, padding:"7px 10px", background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                        <div style={{ fontSize:12, color:"#92400E" }}>
                          <strong>{plateLookup.match.make || "Unknown make"} {plateLookup.match.model||""}</strong>
                          {plateLookup.match.color && <span style={{ color:"#A16207", marginLeft:8 }}>· {plateLookup.match.color}</span>}
                          {plateLookup.match.owner_name && <div style={{ fontSize:10, color:"#A16207", marginTop:2 }}>Owner: {plateLookup.match.owner_name}</div>}
                        </div>
                        <button type="button" onClick={applyPlateMatch} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#D97706", color:"white", fontSize:11, fontWeight:700, cursor:"pointer" }}>Use This Vehicle</button>
                      </div>
                    )}
                    {plateLookup.status==="applied" && (
                      <div style={{ marginTop:6, padding:"6px 10px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, fontSize:11, color:"#1E40AF", display:"flex", alignItems:"center", gap:6 }}>
                        <CheckCircle size={12}/> Vehicle auto-filled from database
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Vehicle Type</label>
                    <select value={form.vehicle_type} onChange={upd("vehicle_type")} style={S.sel}>
                      {["Car","Truck","Bus","Minibus (Daladala)","Motorcycle (Pikipiki)","Tuk-tuk (Bajaji)","Lorry","Van","Pickup","Tractor","Other"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Color · Rangi</label>
                    <select value={form.vehicle_color} onChange={upd("vehicle_color")} style={S.sel}>
                      <option value="">— Select —</option>
                      {COLORS.map(c => <option key={c.v} value={c.v}>{c.v} · {c.sw}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Make</label>
                    <select value={form.vehicle_make.split(" ")[0]} onChange={(e)=>{
                      // Keep existing model after make is changed
                      const restModel = form.vehicle_make.split(" ").slice(1).join(" ");
                      setForm(f=>({ ...f, vehicle_make: restModel ? `${e.target.value} ${restModel}` : e.target.value }));
                    }} style={S.sel}>
                      <option value="">— Select —</option>
                      {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Model</label>
                    <input value={form.vehicle_make.split(" ").slice(1).join(" ")} onChange={(e)=>{
                      const make = form.vehicle_make.split(" ")[0] || "";
                      setForm(f=>({ ...f, vehicle_make: make ? `${make} ${e.target.value}` : e.target.value }));
                    }} placeholder="e.g. Corolla, Hilux, Ist" style={S.inp}/>
                  </div>
                </div>

                <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5, margin:"6px 0 10px" }}>
                  <MapPin size={12} style={{display:"inline",marginRight:5}}/>Offense Location · Mahali pa Kosa
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0 12px" }}>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Region · Mkoa</label>
                    <select value={form.region_id} onChange={e=>pickRegion(e.target.value)} style={S.sel}>
                      <option value="">— My region —</option>
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>District · Wilaya</label>
                    <select value={form.district_id} onChange={e=>pickDistrict(e.target.value)} disabled={!form.region_id}
                      style={{ ...S.sel, opacity: form.region_id ? 1 : .55, cursor: form.region_id ? "pointer" : "not-allowed" }}>
                      <option value="">{form.region_id ? "— Select —" : "Region first"}</option>
                      {formDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Ward · Kata</label>
                    <select value={form.ward_id} onChange={upd("ward_id")} disabled={!form.district_id}
                      style={{ ...S.sel, opacity: form.district_id ? 1 : .55, cursor: form.district_id ? "pointer" : "not-allowed" }}>
                      <option value="">{form.district_id ? "— Select —" : "District first"}</option>
                      {formWards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={S.lbl}>Specific Location · Eneo *</label>
                  <input value={form.location_text} onChange={upd("location_text")} placeholder="e.g. Uhuru Street near Posta junction" required style={S.inp}/>
                </div>

                <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5, margin:"6px 0 10px" }}>Offense & Fine</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Offense (from schedule) *</label>
                    <select value={form.fine_schedule_id} onChange={upd("fine_schedule_id")} required style={S.sel}>
                      <option value="">Select offense...</option>
                      {schedule.map(s=><option key={s.id} value={s.id}>{s.code} · {s.offense_name} — TZS {s.fine_amount.toLocaleString()}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Fine Amount (TZS) *</label>
                    <input type="number" value={form.fine_amount} onChange={upd("fine_amount")} required style={{ ...S.inp, fontWeight:700 }}/>
                  </div>
                </div>

                <div style={{ marginBottom:14 }}>
                  <PhotoUpload
                    folder="citations"
                    value={form.photo_urls}
                    onChange={(urls)=>setForm(f=>({...f, photo_urls:urls}))}
                    maxFiles={5}
                    label="Evidence Photos · Picha za Ushahidi"
                    hint="Plate close-up, scene, driver license"
                  />
                </div>

                {form.fine_amount>0 && <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:9, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}><span style={{ fontSize:13, color:"#92400E" }}>Fine Amount:</span><span style={{ fontSize:18, fontWeight:900, color:"#D97706" }}>TZS {parseInt(form.fine_amount||0).toLocaleString()}</span></div>}
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#D97706", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Saving...":"Issue Citation · Toa Faini"}
                </button>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </form>
            )}
          </div>
        </div>
      )}
    </TrafficLayout>
  );
}
