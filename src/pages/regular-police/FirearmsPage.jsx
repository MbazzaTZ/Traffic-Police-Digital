import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Target, FileBadge, Plus, X, CheckCircle, AlertTriangle, Search, Download } from "lucide-react";
import PhotoUpload from "../../components/PhotoUpload";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import { exportFirearmLicense } from "../../lib/pdfExport";

const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

const FA_STATUS = { active:"#059669", lost:"#D97706", stolen:"#DC2626", surrendered:"#0891B2", destroyed:"#64748B" };
const LIC_STATUS = { active:"#059669", expired:"#D97706", revoked:"#DC2626", suspended:"#7C3AED" };
const FA_TYPES = ["Pistol","Rifle","Shotgun","Revolver","SMG","Other"];
const FA_CATEGORY = ["civilian","police","military","security_company"];
const LIC_TYPES = ["civilian_carry","hunting","security","dealer","collector"];

function ExpiryBadge({ date }) {
  if (!date) return <span style={{ color:"#94A3B8", fontSize:12 }}>—</span>;
  const days = Math.floor((new Date(date) - Date.now()) / 86400000);
  const expired = days < 0;
  const soon = days <= 60 && !expired;
  const c = expired ? "#DC2626" : soon ? "#D97706" : "#059669";
  return (
    <span style={{ color:c, fontWeight:700, fontSize:12 }}>
      {expired ? `⚠ ${Math.abs(days)}d ago` : soon ? `${days}d left` : new Date(date).toLocaleDateString("en-GB")}
    </span>
  );
}

