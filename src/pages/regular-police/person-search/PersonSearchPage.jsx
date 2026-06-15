import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  Search, Fingerprint, CreditCard, Car, Phone,
  Camera, User, AlertTriangle, CheckCircle, XCircle,
  Shield, FileText, MapPin, Clock, ChevronRight
} from "lucide-react";

const searchMethods = [
  { icon: CreditCard, label: "NIDA Number",   labelSw: "Nambari ya NIDA",  placeholder: "e.g. 19901231-12345-00001-1" },
  { icon: User,       label: "Full Name",      labelSw: "Jina Kamili",       placeholder: "e.g. John Doe Mwangi" },
  { icon: Car,        label: "Vehicle Plate",  labelSw: "Nambari ya Gari",   placeholder: "e.g. T 123 ABC" },
  { icon: Phone,      label: "Phone Number",   labelSw: "Nambari ya Simu",   placeholder: "e.g. +255 712 345 678" },
  { icon: Fingerprint,label: "Fingerprint",    labelSw: "Alama ya Kidole",   placeholder: "Scan fingerprint..." },
  { icon: Camera,     label: "Face Scan",      labelSw: "Skanisho la Uso",   placeholder: "Enable camera..." },
];

const mockPersons = [
  {
    id: "P-001", nida: "19850615-12345-00001-2", name: "JUMA ABDALLAH MWALIMU",
    dob: "15/06/1985", gender: "Male", region: "Njombe", district: "Makambako",
    status: "Wanted", statusColor: "#dc2626", statusBg: "#fef2f2",
    occupation: "Unknown", phone: "+255 712 456 789",
    photo: "/wanted/wanted-01.jpg",
    crimes: ["Armed Robbery – 2024", "Assault – 2023"],
    warrants: 2, arrests: 3, cases: 5, risk: 87
  },
  {
    id: "P-002", nida: "19920301-67890-00002-1", name: "AMINA SALIM HASSAN",
    dob: "01/03/1992", gender: "Female", region: "Njombe", district: "Njombe Urban",
    status: "Clear", statusColor: "#16a34a", statusBg: "#f0fdf4",
    occupation: "Teacher", phone: "+255 755 123 456",
    photo: "/suspects/suspect-01.jpg",
    crimes: [], warrants: 0, arrests: 0, cases: 0, risk: 5
  },
  {
    id: "P-003", nida: "19780910-11111-00003-3", name: "PETER JOHN MHAGAMA",
    dob: "10/09/1978", gender: "Male", region: "Iringa", district: "Iringa Urban",
    status: "Suspect", statusColor: "#d97706", statusBg: "#fffbeb",
    occupation: "Trader", phone: "+255 769 876 543",
    photo: "/suspects/suspect-02.jpg",
    crimes: ["Fraud – 2025"], warrants: 0, arrests: 1, cases: 2, risk: 42
  },
];

function statusIcon(s) {
  if (s === "Wanted")  return <AlertTriangle size={14} />;
  if (s === "Clear")   return <CheckCircle size={14} />;
  return <XCircle size={14} />;
}

