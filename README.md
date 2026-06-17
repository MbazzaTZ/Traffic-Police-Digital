# Tanzania Police Digital Operations Platform (TPDOP)

> **Kulinda · Kutumikia · Kuweka Usalama** | Protect · Serve · Secure

React + Vite frontend for the Tanzania Police Force national digital platform — full spec implementation.

## 🚀 Quick Start

```bash
git clone https://github.com/MbazzaTZ/Tanzania-Police-Digital.git
cd Tanzania-Police-Digital
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## 🗄️ Database Setup

This project uses Supabase (PostgreSQL). Schema migrations live in `supabase/migrations/`.

**One-time setup** (link your Supabase project):
```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
```

**Apply all migrations**:
```bash
supabase db push
```

See **[MIGRATIONS.md](./MIGRATIONS.md)** for the complete guide — CLI setup, creating new migrations, troubleshooting, and a Dashboard fallback for non-CLI users.

> ✅ All migrations (00001–00007) are currently applied to production.

## 📁 Complete Folder Structure

```
src/
├── assets/
│   ├── images/          # Police logos, photos
│   ├── icons/           # Custom icon assets
│   ├── fonts/           # Custom fonts
│   └── styles.css       # Component CSS (design tokens)
│
├── components/
│   ├── ui/              # Button · Card · Badge · Table · Tabs · Stepper · Toast · Breadcrumb · StatCard
│   ├── layout/          # Sidebar (RBAC-aware) · Topbar
│   ├── shared/          # Shared composite components
│   ├── charts/          # Chart components (Recharts)
│   └── maps/            # Map components (Mapbox/Google)
│
├── context/
│   ├── AppContext.jsx   # Lang, officer, scope
│   └── AuthContext.jsx  # Supabase auth session
│
├── features/            # Feature-based modules (business logic)
│   ├── citations/       arrests/ detentions/ cases/ persons/
│   ├── vehicles/        officers/ stations/ patrols/ intelligence/
│   ├── evidence/        prisoners/ courts/ firearms/ communications/ hr/
│
├── hooks/
│   ├── useSearch.js     # Live table filtering
│   ├── useFilter.js     # Status/type filtering
│   ├── useToast.js      # Toast notifications
│   └── useAnimateCount.js # Stat card animations
│
├── layout/
│   └── MainLayout.jsx   # Sidebar + Topbar + Outlet
│
├── pages/
│   ├── Dashboard/
│   │   ├── National/    NationalDashboard.jsx  (IGP/DIGP)
│   │   ├── Regional/    RegionalDashboard.jsx  (RPC+)
│   │   ├── District/    DistrictDashboard.jsx  (OCD+)
│   │   └── Station/     StationDashboard.jsx   (OCS+)
│   │
│   ├── Enforcement/
│   │   ├── Citations/   Citations · CitationWizard · CitationDetail
│   │   ├── Arrests/     Arrests · ArrestWizard
│   │   ├── Detentions/  Detentions
│   │   ├── Incidents/   Incidents
│   │   ├── Accidents/   Accidents
│   │   └── PF3/         PF3Forms
│   │
│   ├── Investigation/   (CID)
│   │   ├── Cases/       Cases · CaseDetail
│   │   ├── Warrants/    Warrants
│   │   ├── Wanted/      Wanted
│   │   ├── Missing/     Missing
│   │   ├── Evidence/    Evidence
│   │   └── Forensics/   Forensics
│   │
│   ├── Intelligence/    Intelligence (RPC + IGP only)
│   │
│   ├── Operations/
│   │   ├── Map/         OpsMap (GPS tracking)
│   │   ├── Alerts/      Alerts
│   │   ├── Patrol/      Patrol
│   │   ├── Roadblocks/  Roadblocks
│   │   └── Checkpoints/ Checkpoints
│   │
│   ├── Management/
│   │   ├── Persons/     Persons (9 search types: NIDA/TIN/INEC/Passport/License/Vehicle/Phone/Fingerprint/Face)
│   │   ├── Vehicles/    Vehicles
│   │   ├── Officers/    Officers
│   │   ├── Stations/    Stations
│   │   ├── Prisoners/   Prisoners
│   │   ├── Cells/       Cells
│   │   ├── Firearms/    Firearms
│   │   ├── Assets/      Assets
│   │   └── Courts/      Courts
│   │
│   ├── Communications/  Communications (Messages · Escalations · Alerts)
│   ├── HR/              HR (Human Resources)
│   │
│   ├── Reports/
│   │   ├── Crime/       CrimeReports
│   │   ├── Analytics/   Analytics
│   │   └── Performance/ Performance
│   │
│   └── System/
│       ├── Audit/       Audit (Full audit trail with GPS/device)
│       ├── RBAC/        RBAC (Role management – IGP only)
│       └── Settings/    Settings
│
├── redux/
│   ├── slices/          citations · arrests · cases · persons · alerts · ui
│   └── store/           store.js
│
├── services/
│   ├── supabase.js      # Complete Supabase REST API layer (all 35+ tables)
│   └── supabaseSchema.sql # 555-line PostgreSQL schema + RLS policies
│
├── utils/
│   ├── constants.js     # Full spec: 15 ranks, RBAC roles, departments, units, permissions
│   ├── rbac.js          # hasPermission(), canAccess(), getDashboardScope(), getNavItems()
│   ├── mockData.js      # Complete mock data for all modules
│   └── helpers.js       # formatTZS, formatDate, STATUS_CONFIG, ALERT_CONFIG
│
├── App.jsx              # 40+ React Router v6 routes
├── main.jsx             # Entry + Redux Provider + AuthProvider + AppProvider
└── index.css            # CSS design tokens + animations
```

## 🏛️ Organizational Structure Implemented

**HQ Departments (18):** Operations · CID · Traffic · Intelligence · Forensic Bureau · Community Policing · Anti-Narcotics · Cyber Crime · Financial & Economic Crimes · HR · Admin & Logistics · Communications · Legal Services · Planning & Research · ICT · Internal Affairs · Training · Procurement

**Specialized Units (15):** FFU · Marine Police · Railway Police · Airport Police · Tourist Police · Stock Theft Prevention · K9 · Counter Terrorism · Anti-Robbery · Special Operations · VIP Protection · Interpol Desk · Gender & Children Desk · Disaster Response · Fire & Rescue

**Hierarchy:** National → Zone → Region → District → Division → Ward → Police Station → Police Post

## 👤 Rank Structure (15 ranks)

Constable → Corporal → Sergeant → Staff Sergeant → Inspector → ASP → SP → SSP → ACP → DCP → SCP → CP → RPC → DIGP → IGP

## 🛡️ RBAC – Role Based Access

| Role | Dashboard | Citations | Arrests | CID Cases | Intelligence | Internal Affairs | RBAC |
|------|-----------|-----------|---------|-----------|--------------|-----------------|------|
| Traffic Officer | Station | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Regular Officer | Station | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CID Officer | Station | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Forensic Officer | Station | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| OCS | Station | ✅ | ✅ | Station | ❌ | ❌ | ❌ |
| OCD | District | ✅ | ✅ | District | ❌ | ❌ | ❌ |
| RPC | Regional | ✅ | ✅ | Regional | ✅ | ❌ | ❌ |
| IGP | National | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🗄️ Database (Supabase PostgreSQL)

35+ tables: profiles · roles · permissions · zones · regions · districts · divisions · wards · stations · officers · persons · vehicles · citations · arrests · detentions · cases · case_updates · incident_reports · accident_reports · pf3_forms · evidence · evidence_chain · warrants · wanted_persons · missing_persons · stolen_vehicles · stolen_property · messages · alerts · escalations · patrols · checkpoints · roadblocks · officer_locations · firearms · firearm_licenses · prisoners · cells · transfers · court_cases · hearings · intelligence_files · hr_records · audit_logs

## 🔐 Security Features

- ✅ Supabase Row Level Security (RLS) policies
- ✅ Full Audit Trail (Officer ID + Rank + Station + GPS + Date + Time + Device ID)
- ✅ GPS Tracking
- ✅ Device Registration
- ✅ Face Verification (Sprint 3)
- ✅ Biometric Authentication (Sprint 3)
- ✅ End-to-End Encryption (Sprint 2)
- ✅ Evidence Chain of Custody
- ✅ Tamper Detection

## 🔍 Person Search (9 types)

NIDA · TIN · I-NEC · Passport · Driver License · Vehicle Plate · Phone Number · Fingerprint · Face Recognition

## ⚙️ Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| State | Redux Toolkit |
| Styling | CSS Custom Properties |
| Backend | Supabase (PostgreSQL + RLS) |
| Auth | Firebase Phone Auth +255 OTP |
| Charts | Recharts |
| Maps | Mapbox / Google Maps API |
| PDF | react-pdf |

## 📅 Roadmap

| Sprint | Focus |
|--------|-------|
| Sprint 1 ✅ | React structure, all pages, RBAC, mock data |
| Sprint 2 | Supabase integration, live data, Auth |
| Sprint 3 | Biometric auth, GPS live map, Mobile app |
| Sprint 4 | NIDA/TAZAMA/TRA API integrations |
| Sprint 5 | Intelligence module, Advanced analytics |
| Sprint 6 | Production deployment, hardening |

---

© 2024 Tanzania Police Force · Jeshi la Polisi Tanzania  
*Haki zote zimehifadhiwa · All rights reserved*
