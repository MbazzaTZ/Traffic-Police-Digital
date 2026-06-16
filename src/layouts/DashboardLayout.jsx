import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { useResponsiveSidebar } from "../hooks/useResponsiveSidebar";

export default function DashboardLayout({ children, pageTitle, pageTitle2 }) {
  const { isMobile, open, toggle, close } = useResponsiveSidebar();

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F4F7FC" }}>
      <Sidebar isMobile={isMobile} open={open} onClose={close}/>
      <div style={{ marginLeft: isMobile ? 0 : 240, flex:1, minHeight:"100vh", width:"100%" }}>
        <Topbar pageTitle={pageTitle} pageTitle2={pageTitle2} isMobile={isMobile} onMenuClick={toggle}/>
        <div style={{ marginTop:64, padding:isMobile ? 14 : 24, maxWidth:1600 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
