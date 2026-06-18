import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Home, Plus, X, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const CELL_TYPES = ["general","female","juvenile","isolation","vip"];
const STATUS_C = { available:"#059669", full:"#D97706", maintenance:"#0891B2", closed:"#64748B" };
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function CellsPage() {
  const { profile, stationId, stationName } = useCurrentUser();
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ cell_number:"", cell_type:"general", capacity:4, notes:"" });
  const upd = k => e => setForm(f=>({...f, [k]: k==="capacity"?parseInt(e.target.value)||0:e.target.value}));

  async function load() {
    setLoading(true);
    let q = supabase.from("cells").select("*").order("cell_number");
    if (stationId) q = q.eq("station_id", stationId);
    const { data } = await q;
    setCells(data||[]); setLoading(false);
  }
  useEffect(()=>{ if(profile!==undefined) load(); },[profile, stationId]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { data, error } = await supabase.from("cells").insert({ ...form, station_id:stationId||null, status:"available" }).select().single();
      if (error) throw error;
      logAction({ profile, action:"create_cell", entityType:"cell", entityId:data.id, description:`Cell ${data.cell_number} at ${stationName}` });
      setDone(true); await load();
      setTimeout(()=>{ setModal(false); setDone(false); setForm({ cell_number:"", cell_type:"general", capacity:4, notes:"" }); },1500);
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  async function setStatus(c, status) {
    await supabase.from("cells").update({ status }).eq("id", c.id);
    logAction({ profile, action:"update_cell", entityType:"cell", entityId:c.id, description:`Cell ${c.cell_number} -> ${status}` });
    await load();
  }

  const totalCapacity = cells.reduce((s,c)=>s+(c.capacity||0),0);
  const totalOcc = cells.reduce((s,c)=>s+(c.current_occupancy||0),0);

  return (
    <DashboardLayout pageTitle="Cells" pageTitle2="Vyumba">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Holding Cells <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Vyumba vya Kuwekewa</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{stationName||"Your station"} · {totalOcc}/{totalCapacity} occupied</p>
        </div>
        <button onClick={()=>{setErr("");setModal(true);}} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Add Cell
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          { label:"Total Cells",  v:cells.length, c:"#0D3477" },
          { label:"Available",    v:cells.filter(c=>c.status==="available").length, c:"#059669" },
          { label:"Full",         v:cells.filter(c=>c.status==="full").length, c:"#D97706" },
          { label:"Occupancy %",  v:totalCapacity?Math.round((totalOcc/totalCapacity)*100)+"%":"0%", c:"#7C3AED" },
        ].map(k=>(
          <div key={k.label} style={{ background:"var(--glass-bg-light,rgba(255,255,255,0.72))", borderRadius:"var(--glass-radius,14px)", padding:"14px", border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", borderTop:`3px solid ${k.c}`, textAlign:"center" }}>
            <div style={{ fontSize:"clamp(24px,4vw,28px)", fontWeight:700, color:k.c, fontFamily:"var(--font-mono,monospace)" }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? <div style={{ background:"white", padding:"60px", borderRadius:14, textAlign:"center", color:"#94A3B8" }}>Loading...</div>
      : cells.length===0 ? (
        <div style={{ background:"white", padding:"60px 20px", borderRadius:14, textAlign:"center", color:"#94A3B8", border:"1px solid #E2E8F0" }}>
          <Home size={40} style={{ opacity:.2, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No cells configured</div>
          <div style={{ fontSize:13, marginTop:6 }}>Add cells for {stationName||"your station"} to track occupancy</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {cells.map(c=>{
            const sc=STATUS_C[c.status]||"#94A3B8";
            const pct = c.capacity ? (c.current_occupancy/c.capacity)*100 : 0;
            return (
              <div key={c.id} style={{ background:"white", borderRadius:14, padding:16, border:"1px solid #E2E8F0", borderLeft:`4px solid ${sc}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:900, color:"#0D3477", fontFamily:"monospace" }}>{c.cell_number}</div>
                    <div style={{ fontSize:11, color:"#94A3B8", textTransform:"uppercase", fontWeight:700 }}>{c.cell_type}</div>
                  </div>
                  <span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{c.status}</span>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <span style={{ color:"#64748B" }}>Occupancy</span>
                    <span style={{ fontWeight:700, color:pct>=100?"#DC2626":pct>=75?"#D97706":"#059669" }}>{c.current_occupancy}/{c.capacity}</span>
                  </div>
                  <div style={{ height:6, background:"#F1F5F9", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:pct>=100?"#DC2626":pct>=75?"#D97706":"#059669" }}/>
                  </div>
                </div>
                <select onChange={e=>e.target.value&&setStatus(c, e.target.value)} defaultValue=""
                  style={{ width:"100%", height:32, border:"1px solid #E2E8F0", borderRadius:7, fontSize:12, padding:"0 8px", background:"white", cursor:"pointer" }}>
                  <option value="">Set status...</option>
                  {Object.keys(STATUS_C).map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:440 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>Add Cell · Ongeza Chumba</div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Cell Added!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Cell Number *</label><input value={form.cell_number} onChange={upd("cell_number")} required placeholder="e.g. C-1" style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Type</label><select value={form.cell_type} onChange={upd("cell_type")} style={S.sel}>{CELL_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Capacity *</label><input type="number" min="1" value={form.capacity} onChange={upd("capacity")} required style={S.inp}/></div>
                <div style={{ marginBottom:16 }}><label style={S.lbl}>Notes</label><textarea value={form.notes} onChange={upd("notes")} rows={2} style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Adding...":"Add Cell"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
