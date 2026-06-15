import { Bell, MessageSquare, MapPin, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ pageTitle = "Dashboard", pageTitle2 = "" }) {
  const nav = useNavigate();
  const date = new Date().toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short", year:"numeric" });

  return (
    <header style={{
      position: "fixed", top: 0, left: 240, right: 0,
      height: 64, background: "white",
      borderBottom: "1px solid #E2E8F0",
      boxShadow: "0 1px 8px rgba(0,0,0,.06)",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px", zIndex: 40,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MapPin size={14} color="#16A34A" />
        <span style={{ fontSize: 13, color: "#64748B" }}>Makambako Police Station</span>
        <span style={{ color: "#CBD5E1", margin: "0 2px" }}>·</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0D3477" }}>{pageTitle}</span>
        {pageTitle2 && <span style={{ fontSize: 13, color: "#94A3B8" }}>· {pageTitle2}</span>}
        <span style={{ color: "#CBD5E1", margin: "0 4px" }}>·</span>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>{date}</span>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* On Duty */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>ON DUTY</span>
        </div>

        {/* Messages */}
        <button onClick={() => nav("/messages")} style={{
          position: "relative", width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, border: "1px solid #E2E8F0", background: "white",
          cursor: "pointer", color: "#64748B",
        }}>
          <MessageSquare size={18} />
          <span style={{ position: "absolute", top: -4, right: -4, width: 17, height: 17, borderRadius: "50%", background: "#0D3477", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>5</span>
        </button>

        {/* Alerts */}
        <button onClick={() => nav("/alerts")} style={{
          position: "relative", width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, border: "1px solid #E2E8F0", background: "white",
          cursor: "pointer", color: "#64748B",
        }}>
          <Bell size={18} />
          <span style={{ position: "absolute", top: -4, right: -4, width: 17, height: 17, borderRadius: "50%", background: "#DC2626", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>3</span>
        </button>

        {/* Officer */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 6px", borderRadius: 999, border: "1px solid #E2E8F0", cursor: "pointer" }}>
          <img src="/police-logo.png" alt="Officer"
            style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid #DBEAFE" }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Insp. D. Mbaza</div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>TZP-2026-00124</div>
          </div>
          <ChevronDown size={13} color="#94A3B8" />
        </div>
      </div>
    </header>
  );
}
