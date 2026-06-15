import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  Search,
  FileText,
  ShieldAlert,
  Camera,
  Radio,
  Siren,
  MapPinned,
  Users
} from "lucide-react";

export default function RegularPoliceDashboard() {

  const actions = [
  { icon: Search, label: "Search Person" },
  { icon: FileText, label: "New Incident" },
  { icon: ShieldAlert, label: "Arrest" },
  { icon: Siren, label: "Emergency" }
];

  return (
    <DashboardLayout>

      <div className="command-banner">

        <div className="officer-section">

          <img
            src="/wanted/wanted-01.jpg"
            alt="Police"
            className="officer-avatar"
          />

          <div>

            <h2>Inspector David Mbaza</h2>

            <p>Badge: TZP-2026-00124</p>

            <span>Makambako Police Station</span>

          </div>

        </div>

        <div className="status-grid">

          <div className="status-chip online"> On Duty</div>
          <div className="status-chip gps"> GPS Active</div>
          <div className="status-chip device"> Device Verified</div>

        </div>

      </div>

      <div className="kpi-grid">

        <div className="kpi-card">
          <h1>18</h1>
          <span>Open Incidents</span>
        </div>

        <div className="kpi-card">
          <h1>07</h1>
          <span>Arrests Today</span>
        </div>

        <div className="kpi-card">
          <h1>04</h1>
          <span>Detentions</span>
        </div>

        <div className="kpi-card">
          <h1>12</h1>
          <span>Patrols</span>
        </div>

        <div className="kpi-card">
          <h1>09</h1>
          <span>Evidence</span>
        </div>

      </div>

      <div className="section-header">
        Quick Actions
      </div>

      <div className="action-grid">

        {actions.map((item) => {

          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className="action-tile"
            >
              <Icon size={28} />
              <span>{item.label}</span>
            </button>
          );
        })}

      </div>

      <div className="dual-grid">

        <div className="panel">

  <h3>Assigned Tasks</h3>

  <div className="task-card high">

      <div className="task-priority">
          HIGH PRIORITY
      </div>

      <h4>Patrol Sector A</h4>

      <p>Due: 14:00 Today</p>

      <span>Assigned by OCS Makambako</span>

  </div>

  <div className="task-card medium">

      <div className="task-priority">
          MEDIUM
      </div>

      <h4>Follow Up Incident INC-2026-008</h4>

      <p>Due: Tomorrow</p>

      <span>CID Coordination Required</span>

  </div>

</div>

        <div className="panel">

  <h3>Alert Center</h3>

  <div className="alert-profile">

      <img
          src="/wanted/wanted-01.jpg"
          alt="Suspect"
          className="alert-photo"
      />

      <div className="alert-details">

          <div className="alert-badge wanted">
              WANTED PERSON
          </div>

          <h4>JUMA ABDALLAH</h4>

          <p>Crime: Armed Robbery</p>

          <p>Last Seen: Njombe Bus Terminal</p>

          <span>Reported 15 mins ago</span>

      </div>

  </div>

</div>

      </div>

      <div className="panel">

        <h3>Recent Incidents</h3>

        <table className="police-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>

          <tbody>

            <tr>
              <td>INC-1001</td>
              <td>Theft</td>
              <td>Open</td>
              <td>Makambako</td>
            </tr>

            <tr>
              <td>INC-1002</td>
              <td>Assault</td>
              <td>Assigned</td>
              <td>Njombe</td>
            </tr>

            <tr>
              <td>INC-1003</td>
              <td>Burglary</td>
              <td>Investigating</td>
              <td>Mafinga</td>
            </tr>

          </tbody>

        </table>

      </div>

    </DashboardLayout>
  );
}









