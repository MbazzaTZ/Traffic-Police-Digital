import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import BottomNav from "../components/mobile/BottomNav";
import { useResponsiveSidebar } from "../hooks/useResponsiveSidebar";
import { LayoutDashboard, Search, FileText, Shield, MoreHorizontal } from "lucide-react";

// 5 most-used field-officer destinations on mobile bottom nav
const FIELD_NAV = [
  { icon:LayoutDashboard, label:"Home",     path:"/dashboard" },
  { icon:Search,          label:"Search",   path:"/person-search" },
  { icon:FileText,        label:"Report",   path:"/incidents" },
  { icon:Shield,          label:"Arrests",  path:"/arrests" },
  { icon:MoreHorizontal,  label:"More",     path:"/more" },
];

export default function DashboardLayout({ children, pageTitle, pageTitle2 }) {
  const { isMobile, open, toggle, close } = useResponsiveSidebar();

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F4F7FC" }}>
      <Sidebar isMobile={isMobile} open={open} onClose={close}/>
      <div style={{ marginLeft: isMobile ? 0 : 240, flex:1, minHeight:"100vh", width:"100%" }}>
        <Topbar pageTitle={pageTitle} pageTitle2={pageTitle2} isMobile={isMobile} onMenuClick={toggle}/>
        <div style={{ marginTop:64, padding:isMobile ? 14 : 24, paddingBottom: isMobile ? 80 : 24, maxWidth:1600 }}>
          {children}
        </div>
      </div>
      <BottomNav items={FIELD_NAV}/>
    </div>
  );
}
