import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense, Component } from "react";
import { supabase } from "../lib/supabase";

// LoginPage stays eager - it's the entry route, no benefit from splitting
import LoginPage from "../pages/LoginPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

// ── All protected pages are lazy-loaded ──
// Cuts main bundle from ~1.1MB to ~300KB. First navigation to each
// module fetches that module's chunk (~10-40KB gzipped each).
// Heavy deps (jsPDF, html2canvas, Leaflet, Recharts) only load when
// the user actually opens a page that uses them.

// Admin
const AdminDashboard    = lazy(() => import("../pages/admin/AdminDashboard"));
const CreateUserPage    = lazy(() => import("../pages/admin/CreateUserPage"));
const OfficersPage      = lazy(() => import("../pages/admin/OfficersPage"));
const StationsPage      = lazy(() => import("../pages/admin/StationsPage"));
const RegionsPage       = lazy(() => import("../pages/admin/RegionsPage"));
const RolesPage         = lazy(() => import("../pages/admin/RolesPage"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage"));
const FineSchedulePage  = lazy(() => import("../pages/admin/FineSchedulePage"));

// Regular Officer
const RegularPoliceDashboard = lazy(() => import("../pages/regular-police/dashboard/RegularPoliceDashboard"));
const PersonSearchPage       = lazy(() => import("../pages/regular-police/person-search/PersonSearchPage"));
const IncidentReportsPage    = lazy(() => import("../pages/regular-police/IncidentReportsPage"));
const ArrestsPage            = lazy(() => import("../pages/regular-police/ArrestsPage"));
const PatrolDashboardPage    = lazy(() => import("../pages/regular-police/PatrolDashboardPage"));
const EvidenceDashboardPage  = lazy(() => import("../pages/regular-police/EvidenceDashboardPage"));
const MessagesPage           = lazy(() => import("../pages/regular-police/MessagesPage"));
const AlertsPage             = lazy(() => import("../pages/regular-police/AlertsPage"));
const SettingsPage           = lazy(() => import("../pages/regular-police/SettingsPage"));
const MyProfilePage          = lazy(() => import("../pages/regular-police/MyProfilePage"));
const PersonProfilePage      = lazy(() => import("../pages/regular-police/PersonProfilePage"));
const VehicleProfilePage     = lazy(() => import("../pages/regular-police/VehicleProfilePage"));
const DetentionsPage         = lazy(() => import("../pages/regular-police/DetentionsPage"));
const PF3FormsPage           = lazy(() => import("../pages/regular-police/PF3FormsPage"));
const RegistriesPage         = lazy(() => import("../pages/regular-police/RegistriesPage"));
const FirearmsPage           = lazy(() => import("../pages/regular-police/FirearmsPage"));
const PrisonersPage          = lazy(() => import("../pages/regular-police/PrisonersPage"));
const CellsPage              = lazy(() => import("../pages/regular-police/CellsPage"));
const CourtCasesPage         = lazy(() => import("../pages/regular-police/CourtCasesPage"));

// Traffic
const TrafficDashboard  = lazy(() => import("../pages/traffic/TrafficDashboard"));
const CitationsPage     = lazy(() => import("../pages/traffic/CitationsPage"));
const AccidentsPage     = lazy(() => import("../pages/traffic/AccidentsPage"));
const VehicleSearchPage = lazy(() => import("../pages/traffic/VehicleSearchPage"));
const CheckpointsPage   = lazy(() => import("../pages/traffic/CheckpointsPage"));
const PaymentsPage      = lazy(() => import("../pages/traffic/PaymentsPage"));

// CID
const CIDDashboard    = lazy(() => import("../pages/cid/CIDDashboard"));
const CasesPage       = lazy(() => import("../pages/cid/CasesPage"));
const WantedPage      = lazy(() => import("../pages/cid/WantedPage"));
const WarrantsPage    = lazy(() => import("../pages/cid/WarrantsPage"));
const EvidencePage    = lazy(() => import("../pages/cid/EvidencePage"));
const SuspectsPage    = lazy(() => import("../pages/cid/SuspectsPage"));
const NidaSearchPage  = lazy(() => import("../pages/cid/NidaSearchPage"));

// Command Center (heaviest - Leaflet + Recharts)
const CommandCenter     = lazy(() => import("../pages/command/CommandCenter"));
const CommandIncidents  = lazy(() => import("../pages/command/CommandIncidents"));
const CommandOfficers   = lazy(() => import("../pages/command/CommandOfficers"));
const CommandReports    = lazy(() => import("../pages/command/CommandReports"));
const CommandAlerts     = lazy(() => import("../pages/command/CommandAlerts"));
const AuditLogsPage     = lazy(() => import("../pages/command/AuditLogsPage"));
const CommandPatrolMap  = lazy(() => import("../pages/command/CommandPatrolMap"));
const IntelligencePage  = lazy(() => import("../pages/command/IntelligencePage"));

// Shared
const ApprovalsPage = lazy(() => import("../pages/shared/ApprovalsPage"));
const MorePage      = lazy(() => import("../pages/shared/MorePage"));
const CitationRequestsPage = lazy(() => import("../pages/shared/CitationRequestsPage"));

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
// OFFICER = anyone with field/operational duties. All field roles get access to
// the shared operational tools (Person Search, Profiles, Detentions, PF3,
// Registries, Firearms, Messages, Alerts, Approvals). Their *home* module
// (Traffic / CID / Regular dashboard) is still selected by login routing.
const OFFICER = [
  "regular_officer","inspector","ocs","ocd","rpc","igp","digp","admin_officer",
  "traffic_officer","cid_officer","forensic_officer",
];

// Branded loading fallback shown while a lazy page chunk fetches
function PageLoader() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"system-ui", background:"#F4F7FC" }}>
      <div style={{ textAlign:"center", color:"#64748B" }}>
        <div style={{ width:36, height:36, border:"3px solid #E2E8F0", borderTopColor:"#0D3477", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 12px" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontSize:13 }}>Loading...</div>
      </div>
    </div>
  );
}

