import { useState, useEffect } from "react";
import TrafficLayout from "../../layouts/TrafficLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, Download, FileText } from "lucide-react";
import { exportCitation, exportReport } from "../../lib/pdfExport";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const OFFENSES = ["Speeding","Running Red Light","No Seatbelt","Using Phone While Driving","Drunk Driving","No License","Expired License","No Insurance","Overloading","Wrong Lane","Illegal Parking","No Vehicle Registration","Unroadworthy Vehicle","Reckless Driving","Other"];
const FINES = { "Speeding":50000,"Running Red Light":30000,"No Seatbelt":20000,"Using Phone While Driving":30000,"Drunk Driving":200000,"No License":100000,"Expired License":50000,"No Insurance":150000,"Overloading":80000,"Wrong Lane":20000,"Illegal Parking":15000,"No Vehicle Registration":100000,"Unroadworthy Vehicle":80000,"Reckless Driving":100000,"Other":20000 };

const S = {
  inp: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function CitationsPage() {
  const { profile, stationId, regionId, districtId } = useCurrentUser();
  const [citations, setCitations] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(null);
  const [err,       setErr]       = useState("");
  const [search,    setSearch]    = useState("");
  const [form, setForm] = useState({ driver_name:"", driver_license:"", driver_nida:"", vehicle_plate:"", vehicle_type:"Car", vehicle_make:"", vehicle_color:"", offense_type:"", fine_amount:0, location_text:"" });

  const upd = k => e => {
    const v = e.target.value;
    if (k==="offense_type") return setForm(f=>({...f, offense_type:v, fine_amount:FINES[v]||20000}));
    setForm(f=>({...f,[k]:v}));
  };

  async function load() {
    setLoading(true);
    let q = supabase.from("traffic_citations").select("*, profiles!traffic_citations_issued_by_fkey(full_name,badge)").order("created_at",{ascending:false}).limit(100);
    if (stationId) q = q.eq("station_id", stationId);
    const { data, error } = await q;
    if (error) console.error(error);
    setCitations(data||[]);
    setLoading(false);
  }

  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("traffic_citations").insert({
        ...form, fine_amount:parseInt(form.fine_amount)||0, fine_currency:"TZS",
        station_id:stationId||null, region_id:regionId||null, district_id:districtId||null,
        issued_by:profile?.id||null, status:"unpaid", due_date:new Date(Date.now()+30*86400000).toISOString(),
      }).select().single();
      if (error) throw error;
      setDone(data); await load();
      setTimeout(()=>{setModal(false);setDone(null);setForm({driver_name:"",driver_license:"",driver_nida:"",vehicle_plate:"",vehicle_type:"Car",vehicle_make:"",vehicle_color:"",offense_type:"",fine_amount:0,location_text:""});},2500);
    } catch(e){setErr(e.message);} finally{setSaving(false);}
  }

  const filtered = citations.filter(c=> !search || c.driver_name?.toLowerCase().includes(search.toLowerCase()) || c.vehicle_plate?.toLowerCase().includes(search.toLowerCase()) || c.ref_number?.includes(search));

  const STATUS_C = { unpaid:"#DC2626", paid:"#059669", contested:"#D97706", cancelled:"#94A3B8" };

  return (
    <TrafficLayout pageTitle="Citations" pageTitle2="Faini za Trafiki">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Traffic Citations <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Faini</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{citations.length} total · TZS {citations.reduce((a,c)=>a+(c.fine_paid?0:c.fine_amount||0),0).toLocaleString()} unpaid</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>exportReport("Traffic Citations Report",
            ["Ref","Driver","Plate","Offense","Fine TZS","Status","Date"],
            filtered.map(c=>[c.ref_number,c.driver_name,c.vehicle_plate,c.offense_type,(c.fine_amount||0).toLocaleString(),c.status,new Date(c.created_at).toLocaleDateString("en-GB")]),
            `${filtered.length} citations`)}
            disabled={filtered.length===0}
            style={{ padding:"9px 16px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, cursor:filtered.length===0?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, opacity:filtered.length===0?.5:1 }}>
            <FileText size={15}/> Export PDF
          </button>
          <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#D97706", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
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
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:900, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:360 }}>
        <Search size={14} color="#94A3B8"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search plate, driver, ref..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎫</div>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No citations issued yet</div>
            <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#D97706", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Issue First Citation</button>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref #","Driver","Plate","Offense","Fine (TZS)","Status","Issued By","Date",""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((c)=>{
                const sc = STATUS_C[c.status]||"#94A3B8";
                return (
                  <tr key={c.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:"#D97706", fontSize:12, fontFamily:"monospace" }}>{c.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"#1E293B" }}>{c.driver_name}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", padding:"2px 8px", borderRadius:6, fontSize:12, fontWeight:700, fontFamily:"monospace" }}>{c.vehicle_plate}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{c.offense_type}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, fontWeight:700, color:"#1E293B" }}>{(c.fine_amount||0).toLocaleString()}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{c.status}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{c.profiles?.full_name||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(c.created_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <button onClick={()=>exportCitation(c, c.profiles?.full_name||"Officer")}
                        title="Download PDF"
                        style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#D97706" }}>
                        <Download size={14}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Driver Name *</label><input value={form.driver_name} onChange={upd("driver_name")} placeholder="Full name" required style={S.inp} onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>License Number</label><input value={form.driver_license} onChange={upd("driver_license")} placeholder="e.g. TZ-DL-001234" style={S.inp} onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA Number</label><input value={form.driver_nida} onChange={upd("driver_nida")} placeholder="19xxxxxx-xxxxx-xxxxx-x" style={S.inp}/></div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5, margin:"6px 0 10px" }}>Vehicle Information</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Plate Number *</label><input value={form.vehicle_plate} onChange={upd("vehicle_plate")} placeholder="e.g. T 123 ABC" required style={{ ...S.inp, fontFamily:"monospace", fontWeight:700 }} onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Vehicle Type</label><select value={form.vehicle_type} onChange={upd("vehicle_type")} style={S.sel}>{["Car","Truck","Bus","Motorcycle","Tuk-tuk","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Make/Model</label><input value={form.vehicle_make} onChange={upd("vehicle_make")} placeholder="e.g. Toyota Corolla" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Color</label><input value={form.vehicle_color} onChange={upd("vehicle_color")} placeholder="e.g. White" style={S.inp}/></div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.5, margin:"6px 0 10px" }}>Offense & Fine</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Offense Type *</label><select value={form.offense_type} onChange={upd("offense_type")} required style={S.sel} onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}><option value="">Select offense...</option>{OFFENSES.map(o=><option key={o}>{o}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Fine Amount (TZS) *</label><input type="number" value={form.fine_amount} onChange={upd("fine_amount")} required style={{ ...S.inp, fontWeight:700 }} onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}><label style={S.lbl}>Location *</label><input value={form.location_text} onChange={upd("location_text")} placeholder="e.g. Uhuru Street, Dar es Salaam" required style={S.inp} onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                </div>
                {form.fine_amount>0 && <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:9, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}><span style={{ fontSize:13, color:"#92400E" }}>Fine Amount:</span><span style={{ fontSize:18, fontWeight:900, color:"#D97706" }}>TZS {parseInt(form.fine_amount||0).toLocaleString()}</span></div>}
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#D97706", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Saving...":"Issue Citation · Toa Faini"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </TrafficLayout>
  );
}
