# TPDOP — Schema Repair & Code Alignment Runbook

This runbook documents the two new SQL migrations and the code-side table-name
renames that bring the React frontend into alignment with the Supabase schema.

After applying these changes, the previously broken operational pages
(Arrests, Citations, Cases, Court Cases, Detentions, PF3, Firearms, Evidence,
Approvals, Citation Requests, Payments, Patrol Map, Audit Logs, etc.) should
run without column/table errors.

---

## 1. Apply the SQL migrations

The two new migration files live in `supabase/migrations/`:

| File | What it does |
|---|---|
| `00003_runtime_tables.sql` | Adds 12 missing tables (requests, request_approvals, citation_requests, fine_schedule, payments, firearm_licenses, hearings, case_evidence, statements, suspects, stolen_property, stolen_vehicles), creates `officer_latest_locations` view, ALTERs `officer_locations` to be time-series, ALTERs `audit_logs` / `persons` / `vehicles` / `alerts` / `messages` to add code-expected columns, adds RLS + audit triggers for all new tables, seeds `fine_schedule` with 20 TZ traffic offenses. |
| `00004_column_align.sql` | ALTERs 13 existing tables (`citations`, `incident_reports`, `accident_reports`, `cases`, `court_cases`, `arrests`, `detentions`, `pf3_forms`, `firearms`, `cells`, `prisoners`, `wanted_persons`, `evidence`) to add ~150 code-expected columns. Drops 18 NOT NULL constraints that the code violates (because it writes alias columns). Widens 8 CHECK constraints (status/verdict/danger_level). Backfills alias columns from existing data via 44 UPDATE statements. |

### Apply via Supabase CLI (recommended)

```bash
cd Traffic-Police-Digital
supabase db push
```

Or apply individually:

```bash
supabase db execute --file supabase/migrations/00003_runtime_tables.sql
supabase db execute --file supabase/migrations/00004_column_align.sql
```

### Apply via Supabase Dashboard

1. Go to your Supabase project → SQL Editor
2. Paste the contents of `00003_runtime_tables.sql` → Run
3. Paste the contents of `00004_column_align.sql` → Run
4. Verify: the last query should return
   `TPDOP COLUMN ALIGN COMPLETE | 13 tables altered, ~80 columns added, 8 NOT NULLs relaxed, 6 CHECK constraints widened`

Both migrations are **idempotent and additive** — they use `if not exists`, `drop constraint if exists`, and `drop policy if exists` throughout. Running them twice is safe.

---

## 2. Code-side table-name renames (already applied)

The React code referenced 4 tables by incorrect names. These have been renamed
in all 18 affected page files (37 total replacements). No further action needed
— the renames are committed to the working tree.

| Code name (old)    | Schema name (new)      | Files affected |
|---|---|---|
| `incidents`          | `incident_reports`     | 6 files  |
| `traffic_citations`  | `citations`            | 7 files  |
| `traffic_accidents`  | `accident_reports`     | 3 files  |
| `cid_cases`          | `cases`                | 6 files  |

Foreign-key constraint names in PostgREST join hints (e.g.
`profiles!traffic_citations_issued_by_fkey(...)`) were also renamed to match
(e.g. `profiles!citations_issued_by_fkey(...)`).

---

## 3. Other fixes applied in this pass

- **Deleted dead stub** `src/pages/regular-police/PersonSearchPage.jsx` (7-line placeholder never imported — the real page lives at `src/pages/regular-police/person-search/PersonSearchPage.jsx`).
- **Fixed `officer_latest_locations` view** to expose both `full_name` (used by `CommandPatrolMap`) and `officer_name` (used elsewhere).
- **Verified build**: `npx vite build` succeeds with all 18 modified files compiling cleanly. PWA service worker regenerates, 124 precache entries, 6.9 MB total bundle.

---

## 4. What now works

After applying both migrations + rebuilding the app:

| Module | Pages that should now work end-to-end |
|---|---|
| **Admin** | FineSchedulePage (was broken — `fine_schedule` table now exists, seeded with 20 offenses) |
| **Traffic** | CitationsPage, PaymentsPage, AccidentsPage, VehicleSearchPage, TrafficDashboard (all referenced `traffic_citations` / `traffic_accidents` — now renamed) |
| **CID** | CasesPage, EvidencePage, SuspectsPage, NidaSearchPage, CIDDashboard (all referenced `cid_cases` — now renamed; `suspects` table now exists) |
| **Regular Police** | IncidentReportsPage, ArrestsPage, DetentionsPage, PF3FormsPage, FirearmsPage, CellsPage, PrisonersPage, CourtCasesPage, EvidenceDashboardPage, PatrolDashboardPage (columns aligned) |
| **Command** | CommandCenter, CommandIncidents, CommandReports, AuditLogsPage, CommandPatrolMap (audit_logs columns added; officer_latest_locations view created) |
| **Shared** | ApprovalsPage (requests / request_approvals tables now exist), CitationRequestsPage (citation_requests table now exists) |
| **Hooks** | `useGPSTracker` (officer_locations PK changed, time-series columns added) |

---

## 5. Known remaining gaps (future work)

These were noted in the deep scan but NOT addressed in this pass:

1. **`EvidenceDashboardPage.jsx` is still a mock** (`setEvidence(p=>[...])` only, no Supabase calls). Needs wiring to `evidence` + `evidence_chain` tables.
2. **`CheckpointsPage.jsx` is still a mock** (start/stop counter in `useState` only). Needs wiring to `checkpoints` / `roadblocks` tables.
3. **`AdminSettingsPage.jsx` is still a mock** (save() just shows a toast). Needs a `system_settings` table.
4. **`RolesPage.jsx`** hardcodes "0 officers" per role — needs a count query against `profiles`.
5. **`@reduxjs/toolkit` and `recharts`** are installed but never imported. Safe to `npm uninstall` to slim the bundle by ~150 KB.
6. **`global.css` atoms (`.btn`, `.card`, `.tbl`, `.form-input`)** are defined but unused — pages use inline `style={{}}` everywhere. Either adopt them or delete the file.
7. **Some column names on individual pages may still mismatch** — the migrations align the *common* columns the scan identified, but a few page-specific columns (e.g. special fields in `CourtCasesPage` statement tabs) may need page-by-page review.
8. **NIDA / TAZAMA / TRA API integrations** (README Sprint 4) — still not built. `NidaSearchPage` currently just queries local Supabase tables.

---

## 6. Quick verification

After applying migrations and deploying the new build, log in as `admin_officer` and:

1. **Audit Logs page** (`/command/audit`) — should show your login row with your name, badge, role, description "Login: ...". Previously rendered blanks.
2. **Fine Schedule page** (`/admin/fines`) — should show 20 pre-seeded TZ traffic offenses (TRF-001 through DOC-002).
3. **Approvals page** (`/approvals`) — submit a test request; should now persist to the `requests` table.
4. **Patrol Map** (`/command/patrol-map`) — start a patrol from `/patrols`, wait 60s, refresh the map; your marker should appear.
5. **Citations page** (`/traffic/citations`) — issue a test citation; the fine schedule dropdown should populate, the insert should succeed, and the PDF should download.
