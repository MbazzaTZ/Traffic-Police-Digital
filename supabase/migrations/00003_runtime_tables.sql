-- =========================================================
-- TPDOP – Runtime Tables Migration (run AFTER 00001_full_schema.sql & 00002_wards.sql)
-- =========================================================
-- Adds the 12 missing tables referenced by the React frontend
-- (requests, request_approvals, citation_requests, fine_schedule,
--  payments, firearm_licenses, hearings, case_evidence, statements,
--  suspects, stolen_property, stolen_vehicles), plus:
--   * ALTERs officer_locations to be a time-series table (was 1-row-per-officer)
--   * ALTERs audit_logs to add the columns written by src/lib/audit.js
--   * ALTERs persons / vehicles / alerts / messages to add code-expected columns
--   * Creates officer_latest_locations view for CommandPatrolMap
--   * Adds RLS + audit triggers for all new tables
--   * Seeds fine_schedule with common Tanzania traffic offenses
--
-- IMPORTANT: This migration is additive. It does NOT rename existing tables
-- or columns. The remaining table-name mismatches (incidents vs incident_reports,
-- traffic_citations vs citations, traffic_accidents vs accident_reports,
-- cid_cases vs cases) are resolved in CODE (rename references in pages).
-- =========================================================

-- ══════════════════════════════════════════════════════════
-- PART 1: SEQUENCES (must exist before tables that use gen_id())
-- ══════════════════════════════════════════════════════════
create sequence if not exists seq_request          start 1;
create sequence if not exists seq_citation_request start 1;
create sequence if not exists seq_payment          start 1;
create sequence if not exists seq_firearm_license  start 1;
create sequence if not exists seq_statement        start 1;
create sequence if not exists seq_suspect          start 1;
create sequence if not exists seq_stolen_property  start 1;
create sequence if not exists seq_stolen_vehicle   start 1;

-- ══════════════════════════════════════════════════════════
-- PART 2: NEW TABLES
-- ══════════════════════════════════════════════════════════

