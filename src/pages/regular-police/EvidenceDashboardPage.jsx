import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Upload, FolderOpen, X, Camera, Lock, RefreshCw, AlertCircle, Link2, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import PhotoUpload from "../../components/PhotoUpload";

const TYPES = ["Physical Object","Photo / Video","Document","Weapon","Drug Sample","Digital Device","Vehicle Part","Other"];
const STATUSES = [
  { v:"in_custody",  l:"In Custody",  c:"#1D4ED8" },
  { v:"transferred", l:"Transferred", c:"#D97706" },
  { v:"released",    l:"Released",    c:"#059669" },
  { v:"destroyed",   l:"Destroyed",   c:"#DC2626" },
  { v:"archived",    l:"Archived",    c:"#64748B" },
];

export default function EvidenceDashboardPage() {
  const { profile, stationId, regionId, districtId, stationName } = useCurrentUser();
  const [modal,    setModal]    = useState(false);
  const [done,     setDone]     = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [drawer,   setDrawer]   = useState(null); // selected evidence row for chain-of-custody view
  const [chain,    setChain]    = useState([]);
  const [chainLoading, setChainLoading] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [transferForm,  setTransferForm]  = useState({ action:"transfer_to_station", notes:"", toOfficer:"" });
  const [form, setForm] = useState({
    caseId:    "",  // free-text — links to cases.ref_number (resolved by IO)
    type:      "",
    desc:      "",
    loc:       "",  // location_found
    storage:   "",  // storage_location
    date:      "",
    photo_urls: [],
  });

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const updPhotos = urls => setForm(f => ({ ...f, photo_urls: urls }));
  const inp = { width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };

  // ── Load evidence list ──
  async function load() {
    setLoading(true);
    let q = supabase.from("evidence")
      .select("*, profiles!evidence_collected_by_fkey(full_name,badge), cases(ref_number,title)")
      .order("created_at", { ascending:false })
      .limit(200);
    // Station officers see only their station's evidence; CID/command see all
    if (stationId && profile?.role && !["igp","digp","rpc","ocd","cid_officer","forensic_officer","admin_officer"].includes(profile.role)) {
      q = q.eq("station_id", stationId);
    }
    const { data, error } = await q;
    if (error) setErr(`Could not load evidence: ${error.message}`);
    else setItems(data || []);
    setLoading(false);
  }
  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  // ── Load chain-of-custody for selected evidence ──
  async function openDrawer(ev) {
    setDrawer(ev); setChainLoading(true);
    const { data } = await supabase.from("evidence_chain")
      .select("*, profiles!evidence_chain_officer_id_fkey(full_name,badge)")
      .eq("evidence_id", ev.id)
      .order("created_at", { ascending:true });
    setChain(data || []);
    setChainLoading(false);
  }
  function closeDrawer() { setDrawer(null); setChain([]); }

  // ── Submit new evidence ──
  async function submit(e) {
    e.preventDefault();
    if (!profile?.id) { setErr("Officer profile not loaded yet — please wait"); return; }
    setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("evidence").insert({
        type:            form.type,
        description:     form.desc,
        location_found:  form.loc || null,
        storage_location: form.storage || null,
        // case_id is optional — only link if a real case UUID is provided
        // (free-text case reference like INC-2026-001 can't be FK-resolved here)
        collected_by:    profile.id,
        collected_at:    form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        station_id:      stationId  || null,
        region_id:       regionId   || null,
        district_id:     districtId || null,
        photo_urls:      form.photo_urls,
        status:          "in_custody",
        chain_count:     1,
      }).select("*, profiles!evidence_collected_by_fkey(full_name,badge)").single();
      if (error) throw error;

      // Initial chain-of-custody entry
      await supabase.from("evidence_chain").insert({
        evidence_id: data.id,
        officer_id:  profile.id,
        action:      "collected",
        notes:       form.desc ? `Collected at ${form.loc || "unknown location"}` : "Initial collection",
      });

      logAction({
        profile,
        action: "create_evidence",
        entityType: "evidence",
        entityId: data.id,
        entityRef: data.ref_number || data.evidence_no,
        description: `Evidence logged: ${form.type} — ${form.desc?.slice(0,80) || "no description"}`,
      });

      setDone(true);
      await load();
      setTimeout(() => {
        setModal(false); setDone(false);
        setForm({ caseId:"", type:"", desc:"", loc:"", storage:"", date:"", photo_urls:[] });
      }, 2000);
    } catch (e) {
      setErr(e.message || "Could not save evidence");
    } finally {
      setSaving(false);
    }
  }

  // ── Transfer / status change ──
  async function submitTransfer(e) {
    e.preventDefault();
    if (!drawer) return;
    setErr(""); setSaving(true);
    try {
      const action = transferForm.action;
      const notes = transferForm.notes || `${action.replace(/_/g," ")} by ${profile?.full_name || "officer"}`;
      // 1. Insert chain entry
      const { error: chainErr } = await supabase.from("evidence_chain").insert({
        evidence_id: drawer.id,
        officer_id:  profile.id,
        action,
        notes,
      });
      if (chainErr) throw chainErr;
      // 2. Update evidence status + chain_count
      const newStatus = action === "release_to_court" ? "transferred"
                      : action === "destroy" ? "destroyed"
                      : action === "archive" ? "archived"
                      : action === "return_to_owner" ? "released"
                      : "transferred";
      const { error: updErr } = await supabase.from("evidence").update({
        status: newStatus,
        chain_count: (drawer.chain_count || 1) + 1,
      }).eq("id", drawer.id);
      if (updErr) throw updErr;

      logAction({
        profile,
        action: `evidence_${action}`,
        entityType: "evidence",
        entityId: drawer.id,
        entityRef: drawer.ref_number || drawer.evidence_no,
        description: `${action.replace(/_/g," ")} — ${notes}`,
      });

      setTransferModal(false);
      setTransferForm({ action:"transfer_to_station", notes:"", toOfficer:"" });
      await load();
      await openDrawer({ ...drawer, status: newStatus, chain_count: (drawer.chain_count || 1) + 1 });
    } catch (e) {
      setErr(e.message || "Transfer failed");
    } finally {
      setSaving(false);
    }
  }

  const statusMeta = (s) => STATUSES.find(x => x.v === s) || { l: s || "—", c: "#64748B" };

  return (
    <DashboardLayout pageTitle="Evidence" pageTitle2="Ushahidi">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>Evidence <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Ushahidi</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{items.length} items · Chain of custody active · {items.filter(i=>i.status==="in_custody").length} in custody</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} disabled={loading}
            style={{ padding:"9px 14px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:loading?.6:1 }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={() => { setErr(""); setModal(true); }} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
            <Upload size={16}/> Upload Evidence · Pakia
          </button>
        </div>
      </div>

      {err && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", gap:8, alignItems:"center" }}>
          <AlertCircle size={15} color="#DC2626" style={{ flexShrink:0 }}/>
          <span style={{ fontSize:13, color:"#B91C1C", flex:1 }}>{err}</span>
          <button onClick={()=>setErr("")} style={{ background:"transparent", border:"none", color:"#B91C1C", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
        </div>
      )}

      <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"11px 16px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
        <Lock size={16} color="#D97706" />
        <span style={{ fontSize:13, color:"#92400E", fontWeight:600 }}>Chain of Custody Active · Every collection, transfer, release, and destruction is logged with officer ID, timestamp & notes</span>
      </div>

      {loading ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>Loading evidence...</div>
      ) : items.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
          <FolderOpen size={48} style={{ opacity:.2, marginBottom:14 }} />
          <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No evidence uploaded yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Ushahidi haujapakuliwa bado</div>
          <button onClick={() => setModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Upload First Evidence
          </button>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                {["Ref","Case","Type","Description","Storage","Collected By","Collected At","Chain","Status",""].map(h => (
                  <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((ev, i) => {
                const sm = statusMeta(ev.status);
                return (
                  <tr key={ev.id} style={{ borderBottom:i<items.length-1?"1px solid #F1F5F9":"none", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#FAFAFE"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    onClick={()=>openDrawer(ev)}>
                    <td style={{ padding:"12px 14px", fontWeight:700, color:"#7C3AED", fontSize:12, fontFamily:"monospace" }}>{ev.ref_number || ev.evidence_no || ev.id.slice(-8)}</td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:"#0D3477", fontWeight:600 }}>{ev.cases?.ref_number || ev.cases?.case_no || (ev.case_id ? "linked" : "—")}</td>
                    <td style={{ padding:"12px 14px", fontSize:13 }}>{ev.type}</td>
                    <td style={{ padding:"12px 14px", fontSize:13, maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={ev.description}>{ev.description || "—"}</td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:"#64748B" }}>{ev.storage_location || "—"}</td>
                    <td style={{ padding:"12px 14px", fontSize:12 }}>{ev.profiles?.full_name || "—"}</td>
                    <td style={{ padding:"12px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{ev.collected_at ? new Date(ev.collected_at).toLocaleString("en-GB") : "—"}</td>
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      <span style={{ background:"#F5F3FF", color:"#7C3AED", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>#{ev.chain_count || 1}</span>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ background:`${sm.c}18`, color:sm.c, padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{sm.l}</span>
                    </td>
                    <td style={{ padding:"12px 14px", textAlign:"right" }}>
                      <ChevronRight size={14} color="#94A3B8"/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ───── Upload modal ───── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}>
          <div style={{ background:"white", borderRadius:20, padding:30, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#7C3AED" }}>Upload Evidence · Pakia Ushahidi</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Chain of Custody will be initiated automatically</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
            </div>
            {done ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📁</div>
                <h3 style={{ color:"#16A34A" }}>Evidence Uploaded!</h3>
                <p style={{ color:"#94A3B8", fontSize:13 }}>Ushahidi umepakiwa · Chain of custody started</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Case / Incident Ref (optional)</label>
                  <input type="text" value={form.caseId} onChange={upd("caseId")} placeholder="e.g. CASE-2026-001 (link from Cases page)" style={inp}
                    onFocus={e => e.target.style.borderColor="#7C3AED"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Evidence Type *</label>
                  <select value={form.type} onChange={upd("type")} required style={{ ...inp, paddingLeft:12 }}>
                    <option value="">Select type...</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Description · Maelezo *</label>
                  <textarea value={form.desc} onChange={upd("desc")} rows={3} required style={{ ...inp, height:"auto", padding:"10px 12px" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Collection Location · Mahali</label>
                    <input type="text" value={form.loc} onChange={upd("loc")} placeholder="GPS or address" style={inp}/>
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Storage Location · Hifadhi</label>
                    <input type="text" value={form.storage} onChange={upd("storage")} placeholder="e.g. Evidence Room B-3" style={inp}/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Date Collected · Tarehe</label>
                  <input type="date" value={form.date} onChange={upd("date")} style={inp}/>
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>Photos / Attachments</label>
                  <PhotoUpload value={form.photo_urls} onChange={updPhotos} max={5} />
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#A78BFA":"#7C3AED", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving ? "Saving..." : "Submit Evidence · Wasilisha"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ───── Chain of Custody drawer ───── */}
      {drawer && (
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(480px, 100vw)", background:"white", boxShadow:"-8px 0 32px rgba(0,0,0,.15)", zIndex:110, display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"white", zIndex:1 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#7C3AED", letterSpacing:.5, textTransform:"uppercase" }}>Chain of Custody</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#0D3477", fontFamily:"monospace" }}>{drawer.ref_number || drawer.evidence_no || drawer.id.slice(-8)}</div>
            </div>
            <button onClick={closeDrawer} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
          </div>

          <div style={{ padding:"18px 22px", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Type</div><div style={{ fontSize:13, fontWeight:600 }}>{drawer.type}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Status</div>
                <span style={{ background:`${statusMeta(drawer.status).c}18`, color:statusMeta(drawer.status).c, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700 }}>{statusMeta(drawer.status).l}</span>
              </div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Collected By</div><div style={{ fontSize:13 }}>{drawer.profiles?.full_name || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Collected At</div><div style={{ fontSize:12 }}>{drawer.collected_at ? new Date(drawer.collected_at).toLocaleString("en-GB") : "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Location Found</div><div style={{ fontSize:13 }}>{drawer.location_found || drawer.location || "—"}</div></div>
              <div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>Storage</div><div style={{ fontSize:13 }}>{drawer.storage_location || "—"}</div></div>
            </div>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>Description</div>
            <div style={{ fontSize:13, color:"#1E293B", lineHeight:1.5 }}>{drawer.description || "—"}</div>
          </div>

          <div style={{ padding:"18px 22px", flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#0D3477", marginBottom:12, display:"flex", alignItems:"center", gap:7 }}>
              <Link2 size={14}/> Custody Trail ({chain.length})
            </div>
            {chainLoading ? (
              <div style={{ padding:20, textAlign:"center", color:"#94A3B8" }}>Loading trail...</div>
            ) : chain.length === 0 ? (
              <div style={{ padding:20, textAlign:"center", color:"#94A3B8", fontSize:13 }}>No chain entries recorded</div>
            ) : (
              <div style={{ position:"relative", paddingLeft:20 }}>
                <div style={{ position:"absolute", left:7, top:6, bottom:6, width:2, background:"#E2E8F0" }}/>
                {chain.map((c, i) => (
                  <div key={c.id} style={{ position:"relative", marginBottom:14 }}>
                    <div style={{ position:"absolute", left:-19, top:4, width:12, height:12, borderRadius:"50%", background:"#7C3AED", border:"2px solid white", boxShadow:"0 0 0 2px #F5F3FF" }}/>
                    <div style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>{new Date(c.created_at).toLocaleString("en-GB")}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0D3477", textTransform:"capitalize" }}>{c.action?.replace(/_/g," ")}</div>
                    <div style={{ fontSize:12, color:"#64748B" }}>By {c.profiles?.full_name || "Officer"} {c.profiles?.badge ? `· ${c.profiles.badge}` : ""}</div>
                    {c.notes && <div style={{ fontSize:12, color:"#475569", marginTop:3, fontStyle:"italic" }}>"{c.notes}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {drawer.status === "in_custody" && (
            <div style={{ padding:"18px 22px", borderTop:"1px solid #E2E8F0", background:"#F8FAFC" }}>
              <button onClick={() => setTransferModal(true)}
                style={{ width:"100%", padding:"11px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                Transfer / Release / Destroy
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───── Transfer modal ───── */}
      {transferModal && drawer && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:120, padding:20 }}>
          <div style={{ background:"white", borderRadius:16, padding:26, width:"100%", maxWidth:440 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <div style={{ fontSize:16, fontWeight:800, color:"#7C3AED" }}>Update Custody Status</div>
              <button onClick={()=>setTransferModal(false)} style={{ width:28, height:28, borderRadius:6, background:"#F1F5F9", border:"none", cursor:"pointer" }}><X size={14}/></button>
            </div>
            <form onSubmit={submitTransfer}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", marginBottom:6 }}>Action *</label>
                <select value={transferForm.action} onChange={e=>setTransferForm(f=>({...f, action:e.target.value}))} required style={inp}>
                  <option value="transfer_to_station">Transfer to Another Station</option>
                  <option value="transfer_to_lab">Transfer to Forensic Lab</option>
                  <option value="release_to_court">Release to Court</option>
                  <option value="return_to_owner">Return to Owner</option>
                  <option value="destroy">Destroy (per court order)</option>
                  <option value="archive">Archive</option>
                </select>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", marginBottom:6 }}>Notes</label>
                <textarea value={transferForm.notes} onChange={e=>setTransferForm(f=>({...f, notes:e.target.value}))} rows={3} placeholder="Reason, destination, recipient..." style={{ ...inp, height:"auto", padding:"10px 12px" }}/>
              </div>
              <button type="submit" disabled={saving} style={{ width:"100%", height:42, background:saving?"#A78BFA":"#7C3AED", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:saving?"not-allowed":"pointer" }}>
                {saving ? "Saving..." : "Confirm Action"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
