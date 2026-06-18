import { useState, useEffect } from "react";
import CIDLayout from "../../layouts/CIDLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, Shield, UserCheck, Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";
import { exportWantedPoster } from "../../lib/pdfExport";

const DANGER={low:"#64748B",medium:"#D97706",high:"#DC2626",armed:"#7C3AED"};
const S={
  inp:{width:"100%",height:42,border:"1.5px solid #E2E8F0",borderRadius:9,padding:"0 12px",fontSize:13,outline:"none",boxSizing:"border-box"},
  sel:{width:"100%",height:42,border:"1.5px solid #E2E8F0",borderRadius:9,padding:"0 12px",fontSize:13,outline:"none",background:"white",boxSizing:"border-box"},
  lbl:{display:"block",fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:.4,marginBottom:5},
};

export default function WantedPage() {
  const { profile } = useCurrentUser();
  const [wanted,  setWanted]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState("");
  const [search,  setSearch]  = useState("");
  const [form, setForm] = useState({ full_name:"", alias:"", nida:"", dob:"", gender:"Male", description:"", last_seen:"", offenses:"", danger_level:"medium", reward:0 });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("wanted_persons").select("*").order("created_at",{ascending:false}).limit(100);
    setWanted(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("wanted_persons").insert({ ...form, reward:parseInt(form.reward)||0, dob:form.dob||null, added_by:profile?.id||null, status:"wanted" }).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_wanted_person", entityType:"wanted_person", entityId:data.id, entityRef:data.ref_number, description:`Wanted notice: ${data.full_name} - ${data.offenses || "unknown offenses"}` });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({full_name:"",alias:"",nida:"",dob:"",gender:"Male",description:"",last_seen:"",offenses:"",danger_level:"medium",reward:0}); },2500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  // ── Mark a wanted person as captured ──
  async function markCaptured(w) {
    if (!confirm(`Mark ${w.full_name} as captured? This will update their status and remove them from the active wanted list.`)) return;
    try {
      const { error } = await supabase.from("wanted_persons")
        .update({ status: "captured" })
        .eq("id", w.id);
      if (error) throw error;
      logAction({
        profile,
        action: "capture_wanted_person",
        entityType: "wanted_person",
        entityId: w.id,
        entityRef: w.ref_number,
        description: `Captured: ${w.full_name} (${w.offenses || "unknown offenses"})`,
      });
      await load();
    } catch (e) {
      setErr(e.message || "Could not update status");
    }
  }

  // ── Download wanted poster as PDF ──
  async function downloadPoster(w) {
    try {
      await exportWantedPoster(w, profile?.full_name, profile?.stations?.name);
      logAction({
        profile,
        action: "export_wanted_poster",
        entityType: "wanted_person",
        entityId: w.id,
        entityRef: w.ref_number,
        description: `Downloaded wanted poster: ${w.full_name}`,
      });
    } catch (e) {
      setErr(`Could not generate poster: ${e.message}`);
    }
  }

  const filtered = wanted.filter(w=> !search || w.full_name?.toLowerCase().includes(search.toLowerCase()) || w.alias?.toLowerCase().includes(search.toLowerCase()) || w.nida?.includes(search));

  return (
    <CIDLayout pageTitle="Wanted Persons" pageTitle2="Watuhumiwa Wanaotafutwa">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#DC2626", margin:0, fontFamily:"var(--font-serif,Georgia,serif)" }}>Wanted Persons <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Watuhumiwa</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{wanted.filter(w=>w.status==="wanted").length} active · {wanted.filter(w=>w.danger_level==="armed").length} armed & dangerous</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--gold-600,#B45309)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, boxShadow:"0 1px 2px rgba(180,83,9,0.25)" }}>
          <Plus size={15}/> Add Wanted Person
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          {label:"Active Wanted",  v:wanted.filter(w=>w.status==="wanted").length,   c:"#DC2626"},
          {label:"Armed & Danger", v:wanted.filter(w=>w.danger_level==="armed").length, c:"#7C3AED"},
          {label:"High Priority",  v:wanted.filter(w=>w.danger_level==="high").length,  c:"#D97706"},
          {label:"Captured",        v:wanted.filter(w=>w.status==="captured").length,     c:"#059669"},
        ].map(k=>(
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40, marginBottom:14, maxWidth:360 }}>
        <Search size={14} color="#94A3B8"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, alias or NIDA..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
      </div>

      {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
      : filtered.length===0 ? (
        <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Shield size={40} style={{ opacity:.2, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{wanted.length===0?"No wanted persons on file":"No results match search"}</div>
          <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Add First Record</button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 }}>
          {filtered.map(w=>{
            const dc=DANGER[w.danger_level]||"#94A3B8";
            const isArmed = w.danger_level==="armed";
            return (
              <div key={w.id} style={{ background:"white", borderRadius:16, border:`2px solid ${isArmed?"#DC2626":"#E2E8F0"}`, overflow:"hidden", transition:".15s" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.1)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                {isArmed && <div style={{ background:"#DC2626", color:"white", padding:"5px 14px", fontSize:11, fontWeight:800, letterSpacing:1, textAlign:"center" }}>⚠ ARMED & DANGEROUS · HATARI</div>}
                <div style={{ padding:18 }}>
                  <div style={{ display:"flex", gap:14, marginBottom:14 }}>
                    <div style={{ width:56, height:56, borderRadius:12, background:`${dc}18`, border:`2px solid ${dc}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:24 }}>👤</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:"#1E293B" }}>{w.full_name}</div>
                      {w.alias && <div style={{ fontSize:12, color:"#94A3B8" }}>Alias: {w.alias}</div>}
                      <span style={{ background:`${dc}18`, color:dc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"uppercase", marginTop:4, display:"inline-block" }}>{w.danger_level}</span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                    {[["NIDA",w.nida||"Unknown"],["Gender",w.gender||"—"],["Last Seen",w.last_seen||"Unknown"],["Reward","TZS "+(w.reward||0).toLocaleString()]].map(([k,v])=>(
                      <div key={k}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{k}</div><div style={{ fontSize:12, fontWeight:600, color:"#1E293B" }}>{v}</div></div>
                    ))}
                  </div>
                  {w.offenses && <div style={{ background:"#FEF2F2", borderRadius:8, padding:"8px 10px", fontSize:12, color:"#B91C1C", marginBottom:10 }}>⚖️ {w.offenses}</div>}
                  <div style={{ display:"flex", gap:8, alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ background:w.status==="wanted"?"#FEF2F2":"#F0FDF4", color:w.status==="wanted"?"#DC2626":"#16A34A", padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:700, textTransform:"capitalize" }}>{w.status}</span>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>downloadPoster(w)} title="Download wanted poster (PDF)" style={{ padding:"5px 11px", borderRadius:8, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                        <Download size={12}/> Poster
                      </button>
                      {w.status==="wanted" && (
                        <button onClick={()=>markCaptured(w)} title="Mark as captured" style={{ padding:"5px 11px", borderRadius:8, border:"none", background:"#059669", color:"white", fontWeight:700, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                          <UserCheck size={12}/> Captured
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>Add Wanted Person · Ongeza Mtuhumiwa</div><div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Record will be visible to all officers</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Wanted Notice Issued!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Full Name · Jina Kamili *</label><input value={form.full_name} onChange={upd("full_name")} placeholder="Full name" required style={S.inp} onFocus={e=>e.target.style.borderColor="#DC2626"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Alias / Lakabu</label><input value={form.alias} onChange={upd("alias")} placeholder="Known aliases" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA Number</label><input value={form.nida} onChange={upd("nida")} placeholder="If known" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Date of Birth</label><input type="date" value={form.dob} onChange={upd("dob")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Gender · Jinsia</label><select value={form.gender} onChange={upd("gender")} style={S.sel}>{["Male","Female","Unknown"].map(g=><option key={g}>{g}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Danger Level ⚠</label><select value={form.danger_level} onChange={upd("danger_level")} style={{ ...S.sel, borderColor:form.danger_level==="armed"?"#DC2626":"#E2E8F0", color:DANGER[form.danger_level] }}>{["low","medium","high","armed"].map(d=><option key={d} value={d}>{d.toUpperCase()}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Last Seen Location</label><input value={form.last_seen} onChange={upd("last_seen")} placeholder="Last known location" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Reward (TZS)</label><input type="number" value={form.reward} onChange={upd("reward")} min="0" style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Known Offenses · Makosa</label><input value={form.offenses} onChange={upd("offenses")} placeholder="e.g. Armed robbery, murder" style={S.inp}/></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}><label style={S.lbl}>Physical Description · Maelezo ya Mwili</label><textarea value={form.description} onChange={upd("description")} rows={3} placeholder="Height, weight, scars, tattoos, etc." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                </div>
                {form.danger_level==="armed" && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#B91C1C", display:"flex", gap:8 }}><AlertTriangle size={15}/>⚠ ARMED & DANGEROUS — Exercise extreme caution. Do not approach alone.</div>}
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Saving...":"Issue Wanted Notice · Toa Notisi"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </CIDLayout>
  );
}
