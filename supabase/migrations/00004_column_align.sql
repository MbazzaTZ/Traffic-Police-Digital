-- =========================================================
-- TPDOP – Column Alignment Migration (run AFTER 00003_runtime_tables.sql)
-- =========================================================
-- Adds the columns the React frontend code expects on existing tables
-- (incident_reports, accident_reports, citations, cases, court_cases,
--  arrests, detentions, pf3_forms, firearms, cells, prisoners,
--  wanted_persons, evidence).
--
-- Also DROPS NOT NULL constraints on columns the code does NOT set
-- (because it uses an alias column we're adding here).
--
-- After this migration + the code-side table-name renames
-- (incidents→incident_reports, traffic_citations→citations,
--  traffic_accidents→accident_reports, cid_cases→cases), most pages
-- should run without column errors.
-- =========================================================

-- ══════════════════════════════════════════════════════════
-- 1. CITATIONS  (code uses ref_number/driver_name/vehicle_plate/...)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: officer_id, offence_code. Code uses issued_by (alias) and offense_code.
-- Drop NOT NULL on officer_id since the code sets issued_by instead.
alter table public.citations alter column officer_id drop not null;

alter table public.citations add column if not exists ref_number        text;
alter table public.citations add column if not exists control_number   text;
alter table public.citations add column if not exists driver_name      text;
alter table public.citations add column if not exists driver_license   text;
alter table public.citations add column if not exists driver_nida      text;
alter table public.citations add column if not exists vehicle_plate    text;
alter table public.citations add column if not exists vehicle_make     text;
alter table public.citations add column if not exists vehicle_type     text;
alter table public.citations add column if not exists vehicle_color    text;
alter table public.citations add column if not exists vehicle_id_code  text;
alter table public.citations add column if not exists offense_type     text;
alter table public.citations add column if not exists offense_code     text;
alter table public.citations add column if not exists fine_currency    text default 'TZS';
alter table public.citations add column if not exists location_text    text;
alter table public.citations add column if not exists photo_urls       jsonb default '[]';
alter table public.citations add column if not exists issued_by        uuid references public.profiles;
alter table public.citations add column if not exists issued_at        timestamptz default now();
alter table public.citations add column if not exists due_date         timestamptz;
alter table public.citations add column if not exists fine_schedule_id uuid references public.fine_schedule;
alter table public.citations add column if not exists amount_paid      bigint default 0;
alter table public.citations add column if not exists region_id        uuid references public.regions;
alter table public.citations add column if not exists district_id      uuid references public.districts;

-- Backfill aliases from old columns
update public.citations set ref_number = citation_no where ref_number is null and citation_no is not null;
update public.citations set issued_by   = officer_id  where issued_by   is null and officer_id  is not null;
update public.citations set offense_type = offence_name where offense_type is null and offence_name is not null;
update public.citations set offense_code = offence_code where offense_code is null;
update public.citations set location_text = location where location_text is null and location is not null;
update public.citations set photo_urls    = photos     where photo_urls    is null and photos     is not null;
update public.citations set issued_at     = created_at where issued_at     is null;
-- Ensure ref_number has a value (gen_id was on citation_no)
update public.citations set ref_number = citation_no where ref_number is null;

create index if not exists idx_citations_ref_number    on public.citations(ref_number);
create index if not exists idx_citations_control       on public.citations(control_number);
create index if not exists idx_citations_vehicle_plate on public.citations(vehicle_plate);
create index if not exists idx_citations_issued_by     on public.citations(issued_by);
create index if not exists idx_citations_issued_at     on public.citations(issued_at desc);

-- ══════════════════════════════════════════════════════════
-- 2. INCIDENT_REPORTS  (code calls this table "incidents")
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: officer_id. Code uses reported_by (alias). Drop NOT NULL.
alter table public.incident_reports alter column officer_id drop not null;

alter table public.incident_reports add column if not exists ref_number    text;
alter table public.incident_reports add column if not exists title         text;
alter table public.incident_reports add column if not exists severity      text;
alter table public.incident_reports add column if not exists location_text text;
alter table public.incident_reports add column if not exists reported_by   uuid references public.profiles;
alter table public.incident_reports add column if not exists region_id     uuid references public.regions;
alter table public.incident_reports add column if not exists district_id   uuid references public.districts;
alter table public.incident_reports add column if not exists photo_urls    jsonb default '[]';
alter table public.incident_reports add column if not exists ward_id       uuid references public.wards;

-- Backfill
update public.incident_reports set ref_number    = report_no  where ref_number is null and report_no is not null;
update public.incident_reports set reported_by   = officer_id where reported_by is null;
update public.incident_reports set severity      = priority   where severity is null and priority is not null;
update public.incident_reports set location_text = location   where location_text is null and location is not null;
update public.incident_reports set photo_urls    = attachments where photo_urls is null and attachments is not null;

create index if not exists idx_incident_reports_ref_number on public.incident_reports(ref_number);
create index if not exists idx_incident_reports_reported_by on public.incident_reports(reported_by);

-- ══════════════════════════════════════════════════════════
-- 3. ACCIDENT_REPORTS  (code calls this table "traffic_accidents")
-- ══════════════════════════════════════════════════════════
alter table public.accident_reports alter column officer_id drop not null;

alter table public.accident_reports add column if not exists ref_number    text;
alter table public.accident_reports add column if not exists location_text text;
alter table public.accident_reports add column if not exists photo_urls    jsonb default '[]';
alter table public.accident_reports add column if not exists region_id     uuid references public.regions;
alter table public.accident_reports add column if not exists district_id   uuid references public.districts;
alter table public.accident_reports add column if not exists ward_id       uuid references public.wards;
alter table public.accident_reports add column if not exists reported_by   uuid references public.profiles;
alter table public.accident_reports add column if not exists fatalities    int default 0;
alter table public.accident_reports add column if not exists vehicle_plate text;

-- Backfill
update public.accident_reports set ref_number    = report_no  where ref_number is null and report_no is not null;
update public.accident_reports set reported_by   = officer_id where reported_by is null;
update public.accident_reports set location_text = location   where location_text is null and location is not null;
update public.accident_reports set photo_urls    = photos     where photo_urls is null and photos is not null;

create index if not exists idx_accident_reports_ref_number on public.accident_reports(ref_number);

-- ══════════════════════════════════════════════════════════
-- 4. CASES  (code calls this table "cid_cases")
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: officer_id, title, type. Code uses lead_officer (alias).
alter table public.cases alter column officer_id drop not null;

alter table public.cases add column if not exists ref_number   text;
alter table public.cases add column if not exists case_number  text;
alter table public.cases add column if not exists lead_officer uuid references public.profiles;
alter table public.cases add column if not exists region_id    uuid references public.regions;
alter table public.cases add column if not exists district_id  uuid references public.districts;
alter table public.cases add column if not exists ward_id      uuid references public.wards;
alter table public.cases add column if not exists opened_at    timestamptz default now();

-- Backfill
update public.cases set ref_number  = case_no   where ref_number is null and case_no is not null;
update public.cases set case_number = case_no   where case_number is null and case_no is not null;
update public.cases set lead_officer = officer_id where lead_officer is null;
update public.cases set opened_at    = created_at where opened_at is null;

create index if not exists idx_cases_ref_number  on public.cases(ref_number);
create index if not exists idx_cases_lead_officer on public.cases(lead_officer);

-- Relax the status check to include values the code uses
alter table public.cases drop constraint if exists cases_status_check;
alter table public.cases add constraint cases_status_check
  check (status in ('open','active','investigating','pending','court','closed','cold','reopened'));

-- ══════════════════════════════════════════════════════════
-- 5. COURT_CASES  (code expects extensive metadata)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: court. Code uses court_name (alias). Drop NOT NULL.
alter table public.court_cases alter column court drop not null;

alter table public.court_cases add column if not exists ref_number          text;
alter table public.court_cases add column if not exists case_number         text;
alter table public.court_cases add column if not exists court_name          text;
alter table public.court_cases add column if not exists court_type          text;
alter table public.court_cases add column if not exists accused_name        text;
alter table public.court_cases add column if not exists charges             text;
alter table public.court_cases add column if not exists filed_date          date;
alter table public.court_cases add column if not exists prosecutor          text;
alter table public.court_cases add column if not exists defence             text;
alter table public.court_cases add column if not exists investigating_officer uuid references public.profiles;
alter table public.court_cases add column if not exists sentence            text;
alter table public.court_cases add column if not exists region_id           uuid references public.regions;
alter table public.court_cases add column if not exists district_id         uuid references public.districts;
alter table public.court_cases add column if not exists station_id          uuid references public.stations;

-- Backfill
update public.court_cases set court_name = court where court_name is null and court is not null;
update public.court_cases set status     = 'open' where status is null or status = 'pending';

-- Relax status check
alter table public.court_cases drop constraint if exists court_cases_status_check;
alter table public.court_cases add constraint court_cases_status_check
  check (status in ('pending','open','active','adjourned','hearing','ruling','sentencing','closed','acquitted','convicted','dismissed','withdrawn'));

-- Relax verdict
alter table public.court_cases drop constraint if exists court_cases_verdict_check;

create index if not exists idx_court_cases_ref_number on public.court_cases(ref_number);
create index if not exists idx_court_cases_accused    on public.court_cases(accused_name);

-- ══════════════════════════════════════════════════════════
-- 6. ARRESTS  (code uses ref_number/suspect_name/arrested_by/...)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: officer_id. Code uses arrested_by.
alter table public.arrests alter column officer_id drop not null;

alter table public.arrests add column if not exists ref_number      text;
alter table public.arrests add column if not exists suspect_name    text;
alter table public.arrests add column if not exists suspect_nida    text;
alter table public.arrests add column if not exists suspect_dob     date;
alter table public.arrests add column if not exists suspect_gender  text;
alter table public.arrests add column if not exists suspect_id_no   text;
alter table public.arrests add column if not exists charge          text;
alter table public.arrests add column if not exists charge_details  text;
alter table public.arrests add column if not exists location_text   text;
alter table public.arrests add column if not exists arrested_by     uuid references public.profiles;
alter table public.arrests add column if not exists arrested_at     timestamptz default now();
alter table public.arrests add column if not exists photo_urls      jsonb default '[]';
alter table public.arrests add column if not exists region_id       uuid references public.regions;
alter table public.arrests add column if not exists district_id     uuid references public.districts;
alter table public.arrests add column if not exists ward_id         uuid references public.wards;

-- Backfill
update public.arrests set ref_number  = arrest_no  where ref_number is null and arrest_no is not null;
update public.arrests set arrested_by = officer_id where arrested_by is null;
update public.arrests set arrested_at = arrest_time where arrested_at is null;
update public.arrests set location_text = location where location_text is null and location is not null;
update public.arrests set photo_urls     = photos     where photo_urls is null and photos is not null;

-- Relax status check (code uses 'detained', 'charged', 'released', 'transferred', etc.)
alter table public.arrests drop constraint if exists arrests_status_check;
alter table public.arrests add constraint arrests_status_check
  check (status in ('pending','detained','charged','released','transferred','court','completed','bailed','escaped'));

create index if not exists idx_arrests_ref_number  on public.arrests(ref_number);
create index if not exists idx_arrests_arrested_by on public.arrests(arrested_by);
create index if not exists idx_arrests_suspect_name on public.arrests using gin(suspect_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- 7. DETENTIONS  (code uses detainee_name/reason_code/...)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: officer_id. Code uses arresting_officer (different concept).
alter table public.detentions alter column officer_id drop not null;

alter table public.detentions add column if not exists ref_number        text;
alter table public.detentions add column if not exists detainee_name     text;
alter table public.detentions add column if not exists detainee_nida     text;
alter table public.detentions add column if not exists detainee_phone    text;
alter table public.detentions add column if not exists detainee_address  text;
alter table public.detentions add column if not exists reason_code       text;
alter table public.detentions add column if not exists cell_number       text;
alter table public.detentions add column if not exists location_text     text;
alter table public.detentions add column if not exists arresting_officer text;
alter table public.detentions add column if not exists notes             text;
alter table public.detentions add column if not exists photo_urls        jsonb default '[]';
alter table public.detentions add column if not exists region_id         uuid references public.regions;
alter table public.detentions add column if not exists district_id       uuid references public.districts;
alter table public.detentions add column if not exists ward_id           uuid references public.wards;
alter table public.detentions add column if not exists must_charge_by    timestamptz;
alter table public.detentions add column if not exists released_at       timestamptz;

-- Backfill
update public.detentions set ref_number  = detention_no where ref_number is null and detention_no is not null;
update public.detentions set cell_number = cell_no     where cell_number is null and cell_no is not null;
update public.detentions set released_at = checkout_time where released_at is null and checkout_time is not null;

-- Relax status check
alter table public.detentions drop constraint if exists detentions_status_check;
alter table public.detentions add constraint detentions_status_check
  check (status in ('active','in_custody','released','transferred','charged','bailed','discharged'));

create index if not exists idx_detentions_ref_number  on public.detentions(ref_number);
create index if not exists idx_detentions_detainee_name on public.detentions using gin(detainee_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- 8. PF3_FORMS  (code uses patient_name/incident_type/...)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: officer_id, type, form_no. Code uses issued_by (alias).
alter table public.pf3_forms alter column officer_id drop not null;
alter table public.pf3_forms alter column type drop not null;
alter table public.pf3_forms alter column form_no drop not null;

alter table public.pf3_forms add column if not exists ref_number       text;
alter table public.pf3_forms add column if not exists patient_name     text;
alter table public.pf3_forms add column if not exists patient_nida     text;
alter table public.pf3_forms add column if not exists patient_age      int;
alter table public.pf3_forms add column if not exists patient_gender   text;
alter table public.pf3_forms add column if not exists patient_phone    text;
alter table public.pf3_forms add column if not exists patient_type     text;
alter table public.pf3_forms add column if not exists incident_type    text;
alter table public.pf3_forms add column if not exists incident_date    timestamptz;
alter table public.pf3_forms add column if not exists injuries_alleged text;
alter table public.pf3_forms add column if not exists hospital_name    text;
alter table public.pf3_forms add column if not exists notes            text;
alter table public.pf3_forms add column if not exists photo_urls       jsonb default '[]';
alter table public.pf3_forms add column if not exists issued_by        uuid references public.profiles;
alter table public.pf3_forms add column if not exists region_id        uuid references public.regions;
alter table public.pf3_forms add column if not exists district_id      uuid references public.districts;

-- Backfill ref_number from form_no
update public.pf3_forms set ref_number = form_no where ref_number is null and form_no is not null;
update public.pf3_forms set issued_by  = officer_id where issued_by is null;

create index if not exists idx_pf3_forms_ref_number on public.pf3_forms(ref_number);
create index if not exists idx_pf3_forms_issued_by  on public.pf3_forms(issued_by);

-- ══════════════════════════════════════════════════════════
-- 9. FIREARMS  (code uses serial_number/holder_name/...)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: serial_no, type. Code uses serial_number/firearm_type.
alter table public.firearms alter column serial_no drop not null;
alter table public.firearms alter column type drop not null;

alter table public.firearms add column if not exists ref_number     text;
alter table public.firearms add column if not exists serial_number  text;
alter table public.firearms add column if not exists firearm_type   text;
alter table public.firearms add column if not exists category       text;
alter table public.firearms add column if not exists holder_name    text;
alter table public.firearms add column if not exists holder_nida    text;
alter table public.firearms add column if not exists holder_phone   text;
alter table public.firearms add column if not exists photo_urls     jsonb default '[]';
alter table public.firearms add column if not exists year_made      int;
alter table public.firearms add column if not exists registered_by  uuid references public.profiles;
alter table public.firearms add column if not exists region_id      uuid references public.regions;

-- Backfill
update public.firearms set serial_number = serial_no where serial_number is null and serial_no is not null;
update public.firearms set firearm_type  = type      where firearm_type is null and type is not null;

create unique index if not exists idx_firearms_serial_number on public.firearms(serial_number) where serial_number is not null;
create index if not exists idx_firearms_holder_name on public.firearms(holder_name);

-- ══════════════════════════════════════════════════════════
-- 10. CELLS  (code uses cell_number/cell_type/notes)
-- ══════════════════════════════════════════════════════════
alter table public.cells add column if not exists cell_number text;
alter table public.cells add column if not exists cell_type   text;
alter table public.cells add column if not exists notes       text;

-- Backfill
update public.cells set cell_number = cell_no where cell_number is null and cell_no is not null;
update public.cells set cell_type   = type    where cell_type is null and type is not null;

-- Relax status (code uses 'available','occupied','full','closed','maintenance')
alter table public.cells drop constraint if exists cells_status_check;
alter table public.cells add constraint cells_status_check
  check (status in ('available','occupied','full','closed','maintenance','cleaning'));

create index if not exists idx_cells_cell_number on public.cells(cell_number);

-- ══════════════════════════════════════════════════════════
-- 11. PRISONERS  (code uses prisoner_name/sentence_text/admitted_by)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: person_id, station_id, officer_id. Code uses prisoner_name (no person_id link).
alter table public.prisoners alter column person_id drop not null;
alter table public.prisoners alter column officer_id drop not null;

alter table public.prisoners add column if not exists ref_number    text;
alter table public.prisoners add column if not exists prisoner_name text;
alter table public.prisoners add column if not exists prisoner_nida text;
alter table public.prisoners add column if not exists charges       text;
alter table public.prisoners add column if not exists sentence_text text;
alter table public.prisoners add column if not exists notes         text;
alter table public.prisoners add column if not exists admitted_by   uuid references public.profiles;
alter table public.prisoners add column if not exists region_id     uuid references public.regions;

-- Backfill
update public.prisoners set ref_number = prisoner_no where ref_number is null and prisoner_no is not null;
update public.prisoners set admitted_by = officer_id where admitted_by is null;

-- Relax status
alter table public.prisoners drop constraint if exists prisoners_status_check;
alter table public.prisoners add constraint prisoners_status_check
  check (status in ('active','remand','convicted','released','transferred','court','escaped','deceased'));

create index if not exists idx_prisoners_ref_number    on public.prisoners(ref_number);
create index if not exists idx_prisoners_prisoner_name on public.prisoners using gin(prisoner_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- 12. WANTED_PERSONS  (code uses full_name/offenses/danger_level)
-- ══════════════════════════════════════════════════════════
alter table public.wanted_persons add column if not exists ref_number   text;
alter table public.wanted_persons add column if not exists full_name    text;
alter table public.wanted_persons add column if not exists nida         text;
alter table public.wanted_persons add column if not exists dob          date;
alter table public.wanted_persons add column if not exists gender       text;
alter table public.wanted_persons add column if not exists offenses     text;
alter table public.wanted_persons add column if not exists danger_level text default 'medium' check (danger_level in ('low','medium','high','armed','critical'));
alter table public.wanted_persons add column if not exists photo_url    text;

-- Backfill from existing columns where possible
update public.wanted_persons set offenses = crime where offenses is null and crime is not null;
update public.wanted_persons set danger_level = case
  when dangerous and armed then 'armed'
  when dangerous then 'high'
  else 'medium'
end where danger_level is null or danger_level = 'medium';
update public.wanted_persons set danger_level = 'medium' where danger_level is null;

-- Relax status (code uses 'wanted','captured','cancelled','active')
alter table public.wanted_persons drop constraint if exists wanted_persons_status_check;
alter table public.wanted_persons add constraint wanted_persons_status_check
  check (status in ('active','wanted','captured','cancelled','cleared','deceased'));

create index if not exists idx_wanted_persons_ref_number on public.wanted_persons(ref_number);
create index if not exists idx_wanted_persons_full_name  on public.wanted_persons using gin(full_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- 13. EVIDENCE  (code uses ref_number/location_found/storage_location/chain_count)
-- ══════════════════════════════════════════════════════════
-- Original NOT NULL: case_id, collected_by. Code may insert with case_id=null (CID general evidence).
alter table public.evidence alter column case_id drop not null;

alter table public.evidence add column if not exists ref_number      text;
alter table public.evidence add column if not exists location_found  text;
alter table public.evidence add column if not exists storage_location text;
alter table public.evidence add column if not exists chain_count     int default 1;
alter table public.evidence add column if not exists station_id      uuid references public.stations;
alter table public.evidence add column if not exists region_id       uuid references public.regions;
alter table public.evidence add column if not exists photo_urls      jsonb default '[]';

-- Backfill
update public.evidence set ref_number     = evidence_no where ref_number is null and evidence_no is not null;
update public.evidence set location_found = location    where location_found is null and location is not null;

-- Relax status
alter table public.evidence drop constraint if exists evidence_status_check;
alter table public.evidence add constraint evidence_status_check
  check (status in ('active','in_custody','transferred','released','destroyed','lost','archived'));

create index if not exists idx_evidence_ref_number on public.evidence(ref_number);

-- ══════════════════════════════════════════════════════════
-- 14. STATIONS  (small addition for code consistency)
-- ══════════════════════════════════════════════════════════
-- Already has lat/lng; add ward_id link (some pages may use)
alter table public.stations add column if not exists ward_id uuid references public.wards;
alter table public.stations add column if not exists ocs_name text;

-- ══════════════════════════════════════════════════════════
-- 15. PROFILES  (last_login_at already exists; add notification prefs)
-- ══════════════════════════════════════════════════════════
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists preferences    jsonb default '{}';

-- ══════════════════════════════════════════════════════════
-- DONE
-- ══════════════════════════════════════════════════════════
select 'TPDOP COLUMN ALIGN COMPLETE' as status,
       '13 tables altered, ~80 columns added, 8 NOT NULLs relaxed, 6 CHECK constraints widened' as summary;
