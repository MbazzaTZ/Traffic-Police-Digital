import { useState, useEffect } from "react";
import TrafficLayout from "../../layouts/TrafficLayout";
import DashboardLayout from "../../layouts/DashboardLayout";
import CIDLayout from "../../layouts/CIDLayout";
import { Banknote, Plus, X, CheckCircle, AlertTriangle, Search, Download, Receipt } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import { exportPaymentReceipt } from "../../lib/pdfExport";
import ResponsiveTable from "../../components/mobile/ResponsiveTable";

// Render in the layout that matches the viewing officer's role
function RoleLayout({ role, children, ...props }) {
  if (role === "traffic_officer") return <TrafficLayout {...props}>{children}</TrafficLayout>;
  if (role === "cid_officer" || role === "forensic_officer") return <CIDLayout {...props}>{children}</CIDLayout>;
  return <DashboardLayout {...props}>{children}</DashboardLayout>;
}

const METHOD_C = { mpesa:"#16A34A", tigo_pesa:"#0891B2", airtel_money:"#DC2626", halopesa:"#7C3AED", ezypesa:"#D97706", bank_transfer:"#0D3477", cash:"#64748B" };
const METHODS = ["mpesa","tigo_pesa","airtel_money","halopesa","ezypesa","bank_transfer","cash"];
const STATUS_C = { completed:"#059669", pending:"#D97706", failed:"#DC2626", refunded:"#7C3AED" };

