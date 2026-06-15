import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { UserPlus, Search, Users } from "lucide-react";

export default function OfficersPage() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <AdminLayout pageTitle="Officers" pageTitle2="Maafisa Wote">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:"#1a0533", margin:0 }}>Officers <span style={{ fontWeight:500, color:"#94A3B8", fontSize:18 }}>· Maafisa</span></h1>
          <p style={{ color:"#64748B", marginTop:3 }}>All registered officers in the system</p>
        </div>
        <button onClick={() => nav("/admin/create-user")}
          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
          <UserPlus size={16} /> Create Officer
        </button>
      </div>

      {/* Stats — all zero */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        {[
          { label:"Total",     c:"#7C3AED" },
          { label:"Active",    c:"#059669" },
          { label:"Pending",   c:"#D97706" },
          { label:"Suspended", c:"#DC2626" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:14, padding:"16px 18px", border:"1px solid #E2E8F0", borderTop:`4px solid ${s.c}`, textAlign:"center" }}>
            <div style={{ fontSize:30, fontWeight:900, color:s.c }}>0</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 14px", height:42, marginBottom:16, maxWidth:340 }}>
        <Search size={16} color="#94A3B8" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or badge..."
          style={{ border:"none", outline:"none", fontSize:13, color:"#1E293B", width:"100%", background:"transparent" }} />
      </div>

      {/* Empty state */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"80px 20px", textAlign:"center", color:"#94A3B8" }}>
        <Users size={48} style={{ opacity:.2, marginBottom:14 }} />
        <div style={{ fontSize:16, fontWeight:600, color:"#64748B" }}>No officers registered yet</div>
        <div style={{ fontSize:13, marginTop:6 }}>Maafisa hawajasajiliwa bado · Create your first officer to get started</div>
        <button onClick={() => nav("/admin/create-user")} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, border:"none", background:"#7C3AED", color:"white", fontWeight:700, cursor:"pointer", fontSize:13 }}>
          Create First Officer · Unda Afisa wa Kwanza
        </button>
      </div>
    </AdminLayout>
  );
}
