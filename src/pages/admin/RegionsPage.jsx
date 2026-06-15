import { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { MapPin, Plus, ChevronDown, ChevronRight, Building2, Users } from "lucide-react";

const REGIONS = [
  { name:"Njombe",        code:"NJO", zone:"Southern", districts:["Njombe Urban","Makete","Wanging'ombe","Ludewa"], stations:8,  officers:87  },
  { name:"Iringa",        code:"IRI", zone:"Southern", districts:["Iringa Urban","Kilolo","Mufindi","Iringa Rural"], stations:11, officers:124 },
  { name:"Mbeya",         code:"MBY", zone:"Southern", districts:["Mbeya Urban","Chunya","Mbarali","Kyela","Rungwe","Busokelo"], stations:14, officers:178 },
  { name:"Dar es Salaam", code:"DAR", zone:"Eastern",  districts:["Ilala","Kinondoni","Temeke","Ubungo","Kigamboni"], stations:42, officers:650 },
  { name:"Dodoma",        code:"DOD", zone:"Central",  districts:["Dodoma Urban","Bahi","Chamwino","Kondoa","Mpwapwa"], stations:12, officers:145 },
  { name:"Arusha",        code:"ARU", zone:"Northern", districts:["Arusha Urban","Meru","Ngorongoro","Monduli","Karatu","Longido"], stations:16, officers:210 },
];

export default function RegionsPage() {
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal]       = useState(false);

  return (
    <AdminLayout pageTitle="Regions & Districts" pageTitle2="Mikoa na Wilaya">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a0533", margin:0 }}>Regions & Districts</h1>
          <p style={{ color:"#64748B", marginTop:3 }}>Mikoa na Wilaya · Tanzania national structure</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <Plus size={16} /> Add Region
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Regions / Mikoa",  v:"31", c:"#7C3AED" },
          { label:"Districts / Wilaya",v:"184",c:"#0D3477" },
          { label:"Stations / Vituo", v:"186", c:"#059669" },
          { label:"Officers / Maafisa",v:"1,247",c:"#D97706" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Hierarchy */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {REGIONS.map((r, i) => (
          <div key={i} style={{ background:"white", borderRadius:14, border:"1px solid #E2E8F0", overflow:"hidden" }}>
            <button onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px 20px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <MapPin size={18} color="#7C3AED" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#1a0533" }}>{r.name} Region</div>
                <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Code: {r.code} · Zone: {r.zone} · {r.districts.length} Districts</div>
              </div>
              <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:800, color:"#7C3AED" }}>{r.stations}</div>
                  <div style={{ fontSize:10, color:"#94A3B8" }}>Stations</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:800, color:"#0D3477" }}>{r.officers}</div>
                  <div style={{ fontSize:10, color:"#94A3B8" }}>Officers</div>
                </div>
                {expanded === i ? <ChevronDown size={18} color="#94A3B8" /> : <ChevronRight size={18} color="#94A3B8" />}
              </div>
            </button>

            {expanded === i && (
              <div style={{ padding:"0 20px 16px", borderTop:"1px solid #F1F5F9" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"12px 0 8px", textTransform:"uppercase", letterSpacing:.5 }}>Districts · Wilaya</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                  {r.districts.map((d, j) => (
                    <div key={j} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
                      <Building2 size={14} color="#7C3AED" />
                      <span style={{ fontSize:12, fontWeight:600, color:"#1E293B" }}>{d}</span>
                    </div>
                  ))}
                  <button style={{ background:"#F5F3FF", border:"1px dashed #DDD6FE", borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:6, cursor:"pointer", color:"#7C3AED", fontSize:12, fontWeight:600 }}>
                    <Plus size={13} /> Add District
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Region Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div style={{ background:"white", borderRadius:20, padding:28, width:460 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#1a0533" }}>Add Region · Ongeza Mkoa</div>
              <button onClick={() => setModal(false)} style={{ border:"none", background:"#F1F5F9", borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>✕</button>
            </div>
            {[["Region Name","e.g. Njombe"],["Region Code","e.g. NJO"],["Zone","e.g. Southern Zone"]].map(([l,p]) => (
              <div key={l} style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:.4, marginBottom:6 }}>{l} *</label>
                <input placeholder={p} style={{ width:"100%", height:42, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor="#7C3AED"} onBlur={e => e.target.style.borderColor="#E2E8F0"} />
              </div>
            ))}
            <button onClick={() => setModal(false)} style={{ width:"100%", height:44, background:"#7C3AED", color:"white", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:14 }}>
              Add Region · Ongeza Mkoa
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
