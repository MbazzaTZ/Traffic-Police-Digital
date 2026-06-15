import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  Search, Fingerprint, CreditCard, Car, Phone, Camera, User,
  AlertTriangle, CheckCircle, XCircle, Shield, FileText, ChevronRight
} from "lucide-react";

const METHODS = [
  { icon: CreditCard,  label: "NIDA",         sw: "Nambari ya NIDA",    ph: "19901231-12345-00001-1" },
  { icon: User,        label: "Full Name",     sw: "Jina Kamili",        ph: "e.g. John Doe Mwangi" },
  { icon: Car,         label: "Vehicle Plate", sw: "Nambari ya Gari",    ph: "e.g. T 123 ABC" },
  { icon: Phone,       label: "Phone",         sw: "Nambari ya Simu",    ph: "+255 712 345 678" },
  { icon: Fingerprint, label: "Fingerprint",   sw: "Alama ya Kidole",    ph: "Scan fingerprint..." },
  { icon: Camera,      label: "Face Scan",     sw: "Skanisho la Uso",    ph: "Enable camera..." },
];

const PERSONS = [
  {
    id: "P-001", nida: "19850615-12345-00001-2", name: "JUMA ABDALLAH MWALIMU",
    dob: "15/06/1985", gender: "Male", region: "Njombe", occupation: "Unknown",
    phone: "+255 712 456 789", photo: "/wanted/wanted-01.jpg",
    status: "Wanted", statusCls: "badge-danger",
    crimes: ["Armed Robbery – 2024", "Assault – 2023"], warrants: 2, arrests: 3, cases: 5, risk: 87,
  },
  {
    id: "P-002", nida: "19920301-67890-00002-1", name: "AMINA SALIM HASSAN",
    dob: "01/03/1992", gender: "Female", region: "Njombe", occupation: "Teacher",
    phone: "+255 755 123 456", photo: "/suspects/suspect-01.jpg",
    status: "Clear", statusCls: "badge-success",
    crimes: [], warrants: 0, arrests: 0, cases: 0, risk: 5,
  },
  {
    id: "P-003", nida: "19780910-11111-00003-3", name: "PETER JOHN MHAGAMA",
    dob: "10/09/1978", gender: "Male", region: "Iringa", occupation: "Trader",
    phone: "+255 769 876 543", photo: "/suspects/suspect-02.jpg",
    status: "Suspect", statusCls: "badge-warning",
    crimes: ["Fraud – 2025"], warrants: 0, arrests: 1, cases: 2, risk: 42,
  },
];

function riskColor(r) {
  if (r >= 70) return "#DC2626";
  if (r >= 40) return "#D97706";
  return "#16A34A";
}

