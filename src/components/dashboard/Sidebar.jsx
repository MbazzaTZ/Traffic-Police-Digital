import {
  LayoutDashboard,
  Search,
  FileText,
  Shield,
  MapPinned,
  FolderOpen,
  MessageSquare,
  Settings
} from "lucide-react";

export default function Sidebar() {

  const menu = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Search, label: "Person Search" },
    { icon: FileText, label: "Incident Reports" },
    { icon: Shield, label: "Arrests" },
    { icon: MapPinned, label: "Patrols" },
    { icon: FolderOpen, label: "Evidence" },
    { icon: MessageSquare, label: "Messages" },
    { icon: Settings, label: "Settings" }
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-header">

        <img
          src="/police-logo-transparent.png"
          alt="Police"
          className="sidebar-logo"
        />

        <h3>TPDOP</h3>

      </div>

      {menu.map((item) => {

        const Icon = item.icon;

        return (
          <button
            key={item.label}
            className="sidebar-item"
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}

    </aside>
  );
}
