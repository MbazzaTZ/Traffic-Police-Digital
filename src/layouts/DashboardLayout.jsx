import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

export default function DashboardLayout({ children, pageTitle, pageTitle2 }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F7FC" }}>
      <Sidebar />
      <div style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        <Topbar pageTitle={pageTitle} pageTitle2={pageTitle2} />
        <div style={{ marginTop: 64, padding: 24, maxWidth: 1600 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
