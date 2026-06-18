import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { UserPlus, Search, Users, Eye, Edit, Trash2, X, Save, Phone, Mail, Shield, MapPin, Calendar, AlertTriangle, CheckCircle, KeyRound, Copy } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const ROLE_LABELS = { regular_officer:"Regular Officer", traffic_officer:"Traffic Officer", cid_officer:"CID Officer", forensic_officer:"Forensic Officer", ocs:"OCS", ocd:"OCD", rpc:"RPC", igp:"IGP", admin_officer:"Admin Officer" };
const RANKS = ["Constable","Corporal","Sergeant","Staff Sergeant","Inspector","Assistant Inspector","Chief Inspector","Assistant Superintendent","Senior Assistant Superintendent","Superintendent","Senior Superintendent","Assistant Commissioner","Senior Assistant Commissioner","Commissioner","Inspector General"];
const ROLES = ["regular_officer","traffic_officer","cid_officer","forensic_officer","ocs","ocd","rpc","admin_officer"];
const STATUSES = ["active","pending","suspended"];

export default function OfficersPage() {
  const nav = useNavigate();
  const {
    officers, deleteOfficer, refresh,
    regions, districts, wards, stations,
    regionName, districtName, wardName,
  } = useAppData();
  const { profile: currentProfile } = useCurrentUser();
  const [search, setSearch]             = useState("");
  const [filterRole, setFilterRole]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Action modals
  const [viewOfficer, setViewOfficer] = useState(null);
  const [editOfficer, setEditOfficer] = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [resetOfficer, setResetOfficer] = useState(null);
  const [resetForm,    setResetForm]    = useState({ new_password:"", confirm:"" });
  const [resetShown,   setResetShown]   = useState(false);
  const [resetDone,    setResetDone]    = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState("");
  const [toast,       setToast]       = useState("");

  // Cascading dropdown options derived from selected IDs
  const editDistricts = editForm.region_id   ? districts.filter(d => d.region_id   === editForm.region_id)   : [];
  const editWards     = editForm.district_id ? wards.filter(w     => w.district_id === editForm.district_id) : [];
  const editStations  = editForm.region_id
    ? stations.filter(s => {
        if (editForm.ward_id)     return s.ward_id     === editForm.ward_id;
        if (editForm.district_id) return s.district_id === editForm.district_id;
        return s.region_id === editForm.region_id;
      })
    : stations;

  const roles = ["All", ...new Set(officers.map(o => o.role).filter(Boolean))];
  const filtered = officers.filter(o => {
    const ms  = !search || o.full_name?.toLowerCase().includes(search.toLowerCase()) || o.badge?.includes(search);
    const mr  = filterRole==="All"   || o.role===filterRole;
    const mst = filterStatus==="All" || o.status===filterStatus;
    return ms && mr && mst;
  });

  function openEdit(o) {
    setEditOfficer(o);
    setEditForm({
      full_name:   o.full_name   || "",
      email:       o.email       || "",
      phone:       o.phone       || "",
      badge:       o.badge       || "",
      rank:        o.rank        || "",
      role:        o.role        || "",
      status:      o.status      || "active",
      region_id:   o.region_id   || "",
      district_id: o.district_id || "",
      ward_id:     o.ward_id     || "",
      station_id:  o.station_id  || "",
    });
    setErr("");
  }

  async function saveEdit() {
    setSaving(true); setErr("");
    try {
      // Empty strings can't be sent to UUID columns - Supabase rejects them.
      // Convert blanks to null so the column can hold "not set".
      const payload = { ...editForm };
      ["region_id","district_id","ward_id","station_id","email","phone"].forEach(k => {
        if (payload[k] === "") payload[k] = null;
      });
      const { error } = await supabase.from("profiles")
        .update(payload).eq("id", editOfficer.id);
      if (error) throw error;
      logAction({
        profile: currentProfile, action: "update_officer",
        entityType:"profile", entityId: editOfficer.id, entityRef: editOfficer.badge,
        description: `Updated ${editOfficer.full_name}`,
      });
      setEditOfficer(null);
      setToast(`Updated ${editForm.full_name}`);
      setTimeout(()=>setToast(""), 3000);
      if (refresh) refresh();
    } catch (e) {
      setErr(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function openReset(o) {
    setResetOfficer(o);
    setResetForm({ new_password:"", confirm:"" });
    setResetShown(false);
    setResetDone(null);
    setErr("");
  }

  async function doResetPassword() {
    if (!resetOfficer) return;
    setErr("");
    if (resetForm.new_password.length < 6) {
      setErr("Password must be at least 6 characters."); return;
    }
    if (resetForm.new_password !== resetForm.confirm) {
      setErr("Passwords don't match."); return;
    }
    if (resetOfficer.id === currentProfile?.id) {
      setErr("Use the Forgot Password flow to reset your own password."); return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session expired - please sign in again.");

      const resp = await supabase.functions.invoke("admin-reset-password", {
        body: {
          target_user_id: resetOfficer.id,
          new_password:   resetForm.new_password,
        },
      });

      if (resp.error) {
        const ctx = resp.error.context;
        let msg = resp.error.message;
        if (ctx && typeof ctx.json === "function") {
          try { const j = await ctx.json(); if (j?.error) msg = j.error; } catch {}
        }
        throw new Error(msg);
      }
      if (resp.data?.error) throw new Error(resp.data.error);

      setResetDone({
        email:    resp.data?.target_email || resetOfficer.email,
        password: resetForm.new_password,
      });
      logAction({
        profile: currentProfile, action: "admin_password_reset",
        entityType:"profile", entityId: resetOfficer.id, entityRef: resetOfficer.badge,
        description: `Reset password for ${resetOfficer.full_name}`,
      });
    } catch (e) {
      setErr(e.message || "Password reset failed");
    } finally {
      setSaving(false);
    }
  }

  function generatePassword() {
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digit = "23456789";
    const sym   = "!@#$%&*";
    const all   = lower + upper + digit + sym;
    let p = "";
    p += lower[Math.floor(Math.random() * lower.length)];
    p += upper[Math.floor(Math.random() * upper.length)];
    p += digit[Math.floor(Math.random() * digit.length)];
    p += sym[Math.floor(Math.random() * sym.length)];
    for (let i = 0; i < 8; i++) p += all[Math.floor(Math.random() * all.length)];
    p = p.split("").sort(() => Math.random() - 0.5).join("");
    setResetForm({ new_password: p, confirm: p });
    setResetShown(true);
  }

  async function copyPassword() {
    if (!resetDone) return;
    try {
      await navigator.clipboard.writeText(`Email: ${resetDone.email}\nPassword: ${resetDone.password}`);
      setToast("Credentials copied to clipboard");
      setTimeout(()=>setToast(""), 3000);
    } catch { /* ignore */ }
  }

  async function doDelete() {
    if (!confirmDel) return;
    setSaving(true); setErr("");
    try {
      // Defensive: don't let an admin delete themselves
      if (confirmDel.id === currentProfile?.id) {
        throw new Error("You cannot delete your own account.");
      }
      await deleteOfficer(confirmDel.id, { confirm: true });
      logAction({
        profile: currentProfile, action: "delete_officer",
        entityType:"profile", entityId: confirmDel.id, entityRef: confirmDel.badge,
        description: `Deleted ${confirmDel.full_name}`,
      });
      setToast(`Deleted ${confirmDel.full_name}`);
      setTimeout(()=>setToast(""), 3000);
      setConfirmDel(null);
    } catch (e) {
      setErr(e.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  const lbl = { display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:0.4, marginBottom:5 };
  const inp = { width:"100%", height:40, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" };
  const sel = { ...inp, background:"white" };

  return (
    <AdminLayout pageTitle="Officers" pageTitle2="Maafisa Wote">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#03102B", margin:0 }}>
            Officers <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Maafisa</span>
          </h1>
          <p style={{ color:"#64748B", marginTop:3 }}>{officers.length} officers registered</p>
        </div>
        <button onClick={() => nav("/admin/create-user")}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <UserPlus size={16} /> Create Officer
        </button>
      </div>

      {toast && (
        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"10px 14px", marginBottom:14, color:"#166534", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
          <CheckCircle size={15}/> {toast}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Total",     v:officers.length,                                                         c:"#0D3477" },
          { label:"Active",    v:officers.filter(o=>(o.status||"").toLowerCase()==="active").length,      c:"#059669" },
          { label:"Pending",   v:officers.filter(o=>(o.status||"").toLowerCase()==="pending").length,     c:"#D97706" },
          { label:"Suspended", v:officers.filter(o=>(o.status||"").toLowerCase()==="suspended").length,   c:"#DC2626" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 240px", display:"flex", alignItems:"center", gap:8, background:"white", border:"1px solid #E2E8F0", borderRadius:10, padding:"0 12px", height:42 }}>
          <Search size={14} color="#94A3B8"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or badge..." style={{ border:"none", outline:"none", flex:1, fontSize:13, background:"transparent" }}/>
        </div>
        <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} style={{ ...sel, height:42, maxWidth:170 }}>
          {roles.map(r=><option key={r} value={r}>{r==="All"?"All Roles":ROLE_LABELS[r]||r}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ ...sel, height:42, maxWidth:140 }}>
          <option value="All">All Status</option>
          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length===0 ? (
        <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8", background:"white", borderRadius:14, border:"1px solid #E2E8F0" }}>
          <Users size={40} style={{ opacity:.2, marginBottom:10 }}/>
          <div style={{ fontSize:14 }}>No officers match your filters</div>
          <button onClick={()=>nav("/admin/create-user")} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#0D3477", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Create First Officer
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
              {["Officer","Badge","Rank","Role","Region / Station","Status","Actions"].map(h=>(
                <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:0.4 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(o=>(
                <tr key={o.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:"#0D3477", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800 }}>
                        {(o.full_name||"?").split(" ").map(n=>n[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{o.full_name||"—"}</div>
                        <div style={{ fontSize:11, color:"#94A3B8" }}>{o.phone||o.email||"—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", fontSize:12, fontWeight:700, color:"#0D3477" }}>{o.badge||"—"}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#475569" }}>{o.rank||"—"}</td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:"#475569" }}>{ROLE_LABELS[o.role]||o.role||"—"}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1E293B" }}>{regionName(o.region_id) || o.region || "—"}</div>
                    <div style={{ fontSize:11, color:"#94A3B8" }}>{o.stations?.name || districtName(o.district_id) || ""}</div>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ background:"#F0FDF4", color:"#16A34A", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{o.status||"—"}</span>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>setViewOfficer(o)} title="View details"
                        style={{ width:30, height:30, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}><Eye size={14}/></button>
                      <button onClick={()=>openEdit(o)} title="Edit officer"
                        style={{ width:30, height:30, borderRadius:8, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}><Edit size={14}/></button>
                      <button onClick={()=>openReset(o)} title="Reset password"
                        style={{ width:30, height:30, borderRadius:8, border:"1px solid #FED7AA", background:"#FFF7ED", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#D97706" }}><KeyRound size={14}/></button>
                      <button onClick={()=>setConfirmDel(o)} title="Delete officer"
                        style={{ width:30, height:30, borderRadius:8, border:"1px solid #FEE2E2", background:"#FEF2F2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#DC2626" }}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── VIEW DRAWER ─── */}
      {viewOfficer && (
        <div onClick={e=>e.target===e.currentTarget&&setViewOfficer(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:100, display:"flex", justifyContent:"flex-end" }}>
          <div style={{ background:"#F8FAFC", width:"100%", maxWidth:480, height:"100vh", overflowY:"auto", boxShadow:"-10px 0 32px rgba(0,0,0,.18)" }}>
            {/* Hero */}
            <div style={{ background:"linear-gradient(135deg,#0D3477,#082A63)", color:"white", padding:"22px 22px 28px", position:"relative" }}>
              <button onClick={()=>setViewOfficer(null)} aria-label="Close" style={{ position:"absolute", top:14, right:14, width:32, height:32, borderRadius:8, border:"none", background:"rgba(255,255,255,.18)", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:8 }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,.18)", border:"2px solid rgba(255,255,255,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, flexShrink:0 }}>
                  {(viewOfficer.full_name||"?").split(" ").map(n=>n[0]).slice(0,2).join("")}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:18, fontWeight:800 }}>{viewOfficer.full_name||"—"}</div>
                  <div style={{ fontSize:12, opacity:.85, marginTop:2 }}>{viewOfficer.rank||"—"} · {ROLE_LABELS[viewOfficer.role]||viewOfficer.role}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ background:"rgba(255,255,255,.18)", padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:700, fontFamily:"monospace" }}>{viewOfficer.badge||"—"}</span>
                <span style={{ background:viewOfficer.status==="active"?"#16A34A":"rgba(255,255,255,.18)", padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"uppercase" }}>{viewOfficer.status||"—"}</span>
              </div>
            </div>

            {/* Detail cards */}
            <div style={{ padding:18 }}>
              <Section title="Contact Information">
                <Row icon={Mail}  label="Email" value={viewOfficer.email}/>
                <Row icon={Phone} label="Phone" value={viewOfficer.phone}/>
              </Section>

              <Section title="Posting">
                <Row icon={MapPin} label="Region"   value={regionName(viewOfficer.region_id)     || viewOfficer.region}/>
                <Row icon={MapPin} label="District" value={districtName(viewOfficer.district_id) || viewOfficer.district}/>
                <Row icon={MapPin} label="Ward"     value={wardName(viewOfficer.ward_id)         || viewOfficer.ward}/>
                <Row icon={Shield} label="Station"  value={viewOfficer.stations?.name            || viewOfficer.station_name}/>
              </Section>

              <Section title="System">
                <Row icon={Calendar} label="Created"     value={viewOfficer.created_at ? new Date(viewOfficer.created_at).toLocaleString("en-GB") : "—"}/>
                <Row icon={Calendar} label="Last Sign-in" value={viewOfficer.last_sign_in_at ? new Date(viewOfficer.last_sign_in_at).toLocaleString("en-GB") : "Never"}/>
                <Row icon={Shield}   label="User ID"     value={viewOfficer.id} mono/>
              </Section>

              <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
                <button onClick={()=>{ openEdit(viewOfficer); setViewOfficer(null); }}
                  style={{ flex:"1 1 140px", padding:"10px 14px", borderRadius:10, border:"1px solid #0D3477", background:"#0D3477", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <Edit size={14}/> Edit Officer
                </button>
                <button onClick={()=>{ openReset(viewOfficer); setViewOfficer(null); }}
                  style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #FED7AA", background:"#FFF7ED", color:"#D97706", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <KeyRound size={14}/> Reset Password
                </button>
                <button onClick={()=>{ setConfirmDel(viewOfficer); setViewOfficer(null); }}
                  style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #FECACA", background:"#FEF2F2", color:"#DC2626", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <Trash2 size={14}/> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editOfficer && (
        <div onClick={e=>e.target===e.currentTarget&&setEditOfficer(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"white", borderRadius:18, padding:26, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Edit Officer · Hariri Afisa</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{editOfficer.badge}</div>
              </div>
              <button onClick={()=>setEditOfficer(null)} aria-label="Close" style={{ width:32, height:32, borderRadius:8, border:"none", background:"#F1F5F9", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"9px 13px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7, alignItems:"center" }}>
                <AlertTriangle size={14}/>{err}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
              <div style={{ marginBottom:13, gridColumn:"1/-1" }}>
                <label style={lbl}>Full Name *</label>
                <input value={editForm.full_name} onChange={e=>setEditForm({...editForm, full_name:e.target.value})} style={inp}/>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Email</label>
                <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} style={inp}/>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Phone</label>
                <input value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} placeholder="+255..." style={inp}/>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Badge *</label>
                <input value={editForm.badge} onChange={e=>setEditForm({...editForm, badge:e.target.value})} style={{ ...inp, fontFamily:"monospace", fontWeight:700 }}/>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Rank *</label>
                <select value={editForm.rank} onChange={e=>setEditForm({...editForm, rank:e.target.value})} style={sel}>
                  <option value="">— Select —</option>
                  {RANKS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Role *</label>
                <select value={editForm.role} onChange={e=>setEditForm({...editForm, role:e.target.value})} style={sel}>
                  {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]||r}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Status</label>
                <select value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})} style={sel}>
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* ── Posting (cascading: region -> district -> ward -> station) ── */}
              <div style={{ gridColumn:"1/-1", marginTop:6, marginBottom:8, paddingTop:12, borderTop:"1px solid #E2E8F0" }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#64748B", textTransform:"uppercase", letterSpacing:0.5 }}>Posting · Kituo</div>
                <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>Selecting a region narrows the district list, and so on. Leave blank to clear.</div>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Region</label>
                <select value={editForm.region_id} onChange={e=>setEditForm({...editForm, region_id:e.target.value, district_id:"", ward_id:"", station_id:""})} style={sel}>
                  <option value="">— Not set —</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>District</label>
                <select value={editForm.district_id} onChange={e=>setEditForm({...editForm, district_id:e.target.value, ward_id:"", station_id:""})}
                  disabled={!editForm.region_id}
                  style={{ ...sel, opacity:editForm.region_id?1:0.55, cursor:editForm.region_id?"pointer":"not-allowed" }}>
                  <option value="">{editForm.region_id ? "— Not set —" : "Select region first"}</option>
                  {editDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Ward</label>
                <select value={editForm.ward_id} onChange={e=>setEditForm({...editForm, ward_id:e.target.value, station_id:""})}
                  disabled={!editForm.district_id}
                  style={{ ...sel, opacity:editForm.district_id?1:0.55, cursor:editForm.district_id?"pointer":"not-allowed" }}>
                  <option value="">{editForm.district_id ? "— Not set —" : "Select district first"}</option>
                  {editWards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={lbl}>Station</label>
                <select value={editForm.station_id} onChange={e=>setEditForm({...editForm, station_id:e.target.value})}
                  disabled={!editForm.region_id}
                  style={{ ...sel, opacity:editForm.region_id?1:0.55, cursor:editForm.region_id?"pointer":"not-allowed" }}>
                  <option value="">{editForm.region_id ? "— Not set —" : "Select region first"}</option>
                  {editStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={saveEdit} disabled={saving||!editForm.full_name||!editForm.badge||!editForm.rank}
              style={{ width:"100%", height:46, marginTop:6, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              <Save size={15}/> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION ─── */}
      {confirmDel && (
        <div onClick={e=>e.target===e.currentTarget&&setConfirmDel(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:110, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"white", borderRadius:14, padding:24, maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <AlertTriangle size={18} color="#DC2626"/>
              </div>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#0F172A" }}>Delete officer?</h3>
            </div>
            <p style={{ fontSize:13, color:"#64748B", lineHeight:1.5, margin:"0 0 16px" }}>
              This will remove <strong style={{ color:"#0F172A" }}>{confirmDel.full_name}</strong> ({confirmDel.badge}) from the system.
              Their audit trail will be preserved as "(deleted user)". This cannot be undone.
            </p>
            {err && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:12, color:"#B91C1C" }}>{err}</div>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
              <button onClick={()=>setConfirmDel(null)} disabled={saving}
                style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={doDelete} disabled={saving}
                style={{ padding:"8px 18px", borderRadius:8, border:"none", background:saving?"#94A3B8":"#DC2626", color:"white", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer" }}>
                {saving ? "Deleting..." : "Delete officer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESET PASSWORD ─── */}
      {resetOfficer && (
        <div onClick={e=>e.target===e.currentTarget && !saving && setResetOfficer(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:110, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"white", borderRadius:14, padding:24, maxWidth:460, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:"#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <KeyRound size={20} color="#D97706"/>
              </div>
              <div style={{ flex:1 }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0F172A" }}>Reset Password</h3>
                <div style={{ fontSize:12, color:"#64748B", marginTop:1 }}>{resetOfficer.full_name} · {resetOfficer.badge}</div>
              </div>
            </div>

            {!resetDone ? (
              <>
                <p style={{ fontSize:12, color:"#64748B", lineHeight:1.5, margin:"0 0 14px", padding:"10px 12px", background:"#FFFBEB", borderLeft:"3px solid #D97706", borderRadius:6 }}>
                  The officer's password will be replaced immediately. They will be signed out of any active sessions and must use the new password to sign in.
                </p>

                <div style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <label style={lbl}>New Password</label>
                    <button onClick={generatePassword} type="button"
                      style={{ background:"transparent", border:"none", color:"#0D3477", fontSize:11, fontWeight:700, cursor:"pointer", padding:0 }}>
                      Generate Strong Password
                    </button>
                  </div>
                  <div style={{ position:"relative" }}>
                    <input
                      type={resetShown?"text":"password"}
                      value={resetForm.new_password}
                      onChange={e=>setResetForm({...resetForm, new_password:e.target.value})}
                      placeholder="At least 6 characters"
                      style={{ ...inp, padding:"0 70px 0 12px", fontFamily:"monospace" }}
                      autoFocus
                    />
                    <button type="button" onClick={()=>setResetShown(!resetShown)}
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#64748B", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      {resetShown ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Confirm Password</label>
                  <input
                    type={resetShown?"text":"password"}
                    value={resetForm.confirm}
                    onChange={e=>setResetForm({...resetForm, confirm:e.target.value})}
                    placeholder="Type it again"
                    style={{ ...inp, fontFamily:"monospace" }}
                  />
                </div>

                {err && (
                  <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7, alignItems:"flex-start" }}>
                    <AlertTriangle size={14} style={{ flexShrink:0, marginTop:1 }}/>{err}
                  </div>
                )}

                <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                  <button onClick={()=>setResetOfficer(null)} disabled={saving}
                    style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer" }}>
                    Cancel
                  </button>
                  <button onClick={doResetPassword} disabled={saving||!resetForm.new_password||!resetForm.confirm}
                    style={{ padding:"8px 18px", borderRadius:8, border:"none", background:(saving||!resetForm.new_password||!resetForm.confirm)?"#94A3B8":"#D97706", color:"white", fontSize:13, fontWeight:700, cursor:(saving||!resetForm.new_password||!resetForm.confirm)?"not-allowed":"pointer" }}>
                    {saving ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </>
            ) : (
              // Success state - show the credentials once with a copy button
              <>
                <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"flex-start" }}>
                  <CheckCircle size={18} color="#16A34A" style={{ flexShrink:0, marginTop:1 }}/>
                  <div style={{ fontSize:13, color:"#166534" }}>
                    <div style={{ fontWeight:700 }}>Password reset successful.</div>
                    <div style={{ fontSize:11, marginTop:2, color:"#15803D" }}>Share these credentials with the officer. They are shown ONCE.</div>
                  </div>
                </div>

                <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:9, padding:"12px 14px", marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>Email</div>
                  <div style={{ fontSize:13, color:"#1E293B", fontFamily:"monospace", marginBottom:10, wordBreak:"break-all" }}>{resetDone.email || "—"}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>New Password</div>
                  <div style={{ fontSize:14, color:"#1E293B", fontFamily:"monospace", fontWeight:700, wordBreak:"break-all" }}>{resetDone.password}</div>
                </div>

                <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                  <button onClick={copyPassword}
                    style={{ padding:"8px 14px", borderRadius:8, border:"1px solid #0D3477", background:"white", color:"#0D3477", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                    <Copy size={13}/> Copy
                  </button>
                  <button onClick={()=>{ setResetOfficer(null); setResetDone(null); }}
                    style={{ padding:"8px 18px", borderRadius:8, border:"none", background:"#16A34A", color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// Helper for the view drawer
function Section({ title, children }) {
  return (
    <div style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0", padding:"14px 16px", marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ icon:Icon, label, value, mono }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"6px 0", borderBottom:"1px solid #F1F5F9" }}>
      <div style={{ width:32, height:32, borderRadius:8, background:"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={14} color="#64748B"/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.4 }}>{label}</div>
        <div style={{ fontSize:13, color:"#1E293B", marginTop:2, wordBreak:"break-all", fontFamily:mono?"monospace":"inherit" }}>{value || "—"}</div>
      </div>
    </div>
  );
}
