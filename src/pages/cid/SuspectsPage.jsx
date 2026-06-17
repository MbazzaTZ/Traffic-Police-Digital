import { useState, useEffect } from "react";
import CIDLayout from "../../layouts/CIDLayout";
import { Plus, X, CheckCircle, AlertTriangle, Search, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const STATUS_C = { suspect:"#D97706", charged:"#DC2626", acquitted:"#059669", convicted:"#7C3AED" };
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function SuspectsPage() {
  const { profile } = useCurrentUser();
  const [suspects, setSuspects] = useState([]);
  const [cases,    setCases]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");
  const [search,   setSearch]   = useState("");
  const [fStatus,  setFStatus]  = useState("");
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    full_name:"", alias:"", nida:"", dob:"", gender:"Male",
    nationality:"Tanzanian", address:"", phone:"", occupation:"",
    description:"", status:"suspect", case_id:"",
  });
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function load() {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      supabase.from("suspects").select("*, cases(case_number,title), profiles!suspects_added_by_fkey(full_name)").order("created_at",{ascending:false}),
      supabase.from("cases").select("id,case_number,title").in("status",["open","active"]).order("created_at",{ascending:false}),
    ]);
    setSuspects(sRes.data||[]); setCases(cRes.data||[]); setLoading(false);
  }
  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const { error } = await supabase.from("suspects").insert({
        ...form, dob:form.dob||null, case_id:form.case_id||null, added_by:profile?.id||null,
      });
      if (error) throw error;
      setDone(true); await load();
      setTimeout(() => { setModal(false); setDone(false); setForm({ full_name:"", alias:"", nida:"", dob:"", gender:"Male", nationality:"Tanzanian", address:"", phone:"", occupation:"", description:"", status:"suspect", case_id:"" }); }, 2500);
    } catch(e) { setErr(e.message); } finally { setSaving(false); }
  }

  const filtered = suspects.filter(s => {
    const ms = !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.alias?.toLowerCase().includes(search.toLowerCase()) || s.nida?.includes(search);
    const mst = !fStatus || s.status === fStatus;
    return ms && mst;
  });

  return (
    <CIDLayout pageTitle="Suspects" pageTitle2="Washukiwa">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0D3477", margin:0 }}>Suspects Register <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Washukiwa</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{suspects.length} total · {suspects.filter(s=>s.status==="suspect").length} active suspects</p>
        </div>
        <button onClick={() => { setErr(""); setModal(true); }}
          style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#D97706", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Add Suspect
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {Object.entries(STATUS_C).map(([s,c]) => (
          <div key={s} style={{ background:"white", borderRadius:12, padding:"14px", border:"1px solid #E2E8F0", borderTop:`4px solid ${c}`, textAlign:"center", cursor:"pointer" }}
            onClick={() => setFStatus(fStatus===s?"":s)}>
            <div style={{ fontSize:26, fontWeight:900, color:c }}>{suspects.filter(x=>x.status===s).length}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B", textTransform:"capitalize" }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, alias or NIDA..."
            style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...S.sel, width:140 }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_C).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        {fStatus && <button onClick={() => setFStatus("")} style={{ padding:"0 14px", borderRadius:9, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", fontSize:13, color:"#DC2626", fontWeight:600 }}>✕ Clear</button>}
      </div>

      {/* Detail panel + list */}
      <div style={{ display:"grid", gridTemplateColumns:selected?"1fr 380px":"1fr", gap:14 }}>
        {/* Table */}
        <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
          : filtered.length===0 ? (
            <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
              <User size={40} style={{ opacity:.2, marginBottom:12 }}/>
              <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>{suspects.length===0?"No suspects on file":"No suspects match filters"}</div>
              <button onClick={()=>setModal(true)} style={{ marginTop:14, padding:"8px 20px", borderRadius:9, border:"none", background:"#D97706", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>Add First Suspect</button>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                {["Name","Alias","NIDA","Case","Status","Added By","Date"].map(h=>(
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(s => {
                  const sc = STATUS_C[s.status]||"#94A3B8";
                  const isSelected = selected?.id === s.id;
                  return (
                    <tr key={s.id}
                      onClick={() => setSelected(isSelected ? null : s)}
                      style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSelected?"#EFF6FF":"white" }}
                      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background="#F8FAFC"; }}
                      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background="white"; }}>
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <div style={{ width:30, height:30, borderRadius:"50%", background:`${sc}18`, border:`2px solid ${sc}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <User size={13} color={sc}/>
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{s.full_name}</div>
                        </div>
                      </td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{s.alias||"—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:11, color:"#64748B", fontFamily:"monospace" }}>{s.nida||"—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:11, color:"#0D3477", fontWeight:700, fontFamily:"monospace" }}>{s.cases?.case_number||"—"}</td>
                      <td style={{ padding:"11px 14px" }}><span style={{ background:`${sc}18`, color:sc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{s.status}</span></td>
                      <td style={{ padding:"11px 14px", fontSize:12, color:"#475569" }}>{s.profiles?.full_name||"—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{new Date(s.created_at).toLocaleDateString("en-GB")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", padding:20, alignSelf:"start" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#03102B" }}>Suspect Detail</div>
              <button onClick={()=>setSelected(null)} style={{ width:26, height:26, borderRadius:6, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={13}/></button>
            </div>
            <div style={{ width:64, height:64, borderRadius:"50%", background:`${STATUS_C[selected.status]||"#94A3B8"}18`, border:`3px solid ${STATUS_C[selected.status]||"#94A3B8"}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <User size={28} color={STATUS_C[selected.status]||"#94A3B8"}/>
            </div>
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:800, color:"#1E293B" }}>{selected.full_name}</div>
              {selected.alias && <div style={{ fontSize:12, color:"#94A3B8" }}>"{selected.alias}"</div>}
              <span style={{ background:`${STATUS_C[selected.status]}18`, color:STATUS_C[selected.status], padding:"3px 12px", borderRadius:999, fontSize:12, fontWeight:700, textTransform:"capitalize", marginTop:6, display:"inline-block" }}>{selected.status}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                ["NIDA", selected.nida||"Not provided"],
                ["Date of Birth", selected.dob||"Unknown"],
                ["Gender", selected.gender||"—"],
                ["Nationality", selected.nationality||"—"],
                ["Phone", selected.phone||"—"],
                ["Occupation", selected.occupation||"—"],
                ["Address", selected.address||"—"],
                ["Linked Case", selected.cases?.case_number||"None"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #F8FAFC" }}>
                  <span style={{ fontSize:11, color:"#94A3B8", fontWeight:700 }}>{k}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#1E293B", textAlign:"right", maxWidth:180 }}>{v}</span>
                </div>
              ))}
            </div>
            {selected.description && (
              <div style={{ marginTop:12, background:"#F8FAFC", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", marginBottom:5 }}>DESCRIPTION</div>
                <div style={{ fontSize:12, color:"#475569", lineHeight:1.5 }}>{selected.description}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#D97706" }}>Add Suspect · Ongeza Mshukiwa</div>
                <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Record will be linked to CID case file</div>
              </div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14} style={{flexShrink:0}}/>{err}</div>}
            {done ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}><CheckCircle size={48} color="#16A34A" style={{ marginBottom:12 }}/><h3 style={{ color:"#16A34A" }}>Suspect Added!</h3></div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Full Name · Jina Kamili *</label><input value={form.full_name} onChange={upd("full_name")} placeholder="Full legal name" required style={S.inp} onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Alias / Lakabu</label><input value={form.alias} onChange={upd("alias")} placeholder="Known aliases" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>NIDA Number</label><input value={form.nida} onChange={upd("nida")} placeholder="If known" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Date of Birth</label><input type="date" value={form.dob} onChange={upd("dob")} style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Gender</label><select value={form.gender} onChange={upd("gender")} style={S.sel}>{["Male","Female","Unknown"].map(g=><option key={g}>{g}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Phone · Simu</label><input value={form.phone} onChange={upd("phone")} placeholder="+255 ..." style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Occupation · Kazi</label><input value={form.occupation} onChange={upd("occupation")} placeholder="Occupation" style={S.inp}/></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Status</label><select value={form.status} onChange={upd("status")} style={S.sel}>{Object.keys(STATUS_C).map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
                  <div style={{ marginBottom:14 }}><label style={S.lbl}>Link to Case</label><select value={form.case_id} onChange={upd("case_id")} style={S.sel}><option value="">No case linked</option>{cases.map(c=><option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>)}</select></div>
                  <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Address · Anwani</label><input value={form.address} onChange={upd("address")} placeholder="Known address" style={S.inp}/></div>
                  <div style={{ marginBottom:16, gridColumn:"1/-1" }}><label style={S.lbl}>Physical Description · Maelezo</label><textarea value={form.description} onChange={upd("description")} rows={3} placeholder="Physical features, distinguishing marks..." style={{ ...S.inp, height:"auto", padding:"10px 12px", resize:"vertical" }}/></div>
                </div>
                <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#D97706", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                  {saving?"Saving...":"Add Suspect · Ongeza Mshukiwa"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </CIDLayout>
  );
}