export default function PersonSearchPage() {
  const [method, setMethod] = useState(0);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);

  function handleSearch(e) {
    e.preventDefault();
    setSearched(true);
    setSelected(null);
  }

  const currentMethod = searchMethods[method];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Person Search · <span style={{ fontSize: 20, color: "#94a3b8", fontWeight: 500 }}>Tafuta Mtu</span></h1>
        <p>Search Tanzania National Database · NIDA, Criminal Records, Warrants</p>
      </div>

      {/* SEARCH METHOD TABS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 20 }}>
        {searchMethods.map((m, i) => {
          const Icon = m.icon;
          return (
            <button key={i} onClick={() => { setMethod(i); setSearched(false); setSelected(null); }}
              style={{
                background: method === i ? "#0D3477" : "white",
                color: method === i ? "white" : "#475569",
                border: `2px solid ${method === i ? "#0D3477" : "#e2e8f0"}`,
                borderRadius: 14, padding: "12px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                cursor: "pointer", transition: ".2s", fontSize: 12
              }}>
              <Icon size={20} />
              <div style={{ fontWeight: 600, textAlign: "center" }}>{m.label}</div>
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 16, padding: "14px 18px", border: "2px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
          <Search size={20} color="#94a3b8" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder={currentMethod.placeholder}
            style={{ border: "none", outline: "none", width: "100%", fontSize: 15, color: "#1e293b" }}
          />
        </div>
        <button type="submit" style={{
          background: "#0D3477", color: "white", border: "none", borderRadius: 14,
          padding: "0 32px", fontWeight: 700, fontSize: 15, cursor: "pointer"
        }}>
          Search · Tafuta
        </button>
      </form>

      {/* RESULTS */}
      {searched && !selected && (
        <>
          <div style={{ fontWeight: 700, color: "#475569", marginBottom: 14 }}>
            {mockPersons.length} results found · Matokeo {mockPersons.length} yamepatikana
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mockPersons.map(p => (
              <div key={p.id} onClick={() => setSelected(p)}
                style={{
                  background: "white", borderRadius: 20, padding: 20,
                  display: "flex", gap: 16, alignItems: "center",
                  cursor: "pointer", border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                  transition: ".2s"
                }}>
                <img src={p.photo} alt={p.name} style={{ width: 64, height: 80, objectFit: "cover", borderRadius: 12 }}
                  onError={e => { e.target.src = "/police-logo.png"; e.target.style.objectFit = "contain"; }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: "#0D3477" }}>{p.name}</span>
                    <span style={{ background: p.statusBg, color: p.statusColor, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      {statusIcon(p.status)} {p.status}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                    {[
                      ["NIDA", p.nida],
                      ["DOB", p.dob],
                      ["Gender", p.gender],
                      ["Region", p.region],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: p.risk > 60 ? "#dc2626" : "#16a34a" }}>{p.risk}</div>
                    <div>Risk Score</div>
                  </div>
                  <ChevronRight size={20} color="#94a3b8" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FULL PROFILE */}
      {selected && (
        <div>
          <button onClick={() => setSelected(null)}
            style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 16px", marginBottom: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}>
            ← Back to results
          </button>

          {/* PROFILE CARD */}
          <div className="person-profile-card" style={{ background: "white", borderRadius: 24, padding: 24, marginBottom: 20, display: "flex", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <img src={selected.photo} alt={selected.name}
                style={{ width: 160, height: 200, objectFit: "cover", borderRadius: 16, border: "3px solid #e2e8f0" }}
                onError={e => { e.target.src = "/police-logo.png"; e.target.style.objectFit = "contain"; }} />
              <div style={{ marginTop: 10, background: selected.statusBg, color: selected.statusColor, padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                {selected.status}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>NIDA: {selected.nida}</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0D3477", margin: "0 0 16px" }}>{selected.name}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {[
                  ["Date of Birth", selected.dob],
                  ["Gender / Jinsia", selected.gender],
                  ["Region / Mkoa", selected.region],
                  ["District", selected.district],
                  ["Occupation", selected.occupation],
                  ["Phone", selected.phone],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RISK SCORE */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: selected.risk > 60 ? "#fef2f2" : selected.risk > 30 ? "#fffbeb" : "#f0fdf4",
                border: `4px solid ${selected.risk > 60 ? "#dc2626" : selected.risk > 30 ? "#d97706" : "#16a34a"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", margin: "0 auto"
              }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: selected.risk > 60 ? "#dc2626" : selected.risk > 30 ? "#d97706" : "#16a34a" }}>{selected.risk}</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#475569" }}>Risk Score</div>
            </div>
          </div>

          {/* RECORD STATS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { icon: AlertTriangle, label: "Warrants",  labelSw: "Hati",    value: selected.warrants, color: "#dc2626" },
              { icon: Shield,        label: "Arrests",   labelSw: "Kukamatwa", value: selected.arrests, color: "#0D3477" },
              { icon: FileText,      label: "Cases",     labelSw: "Kesi",    value: selected.cases,   color: "#7c3aed" },
              { icon: Clock,         label: "Crimes",    labelSw: "Makosa",  value: selected.crimes.length, color: "#d97706" },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="kpi-card" style={{ borderTopColor: item.color }}>
                  <Icon size={24} color={item.color} style={{ marginBottom: 6 }} />
                  <h1 style={{ fontSize: 36, color: item.color, margin: 0 }}>{item.value}</h1>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.labelSw}</div>
                </div>
              );
            })}
          </div>

          {/* CRIMINAL HISTORY */}
          <div className="panel" style={{ marginTop: 0 }}>
            <h3 style={{ marginBottom: 16 }}>Criminal History · <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Historia ya Uhalifu</span></h3>
            {selected.crimes.length === 0 ? (
              <div style={{ color: "#16a34a", fontWeight: 600, padding: 20, textAlign: "center" }}>
                <CheckCircle size={24} style={{ marginBottom: 6 }} />
                <p>No criminal record found · Hakuna rekodi ya uhalifu</p>
              </div>
            ) : (
              selected.crimes.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <span style={{ fontSize: 14, color: "#1e293b" }}>{c}</span>
                </div>
              ))
            )}
          </div>

          {/* OFFICER ACTIONS */}
          <div className="panel" style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 16 }}>Officer Actions · <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Vitendo vya Afisa</span></h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "Record Arrest",   labelSw: "Rekodi Kukamatwa", color: "#dc2626", bg: "#fef2f2" },
                { label: "Create Incident", labelSw: "Unda Tukio",       color: "#0D3477", bg: "#eff6ff" },
                { label: "Issue Alert",     labelSw: "Toa Tahadhari",    color: "#d97706", bg: "#fffbeb" },
                { label: "Add to Watchlist",labelSw: "Ongeza Kwenye Orodha", color: "#7c3aed", bg: "#f5f3ff" },
              ].map(a => (
                <button key={a.label} style={{
                  background: a.bg, border: `1px solid ${a.color}30`,
                  borderRadius: 14, padding: "14px 10px", cursor: "pointer",
                  color: a.color, fontWeight: 700, fontSize: 13, textAlign: "center"
                }}>
                  <div>{a.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{a.labelSw}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!searched && (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <Search size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 16 }}>Enter search criteria above · Weka vigezo vya utafutaji hapo juu</p>
        </div>
      )}
    </DashboardLayout>
  );
}
