import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

export default function DashboardLayout({ children, pageTitle, pageTitle2 }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar pageTitle={pageTitle} pageTitle2={pageTitle2} />
        <div className="page">
          {children}
        </div>
      </div>
    </div>
  );
}
