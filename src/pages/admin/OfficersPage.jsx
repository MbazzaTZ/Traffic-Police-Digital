import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { UserPlus, Search, Filter, Edit, Trash2, Eye, ChevronRight } from "lucide-react";

const OFFICERS = [
  { name:"Inspector David Mbaza",    badge:"TZP-2026-00124", rank:"Inspector",  role:"Regular Officer",  dept:"Operations",  region:"Njombe",        station:"Makambako PS",    status:"Active",    phone:"+255 712 345 678" },
  { name:"Constable Mary Kileo",     badge:"TZP-2026-00201", rank:"Constable",  role:"Regular Officer",  dept:"Operations",  region:"Njombe",        station:"Makambako PS",    status:"Active",    phone:"+255 755 234 567" },
  { name:"Sergeant John Mwamba",     badge:"TZP-2026-00198", rank:"Sergeant",   role:"Traffic Officer",  dept:"Traffic",     region:"Njombe",        station:"Njombe Central",  status:"Active",    phone:"+255 769 345 678" },
  { name:"Corporal Amina Said",      badge:"TZP-2026-00195", rank:"Corporal",   role:"CID Officer",      dept:"CID",         region:"Iringa",        station:"Iringa HQ",       status:"Pending",   phone:"+255 712 456 789" },
  { name:"Inspector Peter Nkosi",    badge:"TZP-2026-00189", rank:"Inspector",  role:"OCS",              dept:"Operations",  region:"Mbeya",         station:"Mbeya Central",   status:"Active",    phone:"+255 784 567 890" },
  { name:"ASP Grace Mtui",           badge:"TZP-2026-00177", rank:"ASP",        role:"OCD",              dept:"Operations",  region:"Dodoma",        station:"Dodoma HQ",       status:"Active",    phone:"+255 756 678 901" },
  { name:"Constable Hassan Omar",    badge:"TZP-2026-00165", rank:"Constable",  role:"Regular Officer",  dept:"Operations",  region:"Dar es Salaam", station:"Temeke PS",       status:"Active",    phone:"+255 712 789 012" },
  { name:"Sergeant Fatuma Rashid",   badge:"TZP-2025-00143", rank:"Sergeant",   role:"Forensic Officer", dept:"Forensics",   region:"Dar es Salaam", station:"Forensics Lab",   status:"Suspended", phone:"+255 755 890 123" },
];

const STATUS_STYLE = {
  Active:    { bg: "#F0FDF4", color: "#16A34A" },
  Pending:   { bg: "#FFFBEB", color: "#D97706" },
  Suspended: { bg: "#FEF2F2", color: "#DC2626" },
};

export default function OfficersPage() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const roles = ["All", ...new Set(OFFICERS.map(o => o.role))];
  const statuses = ["All","Active","Pending","Suspended"];

  const filtered = OFFICERS.filter(o => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.badge.includes(search);
    const matchRole = filterRole === "All" || o.role === filterRole;
    const matchStatus = filterStatus === "All" || o.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <AdminLayout pageTitle="Officers" pageTitle2="Maafisa Wote">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a0533", margin: 0 }}>Officers · <span style={{ fontWeight: 500, color: "#94A3B8", fontSize: 18 }}>Maafisa</span></h1>
          <p style={{ color: "#64748B", marginTop: 3 }}>{OFFICERS.length} total officers in system</p>
        </div>
        <button onClick={() => nav("/admin/create-user")}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#7C3AED", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <UserPlus size={16} /> Create Officer
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total",     v: OFFICERS.length,                              c: "#7C3AED" },
          { label: "Active",    v: OFFICERS.filter(o=>o.status==="Active").length, c: "#059669" },
          { label: "Pending",   v: OFFICERS.filter(o=>o.status==="Pending").length, c: "#D97706" },
          { label: "Suspended", v: OFFICERS.filter(o=>o.status==="Suspended").length, c: "#DC2626" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", borderTop: `4px solid ${s.c}`, textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "0 14px", height: 40 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or badge..."
            style={{ border: "none", outline: "none", fontSize: 13, color: "#1E293B", width: "100%", background: "transparent" }} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ height: 40, border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "0 12px", fontSize: 13, background: "white", outline: "none", cursor: "pointer" }}>
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ height: 40, border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "0 12px", fontSize: 13, background: "white", outline: "none", cursor: "pointer" }}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
              {["Officer","Badge","Rank","Role","Department","Region / Station","Status","Actions"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .4 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => {
              const ss = STATUS_STYLE[o.status] || STATUS_STYLE.Active;
              return (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {o.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{o.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{o.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>{o.badge}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{o.rank}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{o.role}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{o.dept}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{o.region}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{o.station}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: ss.bg, color: ss.color, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{o.status}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                        <Eye size={14} />
                      </button>
                      <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0D3477" }}>
                        <Edit size={14} />
                      </button>
                      <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>
            <Search size={36} style={{ opacity: .3, marginBottom: 10 }} />
            <p>No officers found matching your search</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
