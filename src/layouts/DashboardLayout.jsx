import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">

      <Sidebar />

      <div className="dashboard-main">

        <Topbar />

        <div className="dashboard-content">
          {children}
        </div>

      </div>

    </div>
  );
}
