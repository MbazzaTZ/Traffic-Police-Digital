import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import LoginPage from "../pages/LoginPage";

// Regular Police
import RegularPoliceDashboard    from "../pages/regular-police/dashboard/RegularPoliceDashboard";
import PersonSearchPage          from "../pages/regular-police/person-search/PersonSearchPage";
import IncidentReportsPage       from "../pages/regular-police/IncidentReportsPage";
import ArrestsPage               from "../pages/regular-police/ArrestsPage";
import PatrolDashboardPage       from "../pages/regular-police/PatrolDashboardPage";
import EvidenceDashboardPage     from "../pages/regular-police/EvidenceDashboardPage";
import MessagesPage              from "../pages/regular-police/MessagesPage";
import AlertsPage                from "../pages/regular-police/AlertsPage";
import SettingsPage              from "../pages/regular-police/SettingsPage";

// Admin
import AdminDashboard            from "../pages/admin/AdminDashboard";
import CreateUserPage            from "../pages/admin/CreateUserPage";
import OfficersPage              from "../pages/admin/OfficersPage";
import StationsPage              from "../pages/admin/StationsPage";
import RegionsPage               from "../pages/admin/RegionsPage";
import RolesPage                 from "../pages/admin/RolesPage";
import AdminSettingsPage         from "../pages/admin/AdminSettingsPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/"  element={<LoginPage />} />

      {/* Regular Police */}
      <Route path="/dashboard"    element={<RegularPoliceDashboard />} />
      <Route path="/person-search"element={<PersonSearchPage />} />
      <Route path="/incidents"    element={<IncidentReportsPage />} />
      <Route path="/arrests"      element={<ArrestsPage />} />
      <Route path="/patrols"      element={<PatrolDashboardPage />} />
      <Route path="/evidence"     element={<EvidenceDashboardPage />} />
      <Route path="/messages"     element={<MessagesPage />} />
      <Route path="/alerts"       element={<AlertsPage />} />
      <Route path="/settings"     element={<SettingsPage />} />

      {/* Admin Panel */}
      <Route path="/admin"               element={<AdminDashboard />} />
      <Route path="/admin/officers"      element={<OfficersPage />} />
      <Route path="/admin/create-user"   element={<CreateUserPage />} />
      <Route path="/admin/stations"      element={<StationsPage />} />
      <Route path="/admin/regions"       element={<RegionsPage />} />
      <Route path="/admin/roles"         element={<RolesPage />} />
      <Route path="/admin/settings"      element={<AdminSettingsPage />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
