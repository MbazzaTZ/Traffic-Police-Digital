import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, FileText, Shield,
  MapPinned, FolderOpen, MessageSquare, Bell,
  Settings, LogOut
} from "lucide-react";

const NAV = [
  { label: "Dashboard",       sw: "Dashibodi",    icon: LayoutDashboard, path: "/dashboard" },
  { label: "Person Search",   sw: "Tafuta Mtu",   icon: Search,          path: "/person-search" },
  { label: "Incident Reports",sw: "Ripoti",       icon: FileText,        path: "/incidents" },
  { label: "Arrests",         sw: "Kukamatwa",    icon: Shield,          path: "/arrests" },
  { label: "Patrols",         sw: "Doria",        icon: MapPinned,       path: "/patrols" },
  { label: "Evidence",        sw: "Ushahidi",     icon: FolderOpen,      path: "/evidence" },
  { label: "Messages",        sw: "Ujumbe",       icon: MessageSquare,   path: "/messages",  badge: 5 },
  { label: "Alerts",          sw: "Tahadhari",    icon: Bell,            path: "/alerts",    badge: 3 },
  { label: "Settings",        sw: "Mipangilio",   icon: Settings,        path: "/settings" },
];

export default function Sidebar() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-ring">
          <img
            src="/police-logo-transparent.png"
            alt="Tanzania Police"
            onError={e => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.innerHTML =
                '<div style="color:rgba(255,255,255,.4);font-size:10px;text-align:center">POLISI</div>';
            }}
          />
        </div>
        <div className="sidebar-app-name">TPDOP</div>
        <div className="sidebar-app-sub">Digital Operations Platform</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Operations</div>
        {NAV.map(item => {
          const Icon = item.icon;
          const active = loc.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`nav-item${active ? " active" : ""}`}
              onClick={() => nav(item.path)}
            >
              <span className="nav-item-icon">
                <Icon size={17} />
              </span>
              <span className="nav-item-text">
                <div className="nav-item-label">{item.label}</div>
                <div className="nav-item-sub">{item.sw}</div>
              </span>
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-officer-card">
          <img
            src="/avatars/officer-01.jpg"
            alt="Officer"
            className="sidebar-officer-avatar"
            onError={e => {
              e.currentTarget.style.background = "#14489E";
              e.currentTarget.style.display = "block";
              e.currentTarget.src = "";
            }}
          />
          <div className="sidebar-officer-info">
            <div className="sidebar-officer-name">Insp. D. Mbaza</div>
            <div className="sidebar-officer-rank">TZP-2026-00124 · On Duty</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => nav("/")}>
          <LogOut size={14} />
          <span>Logout · Toka</span>
        </button>
      </div>
    </aside>
  );
}
