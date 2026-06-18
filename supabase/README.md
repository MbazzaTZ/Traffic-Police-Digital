# TPDOP – Supabase Setup

## Quick Start

### 1. Create Supabase Project
- Go to https://supabase.com → New Project
- Name: `tpdop`
- Region: choose closest to Tanzania (e.g. EU Central)
- Save DB password safely

### 2. Set Environment Variables
```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase dashboard
```

### 3. Run Migrations (in order)
Go to Supabase → SQL Editor and run each file in order:
```
migrations/00001_extensions.sql
migrations/00002_location_hierarchy.sql
migrations/00003_roles_profiles.sql
migrations/00004_persons_vehicles.sql
migrations/00005_enforcement.sql
migrations/00006_investigation.sql
migrations/00007_operations.sql
migrations/00008_management.sql
migrations/00009_audit_sequences.sql
migrations/00010_rls_policies.sql
migrations/00011_audit_trigger.sql
```

### 4. Run Seeds
```
seed/01_regions.sql     — Tanzania 26 regions + zones
seed/02_dsm_stations.sql — Dar es Salaam stations
```

### 5. Create First Officer (IGP/Admin)
In Supabase → Authentication → Users → Add User:
- Email: `badge_no@tpf.go.tz` (e.g. `000001@tpf.go.tz`)
- Password: set strong password

Then in SQL Editor:
```sql
insert into profiles (id, badge, full_name, rank, role, email)
values (
  '<user-uuid-from-auth>',
  '000001',
  'IGP Admin',
  'IGP',
  'igp',
  '000001@tpf.go.tz'
);
```

## Schema Overview

| Migration | Tables |
|-----------|--------|
| 00001 | Extensions (uuid-ossp, postgis, pg_trgm) |
| 00002 | zones, regions, districts, divisions, wards, stations |
| 00003 | roles (9), profiles (officers) |
| 00004 | persons (NIDA/TIN/I-NEC), vehicles (TAZARA) |
| 00005 | citations, arrests, arrest_charges, detentions, incidents, accidents, pf3_forms |
| 00006 | cases, case_suspects, case_updates, evidence, evidence_chain, forensic_reports, warrants, wanted_persons, missing_persons |
| 00007 | patrols, officer_locations, gps_trail, checkpoints, roadblocks, intelligence_files, intel_access_log, alerts, messages, escalations |
| 00008 | cells, prisoners, prisoner_transfers, court_cases, hearings, firearms, firearm_licenses, assets, hr_records |
| 00009 | audit_logs + auto-numbering sequences + triggers |
| 00010 | Row Level Security policies (RBAC at DB level) |
| 00011 | Automatic audit trigger on all key tables |

## Auto-Generated IDs
All records get human-readable IDs automatically:
- Citations: `CIT-2024-00001`
- Arrests: `AR-2024-00001`
- Cases: `CASE-2024-00001`
- Evidence: `EVD-2024-00001`
- Warrants: `WRT-2024-00001`
- Intelligence: `INT-2024-00001`
- Prisoners: `PRN-2024-00001`

## Security Model (RLS)
| Role | Scope |
|------|-------|
| IGP / DIGP | Everything (national) |
| RPC | Own region |
| OCD | Own district |
| OCS | Own station |
| Inspector | Own station + limited cases |
| CID Officer | All cases + evidence + forensics |
| Traffic Officer | Citations + accidents + vehicles |
| Regular Officer | Arrests + incidents + patrol |
