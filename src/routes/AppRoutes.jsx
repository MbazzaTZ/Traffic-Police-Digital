import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import LoginPage from "../pages/LoginPage";

// Admin
import AdminDashboard    from "../pages/admin/AdminDashboard";
import CreateUserPage    from "../pages/admin/CreateUserPage";
import OfficersPage      from "../pages/admin/OfficersPage";
import StationsPage      from "../pages/admin/StationsPage";
import RegionsPage       from "../pages/admin/RegionsPage";
import RolesPage         from "../pages/admin/RolesPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";

// Regular police
import RegularPoliceDashboard from "../pages/regular-police/dashboard/RegularPoliceDashboard";
import PersonSearchPage       from "../pages/regular-police/person-search/PersonSearchPage";
import IncidentReportsPage    from "../pages/regular-police/IncidentReportsPage";
import ArrestsPage            from "../pages/regular-police/ArrestsPage";
import PatrolDashboardPage    from "../pages/regular-police/PatrolDashboardPage";
import EvidenceDashboardPage  from "../pages/regular-police/EvidenceDashboardPage";
import MessagesPage           from "../pages/regular-police/MessagesPage";
import AlertsPage             from "../pages/regular-police/AlertsPage";
import SettingsPage           from "../pages/regular-police/SettingsPage";

// Session-aware guard
function Guard({ children, adminOnly = false }) {
  const [status, setStatus] = useState("checking"); // checking | ok | unauth
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setStatus("unauth"); return; }
      const role = session.user.user_metadata?.role || "";
      setIsAdmin(role === "admin_officer");
      setStatus("ok");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setStatus("unauth"); return; }
      const role = session.user.user_metadata?.role || "";
      setIsAdmin(role === "admin_officer");
      setStatus("ok");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (status === "checking") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"system-ui", color:"#64748B" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid #E2E8F0", borderTopColor:"#0D3477", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 16px" }}/>
        <div style={{ fontSize:14 }}>Loading...</div>
      </div>
    </div>
  );

  if (status === "unauth") return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Admin routes */}
      <Route path="/admin"              element={<Guard adminOnly><AdminDashboard /></Guard>} />
      <Route path="/admin/officers"     element={<Guard adminOnly><OfficersPage /></Guard>} />
      <Route path="/admin/create-user"  element={<Guard adminOnly><CreateUserPage /></Guard>} />
      <Route path="/admin/stations"     element={<Guard adminOnly><StationsPage /></Guard>} />
      <Route path="/admin/regions"      element={<Guard adminOnly><RegionsPage /></Guard>} />
      <Route path="/admin/roles"        element={<Guard adminOnly><RolesPage /></Guard>} />
      <Route path="/admin/settings"     element={<Guard adminOnly><AdminSettingsPage /></Guard>} />

      {/* Officer routes */}
      <Route path="/dashboard"    element={<Guard><RegularPoliceDashboard /></Guard>} />
      <Route path="/person-search"element={<Guard><PersonSearchPage /></Guard>} />
      <Route path="/incidents"    element={<Guard><IncidentReportsPage /></Guard>} />
      <Route path="/arrests"      element={<Guard><ArrestsPage /></Guard>} />
      <Route path="/patrols"      element={<Guard><PatrolDashboardPage /></Guard>} />
      <Route path="/evidence"     element={<Guard><EvidenceDashboardPage /></Guard>} />
      <Route path="/messages"     element={<Guard><MessagesPage /></Guard>} />
      <Route path="/alerts"       element={<Guard><AlertsPage /></Guard>} />
      <Route path="/settings"     element={<Guard><SettingsPage /></Guard>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
