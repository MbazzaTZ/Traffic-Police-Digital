# TPDOP — End-to-End Test Plan

Comprehensive checklist for verifying the Tanzania Police Digital Operations Platform works end-to-end after all schema migrations (00001–00007) and code fixes.

---

## 📋 How to use this plan

1. **Apply all migrations** to your Supabase project (see `MIGRATIONS.md`)
2. **Deploy the latest code** to Vercel (or run `npm run dev` locally)
3. **Create test accounts** for each role (see Setup below)
4. **Walk through each section** in order, marking ✅ or ❌ as you go
5. **Report any ❌ failures** with screenshots and the Supabase error

---

## 🔧 Setup

### Test accounts needed

Create these officer accounts via `/admin/create-user` (log in as admin_officer first):

| Role | Email | Password | Purpose |
|---|---|---|---|
| admin_officer | admin@tpdop.test | TestPass123! | Admin module tests |
| traffic_officer | traffic@tpdop.test | TestPass123! | Traffic module tests |
| cid_officer | cid@tpdop.test | TestPass123! | CID module tests |
| regular_officer | officer@tpdop.test | TestPass123! | Regular police tests |
| ocs | ocs@tpdop.test | TestPass123! | Approvals flow tests |
| rpc | rpc@tpdop.test | TestPass123! | Command center tests |

> ⚠️ Disable email confirmation in Supabase → Authentication → Providers → Email for test accounts, or confirm each user manually in Authentication → Users.

### Test data needed

- At least 1 region with districts and stations (DSM is pre-seeded)
- At least 1 fine_schedule entry (20 are pre-seeded)
- At least 1 person in the `persons` table (add via Person Search → Add Person)
- At least 1 vehicle in the `vehicles` table (add via Person Search → Add Person with vehicle)

---

## 1. 🔐 Authentication

### Login Page (`/`)
- [ ] Page loads with bilingual branding (Swahili + English)
- [ ] Tanzania coat of arms and police logo display correctly
- [ ] Email + password fields work
- [ ] Show/hide password toggle works
- [ ] "Forgot Password?" link opens reset modal
- [ ] Invalid credentials show error: "Invalid email or password. Tafadhali angalia taarifa zako."
- [ ] Valid login redirects to role-appropriate home:
  - admin_officer → `/admin`
  - traffic_officer → `/traffic`
  - cid_officer → `/cid`
  - regular_officer → `/dashboard`
- [ ] Audit log entry created (`action: login`)

### Reset Password (`/reset-password`)
- [ ] Forgot password flow sends reset email
- [ ] Reset link opens `/reset-password` page
- [ ] New password can be set
- [ ] After reset, user is signed out and redirected to login

---

## 2. 🛡️ Admin Module

### Admin Dashboard (`/admin`)
- [ ] KPI tiles show real counts (officers, stations, regions)
- [ ] "Recent Officers" table populates
- [ ] Quick-action tiles link to correct pages

