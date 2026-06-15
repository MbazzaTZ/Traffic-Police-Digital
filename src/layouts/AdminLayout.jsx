import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, MapPin,
  Shield, Settings, LogOut, ChevronRight,
  Bell, Search, UserCog
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",     sw: "Dashibodi",      path: "/admin" },
  { icon: Users,           label: "Officers",       sw: "Maafisa",        path: "/admin/officers" },
  { icon: UserCog,         label: "Create User",    sw: "Unda Mtumiaji",  path: "/admin/create-user" },
  { icon: Building2,       label: "Stations",       sw: "Vituo",          path: "/admin/stations" },
  { icon: MapPin,          label: "Regions & Districts", sw: "Mikoa",     path: "/admin/regions" },
  { icon: Shield,          label: "Roles & Access", sw: "Majukumu",       path: "/admin/roles" },
  { icon: Settings,        label: "System Settings",sw: "Mipangilio",     path: "/admin/settings" },
];

export default function AdminLayout({ children, pageTitle = "Admin", pageTitle2 = "" }) {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F7FC", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1a0533 0%, #2d0a52 45%, #3d1270 100%)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, zIndex: 50,
        boxShadow: "4px 0 24px rgba(0,0,0,.3)",
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.08)", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,255,255,.1)", border: "2px solid rgba(255,255,255,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 10px", padding: 8,
          }}>
            <img src="/police-logo-transparent.png" alt="TPDOP"
              style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ color: "white", fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>TPDOP</div>
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: 9, letterSpacing: 1, marginTop: 2 }}>ADMIN PANEL</div>
          <div style={{
            marginTop: 8, padding: "4px 10px", borderRadius: 999,
            background: "rgba(255,200,0,.15)", border: "1px solid rgba(255,200,0,.3)",
            display: "inline-block",
          }}>
            <span style={{ color: "#FFD700", fontSize: 10, fontWeight: 700 }}>⭐ ADMINISTRATOR</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.3)", letterSpacing: 1.5, padding: "8px 10px 4px", textTransform: "uppercase" }}>
            Administration
          </div>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = loc.pathname === item.path;
            return (
              <button key={item.path} onClick={() => nav(item.path)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, border: "none",
                  background: active ? "rgba(255,255,255,.13)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,.6)",
                  cursor: "pointer", marginBottom: 2, transition: ".15s", textAlign: "left",
                  borderLeft: active ? "3px solid #FFD700" : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "white"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; }}}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 10, opacity: .5, marginTop: 1 }}>{item.sw}</div>
                </div>
                {active && <ChevronRight size={13} style={{ opacity: .5 }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "10px 8px 14px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", marginBottom: 6 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#FFD700,#FFA500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 900 }}>A</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin Officer</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>TZP-ADMIN-001</div>
            </div>
          </div>
          <button onClick={() => nav("/")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 12 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,.15)"; e.currentTarget.style.color = "#FCA5A5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.4)"; }}
          >
            <LogOut size={14} /> <span>Logout · Toka</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ marginLeft: 240, flex: 1 }}>
        {/* Topbar */}
        <header style={{
          position: "fixed", top: 0, left: 240, right: 0, height: 64,
          background: "white", borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 1px 8px rgba(0,0,0,.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={14} color="#7C3AED" />
            <span style={{ fontSize: 13, color: "#64748B" }}>Admin Panel</span>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#3d1270" }}>{pageTitle}</span>
            {pageTitle2 && <span style={{ fontSize: 13, color: "#94A3B8" }}>· {pageTitle2}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F97316", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C2410C" }}>ADMIN SESSION</span>
            </div>
            <button style={{ position: "relative", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", color: "#64748B" }}>
              <Bell size={17} />
              <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#DC2626", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>2</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 6px", borderRadius: 999, border: "1px solid #E2E8F0", cursor: "pointer" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: 13, fontWeight: 800 }}>A</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Admin Officer</div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>System Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ marginTop: 64, padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
