// BottomNav - fixed bottom navigation for field officers on mobile.
// Native-app style: 4-5 primary destinations, large tap targets,
// safe-area-aware (handles iOS notch / Android gesture bar).
//
// USAGE in a layout:
//   <BottomNav items={[
//     { icon:LayoutDashboard, label:"Home", path:"/dashboard" },
//     { icon:Search, label:"Search", path:"/person-search" },
//     ...
//   ]}/>
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function BottomNav({ items, color="#0D3477" }) {
  const isMobile = useIsMobile();
  const nav = useNavigate();
  const loc = useLocation();

  if (!isMobile || !items?.length) return null;

  return (
    <nav style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:60,
      background:"white",
      borderTop:"1px solid #E2E8F0",
      boxShadow:"0 -2px 12px rgba(0,0,0,.06)",
      display:"flex", justifyContent:"space-around",
      paddingBottom:"env(safe-area-inset-bottom)",  // iOS notch / gesture
    }}>
      {items.map(item => {
        const Icon = item.icon;
        const active = loc.pathname === item.path;
        return (
          <button key={item.path}
            onClick={() => nav(item.path)}
            aria-label={item.label}
            style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
              padding:"8px 4px 6px", minHeight:56,
              background:"transparent", border:"none", cursor:"pointer",
              color: active ? color : "#94A3B8",
              fontWeight: active ? 700 : 500,
              transition:"color .15s",
              position:"relative",
            }}>
            {active && <span style={{ position:"absolute", top:0, left:"30%", right:"30%", height:3, background:color, borderRadius:"0 0 3px 3px" }}/>}
            <Icon size={20}/>
            <span style={{ fontSize:10, letterSpacing:0.2 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