// ── Chunk-load error boundary ──
// Catches the "Failed to fetch dynamically imported module" error that
// happens when a user has a stale main bundle (from a previous deploy)
// cached in their browser/SW. The boundary shows a brief "Updating…"
// message while the main.jsx global handler unregisters the SW, clears
// caches, and reloads the page.
const CHUNK_ERR_PATTERNS = [
  "failed to fetch dynamically imported module",
  "importing a module script failed",
  "error loading dynamically imported module",
];
function isChunkErr(msg) {
  if (!msg) return false;
  const m = String(msg).toLowerCase();
  return CHUNK_ERR_PATTERNS.some(p => m.includes(p));
}

class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasChunkError: false };
  }
  static getDerivedStateFromError(error) {
    if (isChunkErr(error?.message) || isChunkErr(String(error))) {
      return { hasChunkError: true };
    }
    return { hasChunkError: false };
  }
  componentDidCatch(error) {
    if (isChunkErr(error?.message) || isChunkErr(String(error))) {
      // main.jsx has a global handler that will unregister SW + reload.
      // The boundary just keeps the UI from going blank during the
      // brief window between the error and the reload.
      console.warn("Chunk load failed — auto-reloading to recover...");
    }
  }
  render() {
    if (this.state.hasChunkError) {
      return (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"system-ui", background:"#F4F7FC" }}>
          <div style={{ textAlign:"center", color:"#64748B" }}>
            <div style={{ width:36, height:36, border:"3px solid #E2E8F0", borderTopColor:"#0D3477", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 14px" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ fontSize:14, fontWeight:600, color:"#0D3477", marginBottom:4 }}>Updating TPDOP...</div>
            <div style={{ fontSize:12, color:"#94A3B8" }}>A new version is available — reloading automatically</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppRoutes() {
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={<PageLoader/>}>
    <Routes>
      <Route path="/" element={<LoginPage/>}/>
      <Route path="/reset-password" element={<ResetPasswordPage/>}/>

      {/* Admin */}
      <Route path="/admin"             element={<Guard roles={ADMIN}><AdminDashboard/></Guard>}/>
      <Route path="/admin/officers"    element={<Guard roles={ADMIN}><OfficersPage/></Guard>}/>
      <Route path="/admin/create-user" element={<Guard roles={ADMIN}><CreateUserPage/></Guard>}/>
      <Route path="/admin/stations"    element={<Guard roles={ADMIN}><StationsPage/></Guard>}/>
      <Route path="/admin/regions"     element={<Guard roles={ADMIN}><RegionsPage/></Guard>}/>
      <Route path="/admin/roles"       element={<Guard roles={ADMIN}><RolesPage/></Guard>}/>
      <Route path="/admin/settings"    element={<Guard roles={ADMIN}><AdminSettingsPage/></Guard>}/>
      <Route path="/admin/fines"       element={<Guard roles={ADMIN}><FineSchedulePage/></Guard>}/>

      {/* Command Center */}
      <Route path="/command"           element={<Guard roles={COMMAND}><CommandCenter/></Guard>}/>
      <Route path="/command/incidents" element={<Guard roles={COMMAND}><CommandIncidents/></Guard>}/>
      <Route path="/command/alerts"    element={<Guard roles={COMMAND}><CommandAlerts/></Guard>}/>
      <Route path="/command/officers"  element={<Guard roles={COMMAND}><CommandOfficers/></Guard>}/>
      <Route path="/command/reports"   element={<Guard roles={COMMAND}><CommandReports/></Guard>}/>
      <Route path="/command/audit"     element={<Guard roles={COMMAND}><AuditLogsPage/></Guard>}/>
      <Route path="/command/patrol-map" element={<Guard roles={COMMAND}><CommandPatrolMap/></Guard>}/>
      <Route path="/command/intel"      element={<Guard roles={COMMAND}><IntelligencePage/></Guard>}/>
      <Route path="/command/approvals" element={<Guard roles={COMMAND}><ApprovalsPage/></Guard>}/>
      <Route path="/command/settings"  element={<Guard roles={COMMAND}><SettingsPage/></Guard>}/>

      {/* Regular Police */}
      <Route path="/dashboard"     element={<Guard roles={OFFICER}><RegularPoliceDashboard/></Guard>}/>
      <Route path="/person-search" element={<Guard roles={OFFICER}><PersonSearchPage/></Guard>}/>
      <Route path="/person/:id"    element={<Guard roles={OFFICER}><PersonProfilePage/></Guard>}/>
      <Route path="/vehicle/:id"   element={<Guard roles={OFFICER}><VehicleProfilePage/></Guard>}/>
      <Route path="/incidents"     element={<Guard roles={OFFICER}><IncidentReportsPage/></Guard>}/>
      <Route path="/arrests"       element={<Guard roles={OFFICER}><ArrestsPage/></Guard>}/>
      <Route path="/detentions"    element={<Guard roles={OFFICER}><DetentionsPage/></Guard>}/>
      <Route path="/pf3"           element={<Guard roles={OFFICER}><PF3FormsPage/></Guard>}/>
      <Route path="/registries"    element={<Guard roles={OFFICER}><RegistriesPage/></Guard>}/>
      <Route path="/firearms"      element={<Guard roles={OFFICER}><FirearmsPage/></Guard>}/>
      <Route path="/prisoners"     element={<Guard roles={OFFICER}><PrisonersPage/></Guard>}/>
      <Route path="/cells"         element={<Guard roles={OFFICER}><CellsPage/></Guard>}/>
      <Route path="/court-cases"   element={<Guard roles={OFFICER}><CourtCasesPage/></Guard>}/>
      <Route path="/patrols"       element={<Guard roles={OFFICER}><PatrolDashboardPage/></Guard>}/>
      <Route path="/evidence"      element={<Guard roles={OFFICER}><EvidenceDashboardPage/></Guard>}/>
      <Route path="/messages"      element={<Guard roles={OFFICER}><MessagesPage/></Guard>}/>
      <Route path="/alerts"        element={<Guard roles={OFFICER}><AlertsPage/></Guard>}/>
      <Route path="/settings"      element={<Guard roles={OFFICER}><SettingsPage/></Guard>}/>
      <Route path="/profile"       element={<Guard roles={OFFICER}><MyProfilePage/></Guard>}/>
      <Route path="/approvals"     element={<Guard roles={OFFICER}><ApprovalsPage/></Guard>}/>
      <Route path="/more"          element={<Guard roles={OFFICER}><MorePage/></Guard>}/>
      <Route path="/citation-requests" element={<Guard roles={OFFICER}><CitationRequestsPage/></Guard>}/>

      {/* Traffic */}
      <Route path="/traffic"             element={<Guard roles={TRAFFIC}><TrafficDashboard/></Guard>}/>
      <Route path="/traffic/citations"   element={<Guard roles={TRAFFIC}><CitationsPage/></Guard>}/>
      <Route path="/traffic/accidents"   element={<Guard roles={TRAFFIC}><AccidentsPage/></Guard>}/>
      <Route path="/traffic/vehicles"    element={<Guard roles={TRAFFIC}><VehicleSearchPage/></Guard>}/>
      <Route path="/vehicle-search"      element={<Guard roles={OFFICER}><VehicleSearchPage/></Guard>}/>
      <Route path="/traffic/checkpoints" element={<Guard roles={TRAFFIC}><CheckpointsPage/></Guard>}/>
      <Route path="/traffic/payments"    element={<Guard roles={OFFICER}><PaymentsPage/></Guard>}/>
      <Route path="/payments"            element={<Guard roles={OFFICER}><PaymentsPage/></Guard>}/>
      <Route path="/traffic/settings"    element={<Guard roles={TRAFFIC}><SettingsPage/></Guard>}/>
      <Route path="/traffic/profile"     element={<Guard roles={TRAFFIC}><MyProfilePage/></Guard>}/>
      <Route path="/traffic/approvals"   element={<Guard roles={TRAFFIC}><ApprovalsPage/></Guard>}/>

      {/* CID */}
      <Route path="/cid"          element={<Guard roles={CID}><CIDDashboard/></Guard>}/>
      <Route path="/cid/cases"    element={<Guard roles={CID}><CasesPage/></Guard>}/>
      <Route path="/cid/suspects" element={<Guard roles={CID}><SuspectsPage/></Guard>}/>
      <Route path="/cid/wanted"   element={<Guard roles={CID}><WantedPage/></Guard>}/>
      <Route path="/cid/warrants" element={<Guard roles={CID}><WarrantsPage/></Guard>}/>
      <Route path="/cid/evidence" element={<Guard roles={CID}><EvidencePage/></Guard>}/>
      <Route path="/cid/search"   element={<Guard roles={CID}><NidaSearchPage/></Guard>}/>
      <Route path="/cid/profile"  element={<Guard roles={CID}><MyProfilePage/></Guard>}/>
      <Route path="/cid/approvals"  element={<Guard roles={CID}><ApprovalsPage/></Guard>}/>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    </Suspense>
    </ChunkErrorBoundary>
  );
}