export default function PersonSearchPage() {
  const [method, setMethod] = useState(0);
  const [query, setQuery]   = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);

  function doSearch(e) { e.preventDefault(); setSearched(true); setSelected(null); }

  const M = METHODS[method];

  return (
    <DashboardLayout pageTitle="Person Search" pageTitle2="Tafuta Mtu">
      <div className="page-hd">
        <div className="page-hd-row">
          <div>
            <h1 className="page-title">Person Search <span className="page-title-sw">· Tafuta Mtu</span></h1>
            <p className="page-sub">Search Tanzania National Database · NIDA, Criminal Records, Warrants, Vehicles</p>
          </div>
        </div>
      </div>

      {/* Method Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 18 }}>
        {METHODS.map((m, i) => {
          const Icon = m.icon;
          const active = method === i;
          return (
            <button key={i} onClick={() => { setMethod(i); setSearched(false); setSelected(null); }}
              style={{
                background: active ? "var(--blue-700)" : "white",
                color: active ? "white" : "var(--gray-500)",
                border: `2px solid ${active ? "var(--blue-700)" : "var(--gray-200)"}`,
                borderRadius: "var(--radius-md)", padding: "12px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                cursor: "pointer", transition: ".15s",
              }}>
              <Icon size={20} />
              <div style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 10, opacity: .65 }}>{m.sw}</div>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <form onSubmit={doSearch} className="search-bar">
        <div className="search-input-wrap">
          <Search size={18} color="var(--gray-400)" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder={M.ph}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: "0 28px", height: 44 }}>
          Search · Tafuta
        </button>
      </form>

      {/* Results List */}
      {searched && !selected && (
        <>
          <div style={{ fontSize: 13, color: "var(--gray-400)", fontWeight: 600, marginBottom: 12 }}>
            {PERSONS.length} results found · Matokeo {PERSONS.length} yamepatikana
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PERSONS.map(p => (
              <div key={p.id} className="card" onClick={() => setSelected(p)}
                style={{ padding: "18px 20px", display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }}>
                <img src={p.photo} alt={p.name}
                  style={{ width: 60, height: 76, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "2px solid var(--gray-200)", flexShrink: 0 }}
                  onError={e => { e.currentTarget.src = "/police-logo.png"; e.currentTarget.style.objectFit = "contain"; e.currentTarget.style.background = "#F1F5F9"; }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "var(--blue-800)" }}>{p.name}</span>
                    <span className={`badge ${p.statusCls}`}>{p.status}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {[["NIDA", p.nida], ["DOB", p.dob], ["Gender", p.gender], ["Region", p.region]].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 700 }}>{k}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-900)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0, marginRight: 4 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: riskColor(p.risk) }}>{p.risk}</div>
                  <div style={{ fontSize: 10, color: "var(--gray-400)" }}>Risk</div>
                </div>
                <ChevronRight size={18} color="var(--gray-300)" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Full Profile */}
      {selected && (
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => setSelected(null)}>
            ← Back to results
          </button>

          {/* Profile header */}
          <div className="card card-padded" style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <img src={selected.photo} alt={selected.name}
                style={{ width: 150, height: 190, objectFit: "cover", borderRadius: "var(--radius-md)", border: "3px solid var(--gray-200)", display: "block" }}
                onError={e => { e.currentTarget.src = "/police-logo.png"; e.currentTarget.style.objectFit = "contain"; e.currentTarget.style.background = "#F1F5F9"; }} />
              <span className={`badge ${selected.statusCls}`} style={{ marginTop: 8, display: "inline-flex" }}>{selected.status}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--gray-400)", marginBottom: 4 }}>NIDA: {selected.nida}</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--blue-800)", marginBottom: 16 }}>{selected.name}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  ["Date of Birth", selected.dob], ["Gender", selected.gender],
                  ["Region", selected.region], ["Occupation", selected.occupation], ["Phone", selected.phone],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--gray-50)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 700, marginBottom: 4 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Risk gauge */}
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%",
                background: riskColor(selected.risk) + "18",
                border: `4px solid ${riskColor(selected.risk)}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
              }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: riskColor(selected.risk) }}>{selected.risk}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-500)", marginTop: 8 }}>Risk Score</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row stats-4" style={{ marginBottom: 16 }}>
            {[
              { label: "Warrants",  sw: "Hati",       v: selected.warrants, c: "#DC2626", icon: AlertTriangle },
              { label: "Arrests",   sw: "Kukamatwa",  v: selected.arrests,  c: "#0D3477", icon: Shield },
              { label: "Cases",     sw: "Kesi",       v: selected.cases,    c: "#7C3AED", icon: FileText },
              { label: "Crimes",    sw: "Makosa",     v: selected.crimes.length, c: "#D97706", icon: AlertTriangle },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="stat-box" style={{ borderTopColor: s.c }}>
                  <Icon size={20} color={s.c} style={{ marginBottom: 6 }} />
                  <div className="stat-box-value" style={{ color: s.c }}>{s.v}</div>
                  <div className="stat-box-label">{s.label}</div>
                  <div className="stat-box-sw">{s.sw}</div>
                </div>
              );
            })}
          </div>

          {/* Criminal history */}
          <div className="panel">
            <div className="panel-hd">
              <div className="card-title">Criminal History · Historia ya Uhalifu</div>
            </div>
            <div className="panel-body">
              {selected.crimes.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--success)" }}>
                  <CheckCircle size={18} />
                  <span style={{ fontWeight: 600 }}>No criminal record · Hakuna rekodi ya uhalifu</span>
                </div>
              ) : selected.crimes.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--gray-100)", alignItems: "center" }}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span style={{ fontSize: 14 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Officer Actions */}
          <div className="card card-padded" style={{ marginTop: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--blue-800)", marginBottom: 14 }}>Officer Actions · Vitendo vya Afisa</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { label: "Record Arrest",    sw: "Kukamatwa",    bg: "#FEF2F2", c: "#DC2626" },
                { label: "Create Incident",  sw: "Unda Tukio",   bg: "#EFF6FF", c: "#0D3477" },
                { label: "Issue Alert",      sw: "Toa Tahadhari",bg: "#FFFBEB", c: "#D97706" },
                { label: "Add to Watchlist", sw: "Orodha ya Mtu",bg: "#F5F3FF", c: "#7C3AED" },
              ].map(a => (
                <button key={a.label} style={{
                  background: a.bg, border: `1.5px solid ${a.c}30`, borderRadius: "var(--radius-md)",
                  padding: "14px 10px", cursor: "pointer", color: a.c,
                  fontWeight: 700, fontSize: 13, textAlign: "center",
                }}>
                  <div>{a.label}</div>
                  <div style={{ fontSize: 11, opacity: .65, marginTop: 2 }}>{a.sw}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!searched && (
        <div className="empty-state">
          <Search size={48} style={{ opacity: .2, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>Select a search method and enter a query</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Chagua njia ya utafutaji na uweke kigezo</p>
        </div>
      )}
    </DashboardLayout>
  );
}
