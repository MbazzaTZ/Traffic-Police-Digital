import { useState, useEffect } from "react";
import CommandLayout from "../../layouts/CommandLayout";
import { FileText, TrendingUp, Download, BarChart3 } from "lucide-react";
import { exportReport } from "../../lib/pdfExport";
import { supabase } from "../../lib/supabase";

const card = { background:"rgba(255,255,255,.04)", borderRadius:14, border:"1px solid rgba(255,255,255,.08)" };

export default function CommandReports() {
  const [data, setData] = useState({ incidents:[], arrests:[], citations:[], cases:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [inc, arr, cit, cas] = await Promise.all([
        supabase.from("incident_reports").select("type,severity,status,created_at"),
        supabase.from("arrests").select("charge,status,created_at"),
        supabase.from("citations").select("offense_type,fine_amount,status,created_at"),
        supabase.from("cases").select("type,status,created_at"),
      ]);
      setData({ incidents:inc.data||[], arrests:arr.data||[], citations:cit.data||[], cases:cas.data||[] });
      setLoading(false);
    }
    load();
  }, []);

  // Aggregate incident types
  const incidentTypes = {};
  data.incidents.forEach(i => { incidentTypes[i.type] = (incidentTypes[i.type]||0)+1; });
  const topIncidents = Object.entries(incidentTypes).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxInc = Math.max(...topIncidents.map(([,v])=>v), 1);

  const totalFines = data.citations.reduce((t,c)=>t+(c.fine_amount||0),0);
  const paidFines  = data.citations.filter(c=>c.status==="paid").reduce((t,c)=>t+(c.fine_amount||0),0);

  // Monthly trend (last 6 months)
  const months = [];
  for (let i=5; i>=0; i--) {
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const key = d.toLocaleDateString("en-GB",{month:"short"});
    const monthIncidents = data.incidents.filter(x=>{ const xd=new Date(x.created_at); return xd.getMonth()===d.getMonth()&&xd.getFullYear()===d.getFullYear(); }).length;
    months.push({ key, count:monthIncidents });
  }
  const maxMonth = Math.max(...months.map(m=>m.count), 1);

  return (
    <CommandLayout pageTitle="Reports & Analytics" pageTitle2="Ripoti na Takwimu">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"white", margin:0 }}>Reports & Analytics</h1>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, marginTop:3 }}>National crime statistics · Takwimu za Kitaifa</p>
        </div>
        <button onClick={()=>exportReport("National Crime Statistics",
            ["Metric","Value"],
            [["Total Incidents",String(data.incidents.length)],["Total Arrests",String(data.arrests.length)],["Citations",String(data.citations.length)],["CID Cases",String(data.cases.length)],["Fines Issued (TZS)",totalFines.toLocaleString()],["Fines Collected (TZS)",paidFines.toLocaleString()]],
            "TPDOP National Report")} style={{ padding:"9px 18px", borderRadius:10, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.06)", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Download size={15}/> Export Report
        </button>
      </div>

      {loading ? <div style={{ padding:"60px", textAlign:"center", color:"rgba(255,255,255,.3)" }}>Loading analytics...</div> : (
      <>
      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          {label:"Total Incidents", v:data.incidents.length,  c:"#DC2626"},
          {label:"Total Arrests",   v:data.arrests.length,    c:"#D97706"},
          {label:"Citations",       v:data.citations.length,  c:"#0891B2"},
          {label:"CID Cases",       v:data.cases.length,      c:"#7C3AED"},
        ].map(k=>(
          <div key={k.label} style={{ ...card, padding:"18px", textAlign:"center", borderTop:`3px solid ${k.c}` }}>
            <div style={{ fontSize:32, fontWeight:900, color:k.c }}>{k.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.7)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Incident types breakdown */}
        <div style={{ ...card, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <BarChart3 size={16} color="#93C5FD"/> Top Incident Types
          </div>
          {topIncidents.length===0 ? <div style={{ color:"rgba(255,255,255,.3)", textAlign:"center", padding:"20px" }}>No data yet</div>
          : topIncidents.map(([type,count])=>(
            <div key={type} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,.8)" }}>{type}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"white" }}>{count}</span>
              </div>
              <div style={{ height:8, background:"rgba(255,255,255,.06)", borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${(count/maxInc)*100}%`, height:"100%", background:"linear-gradient(90deg,#0D3477,#3B82F6)", borderRadius:4 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly trend */}
        <div style={{ ...card, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <TrendingUp size={16} color="#86EFAC"/> Incident Trend (6 months)
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", height:160, gap:10, paddingTop:10 }}>
            {months.map(m=>(
              <div key={m.key} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"white" }}>{m.count}</div>
                <div style={{ width:"100%", height:`${(m.count/maxMonth)*120}px`, minHeight:4, background:"linear-gradient(180deg,#16A34A,#065F46)", borderRadius:"6px 6px 0 0" }}/>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>{m.key}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic revenue */}
      <div style={{ ...card, padding:"20px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:16 }}>Traffic Fine Revenue · Mapato ya Faini</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {[
            {label:"Total Issued",  v:`TZS ${totalFines.toLocaleString()}`, c:"#0891B2"},
            {label:"Collected",     v:`TZS ${paidFines.toLocaleString()}`,  c:"#16A34A"},
            {label:"Outstanding",   v:`TZS ${(totalFines-paidFines).toLocaleString()}`, c:"#DC2626"},
          ].map(k=>(
            <div key={k.label} style={{ background:"rgba(255,255,255,.03)", borderRadius:10, padding:"16px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:k.c }}>{k.v}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginTop:4 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </CommandLayout>
  );
}
