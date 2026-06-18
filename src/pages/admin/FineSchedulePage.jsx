import { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { Receipt, Plus, X, CheckCircle, AlertTriangle, Search, Edit2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

const CAT_C = { traffic:"#0D3477", parking:"#0891B2", road_safety:"#DC2626", license:"#D97706", other:"#64748B" };
const CATEGORIES = ["traffic","parking","road_safety","license","other"];
const S = {
  inp:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" },
  sel:{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", background:"white", boxSizing:"border-box" },
  lbl:{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:5 },
};

export default function FineSchedulePage() {
  const { profile } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [fCat, setFCat] = useState("");

  const [form, setForm] = useState({ code:"", offense_name:"", offense_name_sw:"", fine_amount:0, category:"traffic", legal_reference:"", active:true });
  const upd = k => e => setForm(f=>({...f, [k]: k==="fine_amount"?parseInt(e.target.value)||0 : k==="active"?e.target.checked : e.target.value}));

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("fine_schedule").select("*").order("code");
    setItems(data||[]); setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  function openNew() { setEditing(null); setForm({ code:"", offense_name:"", offense_name_sw:"", fine_amount:0, category:"traffic", legal_reference:"", active:true }); setErr(""); setModal(true); }
  function openEdit(it) { setEditing(it); setForm({ code:it.code||"", offense_name:it.offense_name||"", offense_name_sw:it.offense_name_sw||"", fine_amount:it.fine_amount||0, category:it.category||"traffic", legal_reference:it.legal_reference||"", active:it.active!==false }); setErr(""); setModal(true); }

  async function submit(e) {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("fine_schedule").update(form).eq("id", editing.id);
        if (error) throw error;
        logAction({ profile, action:"update_fine", entityType:"fine_schedule", entityId:editing.id, description:`Updated ${form.code}: TZS ${form.fine_amount.toLocaleString()}` });
      } else {
        const { data, error } = await supabase.from("fine_schedule").insert(form).select().single();
        if (error) throw error;
        logAction({ profile, action:"create_fine", entityType:"fine_schedule", entityId:data.id, description:`New offense ${data.code}: TZS ${data.fine_amount.toLocaleString()}` });
      }
      setModal(false); await load();
    } catch(e){ setErr(e.message); } finally{ setSaving(false); }
  }

  const filtered = items.filter(i =>
    (!search || [i.code, i.offense_name, i.offense_name_sw].some(f=>String(f||"").toLowerCase().includes(search.toLowerCase()))) &&
    (!fCat || i.category===fCat)
  );

  return (
    <AdminLayout pageTitle="Fine Schedule" pageTitle2="Orodha ya Faini">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Fine Schedule <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Orodha ya Faini</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>{items.length} offenses on the official tariff · {items.filter(i=>i.active).length} active</p>
        </div>
        <button onClick={openNew} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"var(--navy-700,#0D3477)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
          <Plus size={15}/> Add Offense
        </button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <div style={{ flex:1, maxWidth:380, display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:9, padding:"0 12px", height:40 }}>
          <Search size={14} color="#94A3B8"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search code or offense..." style={{ border:"none", outline:"none", fontSize:13, width:"100%", background:"transparent" }}/>
        </div>
        <select value={fCat} onChange={e=>setFCat(e.target.value)} style={{ ...S.sel, width:180 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
        </select>
      </div>

      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        {loading ? <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        : filtered.length===0 ? (
          <div style={{ padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
            <Receipt size={40} style={{ opacity:.2, marginBottom:12 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No fines on the schedule</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
              {["Code","Offense · Kosa","Category","Fine (TZS)","Legal Ref","Active","Action"].map(h=>(
                <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(it=>{
                const cc=CAT_C[it.category]||"#64748B";
                return (
                  <tr key={it.id} style={{ borderBottom:"1px solid #F1F5F9", opacity:it.active?1:.55 }}>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontWeight:700, color:"#0D3477", fontSize:12 }}>{it.code}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{it.offense_name}</div>
                      <div style={{ fontSize:11, color:"#94A3B8", fontStyle:"italic" }}>{it.offense_name_sw}</div>
                    </td>
                    <td style={{ padding:"11px 14px" }}><span style={{ background:`${cc}18`, color:cc, padding:"2px 9px", borderRadius:999, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{it.category?.replace(/_/g," ")}</span></td>
                    <td style={{ padding:"11px 14px", fontWeight:700, fontFamily:"monospace", color:"#0D3477" }}>{(it.fine_amount||0).toLocaleString()}</td>
                    <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8" }}>{it.legal_reference||"—"}</td>
                    <td style={{ padding:"11px 14px", fontSize:12 }}>{it.active ? <span style={{ color:"#059669", fontWeight:700 }}>● Active</span> : <span style={{ color:"#94A3B8" }}>● Inactive</span>}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <button onClick={()=>openEdit(it)} title="Edit" style={{ width:30, height:30, borderRadius:7, border:"1px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0D3477" }}>
                        <Edit2 size={13}/>
                      </button>
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
          <div style={{ background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:520 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#0D3477" }}>{editing?"Edit Offense":"Add Offense"}</div>
              <button onClick={()=>setModal(false)} style={{ width:32, height:32, borderRadius:8, background:"#F1F5F9", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
            </div>
            {err && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#B91C1C", display:"flex", gap:7 }}><AlertTriangle size={14}/>{err}</div>}
            <form onSubmit={submit}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Code *</label><input value={form.code} onChange={upd("code")} required placeholder="e.g. TZRT-021" style={{ ...S.inp, fontFamily:"monospace" }}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Category</label><select value={form.category} onChange={upd("category")} style={S.sel}>{CATEGORIES.map(c=><option key={c} value={c}>{c.replace(/_/g," ")}</option>)}</select></div>
                <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Offense (English) *</label><input value={form.offense_name} onChange={upd("offense_name")} required style={S.inp}/></div>
                <div style={{ marginBottom:14, gridColumn:"1/-1" }}><label style={S.lbl}>Kosa (Swahili)</label><input value={form.offense_name_sw} onChange={upd("offense_name_sw")} style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Fine Amount (TZS) *</label><input type="number" min="0" value={form.fine_amount} onChange={upd("fine_amount")} required style={S.inp}/></div>
                <div style={{ marginBottom:14 }}><label style={S.lbl}>Legal Reference</label><input value={form.legal_reference} onChange={upd("legal_reference")} placeholder="e.g. Road Traffic Act s.42" style={S.inp}/></div>
                <div style={{ marginBottom:16, gridColumn:"1/-1" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"#475569" }}>
                    <input type="checkbox" checked={form.active} onChange={upd("active")} style={{ accentColor:"#059669" }}/>
                    Active — available for officers to issue
                  </label>
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ width:"100%", height:46, background:saving?"#94A3B8":"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
                {saving?"Saving...":(editing?"Save Changes":"Add Offense")}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
