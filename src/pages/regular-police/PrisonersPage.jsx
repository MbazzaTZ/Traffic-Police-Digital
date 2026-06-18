import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Users, Plus, X, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const STATUS_C = { remand:"#D97706", convicted:"#DC2626", released:"#059669", transferred:"#0891B2", escaped:"#7C3AED", deceased:"#64748B" };
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function PrisonersPage() {
  const { profile, stationId, regionId } = useCurrentUser();
  const [prisoners, setPrisoners] = useState([]);
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");

  const [form, setForm] = useState({ prisoner_name:"", prisoner_nida:"", charges:"", cell_id:"", sentence_text:"", notes:"" });
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));

  async function load() {
    setLoading(true);
    const [pr, cl] = await Promise.all([
      supabase.from("prisoners").select("*, cells(cell_number, cell_type)").order("created_at",{ascending:false}).limit(300),
      stationId ? supabase.from("cells").select("*").eq("station_id", stationId).order("cell_number") : Promise.resolve({data:[]}),
    ]);
    setPrisoners(pr.data||[]); setCells(cl.data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile, stationId]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("prisoners").insert({
        ...form, cell_id:form.cell_id||null, station_id:stationId||null, region_id:regionId||null,
        admitted_by:profile?.id||null, status:"remand",
      }).select("*, cells(cell_number)").single();
      if (error) throw error;
      logAction({ profile, action:"admit_prisoner", entityType:"prisoner", entityId:data.id, entityRef:data.ref_number, description:`Admitted ${data.prisoner_name}` });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({ prisoner_name:"", prisoner_nida:"", charges:"", cell_id:"", sentence_text:"", notes:"" }); },2000);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function updateStatus(p, status) {
    const updates = { status };
    if (["released","transferred"].includes(status)) { updates.released_at = new Date().toISOString(); updates.cell_id = null; }
    await supabase.from("prisoners").update(updates).eq("id", p.id);
    logAction({ profile, action:"update_prisoner", entityType:"prisoner", entityId:p.id, entityRef:p.ref_number, description:`${p.prisoner_name} -> ${status}` });
    await load();
  }

  const filtered = prisoners.filter(p =>
    (!search || [p.prisoner_name, p.prisoner_nida, p.ref_number].some(f=>String(f||"").toLowerCase().includes(search.toLowerCase()))) &&
    (!fStatus || p.status===fStatus)
  );
  const availCells = cells.filter(c=>c.current_occupancy < c.capacity && c.status !== "closed");

  return (
    <DashboardLayout pageTitle="Prisoners" pageTitle2="Wafungwa">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Prisoners Register <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Daftari ya Wafungwa</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{prisoners.length} records · {prisoners.filter(p=>["remand","convicted"].includes(p.status)).length} currently held</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#DC2626", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Admit Prisoner
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          { label:"On Remand",   v:prisoners.filter(p=>p.status==="remand").length, c:"#D97706" },
          { label:"Convicted",   v:prisoners.filter(p=>p.status==="convicted").length, c:"#DC2626" },
          { label:"Released",    v:prisoners.filter(p=>p.status==="released").length, c:"#059669" },
          { label:"Transferred", v:prisoners.filter(p=>p.status==="transferred").length, c:"#0891B2" },
        ].map(k=>(
          <div key={k.label} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <div style={{ flex:1, maxWidth:380, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, NIDA, ref..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...S.sel, width:170 }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_C).map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Users size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No prisoner records</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Ref #","Prisoner","Charges","Cell","Sentence","Admitted","Status","Action"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(p=>{
                const sc=STATUS_C[p.status]||"#94A3B8";
                return (
                  <tr key={p.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#DC2626", fontSize:12 }}>{p.ref_number}</td>
                    <td style={{ padding:"11px 14px" }}><div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{p.prisoner_name}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{p.prisoner_nida||"—"}</div></td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569", maxWidth:200 }}>{p.charges||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, fontWeight:600 }}>{p.cells?.cell_number ? <span style={{ background:"#EFF6FF", color:"#0D3477", padding:"2px 8px", borderRadius:6 }}>{p.cells.cell_number}</span> : "—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{p.sentence_text||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{new Date(p.admitted_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{p.status}</span></td>
                    <td style={{ padding:"11px 14px" }}>
                      {["remand","convicted"].includes(p.status) && (
                        <select onChange={e=>e.target.value&&updateStatus(p,e.target.value)} defaultValue=""
                          style={{ height:32, border:"1px solid #E2E8F0", borderRadius:7, fontSize:12, padding:"0 8px", background:"white", cursor:"pointer" }}>
                          <option value="">Update...</option>
                          {p.status==="remand" && <option value="convicted">Convict</option>}
                          <option value="released">Release</option>
                          <option value="transferred">Transfer</option>
                          <option value="escaped">Escaped</option>
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
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div><div style={{ fontSize:17, fontWeight:800, color:"#DC2626" }}>Admit Prisoner · Sajili Mfungwa</div></div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Prisoner Admitted!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Prisoner Name *</label><input value={form.prisoner_name} onChange={upd("prisoner_name")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA</label><input value={form.prisoner_nida} onChange={upd("prisoner_nida")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Assign Cell</label>
                    <select value={form.cell_id} onChange={upd("cell_id")} style={S.sel}>
                      <option value="">— No cell —</option>
                      {availCells.map(c=><option key={c.id} value={c.id}>{c.cell_number} ({c.cell_type}, {c.current_occupancy}/{c.capacity})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Charges · Mashtaka *</label><input value={form.charges} onChange={upd("charges")} required style={S.inp}/></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Sentence (if convicted)</label><input value={form.sentence_text} onChange={upd("sentence_text")} placeholder="e.g. 2 years imprisonment" style={S.inp}/></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}><label style={S.lbl}>Notes</label><textarea value={form.notes} onChange={upd("notes")} rows={2} style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#DC2626", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Admitting...":"Admit Prisoner"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
