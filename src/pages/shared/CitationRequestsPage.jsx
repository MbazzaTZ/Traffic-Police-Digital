// CitationRequestsPage
// =====================
// Single page for the citation_requests lateral escalation flow.
//
// WHO SEES WHAT:
//   regular_officer / inspector  -> "My Citation Requests" + Create button
//   traffic_officer              -> "Incoming Requests" with Issue/Reject actions
//   ocs/ocd/rpc/igp/admin        -> "All Citation Requests" (read-only)
//
// CREATE FLOW (regular officer):
//   1. Click "Flag for Citation"
//   2. Fill in plate, offense (dropdown from fine_schedule), location, photos
//   3. Submit -> status='pending', visible to traffic officers at same station
//
// REVIEW FLOW (traffic officer):
//   1. See list of pending requests at their station
//   2. Click a request to open the review drawer
//   3. Either:
//      - "Issue Citation" -> creates traffic_citations row + sets status='issued'
//      - "Reject" -> requires reason, status='rejected'
//
// All actions audited.
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import TrafficLayout from "../../layouts/TrafficLayout";
import CIDLayout from "../../layouts/CIDLayout";
import CommandLayout from "../../layouts/CommandLayout";
import {
  Car, Plus, X, CheckCircle, AlertTriangle, Search, FileText,
  Clock, Send, Eye, MapPin, Camera, ArrowRight, Ban,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import PhotoUpload from "../../components/PhotoUpload";

function RoleLayout({ role, children, ...props }) {
  if (role === "traffic_officer") return <TrafficLayout {...props}>{children}</TrafficLayout>;
  if (role === "cid_officer" || role === "forensic_officer") return <CIDLayout {...props}>{children}</CIDLayout>;
  if (role === "igp" || role === "digp" || role === "rpc") return <CommandLayout {...props}>{children}</CommandLayout>;
  return <DashboardLayout {...props}>{children}</DashboardLayout>;
}

const STATUS_C = { pending:"#D97706", issued:"#059669", rejected:"#DC2626", cancelled:"#94A3B8" };
const S = {
  inp: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel: { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl: { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:0.4, marginBottom:5 },
};

export default function CitationRequestsPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { profile, stationId, regionId, fullName } = useCurrentUser();
  const isTraffic = profile?.role === "traffic_officer";
  const isRequester = ["regular_officer","inspector","ocs","ocd"].includes(profile?.role);

  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [drawer,   setDrawer]   = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");
  const [tab,      setTab]      = useState(isTraffic ? "pending" : "mine");

  // Create form
  const [form, setForm] = useState({
    vehicle_plate:"", driver_name:"", driver_nida:"", driver_phone:"",
    offense_type:"", fine_schedule_id:"", location_text:"",
    officer_notes:"", photo_urls:[],
  });
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Reject form
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    let q = supabase
      .from("citation_requests")
      .select("*, requester:profiles!cr_requester_fk(full_name,badge), reviewer:profiles!cr_reviewer_fk(full_name,badge)")
      .order("created_at", { ascending:false })
      .limit(200);

    if (tab === "mine") {
      q = q.eq("requester_id", profile?.id || "00000000-0000-0000-0000-000000000000");
    } else if (tab === "pending") {
      q = q.eq("status", "pending");
      if (stationId) q = q.eq("station_id", stationId);  // traffic sees their own station's pending
    }
    // 'all' applies no filter

    const { data, error } = await q;
    if (!error) setRequests(data || []);
    setLoading(false);
  }

  async function loadSchedule() {
    const { data } = await supabase.from("fine_schedule").select("*").eq("active", true).order("offense_name");
    setSchedule(data || []);
  }

  useEffect(() => { if (profile !== undefined) load(); }, [profile, tab]);
  useEffect(() => { loadSchedule(); }, []);

  // If we arrived with a prefill (from VehicleProfilePage's "Flag for
  // Citation" button), populate the form and auto-open the modal.
  // Then clear the state so a refresh doesn't keep re-opening it.
  useEffect(() => {
    const prefill = loc.state?.prefill;
    if (prefill && isRequester) {
      setForm(f => ({ ...f, ...prefill }));
      setModal(true);
      nav(loc.pathname, { replace:true, state:null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.state]);

  async function submitCreate(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const sched = schedule.find(s => s.id === form.fine_schedule_id);
      const { data, error } = await supabase.from("citation_requests").insert({
        ...form,
        offense_type:   form.offense_type || sched?.offense_name || null,
        requester_id:   profile?.id || null,
        station_id:     stationId || null,
        region_id:      regionId || null,
        status:         "pending",
      }).select().single();
      if (error) throw error;

      logAction({
        profile, action:"flag_citation", entityType:"citation_request",
        entityId: data.id, entityRef: data.ref_number,
        description: `Flagged ${data.vehicle_plate} for ${data.offense_type} - awaiting traffic officer`,
      });

      setDone(true); await load();
      setTimeout(() => {
        setModal(false); setDone(false);
        setForm({ vehicle_plate:"", driver_name:"", driver_nida:"", driver_phone:"", offense_type:"", fine_schedule_id:"", location_text:"", officer_notes:"", photo_urls:[] });
      }, 2200);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function issueCitation() {
    if (!drawer) return;
    setErr(""); setSaving(true);
    try {
      // 1. Create the actual traffic_citation
      const sched = schedule.find(s => s.id === drawer.fine_schedule_id);
      const { data: cit, error: cErr } = await supabase.from("traffic_citations").insert({
        vehicle_plate:    drawer.vehicle_plate,
        vehicle_id:       drawer.vehicle_id || null,
        driver_name:      drawer.driver_name,
        driver_nida:      drawer.driver_nida,
        offense_type:     drawer.offense_type,
        fine_amount:      sched?.fine_amount || 0,
        fine_schedule_id: drawer.fine_schedule_id,
        location_text:    drawer.location_text,
        status:           "open",
        officer_id:       profile?.id || null,
        station_id:       stationId || null,
        region_id:        regionId || null,
      }).select().single();
      if (cErr) throw cErr;

      // 2. Update the request to issued + link to the citation
      const { error: uErr } = await supabase.from("citation_requests").update({
        status:        "issued",
        reviewed_by:   profile?.id || null,
        reviewed_at:   new Date().toISOString(),
        citation_id:   cit.id,
      }).eq("id", drawer.id);
      if (uErr) throw uErr;

      logAction({
        profile, action:"issue_citation_from_request", entityType:"citation_request",
        entityId: drawer.id, entityRef: drawer.ref_number,
        description: `Issued citation ${cit.ref_number} for ${drawer.vehicle_plate} (request ${drawer.ref_number})`,
      });

      setDrawer(null); await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function doReject() {
    if (!drawer || !rejectReason.trim()) {
      setErr("Please provide a reason for rejection."); return;
    }
    setErr(""); setSaving(true);
    try {
      const { error } = await supabase.from("citation_requests").update({
        status:           "rejected",
        reviewed_by:      profile?.id || null,
        reviewed_at:      new Date().toISOString(),
        rejection_reason: rejectReason,
      }).eq("id", drawer.id);
      if (error) throw error;

      logAction({
        profile, action:"reject_citation_request", entityType:"citation_request",
        entityId: drawer.id, entityRef: drawer.ref_number,
        description: `Rejected: ${rejectReason}`,
      });

      setRejectModal(false); setRejectReason("");
      setDrawer(null); await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const pendingCount  = requests.filter(r => r.status === "pending").length;
  const issuedCount   = requests.filter(r => r.status === "issued").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <RoleLayout role={profile?.role} pageTitle="Citation Requests" pageTitle2="Maombi ya Faini">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>
            Citation Requests <span style={{ color:"#94A3B8", fontWeight:500, fontSize:16 }}>· Maombi ya Faini</span>
          </h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>
            {isTraffic
              ? "Requests from regular officers awaiting your review"
              : "Flag a traffic offense — a traffic officer will review and issue the citation"}
          </p>
        </div>
        {isRequester && (
          <button onClick={() => { setErr(""); setModal(true); }}
            style={{ padding:"10px 18px", borderRadius:10, border:"none", background:"#D97706", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
            <Plus size={15}/> Flag for Citation
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        <Stat color="#D97706" label="Pending" value={pendingCount}/>
        <Stat color="#059669" label="Issued" value={issuedCount}/>
        <Stat color="#DC2626" label="Rejected" value={rejectedCount}/>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, borderBottom:"1px solid #E2E8F0", marginBottom:14 }}>
        {isTraffic && <TabBtn k="pending" tab={tab} setTab={setTab} label="Pending Review"/>}
        {isRequester && <TabBtn k="mine" tab={tab} setTab={setTab} label="My Requests"/>}
        <TabBtn k="all" tab={tab} setTab={setTab} label="All"/>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding:"40px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div style={{ padding:"50px 20px", textAlign:"center", color:"#94A3B8", background:"white", borderRadius:14, border:"1px solid #E2E8F0" }}>
          <FileText size={36} style={{ opacity:.2, marginBottom:10 }}/>
          <div style={{ fontSize:13 }}>No citation requests in this view</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {requests.map(r => {
            const sc = STATUS_C[r.status] || "#94A3B8";
            return (
              <div key={r.id} onClick={() => setDrawer(r)}
                style={{ background:"white", border:"1px solid #E2E8F0", borderLeft:`4px solid ${sc}`, borderRadius:12, padding:14, cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
                  <div style={{ flex:"1 1 200px", minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                      <span style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", padding:"2px 8px", borderRadius:6, fontWeight:800, fontFamily:"monospace", fontSize:13 }}>{r.vehicle_plate || "—"}</span>
                      <span style={{ fontSize:11, color:"#94A3B8", fontFamily:"monospace" }}>{r.ref_number}</span>
                      <span style={{ background:`${sc}18`, color:sc, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{r.status}</span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{r.offense_type}</div>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:3 }}>
                      {r.driver_name || "Driver unknown"} · {r.location_text || "Location not given"}
                    </div>
                    <div style={{ fontSize:10, color:"#94A3B8", marginTop:3 }}>
                      Flagged by {r.requester?.full_name || "—"} · {new Date(r.created_at).toLocaleString("en-GB")}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    {(r.photo_urls?.length || 0) > 0 && (
                      <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#64748B" }}>
                        <Camera size={12}/> {r.photo_urls.length}
                      </span>
                    )}
                    <Eye size={14} color="#94A3B8"/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE MODAL (regular officer flags offense) ─── */}
      {modal && (
        <div onClick={e=>e.target===e.currentTarget && !saving && setModal(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:14 }}>
          <div style={{ background:"white", borderRadius:18, padding:24, width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#D97706" }}>Flag for Citation · Pendekeza Faini</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>A traffic officer will review and issue if appropriate</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer" }}><X size={16}/></button>
            </div>

            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/>
                <h3 style={{ color:"#16A34A", margin:0 }}>Citation Request Sent</h3>
                <p style={{ fontSize:13, color:"#64748B", marginTop:6 }}>A traffic officer at your station will review it.</p>
              </div>
            ) : (
              <form onSubmit={submitCreate}>
                {err && (
                  <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}>
                    <AlertTriangle size={14}/>{err}
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
                  <div style={{ marginBottom:13, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Plate Number · Namba ya Gari *</label>
                    <input value={form.vehicle_plate} onChange={upd("vehicle_plate")} required placeholder="T123ABC" style={{ ...S.inp, fontFamily:"monospace", fontWeight:700, textTransform:"uppercase" }}/>
                  </div>
                  <div style={{ marginBottom:13 }}>
                    <label style={S.lbl}>Driver Name · Jina la Dereva</label>
                    <input value={form.driver_name} onChange={upd("driver_name")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:13 }}>
                    <label style={S.lbl}>NIDA</label>
                    <input value={form.driver_nida} onChange={upd("driver_nida")} style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:13, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Offense · Kosa *</label>
                    <select value={form.fine_schedule_id} onChange={upd("fine_schedule_id")} required style={S.sel}>
                      <option value="">— Select offense —</option>
                      {schedule.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.offense_name} · {(s.fine_amount||0).toLocaleString()} TZS
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom:13, gridColumn:"1/-1" }}>
                    <label style={S.lbl}><MapPin size={11} style={{display:"inline",marginRight:3}}/>Location · Eneo</label>
                    <input value={form.location_text} onChange={upd("location_text")} placeholder="e.g. Morogoro Rd, near junction" style={S.inp}/>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <label style={S.lbl}>Officer Notes · Maelezo ya Afisa</label>
                    <textarea value={form.officer_notes} onChange={upd("officer_notes")} rows={3} placeholder="What did you observe? Time, behaviour, context..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}>
                    <PhotoUpload
                      folder="citation_requests"
                      value={form.photo_urls}
                      onChange={(urls)=>setForm(f=>({...f, photo_urls:urls}))}
                      maxFiles={5}
                      label="Evidence Photos · Picha za Ushahidi"
                      hint="Photos strengthen the case - plate, scene, violation"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#D97706", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <Send size={15}/> {saving ? "Submitting..." : "Submit to Traffic"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── REVIEW DRAWER ─── */}
      {drawer && (
        <div onClick={e=>e.target===e.currentTarget && setDrawer(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:95, display:"flex", justifyContent:"flex-end" }}>
          <div style={{ background:"#F8FAFC", width:"100%", maxWidth:500, height:"100vh", overflowY:"auto", boxShadow:"-10px 0 32px rgba(0,0,0,.18)" }}>
            <div style={{ background:`linear-gradient(135deg, ${STATUS_C[drawer.status]}, ${STATUS_C[drawer.status]}CC)`, color:"white", padding:"22px 22px 26px", position:"relative" }}>
              <button onClick={() => setDrawer(null)} aria-label="Close" style={{ position:"absolute", top:14, right:14, width:32, height:32, borderRadius:8, border:"none", background:"rgba(255,255,255,.18)", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <Car size={20}/>
                <span style={{ fontSize:18, fontWeight:800, fontFamily:"monospace" }}>{drawer.vehicle_plate}</span>
              </div>
              <div style={{ fontSize:13, opacity:.95, marginBottom:8 }}>{drawer.offense_type}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ background:"rgba(255,255,255,.2)", padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{drawer.status}</span>
                <span style={{ background:"rgba(255,255,255,.2)", padding:"3px 9px", borderRadius:999, fontSize:10, fontWeight:700, fontFamily:"monospace" }}>{drawer.ref_number}</span>
              </div>
            </div>

            <div style={{ padding:18 }}>
              {err && (
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:12, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}>
                  <AlertTriangle size={14}/>{err}
                </div>
              )}

              <DSection title="Driver">
                <DRow label="Name"  value={drawer.driver_name}/>
                <DRow label="NIDA"  value={drawer.driver_nida}/>
                <DRow label="Phone" value={drawer.driver_phone}/>
              </DSection>

              <DSection title="Encounter">
                <DRow label="Location"   value={drawer.location_text}/>
                <DRow label="Observed at" value={drawer.observed_at ? new Date(drawer.observed_at).toLocaleString("en-GB") : "—"}/>
                <DRow label="Notes"      value={drawer.officer_notes} prelined/>
              </DSection>

              {drawer.photo_urls?.length > 0 && (
                <DSection title={`Evidence Photos (${drawer.photo_urls.length})`}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {drawer.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ width:90, height:90, borderRadius:9, overflow:"hidden", border:"1px solid #E2E8F0", display:"block" }}>
                        <img src={url} alt={`evidence-${i}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                      </a>
                    ))}
                  </div>
                </DSection>
              )}

              <DSection title="Chain of Custody">
                <DRow label="Flagged by" value={drawer.requester ? `${drawer.requester.full_name} (${drawer.requester.badge})` : "—"}/>
                <DRow label="Flagged at" value={new Date(drawer.created_at).toLocaleString("en-GB")}/>
                {drawer.reviewed_at && <DRow label="Reviewed by" value={drawer.reviewer ? `${drawer.reviewer.full_name} (${drawer.reviewer.badge})` : "—"}/>}
                {drawer.reviewed_at && <DRow label="Reviewed at" value={new Date(drawer.reviewed_at).toLocaleString("en-GB")}/>}
                {drawer.rejection_reason && <DRow label="Reject reason" value={drawer.rejection_reason} prelined/>}
                {drawer.citation_id && <DRow label="Citation ID" value={drawer.citation_id} mono/>}
              </DSection>

              {/* Actions - only traffic officers, only when pending */}
              {isTraffic && drawer.status === "pending" && (
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button onClick={issueCitation} disabled={saving}
                    style={{ flex:1, padding:"12px 14px", borderRadius:10, border:"none", background:saving?"#94A3B8":"#16A34A", color:"white", fontWeight:700, fontSize:13, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    <CheckCircle size={15}/> Issue Citation
                  </button>
                  <button onClick={() => setRejectModal(true)} disabled={saving}
                    style={{ padding:"12px 16px", borderRadius:10, border:"1px solid #FECACA", background:"#FEF2F2", color:"#DC2626", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
                    <Ban size={15}/> Reject
                  </button>
                </div>
              )}

              {/* Read-only state for issued */}
              {drawer.status === "issued" && drawer.citation_id && (
                <button onClick={() => nav("/traffic/citations")}
                  style={{ width:"100%", marginTop:14, padding:"12px 14px", borderRadius:10, border:"1px solid #0D3477", background:"white", color:"#0D3477", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  Go to Citation <ArrowRight size={14}/>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECT MODAL ─── */}
      {rejectModal && (
        <div onClick={e=>e.target===e.currentTarget && !saving && setRejectModal(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:120, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"white", borderRadius:14, padding:22, maxWidth:440, width:"100%" }}>
            <h3 style={{ margin:"0 0 10px", fontSize:16, fontWeight:800, color:"#DC2626" }}>Reject Citation Request</h3>
            <p style={{ fontSize:12, color:"#64748B", margin:"0 0 12px" }}>The requesting officer will see your reason in their audit log.</p>
            <label style={S.lbl}>Reason · Sababu *</label>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={4} placeholder="Why is this not appropriate to issue as a citation?" style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical", marginBottom:14 }}/>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={() => setRejectModal(false)} disabled={saving}
                style={{ padding:"8px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={doReject} disabled={saving || !rejectReason.trim()}
                style={{ padding:"8px 18px", borderRadius:8, border:"none", background:saving?"#94A3B8":"#DC2626", color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {saving ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

function Stat({ color, label, value }) {
  return (
    <div style={{ background:"white", borderRadius:12, padding:"14px 16px", border:"1px solid #E2E8F0", borderTop:`4px solid ${color}`, textAlign:"center" }}>
      <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:700, color:"#1E293B", marginTop:4, textTransform:"uppercase", letterSpacing:0.3 }}>{label}</div>
    </div>
  );
}
function TabBtn({ k, tab, setTab, label }) {
  const active = tab === k;
  return (
    <button onClick={() => setTab(k)}
      style={{ padding:"10px 14px", border:"none", background:"transparent", borderBottom:active?"2px solid #0D3477":"2px solid transparent", color:active?"#0D3477":"#64748B", fontWeight:active?700:600, fontSize:13, cursor:"pointer" }}>
      {label}
    </button>
  );
}
function DSection({ title, children }) {
  return (
    <div style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0", padding:"14px 16px", marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}
function DRow({ label, value, mono, prelined }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, padding:"5px 0", borderBottom:"1px solid #F1F5F9" }}>
      <span style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.4 }}>{label}</span>
      <span style={{ fontSize:13, color:"#1E293B", textAlign:"right", fontFamily:mono?"monospace":"inherit", whiteSpace:prelined?"pre-line":"normal", wordBreak:"break-word" }}>{value || "—"}</span>
    </div>
  );
}
