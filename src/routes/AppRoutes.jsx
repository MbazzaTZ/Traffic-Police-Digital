import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegularPoliceDashboard from "../pages/regular-police/dashboard/RegularPoliceDashboard";
import PersonSearchPage from "../pages/regular-police/person-search/PersonSearchPage";
import IncidentReportsPage from "../pages/regular-police/IncidentReportsPage";
import ArrestsPage from "../pages/regular-police/ArrestsPage";
import PatrolDashboardPage from "../pages/regular-police/PatrolDashboardPage";
import EvidenceDashboardPage from "../pages/regular-police/EvidenceDashboardPage";
import MessagesPage from "../pages/regular-police/MessagesPage";
import AlertsPage from "../pages/regular-police/AlertsPage";
import SettingsPage from "../pages/regular-police/SettingsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<RegularPoliceDashboard />} />
      <Route path="/person-search" element={<PersonSearchPage />} />
      <Route path="/incidents" element={<IncidentReportsPage />} />
      <Route path="/arrests" element={<ArrestsPage />} />
      <Route path="/patrols" element={<PatrolDashboardPage />} />
      <Route path="/evidence" element={<EvidenceDashboardPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
