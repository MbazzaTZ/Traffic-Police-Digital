import { Bell, MessageSquare, MapPin, Wifi, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Topbar() {
  const [time] = useState(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MapPin size={15} color="#2E7D32" />
        <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Makambako Police Station</span>
        <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 8 }}>
          {new Date().toLocaleDateString("en-GB")} · {time}
        </span>
      </div>

      <div className="topbar-actions">
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", padding: "6px 14px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
          <Wifi size={14} color="#16a34a" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>ON DUTY</span>
        </div>

        <div style={{ position: "relative" }}>
          <Bell size={22} color="#475569" style={{ cursor: "pointer" }} />
          <span style={{ position: "absolute", top: -4, right: -4, background: "#dc2626", color: "white", fontSize: 10, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>3</span>
        </div>

        <div style={{ position: "relative" }}>
          <MessageSquare size={22} color="#475569" style={{ cursor: "pointer" }} />
          <span style={{ position: "absolute", top: -4, right: -4, background: "#0D3477", color: "white", fontSize: 10, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>5</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <img src="/police-logo.png" alt="Officer" className="topbar-avatar" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Insp. D. Mbaza</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>TZP-2026-00124</div>
          </div>
          <ChevronDown size={14} color="#94a3b8" />
        </div>
      </div>
    </header>
  );
}
