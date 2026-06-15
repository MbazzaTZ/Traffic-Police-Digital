import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import LoginPage from "../pages/LoginPage";
import AdminDashboard    from "../pages/admin/AdminDashboard";
import CreateUserPage    from "../pages/admin/CreateUserPage";
import OfficersPage      from "../pages/admin/OfficersPage";
import StationsPage      from "../pages/admin/StationsPage";
import RegionsPage       from "../pages/admin/RegionsPage";
import RolesPage         from "../pages/admin/RolesPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";

import RegularPoliceDashboard from "../pages/regular-police/dashboard/RegularPoliceDashboard";
import PersonSearchPage       from "../pages/regular-police/person-search/PersonSearchPage";
import IncidentReportsPage    from "../pages/regular-police/IncidentReportsPage";
import ArrestsPage            from "../pages/regular-police/ArrestsPage";
import PatrolDashboardPage    from "../pages/regular-police/PatrolDashboardPage";
import EvidenceDashboardPage  from "../pages/regular-police/EvidenceDashboardPage";
import MessagesPage           from "../pages/regular-police/MessagesPage";
import AlertsPage             from "../pages/regular-police/AlertsPage";
import SettingsPage           from "../pages/regular-police/SettingsPage";
import MyProfilePage          from "../pages/regular-police/MyProfilePage";

import TrafficDashboard  from "../pages/traffic/TrafficDashboard";
import CitationsPage     from "../pages/traffic/CitationsPage";
import AccidentsPage     from "../pages/traffic/AccidentsPage";
import VehicleSearchPage from "../pages/traffic/VehicleSearchPage";
import CheckpointsPage   from "../pages/traffic/CheckpointsPage";

import CIDDashboard from "../pages/cid/CIDDashboard";
import CasesPage    from "../pages/cid/CasesPage";
import WantedPage   from "../pages/cid/WantedPage";
import EvidencePage from "../pages/cid/EvidencePage";
import SuspectsPage from "../pages/cid/SuspectsPage";

import CommandCenter from "../pages/command/CommandCenter";
import CommandIncidents from "../pages/command/CommandIncidents";
import CommandOfficers from "../pages/command/CommandOfficers";
import CommandReports from "../pages/command/CommandReports";
import CommandAlerts from "../pages/command/CommandAlerts";
import NidaSearchPage from "../pages/cid/NidaSearchPage";

const ROLE_HOME = {
  admin_officer:"/admin", igp:"/command", digp:"/command",
  rpc:"/command", ocd:"/dashboard", ocs:"/dashboard",
  traffic_officer:"/traffic", cid_officer:"/cid", forensic_officer:"/cid",
  regular_officer:"/dashboard", inspector:"/dashboard",
};

