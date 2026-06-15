import { useState, useEffect } from "react";
import { FileText, Plus, X, CheckCircle, XCircle, ArrowUp, AlertTriangle, Send, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  REQUEST_TYPES, LEVEL_LABEL, SUBMITTER_ROLES, APPROVAL_CHAIN,
  submitRequest, approveRequest, rejectRequest, canApprove,
} from "../../lib/approvalFlow";

import DashboardLayout from "../../layouts/DashboardLayout";
import TrafficLayout   from "../../layouts/TrafficLayout";
import CIDLayout       from "../../layouts/CIDLayout";
import CommandLayout   from "../../layouts/CommandLayout";

const STATUS_C = { pending:"#D97706", escalated:"#0891B2", approved:"#059669", rejected:"#DC2626", cancelled:"#94A3B8" };
const PRIORITY_C = { normal:"#64748B", urgent:"#D97706", emergency:"#DC2626" };

const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

function pickLayout(role) {
  if (["igp","digp","rpc","admin_officer"].includes(role)) return CommandLayout;
  if (role === "traffic_officer") return TrafficLayout;
  if (["cid_officer","forensic_officer"].includes(role)) return CIDLayout;
  return DashboardLayout;
}

export default function ApprovalsPage() {
  const { profile, role } = useCurrentUser();
  const Layout = pickLayout(role);
  const isCommand = ["igp","digp","rpc","admin_officer"].includes(role);
  const isApprover = ["ocs","ocd","rpc","igp","digp","admin_officer"].includes(role);

  const [tab,       setTab]       = useState(isApprover ? "inbox" : "mine");
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);
  const [err,       setErr]       = useState("");
  const [selected,  setSelected]  = useState(null);
  const [trail,     setTrail]     = useState([]);
  const [note,      setNote]      = useState("");
  const [acting,    setActing]    = useState(false);

  const [form, setForm] = useState({ type:"", title:"", description:"", amount:"", priority:"normal" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    if (!profile?.id) return;
    setLoading(true);
    let q = supabase.from("requests")
      .select("*, requester:profiles!requests_requested_by_fkey(full_name,badge,role)")
      .order("created_at",{ascending:false}).limit(200);
    if (tab === "mine") {
      q = q.eq("requested_by", profile.id);
    } else {
      if (isCommand) q = q.in("status",["pending","escalated"]);
      else q = q.eq("current_approver", profile.id).in("status",["pending","escalated"]);
    }
    const { data } = await q;
    setRequests(data||[]);
    setLoading(false);
  }
  useEffect(()=>{ if(profile?.id) load(); },[profile?.id, tab]);

  async function openDetail(req) {
    setSelected(req); setNote("");
    const { data } = await supabase.from("request_approvals")
      .select("*, actor:profiles!request_approvals_actor_id_fkey(full_name,role)")
      .eq("request_id", req.id).order("created_at",{ascending:true});
    setTrail(data||[]);
  }

  async function doSubmit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      await submitRequest(form, profile);
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({type:"",title:"",description:"",amount:"",priority:"normal"}); setTab("mine"); },2200);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }
  async function doApprove() {
    setActing(true);
    try { await approveRequest(selected, profile, note); setSelected(null); await load(); }
    catch(e){ setErr(e.message); } finally{ setActing(false); }
  }
  async function doReject() {
    setActing(true);
    try { await rejectRequest(selected, profile, note); setSelected(null); await load(); }
    catch(e){ setErr(e.message); } finally{ setActing(false); }
  }

  const dark = isCommand;
  const txtColor = dark ? "white" : "#0D3477";
  const subColor = dark ? "rgba(255,255,255,.45)" : "#64748B";
  const cardBg = dark ? { background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" } : { background:"white", border:"1px solid #E2E8F0" };

  return (
    <Layout pageTitle="Approvals" pageTitle2="Maombi na Idhini">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:23, fontWeight:800, color:txtColor, margin:0 }}>Approvals & Requests <span style={{ color:subColor, fontWeight:400, fontSize:15 }}>· Maombi</span></h1>
          <p style={{ color:subColor, fontSize:13, marginTop:3 }}>Request and approval workflow · Upward escalation</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> New Request · Omba
        </button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {isApprover && (
          <button onClick={()=>setTab("inbox")}
            style={{ padding:"8px 18px", borderRadius:9, background:tab==="inbox"?"#0D3477":(dark?"rgba(255,255,255,.06)":"white"), color:tab==="inbox"?"white":(dark?"rgba(255,255,255,.6)":"#475569"), fontWeight:700, fontSize:13, cursor:"pointer", border:tab==="inbox"?"none":(dark?"1px solid rgba(255,255,255,.1)":"1px solid #E2E8F0") }}>
            📥 Approval Inbox {tab==="inbox"&&requests.length>0?`(${requests.length})`:""}
          </button>
        )}
        <button onClick={()=>setTab("mine")}
          style={{ padding:"8px 18px", borderRadius:9, background:tab==="mine"?"#0D3477":(dark?"rgba(255,255,255,.06)":"white"), color:tab==="mine"?"white":(dark?"rgba(255,255,255,.6)":"#475569"), fontWeight:700, fontSize:13, cursor:"pointer", border:tab==="mine"?"none":(dark?"1px solid rgba(255,255,255,.1)":"1px solid #E2E8F0") }}>
          📤 My Requests
        </button>
      </div>

      <div style={{ ...cardBg, borderRadius:14, overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:subColor }}>Loading...</div>
        : requests.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:subColor }}>
            <FileText size={40} style={{ opacity:.25, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600 }}>{tab==="inbox"?"No requests awaiting your approval":"You haven't submitted any requests"}</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:dark?"rgba(255,255,255,.03)":"#F8FAFC", borderBottom:dark?"1px solid rgba(255,255,255,.08)":"2px solid #E2E8F0" }}>
              {["Ref #","Type","Title","Requested By","Level","Priority","Status",""].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:subColor, textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {requests.map(r=>{
                const sc=STATUS_C[r.status]||"#94A3B8", pc=PRIORITY_C[r.priority]||"#64748B";
                const type=REQUEST_TYPES.find(t=>t.v===r.type);
                return (
                  <tr key={r.id} onClick={()=>openDetail(r)} style={{ borderBottom:dark?"1px solid rgba(255,255,255,.05)":"1px solid #F1F5F9", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,.03)":"#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:dark?"#93C5FD":"#0D3477", fontSize:12, fontFamily:"monospace" }}>{r.ref_number}</td>
                    <td style={{ padding:"11px 14px", fontSize:13 }}>{type?.icon} <span style={{ color:dark?"rgba(255,255,255,.7)":"#475569" }}>{type?.l.split(" / ")[0]||r.type}</span></td>
                    <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:dark?"white":"#1E293B", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:subColor }}>{r.requester?.full_name||"—"}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:dark?"rgba(8,145,178,.2)":"#EFF6FF", color:dark?"#67E8F9":"#0D3477", padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"uppercase" }}>{r.current_level||"—"}</span></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${pc}25`, color:pc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.priority}</span></td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}25`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r.status}</span></td>
                    <td style={{ padding:"11px 14px" }}><ChevronRight size={15} color={subColor}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>New Request · Omba Idhini</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Routed to your OCS, then escalated upward</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Request Submitted!</h3><p style={{ fontSize:13, color:"#64748B" }}>Routed to your OCS for approval</p></div>
            ) : (
              <form onSubmit={doSubmit}>
                <div style={{ marginBottom:14 }}>
                  <label style={S.lbl}>Request Type *</label>
                  <select value={form.type} onChange={upd("type")} required style={S.sel}>
                    <option value="">Select type...</option>
                    {REQUEST_TYPES.map(t=><option key={t.v} value={t.v}>{t.icon} {t.l} (→ {t.finalLevel.toUpperCase()})</option>)}
                  </select>
                  {form.type && <div style={{ fontSize:11, color:"#0891B2", marginTop:5 }}>Chain: {APPROVAL_CHAIN.slice(0, APPROVAL_CHAIN.indexOf(REQUEST_TYPES.find(t=>t.v===form.type)?.finalLevel)+1).map(l=>l.toUpperCase()).join(" → ")}</div>}
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={S.lbl}>Title *</label>
                  <input value={form.title} onChange={upd("title")} required placeholder="Brief request title" style={S.inp} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                </div>
                {(form.type==="budget"||form.type==="resource") && (
                  <div style={{ marginBottom:14 }}>
                    <label style={S.lbl}>Amount (TZS)</label>
                    <input type="number" value={form.amount} onChange={upd("amount")} placeholder="0" style={S.inp}/>
                  </div>
                )}
                <div style={{ marginBottom:14 }}>
                  <label style={S.lbl}>Priority</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {["normal","urgent","emergency"].map(p=>(
                      <button key={p} type="button" onClick={()=>setForm(f=>({...f,priority:p}))}
                        style={{ flex:1, padding:"8px", borderRadius:8, border:`2px solid ${form.priority===p?PRIORITY_C[p]:"#E2E8F0"}`, background:form.priority===p?`${PRIORITY_C[p]}18`:"white", color:form.priority===p?PRIORITY_C[p]:"#475569", cursor:"pointer", fontWeight:700, fontSize:12, textTransform:"capitalize" }}>{p}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:18 }}>
                  <label style={S.lbl}>Description / Justification *</label>
                  <textarea value={form.description} onChange={upd("description")} rows={4} required placeholder="Explain your request..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }} onFocus={e=>e.target.style.borderColor="#0D3477"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <Send size={16}/> {saving?"Submitting...":"Submit Request · Wasilisha"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }} onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:"monospace", fontWeight:700, color:"#0D3477", fontSize:13 }}>{selected.ref_number}</span>
                  <span style={{ background:`${STATUS_C[selected.status]}18`, color:STATUS_C[selected.status], padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{selected.status}</span>
                </div>
                <div style={{ fontSize:17, fontWeight:800, color:"#03102B", marginTop:4 }}>{selected.title}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16, background:"#F8FAFC", borderRadius:10, padding:14 }}>
              {[
                ["Type", REQUEST_TYPES.find(t=>t.v===selected.type)?.l.split(" / ")[0]||selected.type],
                ["Requested By", selected.requester?.full_name||"—"],
                ["Current Level", LEVEL_LABEL[selected.current_level]||selected.current_level],
                ["Priority", selected.priority],
                ...(selected.amount?[["Amount", `TZS ${selected.amount.toLocaleString()}`]]:[]),
              ].map(([k,v])=>(
                <div key={k}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k.toUpperCase()}</div><div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{v}</div></div>
              ))}
            </div>

            {selected.description && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", marginBottom:6 }}>Justification</div>
                <div style={{ fontSize:13, color:"#475569", lineHeight:1.6, background:"#F8FAFC", borderRadius:8, padding:12 }}>{selected.description}</div>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", marginBottom:10 }}>Approval Trail · Mlolongo</div>
              <div style={{ position:"relative", paddingLeft:20 }}>
                <div style={{ position:"absolute", left:6, top:4, bottom:4, width:2, background:"#E2E8F0" }}/>
                {trail.map(t=>{
                  const aColor = t.action==="approved"?"#059669":t.action==="rejected"?"#DC2626":t.action==="escalated"?"#0891B2":"#0D3477";
                  return (
                    <div key={t.id} style={{ position:"relative", marginBottom:14 }}>
                      <div style={{ position:"absolute", left:-18, top:2, width:10, height:10, borderRadius:"50%", background:aColor, border:"2px solid white" }}/>
                      <div style={{ fontSize:12, fontWeight:700, color:"#1E293B", textTransform:"capitalize" }}>{t.action} {t.to_level&&<span style={{ color:"#0891B2" }}>→ {t.to_level.toUpperCase()}</span>}</div>
                      <div style={{ fontSize:11, color:"#64748B" }}>{t.actor?.full_name||"—"} ({t.actor_role?.replace(/_/g," ")}) · {new Date(t.created_at).toLocaleString("en-GB")}</div>
                      {t.note && <div style={{ fontSize:12, color:"#475569", marginTop:2, fontStyle:"italic" }}>"{t.note}"</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {canApprove(role, selected.current_level) && ["pending","escalated"].includes(selected.status) && tab==="inbox" && (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={S.lbl}>Decision Note (optional)</label>
                  <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Add a note..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={doReject} disabled={acting} style={{ flex:1, height:46, background:"white", color:"#DC2626", border:"2px solid #DC2626", borderRadius:10, fontWeight:700, fontSize:14, cursor:acting?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    <XCircle size={16}/> Reject
                  </button>
                  <button onClick={doApprove} disabled={acting} style={{ flex:2, height:46, background:acting?"#94A3B8":"#059669", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:acting?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    {(() => {
                      const type = REQUEST_TYPES.find(t=>t.v===selected.type);
                      const isFinal = selected.current_level===type?.finalLevel || ["igp","digp","admin_officer"].includes(role);
                      return isFinal ? <><CheckCircle size={16}/> Approve (Final)</> : <><ArrowUp size={16}/> Approve & Escalate</>;
                    })()}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
