import { useState, useEffect, useRef } from "react";
import TrafficLayout from "../../layouts/TrafficLayout";
import { Play, Square, Plus, Minus, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logAction } from "../../lib/audit";

export default function CheckpointsPage() {
  const { profile, stationId, regionId, districtId, stationName } = useCurrentUser();
  const [active,    setActive]    = useState(false);
  const [elapsed,   setElapsed]   = useState("00:00:00");
  const [counters,  setCounters]  = useState({ passed:0, checked:0, cited:0, arrested:0 });
  const [sessions,  setSessions]  = useState([]);
  const [location,  setLocation]  = useState("");
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState("");
  const [saving,    setSaving]    = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const activeIdRef = useRef(null); // checkpoint row id in DB
  const countersRef = useRef(counters);
  countersRef.current = counters;

  // ── Load recent checkpoint sessions ──
  async function load() {
    setLoading(true);
    let q = supabase.from("checkpoints")
      .select("*")
      .order("start_time", { ascending:false })
      .limit(50);
    // Station officers see their station's sessions; command sees all
    if (stationId && profile?.role && !["igp","digp","rpc","ocd","admin_officer"].includes(profile.role)) {
      q = q.eq("station_id", stationId);
    }
    const { data, error } = await q;
    if (error) setErr(`Could not load sessions: ${error.message}`);
    else setSessions(data || []);
    setLoading(false);
  }
  useEffect(() => { if (profile !== undefined) load(); }, [profile]);

  // Cleanup interval on unmount — prevents leak if user navigates away mid-checkpoint
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Start a checkpoint ──
  async function startCP() {
    if (!location.trim()) { setErr("Enter checkpoint location first"); return; }
    if (!profile?.id) { setErr("Officer profile not loaded yet — please wait"); return; }
    setErr(""); setSaving(true);
    const { data, error } = await supabase.from("checkpoints").insert({
      name:            `Checkpoint @ ${location.trim()}`,
      location:        location.trim(),
      officer_id:      profile.id,
      officer_name:    profile.full_name || null,
      station_id:      stationId  || null,
      station_name:    stationName || null,
      region_id:       regionId   || null,
      district_id:     districtId || null,
      start_time:      new Date().toISOString(),
      passed_count:    0,
      checked_count:   0,
      cited_count:     0,
      arrested_count:  0,
      status:          "active",
    }).select().single();
    setSaving(false);
    if (error) { setErr(`Could not start checkpoint: ${error.message}`); return; }
    activeIdRef.current = data.id;
    setActive(true); startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const d = Date.now() - startRef.current;
      const h = String(Math.floor(d/3600000)).padStart(2,"0");
      const m = String(Math.floor((d%3600000)/60000)).padStart(2,"0");
      const s = String(Math.floor((d%60000)/1000)).padStart(2,"0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    logAction({
      profile,
      action: "start_checkpoint",
      entityType: "checkpoint",
      entityId: data.id,
      entityRef: data.name,
      description: `Started checkpoint at ${location.trim()}`,
    });
  }

  // ── End a checkpoint — persist final counters ──
  async function stopCP() {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalCounters = countersRef.current;
    const durationLabel = elapsed;
    setSaving(true);
    if (activeIdRef.current) {
      const { error } = await supabase.from("checkpoints").update({
        end_time:        new Date().toISOString(),
        passed_count:    finalCounters.passed,
        checked_count:   finalCounters.checked,
        cited_count:     finalCounters.cited,
        arrested_count:  finalCounters.arrested,
        status:          "completed",
      }).eq("id", activeIdRef.current);
      if (error) setErr(`Saved session but counters may be stale: ${error.message}`);
      logAction({
        profile,
        action: "end_checkpoint",
        entityType: "checkpoint",
        entityId: activeIdRef.current,
        description: `Ended checkpoint at ${location} (${durationLabel}) — passed:${finalCounters.passed} checked:${finalCounters.checked} cited:${finalCounters.cited} arrested:${finalCounters.arrested}`,
      });
    }
    activeIdRef.current = null;
    setSaving(false);
    setActive(false); setElapsed("00:00:00"); setCounters({passed:0,checked:0,cited:0,arrested:0});
    await load();
  }

  // ── Increment/decrement counter ──
  // We update the DB on every change so a refresh mid-session doesn't lose data.
  const adj = (key, delta) => async () => {
    if (!active || !activeIdRef.current) return;
    const newVal = Math.max(0, counters[key] + delta);
    setCounters(c => ({ ...c, [key]: newVal }));
    // Best-effort DB sync — don't block the UI on this
    const patch = { [key === "passed" ? "passed_count" : key === "checked" ? "checked_count" : key === "cited" ? "cited_count" : "arrested_count"]: newVal };
    await supabase.from("checkpoints").update(patch).eq("id", activeIdRef.current);
  };

  const fmtDur = (start, end) => {
    if (!start) return "—";
    const e = end ? new Date(end) : new Date();
    const ms = e - new Date(start);
    const h = String(Math.floor(ms/3600000)).padStart(2,"0");
    const m = String(Math.floor((ms%3600000)/60000)).padStart(2,"0");
    const s = String(Math.floor((ms%60000)/1000)).padStart(2,"0");
    return `${h}:${m}:${s}`;
  };

  const Counter = ({ label, sw, k, color }) => (
    <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", padding:18, textAlign:"center", borderTop:`4px solid ${color}` }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#475569", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:11, color:"#94A3B8", marginBottom:14 }}>{sw}</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
        <button onClick={adj(k,-1)} disabled={!active} style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #E2E8F0", background:"white", cursor:active?"pointer":"not-allowed", fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", color:"#DC2626", opacity:active?1:.4 }}><Minus size={16}/></button>
        <div style={{ fontSize:40, fontWeight:900, color, minWidth:60, lineHeight:1 }}>{counters[k]}</div>
        <button onClick={adj(k,1)} disabled={!active} style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #E2E8F0", background:active?color:"white", cursor:active?"pointer":"not-allowed", fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", color:active?"white":"#94A3B8", opacity:active?1:.4 }}><Plus size={16}/></button>
      </div>
    </div>
  );

  return (
    <TrafficLayout pageTitle="Checkpoints" pageTitle2="Vizuizi vya Barabara">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"var(--navy-700,#0D3477)", fontFamily:"var(--font-serif,Georgia,serif)", margin:0 }}>Road Checkpoints <span style={{ color:"#94A3B8", fontWeight:400, fontSize:16 }}>· Vizuizi</span></h1>
          <p style={{ color:"#64748B", fontSize:13, marginTop:3 }}>Log and track roadblock operations in real-time · All sessions persist to the database</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding:"9px 16px", borderRadius:10, border:"1px solid #E2E8F0", background:"white", color:"#0D3477", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:loading?.6:1 }}>
          <RefreshCw size={14} className={loading?"animate-spin":""}/> Refresh
        </button>
      </div>

      {err && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", gap:8, alignItems:"center" }}>
          <AlertCircle size={15} color="#DC2626" style={{ flexShrink:0 }}/>
          <span style={{ fontSize:13, color:"#B91C1C", flex:1 }}>{err}</span>
          <button onClick={()=>setErr("")} style={{ background:"transparent", border:"none", color:"#B91C1C", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
        </div>
      )}

      {/* Control panel */}
      <div style={{ background:"linear-gradient(135deg,#03102B,#082A63)", borderRadius:16, padding:"22px 24px", color:"white", marginBottom:20, boxShadow:"0 6px 24px rgba(3,16,43,.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div style={{ flex:1, minWidth:260 }}>
            <div style={{ fontSize:11, opacity:.55, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Checkpoint Control · Udhibiti wa Kizuizi</div>
            {!active ? (
              <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Enter checkpoint location (e.g. Morogoro Road Junction)"
                style={{ width:"100%", height:42, borderRadius:9, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.1)", color:"white", fontSize:14, padding:"0 14px", outline:"none", boxSizing:"border-box" }}/>
            ) : (
              <div>
                <div style={{ fontSize:14, opacity:.8, display:"flex", alignItems:"center", gap:6 }}><MapPin size={14}/> {location}</div>
                <div style={{ fontSize:32, fontWeight:900, fontFamily:"monospace", letterSpacing:3, marginTop:4 }}>{elapsed}</div>
              </div>
            )}
          </div>
          <button onClick={active?stopCP:startCP} disabled={saving}
            style={{ padding:"13px 28px", borderRadius:12, border:"none", background:active?"#DC2626":"#16A34A", color:"white", fontWeight:800, fontSize:14, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:10, flexShrink:0, opacity:saving?.7:1 }}>
            {saving ? "Saving..." : active ? <><Square size={18}/> End Checkpoint</> : <><Play size={18}/> Start Checkpoint · Anza Kizuizi</>}
          </button>
        </div>
      </div>

      {/* Counters */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <Counter label="Vehicles Passed"   sw="Magari Yaliyopita"     k="passed"   color="#0D3477"/>
        <Counter label="Vehicles Checked"  sw="Magari Yaliyokaguliwa" k="checked" color="#059669"/>
        <Counter label="Citations Issued"  sw="Faini Zilizotolewa"    k="cited"    color="#D97706"/>
        <Counter label="Arrests Made"      sw="Watu Waliokamatwa"     k="arrested" color="#DC2626"/>
      </div>

      {!active && (
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#92400E" }}>
          ℹ️ Enter a location above and click "Start Checkpoint" to begin logging. Counters will activate during an active checkpoint, and every change is saved to the database so a refresh mid-session won't lose data.
        </div>
      )}

      {/* Session history */}
      <div className="glass-card" style={{ background:"rgba(255,255,255,0.85)", borderRadius:14, border:"1px solid var(--glass-border-light,rgba(13,52,119,0.14))", overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0D3477" }}>Checkpoint History · Historia</div>
          <div style={{ fontSize:12, color:"#94A3B8" }}>{sessions.length} sessions · showing most recent 50</div>
        </div>
        {loading ? (
          <div style={{ padding:"50px", textAlign:"center", color:"#94A3B8" }}>Loading...</div>
        ) : sessions.length===0 ? (
          <div style={{ padding:"40px 20px", textAlign:"center", color:"#94A3B8" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🛑</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#64748B" }}>No checkpoint sessions yet</div>
            <div style={{ fontSize:12, marginTop:4 }}>Sessions appear here after you end a checkpoint</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#F8FAFC" }}>
              {["Location","Duration","Passed","Checked","Cited","Arrested","Officer","Started","Status"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sessions.map(s=>(
                <tr key={s.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
                  <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:"#1E293B" }}>{s.location || s.name}</td>
                  <td style={{ padding:"11px 14px", fontWeight:700, fontFamily:"monospace", color:"#0D3477" }}>{fmtDur(s.start_time, s.end_time)}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700 }}>{s.passed_count ?? 0}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700, color:"#059669" }}>{s.checked_count ?? s.checks_count ?? 0}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700, color:"#D97706" }}>{s.cited_count ?? 0}</td>
                  <td style={{ padding:"11px 14px", textAlign:"center", fontWeight:700, color:"#DC2626" }}>{s.arrested_count ?? s.arrests_count ?? 0}</td>
                  <td style={{ padding:"11px 14px", fontSize:12, color:"#64748B" }}>{s.officer_name || "—"}</td>
                  <td style={{ padding:"11px 14px", fontSize:11, color:"#94A3B8", whiteSpace:"nowrap" }}>{s.start_time ? new Date(s.start_time).toLocaleString("en-GB") : "—"}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <span style={{
                      background:(s.status==="active"?"#DCFCE7":s.status==="completed"?"#E0E7FF":"#F1F5F9"),
                      color:(s.status==="active"?"#16A34A":s.status==="completed"?"#4338CA":"#64748B"),
                      padding:"2px 9px", borderRadius:999, fontSize:10, fontWeight:700, textTransform:"capitalize"
                    }}>{s.status || "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TrafficLayout>
  );
}
