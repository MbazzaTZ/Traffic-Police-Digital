import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Search, Fingerprint, CreditCard, Car, Phone, Camera, User } from "lucide-react";

const METHODS = [
  { icon:CreditCard,  label:"NIDA",          sw:"Nambari ya NIDA",  ph:"19901231-12345-00001-1" },
  { icon:User,        label:"Full Name",      sw:"Jina Kamili",      ph:"e.g. John Doe Mwangi" },
  { icon:Car,         label:"Vehicle Plate",  sw:"Nambari ya Gari",  ph:"e.g. T 123 ABC" },
  { icon:Phone,       label:"Phone",          sw:"Nambari ya Simu",  ph:"+255 712 345 678" },
  { icon:Fingerprint, label:"Fingerprint",    sw:"Alama ya Kidole",  ph:"Scan fingerprint..." },
  { icon:Camera,      label:"Face Scan",      sw:"Skanisho la Uso",  ph:"Enable camera..." },
];

export default function PersonSearchPage() {
  const [method, setMethod] = useState(0);
  const [query, setQuery]   = useState("");
  const [searched, setSearched] = useState(false);

  function doSearch(e) { e.preventDefault(); setSearched(true); }

  return (
    <DashboardLayout pageTitle="Person Search" pageTitle2="Tafuta Mtu">
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#0D3477", margin:0 }}>
          Person Search <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Tafuta Mtu</span>
        </h1>
        <p style={{ color:"#64748B", marginTop:4 }}>Search Tanzania National Database · NIDA, Criminal Records, Warrants</p>
      </div>

      {/* Method Tabs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:18 }}>
        {METHODS.map((m, i) => {
          const Icon = m.icon;
          const active = method === i;
          return (
            <button key={i} onClick={() => { setMethod(i); setSearched(false); setQuery(""); }}
              style={{ background:active?"#0D3477":"white", color:active?"white":"#475569", border:`2px solid ${active?"#0D3477":"#E2E8F0"}`, borderRadius:12, padding:"12px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer", transition:".15s" }}>
              <Icon size={20} />
              <div style={{ fontSize:12, fontWeight:700 }}>{m.label}</div>
              <div style={{ fontSize:10, opacity:.65 }}>{m.sw}</div>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <form onSubmit={doSearch} style={{ display:"flex", gap:10, marginBottom:18 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:"white", borderRadius:10, padding:"0 16px", border:"1.5px solid #E2E8F0", height:44 }}>
          <Search size={18} color="#94A3B8" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={METHODS[method].ph}
            style={{ border:"none", outline:"none", fontSize:14, color:"#1E293B", width:"100%", background:"transparent" }} />
        </div>
        <button type="submit" style={{ padding:"0 28px", height:44, background:"#0D3477", color:"white", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          Search · Tafuta
        </button>
      </form>

      {/* Results */}
      {searched ? (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Search size={40} style={{ opacity:.2, marginBottom:12 }} />
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>No results found</div>
          <div style={{ fontSize:13, marginTop:4 }}>Hakuna matokeo · Try a different search term</div>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"60px 20px", textAlign:"center", color:"#94A3B8" }}>
          <Search size={40} style={{ opacity:.2, marginBottom:12 }} />
          <div style={{ fontSize:15, fontWeight:600, color:"#64748B" }}>Enter search criteria above</div>
          <div style={{ fontSize:13, marginTop:4 }}>Weka vigezo vya utafutaji hapo juu</div>
        </div>
      )}
    </DashboardLayout>
  );
}