### Create User (`/admin/create-user`)
- [ ] 3-step wizard works (Personal → Assignment → Credentials)
- [ ] Region → District → Station cascade dropdowns work
- [ ] Role selection shows permission preview
- [ ] Account is created in `auth.users` + `profiles`
- [ ] Admin session is preserved after creating user (doesn't get logged out)
- [ ] New user can log in with their credentials

### Officers (`/admin/officers`)
- [ ] Officer list loads with search + filters
- [ ] View officer opens modal with full details
- [ ] Edit officer works (name, phone, station, role)
- [ ] Reset password triggers Edge Function
- [ ] Delete officer works (with confirmation)
- [ ] Cannot delete own account (defensive guard)

### Stations (`/admin/stations`)
- [ ] Station list loads
- [ ] Add station modal works with region/district/ward cascade
- [ ] New station appears in list

### Regions (`/admin/regions`)
- [ ] Tree view loads (Region → District → Ward → Station)
- [ ] Add region auto-seeds districts from TZ_REGIONS map
- [ ] Add district works
- [ ] Add ward works

### Roles (`/admin/roles`)
- [ ] 9 role cards display
- [ ] **Each card shows real officer count** (not hardcoded "0")
- [ ] Access matrix renders correctly
- [ ] Refresh button updates counts

### Fine Schedule (`/admin/fines`)
- [ ] **20 pre-seeded TZ traffic offenses display** (TRF-001 through DOC-002)
- [ ] Add new offense works
- [ ] Edit offense works
- [ ] Toggle active/inactive works

### System Settings (`/admin/settings`)
- [ ] **Settings load from `system_settings` table** (not hardcoded defaults)
- [ ] Toggle a setting (e.g. "Email notifications") → Save
- [ ] **Refresh page → toggle stays in saved state**
- [ ] System Status panel reflects actual setting values
- [ ] Reload button re-fetches from DB

---

## 3. 🚔 Regular Police Module

### Dashboard (`/dashboard`)
- [ ] Welcome message with officer name
- [ ] Quick-action tiles link to correct pages

### Person Search (`/person-search`)
- [ ] 9 search methods render (Name, NIDA, Plate, License, TIN, Passport, Phone, Fingerprint, Face)
- [ ] Name search returns matching persons
- [ ] NIDA search returns matching persons
- [ ] Plate search returns matching vehicles + owner
- [ ] Add Person modal works (PhotoUpload + region/district cascade)
- [ ] Search results link to person profile

### Person Profile (`/person/:id`)
- [ ] Profile loads with bio card
- [ ] **Region/District display from text columns** (not broken FK joins)
- [ ] Arrest history table populates (if any)
- [ ] Vehicles grid populates (if any)
- [ ] Citations populate (linked by NIDA/license, not person_id)
- [ ] Wanted banner shows if person is flagged
- [ ] Vehicle cards link to vehicle profile

### Vehicle Profile (`/vehicle/:id`)
- [ ] Profile loads with vehicle details
- [ ] **Plate displays from `plate_number` or `plate` fallback**
- [ ] Stolen banner shows if `is_stolen` or `stolen` is true
- [ ] Insurance status reflects actual expiry date
- [ ] Owner section links to person profile (if linked)
- [ ] Violations table populates
- [ ] Role-aware action buttons work:
  - Regular officer sees "Flag for Citation"
  - Traffic officer sees "Issue Citation"

### Incident Reports (`/incidents`)
- [ ] List loads with search + filters
- [ ] Create incident works (type, severity, location, PhotoUpload)
- [ ] New incident appears in list with status `open`
- [ ] Audit log entry created (`action: create_incident`)

### Arrests (`/arrests`)
- [ ] List loads
- [ ] Create arrest works (suspect name, NIDA, charge, location)
- [ ] New arrest appears with ref number (AR-YYYY-NNNNN)
- [ ] Audit log entry created (`action: create_arrest`)

### Patrols (`/patrols`)
- [ ] Start patrol creates row in `patrols` table
- [ ] GPS tracker pings `officer_locations` every 60s
- [ ] **Multiple pings succeed** (no primary key violation — was a bug before 00003)
- [ ] End patrol writes `end_time` + `duration_mins`
- [ ] Patrol history loads

### Evidence (`/evidence`)
- [ ] List loads with chain-of-custody indicator
- [ ] Upload evidence works (type, description, location, PhotoUpload)
- [ ] **Evidence persists to `evidence` table** (was a mock before)
- [ ] Initial `evidence_chain` row created automatically
- [ ] Click a row → chain-of-custody drawer opens
- [ ] Transfer/Release/Destroy action works
- [ ] Chain trail shows all actions with officer + timestamp

### Detentions (`/detentions`)
- [ ] List loads
- [ ] Create detention works (detainee name, NIDA, reason, cell)
- [ ] **24h custody clock shows remaining time** (uses `must_charge_by`)
- [ ] Overdue detainees highlighted in red
- [ ] Status update works (released, charged, transferred)

### PF3 Forms (`/pf3`)
- [ ] List loads
- [ ] Create PF3 works (patient info, incident type, hospital)
- [ ] **PDF downloads automatically** on issue
- [ ] PDF has bilingual header + Section A (police) + Section B (doctor)

### Firearms (`/firearms`)
- [ ] Firearms tab loads
- [ ] Licenses tab loads
- [ ] Register firearm works
- [ ] Issue license works
- [ ] **License certificate PDF downloads**

### Prisoners (`/prisoners`)
- [ ] List loads
- [ ] Admit prisoner works
- [ ] Status update works (remand, convicted, released)

### Cells (`/cells`)
- [ ] List loads
- [ ] Add cell works (cell number, type, capacity)
- [ ] Status cycle works (available, occupied, full, closed, maintenance)

### Court Cases (`/court-cases`)
- [ ] List loads
- [ ] File court case works (case number, court, accused, charges)
- [ ] Side drawer opens with 5 tabs: Overview, Hearings, Evidence Bundle, Statements, Verdict
- [ ] Record hearing works
- [ ] Attach evidence works
- [ ] Record statement works (with sworn/cautioned/witness-bond flags)
- [ ] **Court File PDF downloads** (multi-page: cover + hearings + evidence + statements + certification)

### Messages (`/messages`)
- [ ] Conversation list loads
- [ ] Send message works
- [ ] Realtime: new messages appear without refresh
- [ ] Broadcast message works

### Alerts (`/alerts`)
- [ ] List loads
- [ ] Issue alert works (type, priority, region, body)
- [ ] **All 4 alert types work**: info, warning, danger, emergency (was broken before 00006)
- [ ] Realtime: new alerts appear without refresh
- [ ] Acknowledgement works

### My Profile (`/profile`)
- [ ] Profile loads with current user info
- [ ] Edit phone/email works
- [ ] Change password works

---

## 4. 🚗 Traffic Module

### Traffic Dashboard (`/traffic`)
- [ ] KPI tiles show real counts
- [ ] Quick-action tiles link to correct pages

### Citations (`/traffic/citations`)
- [ ] List loads
- [ ] **Fine schedule dropdown populates** (20 pre-seeded offenses)
- [ ] Selecting an offense auto-fills fine amount
- [ ] Issue citation works (driver, vehicle, offense, location)
- [ ] **Citation PDF downloads automatically** on issue
- [ ] New citation appears with ref number (CIT-YYYY-NNNNN)
- [ ] Audit log entry created (`action: issue_citation`)

### Accidents (`/traffic/accidents`)
- [ ] List loads
- [ ] Create accident report works (type, vehicles, casualties, location)
- [ ] New accident appears with ref number (ACC-YYYY-NNNNN)

### Vehicle Search (`/traffic/vehicles`)
- [ ] Search by plate works
- [ ] Results show vehicle details + owner + citation history

### Checkpoints (`/traffic/checkpoints`)
- [ ] List loads with session history
- [ ] **Start checkpoint persists to `checkpoints` table** (was a mock before)
- [ ] Counters (passed, checked, cited, arrested) increment
- [ ] **Counter changes sync to DB** (refresh mid-session doesn't lose data)
- [ ] End checkpoint writes final counters + status `completed`
- [ ] Session history shows recent 50 sessions

### Payments (`/traffic/payments`)
- [ ] List loads
- [ ] Lookup by control number works
- [ ] Record payment works (amount, method, payer)
- [ ] **Payment receipt PDF downloads**
- [ ] All payment methods work (mpesa, tigo_pesa, airtel_money, halopesa, ezypesa, bank_transfer, cash)

---

## 5. 🔍 CID Module

### CID Dashboard (`/cid`)
- [ ] KPI tiles show real counts
- [ ] Quick-action tiles link to correct pages

### Cases (`/cid/cases`)
- [ ] List loads
- [ ] Create case works (title, type, priority)
- [ ] New case appears with ref number (CASE-YYYY-NNNNN)
- [ ] **Audit log entry created** (`action: create_case`)

### Suspects (`/cid/suspects`)
- [ ] List loads
- [ ] Add suspect works (name, alias, NIDA, case link)
- [ ] Detail drawer opens
- [ ] **Audit log entry created** (`action: create_suspect`)

### Wanted Persons (`/cid/wanted`)
- [ ] List loads as card grid
- [ ] Add wanted person works (name, alias, NIDA, danger level, offenses)
- [ ] **KPI "Captured" tile shows real count** (was filtering by wrong status)
- [ ] **"Poster" button downloads PDF** (new feature)
- [ ] PDF has: red WANTED banner, photo, name, danger badge, offenses, reward, contact info
- [ ] **"Captured" button updates status** with confirmation
- [ ] **Audit log entries created** (`create_wanted_person`, `capture_wanted_person`, `export_wanted_poster`)

### Evidence (`/cid/evidence`)
- [ ] List loads
- [ ] Add evidence works (type, description, case link, storage location)
- [ ] **Audit log entry created** (`action: create_evidence`)

### NIDA Search (`/cid/search`)
- [ ] Search by name or NIDA works
- [ ] Results show 4 sections: Wanted, Arrests, Suspects, Cases
- [ ] Wanted matches show red alert banner
- [ ] **Audit log entry created** (`action: search_criminal_records`) — security requirement

---

## 6. 🎖️ Command Module

### Command Center (`/command`)
- [ ] Live clock updates every second
- [ ] KPI tiles show real counts
- [ ] Recent incidents table populates
- [ ] Recent alerts list populates
- [ ] Active patrols list populates
- [ ] **Realtime: new incidents/alerts/patrols appear without refresh** (was broken — table name fixed)

### Command Incidents (`/command/incidents`)
- [ ] Live feed loads
- [ ] Search + status + severity filters work
- [ ] "LIVE FEED" pulse indicator shows
- [ ] **Realtime updates work** (table name fixed)

### Command Officers (`/command/officers`)
- [ ] Officer roster loads
- [ ] Search + role/status filters work
- [ ] KPIs show total/active/traffic/CID counts

### Command Reports (`/command/reports`)
- [ ] Aggregates load (incident types, fines, trends)
- [ ] **PDF export works** (tabular report)

### Command Alerts (`/command/alerts`)
- [ ] List loads
- [ ] Issue alert works
- [ ] **All alert types work** (was broken before 00006)

### Audit Logs (`/command/audit`)
- [ ] **Logs load with real data** (was rendering blanks before 00003)
- [ ] Each row shows: time, officer name, badge, role, action, entity ref, description, GPS, device
- [ ] Search works (by officer name, badge, ref, description)
- [ ] Action filter dropdown works
- [ ] GPS link opens Google Maps (when GPS captured)

### Patrol Map (`/command/patrol-map`)
- [ ] **Map loads with Leaflet tiles**
- [ ] **Officer markers appear** (from `officer_latest_locations` view)
- [ ] Markers color-coded by role
- [ ] Live markers pulse (last 5 min)
- [ ] Role filter works
- [ ] 30s auto-refresh works
- [ ] Click marker → popup with officer name, badge, station, battery, speed

---

## 7. 📋 Shared Module

### Approvals (`/approvals`)
- [ ] Submit request works (9 request types available)
- [ ] Request persists to `requests` table (was broken before 00003)
- [ ] "My Requests" tab shows own requests
- [ ] "Inbox" tab shows requests awaiting approval
- [ ] Approve at current level works
- [ ] **Escalation chain works**: OCS → OCD → RPC → IGP
- [ ] Reject works
- [ ] Approval trail timeline shows all actions
- [ ] **All priority levels work** including `emergency` (was broken before 00006)

### Citation Requests (`/citation-requests`)
- [ ] 3 tabs: Mine, Pending, All
- [ ] Flag vehicle for citation works (from Vehicle Profile)
- [ ] Prefill from VehicleProfilePage works
- [ ] Traffic officer can approve → auto-creates citation
- [ ] Traffic officer can reject with reason

### More (`/more`)
- [ ] Mobile menu renders with role-aware items
- [ ] Logout works

---

## 8. 📱 Mobile / PWA

### Responsive Layout
- [ ] Sidebar collapses on mobile (< 768px)
- [ ] Hamburger menu toggles sidebar
- [ ] Bottom nav appears on mobile (DashboardLayout + TrafficLayout)
- [ ] Tables scroll horizontally on mobile (mobile-overrides.css)
- [ ] Grids stack to single column on mobile

### PWA Install
- [ ] Install prompt appears on Chrome/Android
- [ ] iOS Safari shows "Add to Home Screen" hint
- [ ] App opens fullscreen (no browser chrome)
- [ ] Manifest theme color is navy (#0D3477)

### Offline
- [ ] App shell loads offline (after first visit)
- [ ] Visited pages load offline
- [ ] Supabase writes fail gracefully with error banner

---

## 9. 🛡️ Security Verification

### Row Level Security
- [ ] Regular officer can only see their station's citations
- [ ] CID officer can only see CID-relevant data
- [ ] OCS can see station-wide data
- [ ] RPC can see region-wide data
- [ ] IGP/admin can see all data
- [ ] Officer cannot delete own profile (defensive guard)

### Audit Trail
- [ ] Every create/update/delete on audited tables logs to `audit_logs`
- [ ] Audit log entries include: officer_id, officer_name, badge, role, action, entity_ref, description, GPS, device_id
- [ ] Audit logs cannot be deleted or updated (immutable rules)
- [ ] Login/logout events are logged

### GPS Tracking
- [ ] GPS prompt appears on first patrol
- [ ] GPS coordinates captured on audit logs (best-effort)
- [ ] GPS pings persist to `officer_locations` every 60s during patrol

---

## 10. 📊 PDF Exports

Verify each PDF generator produces a valid PDF:

- [ ] **Citation PDF** — bilingual header, driver info, vehicle info, offense, fine amount
- [ ] **PF3 Medical Form** — Section A (police) + Section B (doctor), bilingual
- [ ] **Firearm License Certificate** — license number, holder, firearm, validity, signatures
- [ ] **Payment Receipt** — receipt number, citation, payment, balance, signatures
- [ ] **Court Case File** — multi-page: cover + hearings + evidence + statements + certification
- [ ] **Wanted Poster** — red banner, photo, name, danger badge, offenses, reward, contact
- [ ] **Generic Report** — tabular PDF for Command Reports

---

## 11. 🔄 Realtime Subscriptions

Verify these pages update without manual refresh:

- [ ] Command Center — incidents, alerts, patrols
- [ ] Command Incidents — new incidents
- [ ] Command Alerts — new alerts
- [ ] Messages — new messages in conversation
- [ ] Alerts Page — new alerts

---

## 12. 🚨 Error Handling

- [ ] Network errors show user-friendly messages
- [ ] RLS denials show "permission denied" (not raw SQL error)
- [ ] Missing data shows "—" or "No records" (not blank)
- [ ] Failed PDF export shows error toast
- [ ] Failed form submit shows error message with reason

---

## ✅ Sign-off

**Tester**: _______________________

**Date**: _______________________

**Environment**:
- [ ] Production (Vercel)
- [ ] Staging
- [ ] Local dev

**Results**:
- Total tests: ~250
- Passed: ___
- Failed: ___
- Blocked: ___

**Sign-off**:
- [ ] Ready for production rollout
- [ ] Needs fixes (list below)
- [ ] Not ready

**Notes / Issues**:
```
(paste any failures or observations here)
```

---

## 📞 Quick Reference

| What | Where |
|---|---|
| Live app | https://tanzania-police-digital.vercel.app/ |
| Supabase Dashboard | https://supabase.com/dashboard |
| GitHub repo | https://github.com/MbazzaTZ/Traffic-Police-Digital |
| Migration guide | `MIGRATIONS.md` |
| Schema repair runbook | `SCHEMA_REPAIR_RUNBOOK.md` |
| Emergency (Tanzania) | 112 |
| TPDOP HQ | 022-211-0000 |