function Guard({ children, roles }) {
  const [status, setStatus] = useState("checking");
  const [role,   setRole]   = useState("");

  useEffect(() => {
    async function check(session) {
      if (!session) { setStatus("unauth"); return; }
      const { data:p } = await supabase.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
      const r = p?.role || session.user.user_metadata?.role || "regular_officer";
      setRole(r); setStatus("ok");
    }
    supabase.auth.getSession().then(({data:{session}})=>check(session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>check(session));
    return ()=>subscription.unsubscribe();
  }, []);

  if (status==="checking") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center", color:"#64748B" }}>
        <div style={{ width:40, height:40, border:"3px solid #E2E8F0", borderTopColor:"#0D3477", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 14px" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        <div>Loading TPDOP...</div>
      </div>
    </div>
  );
  if (status==="unauth") return <Navigate to="/" replace/>;
  if (roles && !roles.includes(role)) return <Navigate to={ROLE_HOME[role]||"/"} replace/>;
  return children;
}

const ADMIN   = ["admin_officer","igp","digp"];
const COMMAND = ["igp","digp","rpc","admin_officer"];
const TRAFFIC = ["traffic_officer"];
const CID     = ["cid_officer","forensic_officer"];
const OFFICER = ["regular_officer","inspector","ocs","ocd","rpc","igp","digp","admin_officer"];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage/>}/>

      {/* Admin */}
      <Route path="/admin"             element={<Guard roles={ADMIN}><AdminDashboard/></Guard>}/>
      <Route path="/admin/officers"    element={<Guard roles={ADMIN}><OfficersPage/></Guard>}/>
      <Route path="/admin/create-user" element={<Guard roles={ADMIN}><CreateUserPage/></Guard>}/>
      <Route path="/admin/stations"    element={<Guard roles={ADMIN}><StationsPage/></Guard>}/>
      <Route path="/admin/regions"     element={<Guard roles={ADMIN}><RegionsPage/></Guard>}/>
      <Route path="/admin/roles"       element={<Guard roles={ADMIN}><RolesPage/></Guard>}/>
      <Route path="/admin/settings"    element={<Guard roles={ADMIN}><AdminSettingsPage/></Guard>}/>

      {/* Command Center */}
      <Route path="/command"           element={<Guard roles={COMMAND}><CommandCenter/></Guard>}/>
      <Route path="/command/incidents" element={<Guard roles={COMMAND}><CommandIncidents/></Guard>}/>
      <Route path="/command/alerts"    element={<Guard roles={COMMAND}><CommandAlerts/></Guard>}/>
      <Route path="/command/officers"  element={<Guard roles={COMMAND}><CommandOfficers/></Guard>}/>
      <Route path="/command/reports"   element={<Guard roles={COMMAND}><CommandReports/></Guard>}/>
      <Route path="/command/settings"  element={<Guard roles={COMMAND}><CommandCenter/></Guard>}/>

      {/* Regular Police */}
      <Route path="/dashboard"     element={<Guard roles={OFFICER}><RegularPoliceDashboard/></Guard>}/>
      <Route path="/person-search" element={<Guard roles={OFFICER}><PersonSearchPage/></Guard>}/>
      <Route path="/incidents"     element={<Guard roles={OFFICER}><IncidentReportsPage/></Guard>}/>
      <Route path="/arrests"       element={<Guard roles={OFFICER}><ArrestsPage/></Guard>}/>
      <Route path="/patrols"       element={<Guard roles={OFFICER}><PatrolDashboardPage/></Guard>}/>
      <Route path="/evidence"      element={<Guard roles={OFFICER}><EvidenceDashboardPage/></Guard>}/>
      <Route path="/messages"      element={<Guard roles={OFFICER}><MessagesPage/></Guard>}/>
      <Route path="/alerts"        element={<Guard roles={OFFICER}><AlertsPage/></Guard>}/>
      <Route path="/settings"      element={<Guard roles={OFFICER}><SettingsPage/></Guard>}/>
      <Route path="/profile"       element={<Guard roles={OFFICER}><MyProfilePage/></Guard>}/>

      {/* Traffic */}
      <Route path="/traffic"             element={<Guard roles={TRAFFIC}><TrafficDashboard/></Guard>}/>
      <Route path="/traffic/citations"   element={<Guard roles={TRAFFIC}><CitationsPage/></Guard>}/>
      <Route path="/traffic/accidents"   element={<Guard roles={TRAFFIC}><AccidentsPage/></Guard>}/>
      <Route path="/traffic/vehicles"    element={<Guard roles={TRAFFIC}><VehicleSearchPage/></Guard>}/>
      <Route path="/traffic/checkpoints" element={<Guard roles={TRAFFIC}><CheckpointsPage/></Guard>}/>
      <Route path="/traffic/settings"    element={<Guard roles={TRAFFIC}><TrafficDashboard/></Guard>}/>
      <Route path="/traffic/profile"     element={<Guard roles={TRAFFIC}><MyProfilePage/></Guard>}/>

      {/* CID */}
      <Route path="/cid"          element={<Guard roles={CID}><CIDDashboard/></Guard>}/>
      <Route path="/cid/cases"    element={<Guard roles={CID}><CasesPage/></Guard>}/>
      <Route path="/cid/suspects" element={<Guard roles={CID}><SuspectsPage/></Guard>}/>
      <Route path="/cid/wanted"   element={<Guard roles={CID}><WantedPage/></Guard>}/>
      <Route path="/cid/evidence" element={<Guard roles={CID}><EvidencePage/></Guard>}/>
      <Route path="/cid/search"   element={<Guard roles={CID}><NidaSearchPage/></Guard>}/>
      <Route path="/cid/profile"  element={<Guard roles={CID}><MyProfilePage/></Guard>}/>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}
