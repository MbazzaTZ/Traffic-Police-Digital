import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, FileText, Shield,
  MapPinned, FolderOpen, MessageSquare, Settings,
  LogOut, UserCog, AlertTriangle
} from "lucide-react";

const menu = [
  { icon: LayoutDashboard, label: "Dashboard",        labelSw: "Dashibodi",     path: "/dashboard" },
  { icon: Search,          label: "Person Search",    labelSw: "Tafuta Mtu",    path: "/person-search" },
  { icon: FileText,        label: "Incident Reports", labelSw: "Ripoti",        path: "/incidents" },
  { icon: Shield,          label: "Arrests",          labelSw: "Kukamatwa",     path: "/arrests" },
  { icon: MapPinned,       label: "Patrols",          labelSw: "Doria",         path: "/patrols" },
  { icon: FolderOpen,      label: "Evidence",         labelSw: "Ushahidi",      path: "/evidence" },
  { icon: MessageSquare,   label: "Messages",         labelSw: "Ujumbe",        path: "/messages" },
  { icon: AlertTriangle,   label: "Alerts",           labelSw: "Tahadhari",     path: "/alerts" },
  { icon: Settings,        label: "Settings",         labelSw: "Mipangilio",    path: "/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
      <div className="sidebar-header">
        <img src="/police-logo-transparent.png" alt="Police" className="sidebar-logo" />
        <h3>TPDOP</h3>
      </div>

      <div style={{ flex: 1 }}>
        {menu.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item${active ? " active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={18} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, opacity: 0.65 }}>{item.labelSw}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12, marginTop: 12 }}>
        <button className="sidebar-item" style={{ opacity: 0.75 }} onClick={() => navigate("/")}>
          <LogOut size={16} />
          <span style={{ fontSize: 13 }}>Logout / Toka</span>
        </button>
      </div>
    </aside>
  );
}