export default function FirearmsPage() {
  const { profile, fullName, stationId, regionId, stationName } = useCurrentUser();
  const [tab, setTab] = useState("firearms");
  const [firearms, setFirearms] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [fa, setFA] = useState({ serial_number:"", firearm_type:"Pistol", make:"", model:"", caliber:"", category:"civilian", holder_name:"", holder_nida:"", holder_phone:"", photo_urls:[] });
  const [lic, setLic] = useState({ holder_name:"", holder_nida:"", license_type:"civilian_carry", firearm_id:"", issue_date:"", expiry_date:"" });
  const updFA = k => e => setFA(f=>({...f,[k]:e.target.value}));
  const updLic = k => e => setLic(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const [f, l] = await Promise.all([
      supabase.from("firearms").select("*").order("created_at",{ascending:false}).limit(200),
      supabase.from("firearm_licenses").select("*, firearms(serial_number,make,model)").order("created_at",{ascending:false}).limit(200),
    ]);
    setFirearms(f.data||[]); setLicenses(l.data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submitFA(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("firearms").insert({
        ...fa, year_made:fa.year_made?parseInt(fa.year_made):null,
        station_id:stationId||null, region_id:regionId||null, registered_by:profile?.id||null, status:"active",
      }).select().single();
      if (error) throw error;
      logAction({ profile, action:"register_firearm", entityType:"firearm", entityId:data.id, entityRef:data.ref_number, description:`${data.make} ${data.model} ${data.serial_number} - ${data.holder_name||"unassigned"}` });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setFA({ serial_number:"", firearm_type:"Pistol", make:"", model:"", caliber:"", category:"civilian", holder_name:"", holder_nida:"", holder_phone:"" }); },2000);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function submitLic(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("firearm_licenses").insert({
        ...lic, firearm_id:lic.firearm_id||null, issue_date:lic.issue_date||null, expiry_date:lic.expiry_date||null,
        station_id:stationId||null, region_id:regionId||null, issued_by:profile?.id||null, status:"active",
      }).select("*, firearms(serial_number,make,model)").single();
      if (error) throw error;
      logAction({ profile, action:"issue_license", entityType:"firearm_license", entityId:data.id, entityRef:data.ref_number, description:`License ${data.license_no} to ${data.holder_name}` });
      setDone(true); await load();
      // auto-download license certificate
      exportFirearmLicense(data, fullName, stationName);
      setTimeout(()=>{ setModal(false); setDone(false); setLic({ holder_name:"", holder_nida:"", license_type:"civilian_carry", firearm_id:"", issue_date:"", expiry_date:"" }); },2500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function updateStatus(table, r, status) {
    const updates = { status };
    if (table==="firearms" && ["lost","stolen"].includes(status)) updates.lost_stolen_date = new Date().toISOString();
    await supabase.from(table).update(updates).eq("id", r.id);
    logAction({ profile, action:`update_${table}`, entityType:table, entityId:r.id, entityRef:r.ref_number, description:`Status -> ${status}` });
    await load();
  }

  // auto-mark expired licenses (client-side display flag; status stays unless updated)
  const records = tab==="firearms" ? firearms : licenses;
  const filtered = records.filter(r=>!search ||
    (tab==="firearms" ? [r.serial_number, r.make, r.model, r.holder_name, r.holder_nida, r.ref_number]
                      : [r.license_no, r.holder_name, r.holder_nida, r.ref_number]).some(f=>String(f||"").toLowerCase().includes(search.toLowerCase()))
  );

  const stats = tab==="firearms" ? {
    Active:firearms.filter(f=>f.status==="active").length,
    Lost:firearms.filter(f=>f.status==="lost").length,
    Stolen:firearms.filter(f=>f.status==="stolen").length,
    Total:firearms.length,
  } : {
    Active:licenses.filter(l=>l.status==="active" && (!l.expiry_date || new Date(l.expiry_date)>=new Date())).length,
    Expiring:licenses.filter(l=>l.status==="active" && l.expiry_date && (new Date(l.expiry_date) - Date.now())/86400000 <= 60 && new Date(l.expiry_date)>=new Date()).length,
    Expired:licenses.filter(l=>l.expiry_date && new Date(l.expiry_date)<new Date()).length,
    Revoked:licenses.filter(l=>l.status==="revoked").length,
  };

  return (
    <DashboardLayout pageTitle="Firearms Registry" pageTitle2="Daftari ya Silaha">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Firearms Registry <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Daftari ya Silaha</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{firearms.length} firearms · {licenses.length} licenses on record</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> {tab==="firearms"?"Register Firearm":"Issue License"}
        </button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <button onClick={()=>setTab("firearms")} style={{ padding:"10px 18px", borderRadius:10, border:`2px solid ${tab==="firearms"?"#0D3477":"#E2E8F0"}`, background:tab==="firearms"?"#EFF6FF":"white", color:tab==="firearms"?"#0D3477":"#475569", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <Target size={16}/> Firearms · Silaha
        </button>
        <button onClick={()=>setTab("licenses")} style={{ padding:"10px 18px", borderRadius:10, border:`2px solid ${tab==="licenses"?"#0D3477":"#E2E8F0"}`, background:tab==="licenses"?"#EFF6FF":"white", color:tab==="licenses"?"#0D3477":"#475569", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <FileBadge size={16}/> Licenses · Leseni
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {Object.entries(stats).map(([k,v])=>{
          const c = tab==="firearms" ? {Active:"#059669",Lost:"#D97706",Stolen:"#DC2626",Total:"#0D3477"}[k] : {Active:"#059669",Expiring:"#D97706",Expired:"#DC2626",Revoked:"#7C3AED"}[k];
          return (
            <div key={k} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
              <div style={{ fontSize:26, fontWeight:900, color:c }}>{v}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:420 }}>
        <Search size={14} color="#94A3B8"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tab==="firearms"?"Serial, make, holder, NIDA...":"License, holder, NIDA..."} style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            {tab==="firearms" ? <Target size={40} style={{ opacity:.2, marginBottom:12 }}/> : <FileBadge size={40} style={{ opacity:.2, marginBottom:12 }}/>}
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No records</div>
          </div>
        ) : tab==="firearms" ? (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref","Serial","Type","Make/Model","Caliber","Holder","Category","Status","Action"].map(h=><th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(r=>{
                const sc=FA_STATUS[r.status]||"#94A3B8";
                return (
                  <tr key={r.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#0D3477", fontSize:12 }}>{r.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontSize:12, fontWeight:600 }}>{r.serial_number||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:13 }}>{r.firearm_type}</td>
                    <td style={{ padding:"11px 14px", fontSize:13 }}>{r.make} {r.model}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#64748B" }}>{r.caliber||"—"}</td>
                    <td style={{ padding:"11px 14px" }}><div style={{ fontSize:13, fontWeight:600 }}>{r.holder_name||"—"}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{r.holder_nida||""}</div></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:"#EFF6FF", color:"#0D3477", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.category?.replace(/_/g," ")}</span></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span></td>
                    <td style={{ padding:"11px 14px" }}>
                      {r.status==="active" && (
                        <select onChange={e=>e.target.value&&updateStatus("firearms",r,e.target.value)} defaultValue=""
                          style={{ height:32, border:"1px solid #E2E8F0", borderRadius:7, fontSize:12, padding:"0 8px", background:"white", cursor:"pointer" }}>
                          <option value="">Update...</option>
                          <option value="lost">Lost</option><option value="stolen">Stolen</option>
                          <option value="surrendered">Surrendered</option><option value="destroyed">Destroyed</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref","License No","Holder","Type","Firearm","Issued","Expiry","Status","Action"].map(h=><th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(r=>{
                const expired = r.expiry_date && new Date(r.expiry_date) < new Date();
                const effective = expired && r.status==="active" ? "expired" : r.status;
                const sc=LIC_STATUS[effective]||"#94A3B8";
                return (
                  <tr key={r.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#0D3477", fontSize:12 }}>{r.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontSize:12, fontWeight:700, color:"#7C3AED" }}>{r.license_no}</td>
                    <td style={{ padding:"11px 14px" }}><div style={{ fontSize:13, fontWeight:600 }}>{r.holder_name}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{r.holder_nida||""}</div></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:"#F5F3FF", color:"#7C3AED", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.license_type?.replace(/_/g," ")}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#64748B" }}>{r.firearms?`${r.firearms.make} ${r.firearms.model}`:"—"}<div style={{ fontSize:10, fontFamily:"monospace", color:"#94A3B8" }}>{r.firearms?.serial_number||""}</div></td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{r.issue_date?new Date(r.issue_date).toLocaleDateString("en-GB"):"—"}</td>
                    <td style={{ padding:"11px 14px" }}><ExpiryBadge date={r.expiry_date}/></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{effective}</span></td>
                    <td style={{ padding:"11px 14px", display:"flex", gap:6 }}>
                      <button onClick={()=>exportFirearmLicense(r, profile?.full_name, stationName)} title="Download certificate"
                        style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}>
                        <Download size={14}/>
                      </button>
                      {r.status==="active" && !expired && (
                        <select onChange={e=>e.target.value&&updateStatus("firearm_licenses",r,e.target.value)} defaultValue=""
                          style={{ height:32, border:"1px solid #E2E8F0", borderRadius:7, fontSize:12, padding:"0 8px", background:"white", cursor:"pointer" }}>
                          <option value="">Update...</option>
                          <option value="suspended">Suspend</option><option value="revoked">Revoke</option>
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

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>{tab==="firearms"?"Register Firearm · Sajili Silaha":"Issue License · Toa Leseni"}</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Done!</h3>{tab==="licenses"&&<p style={{ fontSize:13, color:"#64748B" }}>License certificate downloaded</p>}</div>
            ) : tab==="firearms" ? (
              <form onSubmit={submitFA}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Serial Number * </label><input value={fa.serial_number} onChange={updFA("serial_number")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Type</label><select value={fa.firearm_type} onChange={updFA("firearm_type")} style={S.sel}>{FA_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Category</label><select value={fa.category} onChange={updFA("category")} style={S.sel}>{FA_CATEGORY.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Make</label><input value={fa.make} onChange={updFA("make")} placeholder="e.g. Glock" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Model</label><input value={fa.model} onChange={updFA("model")} placeholder="e.g. 17" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Caliber</label><input value={fa.caliber} onChange={updFA("caliber")} placeholder="e.g. 9mm" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Year Made</label><input type="number" value={fa.year_made||""} onChange={updFA("year_made")} style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1", borderTop:"1px solid #F1F5F9", paddingTop:14, marginTop:4 }}><div style={{ fontSize:12, fontWeight:700, color:"#64748B", marginBottom:8 }}>Holder · Mmiliki (if civilian)</div></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Holder Name</label><input value={fa.holder_name} onChange={updFA("holder_name")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Holder NIDA</label><input value={fa.holder_nida} onChange={updFA("holder_nida")} style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Holder Phone</label><input value={fa.holder_phone} onChange={updFA("holder_phone")} style={S.inp}/></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                    <PhotoUpload
                      folder="firearms"
                      value={fa.photo_urls}
                      onChange={(urls)=>setFA(f=>({...f, photo_urls:urls}))}
                      maxFiles={5}
                      label="Photos · Picha (firearm + serial close-up)"
                      hint="Tap to photograph firearm and serial number"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>{saving?"Registering...":"Register Firearm"}</button>
              </form>
            ) : (
              <form onSubmit={submitLic}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Holder Name *</label><input value={lic.holder_name} onChange={updLic("holder_name")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Holder NIDA *</label><input value={lic.holder_nida} onChange={updLic("holder_nida")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>License Type</label><select value={lic.license_type} onChange={updLic("license_type")} style={S.sel}>{LIC_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}</select></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Linked Firearm</label>
                    <select value={lic.firearm_id} onChange={updLic("firearm_id")} style={S.sel}>
                      <option value="">No firearm linked</option>
                      {firearms.filter(f=>f.status==="active"&&f.category==="civilian").map(f=><option key={f.id} value={f.id}>{f.serial_number} · {f.make} {f.model} ({f.firearm_type})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Issue Date</label><input type="date" value={lic.issue_date} onChange={updLic("issue_date")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Expiry Date *</label><input type="date" value={lic.expiry_date} onChange={updLic("expiry_date")} required style={S.inp}/></div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>{saving?"Issuing...":"Issue & Download License"}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
