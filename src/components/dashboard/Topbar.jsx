import { Bell, MessageSquare, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ pageTitle, pageTitle2 }) {
  const nav = useNavigate();
  const now = new Date();
  const date = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="topbar">
      {/* Left: breadcrumb */}
      <div className="topbar-breadcrumb">
        <MapPin size={14} color="#16A34A" />
        <span>Makambako Police Station</span>
        <span style={{ color: "#E2E8F0" }}>·</span>
        <span className="topbar-page-title">{pageTitle || "Dashboard"}</span>
        {pageTitle2 && (
          <span style={{ color: "#94A3B8", fontSize: 13 }}>· {pageTitle2}</span>
        )}
        <span style={{ color: "#E2E8F0", margin: "0 4px" }}>·</span>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>{date}</span>
      </div>

      {/* Right: actions */}
      <div className="topbar-right">
        <div className="topbar-chip chip-online">
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
          ON DUTY
        </div>

        <button className="topbar-icon-btn" onClick={() => nav("/messages")}>
          <MessageSquare size={18} />
          <span className="topbar-badge">5</span>
        </button>

        <button className="topbar-icon-btn" onClick={() => nav("/alerts")}>
          <Bell size={18} />
          <span className="topbar-badge">3</span>
        </button>

        <div className="topbar-officer">
          <img
            src="/avatars/officer-01.jpg"
            alt="Officer"
            className="topbar-officer-avatar"
            onError={e => {
              e.currentTarget.style.background = "#14489E";
              e.currentTarget.src = "";
            }}
          />
          <div className="topbar-officer-info">
            <div className="topbar-officer-name">Insp. D. Mbaza</div>
            <div className="topbar-officer-badge">TZP-2026-00124</div>
          </div>
        </div>
      </div>
    </header>
  );
}