-- ── 2.1 APPROVALS WORKFLOW ──
-- Multi-tier escalation: submitter → OCS → OCD → RPC → IGP
-- See src/lib/approvalFlow.js for the chain logic.
create table if not exists public.requests (
  id                uuid primary key default uuid_generate_v4(),
  ref_number        text unique default gen_id('REQ-','seq_request'),
  type              text not null,
  title             text not null,
  description       text,
  amount            bigint,
  priority          text default 'normal' check (priority in ('low','normal','high','urgent')),
  status            text default 'pending' check (status in ('pending','escalated','approved','rejected','cancelled')),
  requested_by      uuid not null references public.profiles on delete cascade,
  requester_role    text,
  current_level     text not null,
  current_approver  uuid references public.profiles,
  decided_by        uuid references public.profiles,
  decision_note     text,
  decided_at        timestamptz,
  station_id        uuid references public.stations,
  region_id         uuid references public.regions,
  district_id       uuid references public.districts,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index if not exists idx_requests_status     on public.requests(status);
create index if not exists idx_requests_requester  on public.requests(requested_by);
create index if not exists idx_requests_approver   on public.requests(current_approver);
create index if not exists idx_requests_station    on public.requests(station_id);

create table if not exists public.request_approvals (
  id          uuid primary key default uuid_generate_v4(),
  request_id  uuid not null references public.requests on delete cascade,
  actor_id    uuid not null references public.profiles,
  actor_role  text,
  action      text not null check (action in ('submitted','approved','escalated','rejected','cancelled')),
  from_level  text,
  to_level    text,
  note        text,
  created_at  timestamptz default now()
);
create index if not exists idx_request_approvals_request on public.request_approvals(request_id);
create index if not exists idx_request_approvals_actor   on public.request_approvals(actor_id);

-- ── 2.2 CITATION REQUESTS (cross-role workflow) ──
-- Field officer flags a vehicle → Traffic officer reviews → on approval
-- auto-creates a citations row. See src/pages/shared/CitationRequestsPage.jsx.
create table if not exists public.citation_requests (
  id              uuid primary key default uuid_generate_v4(),
  ref_number      text unique default gen_id('CRQ-','seq_citation_request'),
  vehicle_plate   text not null,
  vehicle_make    text,
  vehicle_model   text,
  vehicle_color   text,
  vehicle_type    text,
  driver_name     text,
  driver_license  text,
  driver_nida     text,
  offense_type    text,
  offense_code    text,
  fine_schedule_id uuid references public.fine_schedule,
  location_text   text,
  notes           text,
  photo_urls      jsonb default '[]',
  requester_id    uuid not null references public.profiles on delete cascade,
  station_id      uuid references public.stations,
  region_id       uuid references public.regions,
  status          text default 'pending' check (status in ('pending','approved','rejected','issued','converted','cancelled')),
  reviewed_by     uuid references public.profiles,
  reviewed_at     timestamptz,
  rejection_reason text,
  citation_id     uuid references public.citations,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_citation_requests_status    on public.citation_requests(status);
create index if not exists idx_citation_requests_requester on public.citation_requests(requester_id);
create index if not exists idx_citation_requests_plate     on public.citation_requests(vehicle_plate);

-- ── 2.3 FINE SCHEDULE ──
-- Tariff of offenses with TZS amounts. Used by CitationsPage, FineSchedulePage,
-- CitationRequestsPage to auto-fill offense name + amount.
create table if not exists public.fine_schedule (
  id              uuid primary key default uuid_generate_v4(),
  code            text unique not null,
  offense_name    text not null,
  offense_name_sw text,
  fine_amount     bigint not null default 0,
  category        text default 'traffic' check (category in ('traffic','criminal','administrative','parking','document')),
  legal_reference text,
  active          boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_fine_schedule_code     on public.fine_schedule(code);
create index if not exists idx_fine_schedule_category on public.fine_schedule(category);

-- ── 2.4 PAYMENTS ──
-- Traffic fine payments. Linked to citations via citation_id.
-- Receipt number auto-generated as PAY-YYYY-NNNNN.
create table if not exists public.payments (
  id              uuid primary key default uuid_generate_v4(),
  ref_number      text unique default gen_id('PAY-','seq_payment'),
  citation_id     uuid references public.citations on delete set null,
  control_number  text,
  amount          bigint not null default 0,
  method          text check (method in ('cash','mpesa','tigopesa','airtel_money','halopesa','bank','card','other')),
  transaction_ref text,
  payer_name      text,
  payer_phone     text,
  notes           text,
  paid_at         timestamptz default now(),
  received_by     uuid references public.profiles,
  station_id      uuid references public.stations,
  status          text default 'completed' check (status in ('pending','completed','failed','reversed','partial')),
  created_at      timestamptz default now()
);
create index if not exists idx_payments_citation on public.payments(citation_id);
create index if not exists idx_payments_control on public.payments(control_number);
create index if not exists idx_payments_station on public.payments(station_id);
create index if not exists idx_payments_paid_at on public.payments(paid_at desc);

-- ── 2.5 FIREARM LICENSES ──
-- Linked to firearms table. License certificate PDF generated by exportFirearmLicense().
create table if not exists public.firearm_licenses (
  id              uuid primary key default uuid_generate_v4(),
  ref_number      text unique default gen_id('FL-','seq_firearm_license'),
  license_no      text unique not null,
  firearm_id      uuid references public.firearms on delete set null,
  holder_name     text not null,
  holder_nida     text,
  holder_phone    text,
  holder_address  text,
  license_type    text check (license_type in ('private','official','special','temporary','dealer')),
  issue_date      date default current_date,
  expiry_date     date,
  issued_by       uuid references public.profiles,
  station_id      uuid references public.stations,
  region_id       uuid references public.regions,
  status          text default 'active' check (status in ('active','suspended','revoked','expired')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_firearm_licenses_holder   on public.firearm_licenses(holder_name);
create index if not exists idx_firearm_licenses_firearm  on public.firearm_licenses(firearm_id);
create index if not exists idx_firearm_licenses_status   on public.firearm_licenses(status);

-- ── 2.6 COURT HEARINGS ──
-- Each hearing belongs to a court_cases row. PDF export uses these.
create table if not exists public.hearings (
  id              uuid primary key default uuid_generate_v4(),
  ref_number      text unique default gen_id('HG-','seq_hearing'),
  case_id         uuid not null references public.court_cases on delete cascade,
  court_case_id   uuid references public.court_cases on delete cascade, -- alias used by CourtCasesPage
  hearing_date    timestamptz not null,
  hearing_type    text check (hearing_type in ('mention','trial','ruling','sentencing','adjournment','mention','pretrial')),
  magistrate      text,
  outcome         text,
  next_date       date,
  next_hearing_type text,
  notes           text,
  attended        boolean default true,
  recorded_by     uuid references public.profiles,
  created_at      timestamptz default now()
);
create sequence if not exists seq_hearing start 1;
create index if not exists idx_hearings_case        on public.hearings(case_id);
create index if not exists idx_hearings_court_case  on public.hearings(court_case_id);
create index if not exists idx_hearings_date        on public.hearings(hearing_date desc);

-- ── 2.7 CASE EVIDENCE (bundle: which evidence is tendered in which court case) ──
-- Many-to-many: evidence items get attached to court cases as exhibit bundle.
create table if not exists public.case_evidence (
  id              uuid primary key default uuid_generate_v4(),
  court_case_id   uuid not null references public.court_cases on delete cascade,
  case_id         uuid references public.court_cases on delete cascade, -- alias
  evidence_id     uuid references public.evidence on delete set null,
  exhibit_label   text,
  purpose         text,
  tendered_at     timestamptz default now(),
  tendered_by     uuid references public.profiles,
  created_at      timestamptz default now()
);
create index if not exists idx_case_evidence_court_case on public.case_evidence(court_case_id);
create index if not exists idx_case_evidence_evidence   on public.case_evidence(evidence_id);

-- ── 2.8 STATEMENTS (witness / suspect / victim) ──
-- Full statement capture with legal flags (sworn, cautioned s.33, witness bond s.34).
-- One statement per page in the Court File PDF bundle.
create table if not exists public.statements (
  id                uuid primary key default uuid_generate_v4(),
  ref_number        text unique default gen_id('STMT-','seq_statement'),
  case_id           uuid references public.court_cases on delete cascade,
  court_case_id     uuid references public.court_cases on delete cascade, -- alias
  statement_type    text check (statement_type in ('witness','suspect','victim','informant','expert')),
  deponent_name     text not null,
  deponent_nida     text,
  deponent_phone    text,
  deponent_address  text,
  deponent_occupation text,
  content           text not null,
  language          text default 'sw' check (language in ('sw','en','sw,en')),
  sworn             boolean default false,
  cautioned         boolean default false,   -- s.33 caution
  witness_bond      boolean default false,   -- s.34 witness bond
  taken_at          timestamptz default now(),
  taken_by          uuid references public.profiles,
  station_id        uuid references public.stations,
  created_at        timestamptz default now()
);
create index if not exists idx_statements_court_case on public.statements(court_case_id);
create index if not exists idx_statements_case       on public.statements(case_id);
create index if not exists idx_statements_deponent   on public.statements(deponent_name);

-- ── 2.9 SUSPECTS (standalone table) ──
-- The cases.suspects JSONB column is kept for backwards compat; this table
-- is the proper relational home for per-suspect metadata.
create table if not exists public.suspects (
  id              uuid primary key default uuid_generate_v4(),
  ref_number      text unique default gen_id('SUS-','seq_suspect'),
  person_id       uuid references public.persons on delete set null,
  case_id         uuid references public.cases on delete set null,
  full_name       text not null,
  alias           text,
  nida            text,
  dob             date,
  gender          text,
  nationality     text default 'Tanzanian',
  phone           text,
  address         text,
  occupation      text,
  photo_url       text,
  description     text,
  status          text default 'suspect' check (status in ('suspect','cleared','charged','convicted','acquitted','at_large','released')),
  added_by        uuid references public.profiles,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_suspects_case  on public.suspects(case_id);
create index if not exists idx_suspects_name  on public.suspects using gin(full_name gin_trgm_ops);
create index if not exists idx_suspects_nida  on public.suspects(nida);

-- ── 2.10 STOLEN PROPERTY ──
create table if not exists public.stolen_property (
  id              uuid primary key default uuid_generate_v4(),
  ref_number      text unique default gen_id('SPR-','seq_stolen_property'),
  item_name       text not null,
  item_type       text,
  description     text,
  serial_no       text,
  estimated_value bigint default 0,
  owner_name      text,
  owner_phone     text,
  owner_nida      text,
  stolen_date     timestamptz,
  stolen_location text,
  location_text   text,
  photo_urls      jsonb default '[]',
  officer_id      uuid references public.profiles,
  station_id      uuid references public.stations,
  region_id       uuid references public.regions,
  district_id     uuid references public.districts,
  status          text default 'active' check (status in ('active','recovered','closed')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_stolen_property_status on public.stolen_property(status);
create index if not exists idx_stolen_property_type   on public.stolen_property(item_type);

-- ── 2.11 STOLEN VEHICLES ──
-- (Separate from vehicles.stolen boolean — this captures full theft report)
create table if not exists public.stolen_vehicles (
  id              uuid primary key default uuid_generate_v4(),
  ref_number      text unique default gen_id('SVH-','seq_stolen_vehicle'),
  vehicle_id      uuid references public.vehicles on delete set null,
  plate           text not null,
  plate_number    text, -- alias used by code
  make            text,
  model           text,
  year            int,
  color           text,
  vin             text,
  owner_name      text,
  owner_phone     text,
  owner_nida      text,
  stolen_date     timestamptz,
  stolen_location text,
  location_text   text,
  description     text,
  photo_urls      jsonb default '[]',
  officer_id      uuid references public.profiles,
  station_id      uuid references public.stations,
  region_id       uuid references public.regions,
  district_id     uuid references public.districts,
  status          text default 'active' check (status in ('active','recovered','closed')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists idx_stolen_vehicles_status on public.stolen_vehicles(status);
create index if not exists idx_stolen_vehicles_plate  on public.stolen_vehicles(plate);

-- ══════════════════════════════════════════════════════════
-- PART 3: ALTER officer_locations → time-series
-- ══════════════════════════════════════════════════════════
-- Original schema had officer_id as PRIMARY KEY (1 row per officer = "latest").
-- useGPSTracker.js inserts a new row every 60s → fails on 2nd ping.
-- Convert to a proper time-series table with composite key.
do $$
begin
  -- Drop the PK constraint on officer_id if it exists
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'officer_locations'
      and constraint_type = 'PRIMARY KEY'
      and table_schema = 'public'
  ) then
    alter table public.officer_locations drop constraint officer_locations_pkey;
  end if;
end $$;

-- Add surrogate id PK if missing
alter table public.officer_locations
  add column if not exists id uuid default uuid_generate_v4();

-- Make id the primary key (idempotent: 'add constraint if not exists' isn't supported
-- for PKs in older PG, so we wrap in a check)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'officer_locations' and constraint_type = 'PRIMARY KEY'
  ) then
    alter table public.officer_locations add constraint officer_locations_pkey primary key (id);
  end if;
end $$;

-- Add the columns useGPSTracker writes
alter table public.officer_locations add column if not exists patrol_id   uuid references public.patrols on delete set null;
alter table public.officer_locations add column if not exists accuracy_m  double precision;
alter table public.officer_locations add column if not exists speed_kmh   double precision;
alter table public.officer_locations add column if not exists heading     double precision;
alter table public.officer_locations add column if not exists battery_pct int;
alter table public.officer_locations add column if not exists device_id   text;
alter table public.officer_locations add column if not exists recorded_at timestamptz default now();

-- Indexes for time-series queries
create index if not exists idx_officer_locations_officer_time on public.officer_locations(officer_id, recorded_at desc);
create index if not exists idx_officer_locations_patrol       on public.officer_locations(patrol_id);
create index if not exists idx_officer_locations_recorded     on public.officer_locations(recorded_at desc);

-- ══════════════════════════════════════════════════════════
-- PART 4: ALTER audit_logs → add columns written by src/lib/audit.js
-- ══════════════════════════════════════════════════════════
-- The DB trigger log_audit() writes the original columns (officer_id, badge,
-- rank, full_name, station_name, action, table_name, record_id, record_no,
-- old_data, new_data, lat, lng, device_id, ip_address).
-- The React logAction() writes the columns below. Both write paths coexist.
alter table public.audit_logs add column if not exists officer_name text;
alter table public.audit_logs add column if not exists officer_rank text;
alter table public.audit_logs add column if not exists officer_role text;
alter table public.audit_logs add column if not exists station_id   uuid;
alter table public.audit_logs add column if not exists entity_type  text;
alter table public.audit_logs add column if not exists entity_id    uuid;
alter table public.audit_logs add column if not exists entity_ref   text;
alter table public.audit_logs add column if not exists description  text;
alter table public.audit_logs add column if not exists metadata     jsonb default '{}';
alter table public.audit_logs add column if not exists gps_lat      double precision;
alter table public.audit_logs add column if not exists gps_lng      double precision;
alter table public.audit_logs add column if not exists user_agent   text;

create index if not exists idx_audit_entity    on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_officer2  on public.audit_logs(officer_id, created_at desc);

-- ══════════════════════════════════════════════════════════
-- PART 5: ALTER persons → add columns the React code expects
-- ══════════════════════════════════════════════════════════
alter table public.persons add column if not exists driver_license    text;
alter table public.persons add column if not exists passport_no       text;
alter table public.persons add column if not exists fingerprint_hash  text;
alter table public.persons add column if not exists face_hash         text;
alter table public.persons add column if not exists is_wanted         boolean default false;
alter table public.persons add column if not exists has_criminal_record boolean default false;
alter table public.persons add column if not exists occupation        text;
-- Backfill aliases from existing columns
update public.persons set driver_license = license_no where driver_license is null and license_no is not null;
update public.persons set passport_no    = passport   where passport_no    is null and passport   is not null;
update public.persons set is_wanted      = true       where is_wanted is null and watchlist = true;
create index if not exists idx_persons_driver_license on public.persons(driver_license);
create index if not exists idx_persons_is_wanted      on public.persons(is_wanted) where is_wanted = true;

-- ══════════════════════════════════════════════════════════
-- PART 6: ALTER vehicles → add plate_number alias
-- ══════════════════════════════════════════════════════════
alter table public.vehicles add column if not exists plate_number text;
update public.vehicles set plate_number = plate where plate_number is null;
create index if not exists idx_vehicles_plate_number on public.vehicles(plate_number);

-- ══════════════════════════════════════════════════════════
-- PART 7: ALTER alerts → add columns the React code expects
-- ══════════════════════════════════════════════════════════
alter table public.alerts add column if not exists body            text;
alter table public.alerts add column if not exists priority        text;
alter table public.alerts add column if not exists is_national     boolean default false;
alter table public.alerts add column if not exists issued_by       uuid references public.profiles;
alter table public.alerts add column if not exists target_region   text;
alter table public.alerts add column if not exists target_station  text;
alter table public.alerts add column if not exists acknowledged_by jsonb default '[]';
-- Backfill from old columns
update public.alerts set body       = message   where body       is null and message   is not null;
update public.alerts set priority   = type      where priority   is null and type      is not null;
update public.alerts set issued_by  = created_by where issued_by  is null and created_by is not null;
create index if not exists idx_alerts_priority on public.alerts(priority);
create index if not exists idx_alerts_issued   on public.alerts(issued_by);

-- ══════════════════════════════════════════════════════════
-- PART 8: ALTER messages → add columns the React code expects
-- ══════════════════════════════════════════════════════════
alter table public.messages add column if not exists sender_id     uuid references public.profiles on delete cascade;
alter table public.messages add column if not exists receiver_id   uuid references public.profiles on delete set null;
alter table public.messages add column if not exists body          text;
alter table public.messages add column if not exists subject       text;
alter table public.messages add column if not exists is_broadcast  boolean default false;
-- Backfill
update public.messages set sender_id   = from_id    where sender_id   is null;
update public.messages set receiver_id = to_id      where receiver_id is null;
update public.messages set body        = content    where body        is null and content is not null;
create index if not exists idx_messages_sender   on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);

-- ══════════════════════════════════════════════════════════
-- PART 9: VIEW — officer_latest_locations
-- ══════════════════════════════════════════════════════════
-- Used by CommandPatrolMap.jsx to render live officer markers.
-- Returns the most recent ping per officer with profile/station info.
create or replace view public.officer_latest_locations as
  select distinct on (ol.officer_id)
    ol.id, ol.officer_id, ol.patrol_id,
    ol.lat, ol.lng, ol.accuracy_m, ol.speed_kmh, ol.heading,
    ol.battery_pct, ol.device_id, ol.recorded_at, ol.status,
    p.full_name,                       -- used by CommandPatrolMap (o.full_name)
    p.full_name  as officer_name,      -- alias used by other pages
    p.badge, p.role, p.rank, p.photo_url,
    p.station_id,
    s.name       as station_name,
    s.lat        as station_lat,
    s.lng        as station_lng,
    r.name       as region_name,
    d.name       as district_name
  from public.officer_locations ol
  join public.profiles p  on p.id  = ol.officer_id
  left join public.stations  s on s.id  = p.station_id
  left join public.regions   r on r.id  = p.region_id
  left join public.districts d on d.id  = p.district_id
  order by ol.officer_id, ol.recorded_at desc;

comment on view public.officer_latest_locations is
  'Latest GPS ping per officer, used by CommandPatrolMap. Backed by officer_locations time-series table.';

-- ══════════════════════════════════════════════════════════
-- PART 10: ROW LEVEL SECURITY for new tables
-- ══════════════════════════════════════════════════════════
alter table public.requests             enable row level security;
alter table public.request_approvals    enable row level security;
alter table public.citation_requests    enable row level security;
alter table public.fine_schedule        enable row level security;
alter table public.payments             enable row level security;
alter table public.firearm_licenses     enable row level security;
alter table public.hearings             enable row level security;
alter table public.case_evidence        enable row level security;
alter table public.statements           enable row level security;
alter table public.suspects             enable row level security;
alter table public.stolen_property      enable row level security;
alter table public.stolen_vehicles      enable row level security;
-- officer_locations already had RLS; ensure it's still enabled
alter table public.officer_locations    enable row level security;

-- REQUESTS — requester sees own; approvers see incoming; nationals see all
drop policy if exists "req view own"        on public.requests;
drop policy if exists "req view approver"   on public.requests;
drop policy if exists "req view station"    on public.requests;
drop policy if exists "req view national"   on public.requests;
drop policy if exists "req create"          on public.requests;
drop policy if exists "req update"          on public.requests;
create policy "req view own"        on public.requests for select using (requested_by = auth.uid());
create policy "req view approver"   on public.requests for select using (current_approver = auth.uid());
create policy "req view station"    on public.requests for select using (
  station_id = my_station() and my_role() in ('ocs','ocd','rpc')
);
create policy "req view national"   on public.requests for select using (is_national());
create policy "req create"          on public.requests for insert with check (requested_by = auth.uid());
create policy "req update"          on public.requests for update using (
  requested_by = auth.uid() or current_approver = auth.uid() or is_national()
);

-- REQUEST_APPROVALS
drop policy if exists "ra view own"     on public.request_approvals;
drop policy if exists "ra view nat"     on public.request_approvals;
drop policy if exists "ra create"       on public.request_approvals;
create policy "ra view own" on public.request_approvals for select using (
  actor_id = auth.uid()
  or request_id in (select id from public.requests where requested_by = auth.uid())
  or is_national()
);
create policy "ra create"   on public.request_approvals for insert with check (actor_id = auth.uid());

-- CITATION_REQUESTS — requester + traffic officers + nationals
drop policy if exists "crq view"  on public.citation_requests;
drop policy if exists "crq create" on public.citation_requests;
drop policy if exists "crq update" on public.citation_requests;
create policy "crq view"   on public.citation_requests for select using (
  requester_id = auth.uid() or is_national() or my_role() = 'traffic_officer'
);
create policy "crq create" on public.citation_requests for insert with check (requester_id = auth.uid());
create policy "crq update" on public.citation_requests for update using (
  requester_id = auth.uid() or is_national() or my_role() = 'traffic_officer'
);

-- FINE_SCHEDULE — everyone reads; only admin/national writes
drop policy if exists "fs read"  on public.fine_schedule;
drop policy if exists "fs write" on public.fine_schedule;
create policy "fs read"  on public.fine_schedule for select using (true);
create policy "fs write" on public.fine_schedule for all using (
  is_national() or my_role() = 'admin_officer'
);

-- PAYMENTS
drop policy if exists "pay national" on public.payments;
drop policy if exists "pay station"  on public.payments;
drop policy if exists "pay create"   on public.payments;
create policy "pay national" on public.payments for select using (is_national());
create policy "pay station"  on public.payments for select using (station_id = my_station());
create policy "pay create"   on public.payments for insert with check (received_by = auth.uid());

-- FIREARM_LICENSES
drop policy if exists "fl national" on public.firearm_licenses;
drop policy if exists "fl station"  on public.firearm_licenses;
create policy "fl national" on public.firearm_licenses for select using (is_national());
create policy "fl station"  on public.firearm_licenses for select using (station_id = my_station());

-- HEARINGS / CASE_EVIDENCE / STATEMENTS — CID + command + nationals
drop policy if exists "hg view"   on public.hearings;
drop policy if exists "hg write"  on public.hearings;
create policy "hg view"   on public.hearings for select using (
  is_national() or my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp')
);
create policy "hg write"  on public.hearings for insert with check (
  is_national() or my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp')
);

drop policy if exists "ce view"  on public.case_evidence;
drop policy if exists "ce write" on public.case_evidence;
create policy "ce view"  on public.case_evidence for select using (
  is_national() or my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp')
);
create policy "ce write" on public.case_evidence for insert with check (
  is_national() or my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp')
);

drop policy if exists "stmt view"  on public.statements;
drop policy if exists "stmt write" on public.statements;
create policy "stmt view"  on public.statements for select using (
  is_national() or my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp')
);
create policy "stmt write" on public.statements for insert with check (taken_by = auth.uid());

-- SUSPECTS
drop policy if exists "sus national" on public.suspects;
drop policy if exists "sus cid"      on public.suspects;
drop policy if exists "sus create"   on public.suspects;
create policy "sus national" on public.suspects for select using (is_national());
create policy "sus cid"      on public.suspects for select using (
  my_role() in ('cid_officer','forensic_officer','inspector')
);
create policy "sus create"   on public.suspects for insert with check (added_by = auth.uid());

-- STOLEN_PROPERTY / STOLEN_VEHICLES — public read, officer write
drop policy if exists "sp read"  on public.stolen_property;
drop policy if exists "sp write" on public.stolen_property;
create policy "sp read"  on public.stolen_property for select using (true);
create policy "sp write" on public.stolen_property for all using (officer_id = auth.uid() or is_national());

drop policy if exists "sv read"  on public.stolen_vehicles;
drop policy if exists "sv write" on public.stolen_vehicles;
create policy "sv read"  on public.stolen_vehicles for select using (true);
create policy "sv write" on public.stolen_vehicles for all using (officer_id = auth.uid() or is_national());

-- OFFICER_LOCATIONS — own + national + command roles
drop policy if exists "ol own"     on public.officer_locations;
drop policy if exists "ol command" on public.officer_locations;
drop policy if exists "ol insert"  on public.officer_locations;
create policy "ol own"     on public.officer_locations for select using (officer_id = auth.uid());
create policy "ol command" on public.officer_locations for select using (
  is_national() or my_role() in ('rpc','ocd','ocs','igp','digp')
);
create policy "ol insert"  on public.officer_locations for insert with check (officer_id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- PART 11: AUDIT TRIGGERS for new tables
-- ══════════════════════════════════════════════════════════
-- Reuses the log_audit() function defined in 00001_full_schema.sql.
drop trigger if exists aud_requests          on public.requests;
drop trigger if exists aud_citation_requests on public.citation_requests;
drop trigger if exists aud_payments          on public.payments;
drop trigger if exists aud_firearm_licenses  on public.firearm_licenses;
drop trigger if exists aud_hearings          on public.hearings;
drop trigger if exists aud_case_evidence     on public.case_evidence;
drop trigger if exists aud_statements        on public.statements;
drop trigger if exists aud_suspects          on public.suspects;
drop trigger if exists aud_stolen_property   on public.stolen_property;
drop trigger if exists aud_stolen_vehicles   on public.stolen_vehicles;

create trigger aud_requests          after insert or update or delete on public.requests          for each row execute function log_audit();
create trigger aud_citation_requests after insert or update or delete on public.citation_requests for each row execute function log_audit();
create trigger aud_payments          after insert or update or delete on public.payments          for each row execute function log_audit();
create trigger aud_firearm_licenses  after insert or update or delete on public.firearm_licenses  for each row execute function log_audit();
create trigger aud_hearings          after insert or update or delete on public.hearings          for each row execute function log_audit();
create trigger aud_case_evidence     after insert or update or delete on public.case_evidence     for each row execute function log_audit();
create trigger aud_statements        after insert or update or delete on public.statements        for each row execute function log_audit();
create trigger aud_suspects          after insert or update or delete on public.suspects          for each row execute function log_audit();
create trigger aud_stolen_property   after insert or update or delete on public.stolen_property   for each row execute function log_audit();
create trigger aud_stolen_vehicles   after insert or update or delete on public.stolen_vehicles   for each row execute function log_audit();

-- ══════════════════════════════════════════════════════════
-- PART 12: SEED fine_schedule with common Tanzania traffic offenses
-- (Amounts per Tanzania Police / SUMATRA tariff as of 2024)
-- ══════════════════════════════════════════════════════════
insert into public.fine_schedule (code, offense_name, offense_name_sw, fine_amount, category, legal_reference, active)
values
  ('TRF-001','Failure to wear seat belt','Kutofunga mkanda wa tumbo',        30000,  'traffic','Road Traffic Act s.119',true),
  ('TRF-002','Using mobile phone while driving','Kutumia simu wakati unapoendesha gari',30000,'traffic','Road Traffic Act s.118',true),
  ('TRF-003','Overloading passengers','Kupakia abiria zaidi ya kiasi',       50000,  'traffic','Road Traffic Act s.78',true),
  ('TRF-004','Speeding beyond limit','Kuendesha kwa kasi kupita kiasi',      30000,  'traffic','Road Traffic Act s.113',true),
  ('TRF-005','Driving without valid license','Kuendesha bila leseni',        50000,  'traffic','Road Traffic Act s.34',true),
  ('TRF-006','Expired vehicle insurance','Bima ya gari iliyokwisha',         30000,  'traffic','Insurance Act s.5',true),
  ('TRF-007','Dangerous driving','Uendeshaaji hatari',                       100000, 'traffic','Road Traffic Act s.114',true),
  ('TRF-008','Driving under influence of alcohol','Kuendesha akiwa mleweni',300000, 'traffic','Road Traffic Act s.115',true),
  ('TRF-009','No vehicle registration','Gari lisilokuwa na usajili',         50000,  'traffic','Road Traffic Act s.12',true),
  ('TRF-010','Defective vehicle (lights/brakes)','Gari lenye kasoro',        30000,  'traffic','Road Traffic Act s.121',true),
  ('TRF-011','Failure to stop at red light','Kutoacha kwenye taa nyekundu',  50000,  'traffic','Road Traffic Act s.117',true),
  ('TRF-012','Wrongful overtaking','Kupita kwa njia isiyo halali',           50000,  'traffic','Road Traffic Act s.107',true),
  ('TRF-013','No helmet (motorcycle)','Kutovaa kofia ya pikipiki',           25000,  'traffic','Road Traffic Act s.123',true),
  ('TRF-014','Carrying passenger on motorcycle (pikipiki)','Kubeba abiria kwenye pikipiki',25000,'traffic','Road Traffic Act s.124',true),
  ('TRF-015','Invalid/obscured plate number','Nambari ya usajili isiyo wazi',30000,'traffic','Road Traffic Act s.13',true),
  ('TRF-016','Driving in wrong lane','Kuendesha kwenye njia isiyo sahihi',   30000,  'traffic','Road Traffic Act s.106',true),
  ('TRF-017','Excessive smoke/emissions','Moshi mwingi kutoka kwenye gari',  30000,  'traffic','Environmental Mgmt Act s.84',true),
  ('TRF-018','No reflective vest (night)','Kutovaa jaketi ya kuakisi mwanga',15000,'traffic','Road Traffic Act s.125',true),
  ('DOC-001','No driving permit','Bila ruhusa ya kuendesha',                 30000,  'document','Road Traffic Act s.35',true),
  ('DOC-002','Expired vehicle inspection','Ukaguzi wa gari uliokwisha',      50000,  'document','Road Traffic Act s.122',true)
on conflict (code) do nothing;

-- ══════════════════════════════════════════════════════════
-- DONE
-- ══════════════════════════════════════════════════════════
select 'TPDOP RUNTIME TABLES COMPLETE' as status,
       '12 new tables + 4 altered + 1 view + 20 fine_schedule seeds' as summary;