const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function PaymentsPage() {
  const { profile, stationId, stationName, fullName } = useCurrentUser();
  const [payments, setPayments] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [lookupModal, setLookupModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [fMethod, setFMethod] = useState("");

  // Lookup by control number
  const [lookupCtl, setLookupCtl] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [form, setForm] = useState({ citation_id:"", control_number:"", amount:0, method:"mpesa", transaction_ref:"", payer_name:"", payer_phone:"", notes:"" });
  const upd = k => e => setForm(f=>({ ...f, [k]: k==="amount"?parseInt(e.target.value)||0:e.target.value }));

  async function load() {
    setLoading(true);
    const [pay, out] = await Promise.all([
      supabase.from("payments").select("*, citations(ref_number, driver_name, vehicle_plate, offense_type)").order("paid_at",{ascending:false}).limit(300),
      supabase.from("citations").select("id, ref_number, control_number, driver_name, vehicle_plate, offense_type, fine_amount, amount_paid, status, issued_at").in("status",["unpaid","partial"]).order("issued_at",{ascending:false}).limit(100),
    ]);
    setPayments(pay.data||[]); setOutstanding(out.data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function doLookup() {
    if (!lookupCtl.trim()) return;
    setLookingUp(true); setLookupResult(null);
    const { data } = await supabase.from("citations")
      .select("*")
      .eq("control_number", lookupCtl.trim())
      .maybeSingle();
    setLookupResult(data || { notFound:true });
    setLookingUp(false);
  }

  function openPaymentFor(c) {
    setLookupModal(false); setLookupResult(null); setLookupCtl("");
    const balance = (c.fine_amount||0) - (c.amount_paid||0);
    setForm({
      citation_id: c.id,
      control_number: c.control_number||"",
      amount: balance > 0 ? balance : 0,
      method: "mpesa",
      transaction_ref: "", payer_name: c.driver_name||"", payer_phone:"", notes:"",
    });
    setErr(""); setModal(true);
  }

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      if (!form.citation_id) throw new Error("Pick an outstanding citation first");
      if (form.amount <= 0) throw new Error("Amount must be greater than zero");
      const { data, error } = await supabase.from("payments").insert({
        citation_id: form.citation_id,
        control_number: form.control_number || null,
        amount: form.amount,
        method: form.method,
        transaction_ref: form.transaction_ref || null,
        payer_name: form.payer_name || null,
        payer_phone: form.payer_phone || null,
        notes: form.notes || null,
        received_by: profile?.id || null,
        station_id: stationId || null,
        status: "completed",
      }).select("*, citations(ref_number, driver_name, vehicle_plate, offense_type, fine_amount, amount_paid)").single();
      if (error) throw error;
      logAction({ profile, action:"record_payment", entityType:"payment", entityId:data.id, entityRef:data.ref_number, description:`${data.method} TZS ${data.amount.toLocaleString()} for citation ${data.citations?.ref_number}` });
      setDone(true);
      // Auto-download receipt
      exportPaymentReceipt(data, fullName, stationName);
      await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({ citation_id:"", control_number:"", amount:0, method:"mpesa", transaction_ref:"", payer_name:"", payer_phone:"", notes:"" }); },2500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  const filtered = payments.filter(p =>
    (!search || [p.ref_number, p.control_number, p.transaction_ref, p.payer_name, p.citations?.driver_name, p.citations?.vehicle_plate].some(f=>String(f||"").toLowerCase().includes(search.toLowerCase()))) &&
    (!fMethod || p.method===fMethod)
  );

  const totalCollected = payments.filter(p=>p.status==="completed").reduce((s,p)=>s+(p.amount||0),0);
  const totalOutstanding = outstanding.reduce((s,c)=>s+((c.fine_amount||0)-(c.amount_paid||0)),0);

  return (
    <RoleLayout role={profile?.role} pageTitle="Payments" pageTitle2="Malipo">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Fine Payments <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Malipo ya Faini</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{payments.length} payments recorded · {outstanding.length} citations awaiting payment</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>{setLookupCtl("");setLookupResult(null);setLookupModal(true);}} style={{ padding:"9px 16px", borderRadius:10, border:"1.5px solid #0D3477", background:"white", color:"#0D3477", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
            <Search size={15}/> Lookup Control No
          </button>
          <button onClick={()=>{setErr("");setForm({ citation_id:"", control_number:"", amount:0, method:"mpesa", transaction_ref:"", payer_name:"", payer_phone:"", notes:"" });setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#16A34A", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
            <Plus size={15}/> Record Payment
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          { label:"Collected (TZS)",  v:totalCollected.toLocaleString(),   c:"#16A34A" },
          { label:"Outstanding (TZS)",v:totalOutstanding.toLocaleString(), c:"#DC2626" },
          { label:"Payments",         v:payments.length,                   c:"#0D3477" },
          { label:"M-Pesa",           v:payments.filter(p=>p.method==="mpesa").length, c:"#16A34A" },
        ].map(k=>(
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:900, color:k.c, fontFamily:"monospace" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <div style={{ flex:1, maxWidth:380, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search receipt, control, transaction, payer, plate..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fMethod} onChange={e=>setFMethod(e.target.value)} style={{ ...S.sel, width:180 }}>
          <option value="">All Methods</option>
          {METHODS.map(m=><option key={m} value={m}>{m.replace(/_/g," ")}</option>)}
        </select>
      </div>

      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Banknote size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No payments recorded yet</div>
          </div>
        ) : (
          <ResponsiveTable
            rows={filtered}
            emptyText="No payments recorded yet"
            columns={[
              { key:"_payer", label:"Payer", primary:true,
                render:(_, p) => (
                  <div>
                    <div style={{ fontWeight:700, color:"#1E293B" }}>{p.citations?.driver_name || p.payer_name || "—"}</div>
                    <div style={{ fontSize:11, color:"#94A3B8", fontFamily:"monospace", marginTop:2 }}>{p.citations?.vehicle_plate || ""}</div>
                  </div>
                ) },
              { key:"ref_number", label:"Receipt",
                render:v => <span style={{ fontFamily:"monospace", fontWeight:700, color:"#16A34A", fontSize:12 }}>{v}</span> },
              { key:"control_number", label:"Control No",
                render:v => v ? <span style={{ fontFamily:"monospace", fontSize:11, color:"#64748B" }}>{v}</span> : "—" },
              { key:"_offense", label:"Offense",
                render:(_, p) => p.citations?.offense_type || "—" },
              { key:"method", label:"Method",
                render:v => {
                  const mc = METHOD_C[v] || "#64748B";
                  return <span style={{ background:`${mc}18`, color:mc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{v?.replace(/_/g," ")}</span>;
                } },
              { key:"transaction_ref", label:"Txn Ref",
                render:v => v ? <span style={{ fontFamily:"monospace", fontSize:11, color:"#64748B" }}>{v}</span> : "—" },
              { key:"amount", label:"Amount (TZS)",
                render:v => <span style={{ fontWeight:700, fontFamily:"monospace", color:"#16A34A" }}>{(v||0).toLocaleString()}</span> },
              { key:"paid_at", label:"Paid",
                render:v => <span style={{ fontSize:11, color:"#94A3B8" }}>{new Date(v).toLocaleString("en-GB")}</span> },
              { key:"status", label:"Status",
                render:v => {
                  const sc = STATUS_C[v] || "#94A3B8";
                  return <span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{v}</span>;
                } },
              { key:"_pdf", label:"PDF",
                render:(_, p) => (
                  <button onClick={(e)=>{e.stopPropagation();exportPaymentReceipt(p, fullName, stationName);}} title="Download receipt"
                    style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}>
                    <Download size={14}/>
                  </button>
                ) },
            ]}
          />
        )}
      </div>

      {/* Lookup modal */}
      {lookupModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setLookupModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:480 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Lookup by Control Number</div>
              <button onClick={()=>setLookupModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <input value={lookupCtl} onChange={e=>setLookupCtl(e.target.value)} placeholder="e.g. 000000100023" style={{ ...S.inp, fontFamily:"monospace", fontSize:14 }} onKeyDown={e=>e.key==="Enter"&&doLookup()}/>
              <button onClick={doLookup} disabled={lookingUp} style={{ padding:"0 18px", height:42, background:lookingUp?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:9, fontWeight:700, cursor:lookingUp?"not-allowed":"pointer" }}>
                {lookingUp?"…":"Find"}
              </button>
            </div>
            {lookupResult && (lookupResult.notFound ? (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:14, fontSize:13, color:"#B91C1C" }}>
                No citation found with that control number.
              </div>
            ) : (
              <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:.4 }}>CITATION {lookupResult.ref_number}</div>
                <div style={{ fontSize:15, fontWeight:700, color:"#1E293B", marginTop:4 }}>{lookupResult.driver_name}</div>
                <div style={{ fontSize:13, color:"#475569" }}>{lookupResult.vehicle_plate} · {lookupResult.offense_type}</div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:10, borderTop:"1px solid #E2E8F0" }}>
                  <div><div style={{ fontSize:10, color:"#94A3B8" }}>FINE</div><div style={{ fontWeight:700, color:"#0D3477", fontFamily:"monospace" }}>TZS {(lookupResult.fine_amount||0).toLocaleString()}</div></div>
                  <div><div style={{ fontSize:10, color:"#94A3B8" }}>PAID</div><div style={{ fontWeight:700, color:"#16A34A", fontFamily:"monospace" }}>TZS {(lookupResult.amount_paid||0).toLocaleString()}</div></div>
                  <div><div style={{ fontSize:10, color:"#94A3B8" }}>BALANCE</div><div style={{ fontWeight:700, color:"#DC2626", fontFamily:"monospace" }}>TZS {((lookupResult.fine_amount||0)-(lookupResult.amount_paid||0)).toLocaleString()}</div></div>
                </div>
                {(lookupResult.fine_amount||0) > (lookupResult.amount_paid||0) && (
                  <button onClick={()=>openPaymentFor(lookupResult)} style={{ width:"100%", marginTop:12, padding:"10px", border:"none", background:"#16A34A", color:"white", borderRadius:8, fontWeight:700, cursor:"pointer" }}>
                    Record Payment for this Citation
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record payment modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#16A34A" }}>Record Payment · Sajili Malipo</div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Payment Recorded!</h3><p style={{ fontSize:13, color:"#64748B" }}>Receipt downloaded — hand to driver</p></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ marginBottom:14 }}>
                  <label style={S.lbl}>Citation *</label>
                  <select value={form.citation_id} onChange={e=>{
                    const cit = outstanding.find(c=>c.id===e.target.value);
                    if (cit) openPaymentFor(cit); else setForm(f=>({...f, citation_id:""}));
                  }} required style={S.sel}>
                    <option value="">— Select outstanding citation —</option>
                    {outstanding.map(c=>{
                      const balance = (c.fine_amount||0)-(c.amount_paid||0);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.ref_number} · {c.vehicle_plate} · {c.driver_name?.slice(0,20)} · Balance TZS {balance.toLocaleString()}
                        </option>
                      );
                    })}
                  </select>
                  <div style={{ fontSize:10, color:"#94A3B8", marginTop:4 }}>{outstanding.length} unpaid / partial citations</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Control No</label><input value={form.control_number} onChange={upd("control_number")} readOnly style={{ ...S.inp, fontFamily:"monospace", background:"#F8FAFC", color:"#64748B" }}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Amount (TZS) *</label><input type="number" min="1" value={form.amount} onChange={upd("amount")} required style={{ ...S.inp, fontFamily:"monospace", fontWeight:700 }}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Method *</label><select value={form.method} onChange={upd("method")} style={S.sel}>{METHODS.map(m=><option key={m} value={m}>{m.replace(/_/g," ")}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Transaction Ref</label><input value={form.transaction_ref} onChange={upd("transaction_ref")} placeholder="e.g. QGH3K9LM2X" style={{ ...S.inp, fontFamily:"monospace" }}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Payer Name</label><input value={form.payer_name} onChange={upd("payer_name")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Payer Phone</label><input value={form.payer_phone} onChange={upd("payer_phone")} style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Notes</label><textarea value={form.notes} onChange={upd("notes")} rows={2} style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#16A34A", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <Receipt size={16}/> {saving?"Recording...":"Record & Issue Receipt"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
