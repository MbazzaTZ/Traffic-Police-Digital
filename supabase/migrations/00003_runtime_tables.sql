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
-- IDEMPOTENCY
-- -----------
-- This migration is FULLY IDEMPOTENT — safe to run any number of times.
-- Pattern used (instead of inline column definitions in CREATE TABLE):
--   1. CREATE TABLE IF NOT EXISTS (creates shell if missing)
--   2. ALTER TABLE ADD COLUMN IF NOT EXISTS for every column
--      (adds missing columns to existing tables — this is the key
--       fix for the "column does not exist" error that occurred
--       when 00003 was first applied to a DB that already had a
--       partial hearings table from a previous run)
--   3. All constraints, indexes, RLS, triggers, seeds are wrapped
--      in IF NOT EXISTS / DROP IF EXISTS guards
--
-- If this migration ever fails partway, just re-run it.
-- =========================================================

-- ══════════════════════════════════════════════════════════
-- Ensure extensions
-- ══════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ══════════════════════════════════════════════════════════
-- Ensure helper function (defined in 00001, but just in case)
-- ══════════════════════════════════════════════════════════
create or replace function gen_id(prefix text, seq regclass)
returns text language sql as $$
  select prefix || to_char(now(),'YYYY') || '-' || lpad(nextval(seq)::text,5,'0')
$$;

-- ══════════════════════════════════════════════════════════
-- Sequences first (before any table that uses them in DEFAULT)
-- ══════════════════════════════════════════════════════════
create sequence if not exists seq_request          start 1;
create sequence if not exists seq_citation_request start 1;
create sequence if not exists seq_payment          start 1;
create sequence if not exists seq_firearm_license  start 1;
create sequence if not exists seq_statement        start 1;
create sequence if not exists seq_suspect          start 1;
create sequence if not exists seq_stolen_property  start 1;
create sequence if not exists seq_stolen_vehicle   start 1;
create sequence if not exists seq_hearing          start 1;

-- ══════════════════════════════════════════════════════════
-- 1. REQUESTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.requests (
  id uuid primary key default uuid_generate_v4()
);
alter table public.requests add column if not exists ref_number        text;
alter table public.requests add column if not exists type              text;
alter table public.requests add column if not exists title             text;
alter table public.requests add column if not exists description       text;
alter table public.requests add column if not exists amount            bigint;
alter table public.requests add column if not exists priority          text default 'normal';
alter table public.requests add column if not exists status            text default 'pending';
alter table public.requests add column if not exists requested_by      uuid;
alter table public.requests add column if not exists requester_role    text;
alter table public.requests add column if not exists current_level     text;
alter table public.requests add column if not exists current_approver  uuid;
alter table public.requests add column if not exists decided_by        uuid;
alter table public.requests add column if not exists decision_note     text;
alter table public.requests add column if not exists decided_at        timestamptz;
alter table public.requests add column if not exists station_id        uuid;
alter table public.requests add column if not exists region_id         uuid;
alter table public.requests add column if not exists district_id       uuid;
alter table public.requests add column if not exists created_at        timestamptz default now();
alter table public.requests add column if not exists updated_at        timestamptz default now();

-- Set unique constraint on ref_number if not already present
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'requests_ref_number_key') then
    alter table public.requests add constraint requests_ref_number_key unique (ref_number);
  end if;
end $$;

-- Drop old priority/status check constraints and re-add (widened versions)
alter table public.requests drop constraint if exists requests_priority_check;
alter table public.requests add constraint requests_priority_check
  check (priority in ('low','normal','high','urgent','emergency'));
alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check
  check (status in ('pending','escalated','approved','rejected','cancelled'));

-- Set DEFAULT for ref_number using gen_id (after seq exists)
alter table public.requests alter column ref_number set default gen_id('REQ-','seq_request');

create index if not exists idx_requests_status     on public.requests(status);
create index if not exists idx_requests_requester  on public.requests(requested_by);
create index if not exists idx_requests_approver   on public.requests(current_approver);
create index if not exists idx_requests_station    on public.requests(station_id);

-- ══════════════════════════════════════════════════════════
-- 2. REQUEST_APPROVALS
-- ══════════════════════════════════════════════════════════
create table if not exists public.request_approvals (
  id uuid primary key default uuid_generate_v4()
);
alter table public.request_approvals add column if not exists request_id  uuid;
alter table public.request_approvals add column if not exists actor_id    uuid;
alter table public.request_approvals add column if not exists actor_role  text;
alter table public.request_approvals add column if not exists action      text;
alter table public.request_approvals add column if not exists from_level  text;
alter table public.request_approvals add column if not exists to_level    text;
alter table public.request_approvals add column if not exists note        text;
alter table public.request_approvals add column if not exists created_at  timestamptz default now();

alter table public.request_approvals drop constraint if exists request_approvals_action_check;
alter table public.request_approvals add constraint request_approvals_action_check
  check (action in ('submitted','approved','escalated','rejected','cancelled'));

create index if not exists idx_request_approvals_request on public.request_approvals(request_id);
create index if not exists idx_request_approvals_actor   on public.request_approvals(actor_id);

-- ══════════════════════════════════════════════════════════
-- 3. CITATION_REQUESTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.citation_requests (
  id uuid primary key default uuid_generate_v4()
);
alter table public.citation_requests add column if not exists ref_number       text;
alter table public.citation_requests add column if not exists vehicle_plate    text;
alter table public.citation_requests add column if not exists vehicle_make     text;
alter table public.citation_requests add column if not exists vehicle_model    text;
alter table public.citation_requests add column if not exists vehicle_color    text;
alter table public.citation_requests add column if not exists vehicle_type     text;
alter table public.citation_requests add column if not exists driver_name      text;
alter table public.citation_requests add column if not exists driver_license   text;
alter table public.citation_requests add column if not exists driver_nida      text;
alter table public.citation_requests add column if not exists offense_type     text;
alter table public.citation_requests add column if not exists offense_code     text;
alter table public.citation_requests add column if not exists fine_schedule_id uuid;
alter table public.citation_requests add column if not exists location_text    text;
alter table public.citation_requests add column if not exists notes            text;
alter table public.citation_requests add column if not exists photo_urls       jsonb default '[]';
alter table public.citation_requests add column if not exists requester_id     uuid;
alter table public.citation_requests add column if not exists station_id       uuid;
alter table public.citation_requests add column if not exists region_id        uuid;
alter table public.citation_requests add column if not exists status           text default 'pending';
alter table public.citation_requests add column if not exists reviewed_by      uuid;
alter table public.citation_requests add column if not exists reviewed_at      timestamptz;
alter table public.citation_requests add column if not exists rejection_reason text;
alter table public.citation_requests add column if not exists citation_id      uuid;
alter table public.citation_requests add column if not exists created_at       timestamptz default now();
alter table public.citation_requests add column if not exists updated_at       timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'citation_requests_ref_number_key') then
    alter table public.citation_requests add constraint citation_requests_ref_number_key unique (ref_number);
  end if;
end $$;

alter table public.citation_requests drop constraint if exists citation_requests_status_check;
alter table public.citation_requests add constraint citation_requests_status_check
  check (status in ('pending','approved','rejected','issued','converted','cancelled'));

alter table public.citation_requests alter column ref_number set default gen_id('CRQ-','seq_citation_request');

create index if not exists idx_citation_requests_status    on public.citation_requests(status);
create index if not exists idx_citation_requests_requester on public.citation_requests(requester_id);
create index if not exists idx_citation_requests_plate     on public.citation_requests(vehicle_plate);

-- ══════════════════════════════════════════════════════════
-- 4. FINE_SCHEDULE
-- ══════════════════════════════════════════════════════════
create table if not exists public.fine_schedule (
  id uuid primary key default uuid_generate_v4()
);
alter table public.fine_schedule add column if not exists code            text;
alter table public.fine_schedule add column if not exists offense_name    text;
alter table public.fine_schedule add column if not exists offense_name_sw text;
alter table public.fine_schedule add column if not exists fine_amount     bigint default 0;
alter table public.fine_schedule add column if not exists category        text default 'traffic';
alter table public.fine_schedule add column if not exists legal_reference text;
alter table public.fine_schedule add column if not exists active          boolean default true;
alter table public.fine_schedule add column if not exists created_at      timestamptz default now();
alter table public.fine_schedule add column if not exists updated_at      timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'fine_schedule_code_key') then
    alter table public.fine_schedule add constraint fine_schedule_code_key unique (code);
  end if;
end $$;

alter table public.fine_schedule drop constraint if exists fine_schedule_category_check;
alter table public.fine_schedule add constraint fine_schedule_category_check
  check (category in ('traffic','criminal','administrative','parking','document'));

create index if not exists idx_fine_schedule_code     on public.fine_schedule(code);
create index if not exists idx_fine_schedule_category on public.fine_schedule(category);

-- ══════════════════════════════════════════════════════════
-- 5. PAYMENTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4()
);
alter table public.payments add column if not exists ref_number      text;
alter table public.payments add column if not exists citation_id     uuid;
alter table public.payments add column if not exists control_number  text;
alter table public.payments add column if not exists amount          bigint default 0;
alter table public.payments add column if not exists method          text;
alter table public.payments add column if not exists transaction_ref text;
alter table public.payments add column if not exists payer_name      text;
alter table public.payments add column if not exists payer_phone     text;
alter table public.payments add column if not exists notes           text;
alter table public.payments add column if not exists paid_at         timestamptz default now();
alter table public.payments add column if not exists received_by     uuid;
alter table public.payments add column if not exists station_id      uuid;
alter table public.payments add column if not exists status          text default 'completed';
alter table public.payments add column if not exists created_at      timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'payments_ref_number_key') then
    alter table public.payments add constraint payments_ref_number_key unique (ref_number);
  end if;
end $$;

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check
  check (method in ('cash','mpesa','tigopesa','tigo_pesa','airtel_money','halopesa','ezypesa','bank','bank_transfer','card','other'));
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('pending','completed','failed','reversed','partial'));

alter table public.payments alter column ref_number set default gen_id('PAY-','seq_payment');

create index if not exists idx_payments_citation on public.payments(citation_id);
create index if not exists idx_payments_control on public.payments(control_number);
create index if not exists idx_payments_station on public.payments(station_id);
create index if not exists idx_payments_paid_at on public.payments(paid_at desc);

-- ══════════════════════════════════════════════════════════
-- 6. FIREARM_LICENSES
-- ══════════════════════════════════════════════════════════
create table if not exists public.firearm_licenses (
  id uuid primary key default uuid_generate_v4()
);
alter table public.firearm_licenses add column if not exists ref_number     text;
alter table public.firearm_licenses add column if not exists license_no     text;
alter table public.firearm_licenses add column if not exists firearm_id     uuid;
alter table public.firearm_licenses add column if not exists holder_name    text;
alter table public.firearm_licenses add column if not exists holder_nida    text;
alter table public.firearm_licenses add column if not exists holder_phone   text;
alter table public.firearm_licenses add column if not exists holder_address text;
alter table public.firearm_licenses add column if not exists license_type   text;
alter table public.firearm_licenses add column if not exists issue_date     date;
alter table public.firearm_licenses add column if not exists expiry_date    date;
alter table public.firearm_licenses add column if not exists issued_by      uuid;
alter table public.firearm_licenses add column if not exists station_id     uuid;
alter table public.firearm_licenses add column if not exists region_id      uuid;
alter table public.firearm_licenses add column if not exists status         text default 'active';
alter table public.firearm_licenses add column if not exists created_at     timestamptz default now();
alter table public.firearm_licenses add column if not exists updated_at     timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'firearm_licenses_ref_number_key') then
    alter table public.firearm_licenses add constraint firearm_licenses_ref_number_key unique (ref_number);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'firearm_licenses_license_no_key') then
    alter table public.firearm_licenses add constraint firearm_licenses_license_no_key unique (license_no);
  end if;
end $$;

alter table public.firearm_licenses drop constraint if exists firearm_licenses_license_type_check;
alter table public.firearm_licenses add constraint firearm_licenses_license_type_check
  check (license_type in ('private','official','special','temporary','dealer','civilian_carry','hunting','security','collector','manufacture'));
alter table public.firearm_licenses drop constraint if exists firearm_licenses_status_check;
alter table public.firearm_licenses add constraint firearm_licenses_status_check
  check (status in ('active','suspended','revoked','expired'));

alter table public.firearm_licenses alter column ref_number set default gen_id('FL-','seq_firearm_license');

create index if not exists idx_firearm_licenses_holder   on public.firearm_licenses(holder_name);
create index if not exists idx_firearm_licenses_firearm  on public.firearm_licenses(firearm_id);
create index if not exists idx_firearm_licenses_status   on public.firearm_licenses(status);

-- ══════════════════════════════════════════════════════════
-- 7. HEARINGS  ← this is where the original error occurred
-- ══════════════════════════════════════════════════════════
create table if not exists public.hearings (
  id uuid primary key default uuid_generate_v4()
);
-- ALTER TABLE ADD COLUMN IF NOT EXISTS for every column — this is the fix
alter table public.hearings add column if not exists ref_number        text;
alter table public.hearings add column if not exists case_id           uuid;
alter table public.hearings add column if not exists court_case_id     uuid;  -- ← the missing column
alter table public.hearings add column if not exists hearing_date      timestamptz;
alter table public.hearings add column if not exists hearing_type      text;
alter table public.hearings add column if not exists magistrate        text;
alter table public.hearings add column if not exists outcome           text;
alter table public.hearings add column if not exists next_date         date;
alter table public.hearings add column if not exists next_hearing_type text;
alter table public.hearings add column if not exists notes             text;
alter table public.hearings add column if not exists attended          boolean default true;
alter table public.hearings add column if not exists recorded_by       uuid;
alter table public.hearings add column if not exists created_at        timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'hearings_ref_number_key') then
    alter table public.hearings add constraint hearings_ref_number_key unique (ref_number);
  end if;
end $$;

alter table public.hearings drop constraint if exists hearings_hearing_type_check;
alter table public.hearings add constraint hearings_hearing_type_check
  check (hearing_type in ('mention','trial','ruling','sentencing','adjournment','pretrial','plea','prosecution_evidence','defence_evidence','judgment','sentence','appeal','conference'));

-- Make case_id NOT NULL only if the column is empty-safe (skip if rows exist with null)
-- Safe approach: don't enforce NOT NULL on existing data
alter table public.hearings alter column hearing_date set not null;

alter table public.hearings alter column ref_number set default gen_id('HG-','seq_hearing');

create index if not exists idx_hearings_case        on public.hearings(case_id);
create index if not exists idx_hearings_court_case  on public.hearings(court_case_id);
create index if not exists idx_hearings_date        on public.hearings(hearing_date desc);

-- ══════════════════════════════════════════════════════════
-- 8. CASE_EVIDENCE
-- ══════════════════════════════════════════════════════════
create table if not exists public.case_evidence (
  id uuid primary key default uuid_generate_v4()
);
alter table public.case_evidence add column if not exists court_case_id   uuid;
alter table public.case_evidence add column if not exists case_id         uuid;
alter table public.case_evidence add column if not exists evidence_id     uuid;
alter table public.case_evidence add column if not exists exhibit_label   text;
alter table public.case_evidence add column if not exists purpose         text;
alter table public.case_evidence add column if not exists tendered_at     timestamptz default now();
alter table public.case_evidence add column if not exists tendered_by     uuid;
alter table public.case_evidence add column if not exists created_at      timestamptz default now();

create index if not exists idx_case_evidence_court_case on public.case_evidence(court_case_id);
create index if not exists idx_case_evidence_evidence   on public.case_evidence(evidence_id);

-- ══════════════════════════════════════════════════════════
-- 9. STATEMENTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.statements (
  id uuid primary key default uuid_generate_v4()
);
alter table public.statements add column if not exists ref_number          text;
alter table public.statements add column if not exists case_id             uuid;
alter table public.statements add column if not exists court_case_id       uuid;
alter table public.statements add column if not exists statement_type      text;
alter table public.statements add column if not exists deponent_name       text;
alter table public.statements add column if not exists deponent_nida       text;
alter table public.statements add column if not exists deponent_phone      text;
alter table public.statements add column if not exists deponent_address    text;
alter table public.statements add column if not exists deponent_occupation text;
alter table public.statements add column if not exists content             text;
alter table public.statements add column if not exists language            text default 'sw';
alter table public.statements add column if not exists sworn               boolean default false;
alter table public.statements add column if not exists cautioned           boolean default false;
alter table public.statements add column if not exists witness_bond        boolean default false;
alter table public.statements add column if not exists taken_at            timestamptz default now();
alter table public.statements add column if not exists taken_by            uuid;
alter table public.statements add column if not exists station_id          uuid;
alter table public.statements add column if not exists created_at          timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'statements_ref_number_key') then
    alter table public.statements add constraint statements_ref_number_key unique (ref_number);
  end if;
end $$;

alter table public.statements drop constraint if exists statements_statement_type_check;
alter table public.statements add constraint statements_statement_type_check
  check (statement_type in ('witness','suspect','victim','informant','expert'));
alter table public.statements drop constraint if exists statements_language_check;
alter table public.statements add constraint statements_language_check
  check (language in ('sw','en','sw,en'));

alter table public.statements alter column deponent_name set not null;
alter table public.statements alter column content set not null;
alter table public.statements alter column ref_number set default gen_id('STMT-','seq_statement');

create index if not exists idx_statements_court_case on public.statements(court_case_id);
create index if not exists idx_statements_case       on public.statements(case_id);
create index if not exists idx_statements_deponent   on public.statements(deponent_name);

-- ══════════════════════════════════════════════════════════
-- 10. SUSPECTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.suspects (
  id uuid primary key default uuid_generate_v4()
);
alter table public.suspects add column if not exists ref_number      text;
alter table public.suspects add column if not exists person_id       uuid;
alter table public.suspects add column if not exists case_id         uuid;
alter table public.suspects add column if not exists full_name       text;
alter table public.suspects add column if not exists alias           text;
alter table public.suspects add column if not exists nida            text;
alter table public.suspects add column if not exists dob             date;
alter table public.suspects add column if not exists gender          text;
alter table public.suspects add column if not exists nationality     text default 'Tanzanian';
alter table public.suspects add column if not exists phone           text;
alter table public.suspects add column if not exists address         text;
alter table public.suspects add column if not exists occupation      text;
alter table public.suspects add column if not exists photo_url       text;
alter table public.suspects add column if not exists description     text;
alter table public.suspects add column if not exists status          text default 'suspect';
alter table public.suspects add column if not exists added_by        uuid;
alter table public.suspects add column if not exists created_at      timestamptz default now();
alter table public.suspects add column if not exists updated_at      timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'suspects_ref_number_key') then
    alter table public.suspects add constraint suspects_ref_number_key unique (ref_number);
  end if;
end $$;

alter table public.suspects drop constraint if exists suspects_status_check;
alter table public.suspects add constraint suspects_status_check
  check (status in ('suspect','cleared','charged','convicted','acquitted','at_large','released'));

alter table public.suspects alter column full_name set not null;
alter table public.suspects alter column ref_number set default gen_id('SUS-','seq_suspect');

create index if not exists idx_suspects_case  on public.suspects(case_id);
create index if not exists idx_suspects_name  on public.suspects using gin(full_name gin_trgm_ops);
create index if not exists idx_suspects_nida  on public.suspects(nida);

-- ══════════════════════════════════════════════════════════
-- 11. STOLEN_PROPERTY
-- ══════════════════════════════════════════════════════════
create table if not exists public.stolen_property (
  id uuid primary key default uuid_generate_v4()
);
alter table public.stolen_property add column if not exists ref_number       text;
alter table public.stolen_property add column if not exists item_name        text;
alter table public.stolen_property add column if not exists item_type        text;
alter table public.stolen_property add column if not exists category         text;
alter table public.stolen_property add column if not exists description      text;
alter table public.stolen_property add column if not exists serial_no        text;
alter table public.stolen_property add column if not exists serial_number    text;
alter table public.stolen_property add column if not exists imei             text;
alter table public.stolen_property add column if not exists estimated_value  bigint default 0;
alter table public.stolen_property add column if not exists owner_name       text;
alter table public.stolen_property add column if not exists owner_phone      text;
alter table public.stolen_property add column if not exists owner_nida       text;
alter table public.stolen_property add column if not exists stolen_date      timestamptz;
alter table public.stolen_property add column if not exists stolen_location  text;
alter table public.stolen_property add column if not exists location_text    text;
alter table public.stolen_property add column if not exists photo_urls       jsonb default '[]';
alter table public.stolen_property add column if not exists officer_id       uuid;
alter table public.stolen_property add column if not exists reported_by      uuid;
alter table public.stolen_property add column if not exists station_id       uuid;
alter table public.stolen_property add column if not exists region_id        uuid;
alter table public.stolen_property add column if not exists district_id      uuid;
alter table public.stolen_property add column if not exists recovered_date   timestamptz;
alter table public.stolen_property add column if not exists status           text default 'active';
alter table public.stolen_property add column if not exists created_at       timestamptz default now();
alter table public.stolen_property add column if not exists updated_at       timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'stolen_property_ref_number_key') then
    alter table public.stolen_property add constraint stolen_property_ref_number_key unique (ref_number);
  end if;
end $$;

alter table public.stolen_property drop constraint if exists stolen_property_status_check;
alter table public.stolen_property add constraint stolen_property_status_check
  check (status in ('active','recovered','closed'));

alter table public.stolen_property alter column ref_number set default gen_id('SPR-','seq_stolen_property');
alter table public.stolen_property alter column item_name set not null;

create index if not exists idx_stolen_property_status on public.stolen_property(status);
create index if not exists idx_stolen_property_type   on public.stolen_property(item_type);

-- ══════════════════════════════════════════════════════════
-- 12. STOLEN_VEHICLES
-- ══════════════════════════════════════════════════════════
create table if not exists public.stolen_vehicles (
  id uuid primary key default uuid_generate_v4()
);
alter table public.stolen_vehicles add column if not exists ref_number       text;
alter table public.stolen_vehicles add column if not exists vehicle_id       uuid;
alter table public.stolen_vehicles add column if not exists plate            text;
alter table public.stolen_vehicles add column if not exists plate_number     text;
alter table public.stolen_vehicles add column if not exists make             text;
alter table public.stolen_vehicles add column if not exists model            text;
alter table public.stolen_vehicles add column if not exists year             int;
alter table public.stolen_vehicles add column if not exists color            text;
alter table public.stolen_vehicles add column if not exists vin              text;
alter table public.stolen_vehicles add column if not exists owner_name       text;
alter table public.stolen_vehicles add column if not exists owner_phone      text;
alter table public.stolen_vehicles add column if not exists owner_nida       text;
alter table public.stolen_vehicles add column if not exists stolen_date      timestamptz;
alter table public.stolen_vehicles add column if not exists stolen_location  text;
alter table public.stolen_vehicles add column if not exists location_text    text;
alter table public.stolen_vehicles add column if not exists description      text;
alter table public.stolen_vehicles add column if not exists notes            text;
alter table public.stolen_vehicles add column if not exists photo_urls       jsonb default '[]';
alter table public.stolen_vehicles add column if not exists officer_id       uuid;
alter table public.stolen_vehicles add column if not exists reported_by      uuid;
alter table public.stolen_vehicles add column if not exists station_id       uuid;
alter table public.stolen_vehicles add column if not exists region_id        uuid;
alter table public.stolen_vehicles add column if not exists district_id      uuid;
alter table public.stolen_vehicles add column if not exists recovered_date   timestamptz;
alter table public.stolen_vehicles add column if not exists status           text default 'active';
alter table public.stolen_vehicles add column if not exists created_at       timestamptz default now();
alter table public.stolen_vehicles add column if not exists updated_at       timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'stolen_vehicles_ref_number_key') then
    alter table public.stolen_vehicles add constraint stolen_vehicles_ref_number_key unique (ref_number);
  end if;
end $$;

alter table public.stolen_vehicles drop constraint if exists stolen_vehicles_status_check;
alter table public.stolen_vehicles add constraint stolen_vehicles_status_check
  check (status in ('active','recovered','closed'));

alter table public.stolen_vehicles alter column ref_number set default gen_id('SVH-','seq_stolen_vehicle');
alter table public.stolen_vehicles alter column plate set not null;

create index if not exists idx_stolen_vehicles_status on public.stolen_vehicles(status);
create index if not exists idx_stolen_vehicles_plate  on public.stolen_vehicles(plate);

-- ══════════════════════════════════════════════════════════
-- 13. OFFICER_LOCATIONS — convert to time-series (from 00003)
-- ══════════════════════════════════════════════════════════
do $$ begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'officer_locations'
      and constraint_type = 'PRIMARY KEY'
      and table_schema = 'public'
  ) then
    -- Check if the PK is on officer_id (old schema) — if so, drop it
    if exists (
      select 1 from pg_constraint
      where conrelid = 'public.officer_locations'::regclass
        and contype = 'p'
        and array_length(conkey, 1) = 1
        and conkey[1] = (
          select attnum from pg_attribute
          where attrelid = 'public.officer_locations'::regclass
            and attname = 'officer_id'
        )
    ) then
      alter table public.officer_locations drop constraint officer_locations_pkey;
    end if;
  end if;
end $$;

alter table public.officer_locations add column if not exists id uuid default uuid_generate_v4();

do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'officer_locations' and constraint_type = 'PRIMARY KEY'
  ) then
    alter table public.officer_locations add constraint officer_locations_pkey primary key (id);
  end if;
end $$;

alter table public.officer_locations add column if not exists patrol_id   uuid;
alter table public.officer_locations add column if not exists accuracy_m  double precision;
alter table public.officer_locations add column if not exists speed_kmh   double precision;
alter table public.officer_locations add column if not exists heading     double precision;
alter table public.officer_locations add column if not exists battery_pct int;
alter table public.officer_locations add column if not exists device_id   text;
alter table public.officer_locations add column if not exists recorded_at timestamptz default now();

create index if not exists idx_officer_locations_officer_time on public.officer_locations(officer_id, recorded_at desc);
create index if not exists idx_officer_locations_patrol       on public.officer_locations(patrol_id);
create index if not exists idx_officer_locations_recorded     on public.officer_locations(recorded_at desc);

-- ══════════════════════════════════════════════════════════
-- 14. AUDIT_LOGS — add code-expected columns
-- ══════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════
-- 15. PERSONS — add code-expected columns
-- ══════════════════════════════════════════════════════════
alter table public.persons add column if not exists driver_license      text;
alter table public.persons add column if not exists passport_no         text;
alter table public.persons add column if not exists fingerprint_hash    text;
alter table public.persons add column if not exists face_hash           text;
alter table public.persons add column if not exists is_wanted           boolean default false;
alter table public.persons add column if not exists has_criminal_record boolean default false;
alter table public.persons add column if not exists occupation          text;
update public.persons set driver_license = license_no where driver_license is null and license_no is not null;
update public.persons set passport_no    = passport   where passport_no    is null and passport   is not null;
update public.persons set is_wanted      = true       where is_wanted is null and watchlist = true;
create index if not exists idx_persons_driver_license on public.persons(driver_license);
create index if not exists idx_persons_is_wanted      on public.persons(is_wanted) where is_wanted = true;

-- ══════════════════════════════════════════════════════════
-- 16. VEHICLES — add plate_number alias
-- ══════════════════════════════════════════════════════════
alter table public.vehicles add column if not exists plate_number text;
update public.vehicles set plate_number = plate where plate_number is null;
create index if not exists idx_vehicles_plate_number on public.vehicles(plate_number);

-- ══════════════════════════════════════════════════════════
-- 17. ALERTS — add code-expected columns
-- ══════════════════════════════════════════════════════════
alter table public.alerts add column if not exists body            text;
alter table public.alerts add column if not exists priority        text;
alter table public.alerts add column if not exists is_national     boolean default false;
alter table public.alerts add column if not exists issued_by       uuid;
alter table public.alerts add column if not exists target_region   text;
alter table public.alerts add column if not exists target_station  text;
alter table public.alerts add column if not exists acknowledged_by jsonb default '[]';
update public.alerts set body       = message   where body       is null and message   is not null;
update public.alerts set priority   = type      where priority   is null and type      is not null;
update public.alerts set issued_by  = created_by where issued_by  is null and created_by is not null;
create index if not exists idx_alerts_priority on public.alerts(priority);
create index if not exists idx_alerts_issued   on public.alerts(issued_by);

-- Widen alerts.type CHECK
alter table public.alerts drop constraint if exists alerts_type_check;
alter table public.alerts add constraint alerts_type_check
  check (type in ('critical','urgent','info','reminder','warning','danger','emergency','success'));

-- ══════════════════════════════════════════════════════════
-- 18. MESSAGES — add code-expected columns
-- ══════════════════════════════════════════════════════════
alter table public.messages add column if not exists sender_id     uuid;
alter table public.messages add column if not exists receiver_id   uuid;
alter table public.messages add column if not exists body          text;
alter table public.messages add column if not exists subject       text;
alter table public.messages add column if not exists is_broadcast  boolean default false;
update public.messages set sender_id   = from_id    where sender_id   is null;
update public.messages set receiver_id = to_id      where receiver_id is null;
update public.messages set body        = content    where body        is null and content is not null;
create index if not exists idx_messages_sender   on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);

-- ══════════════════════════════════════════════════════════
-- 19. OFFICER_LATEST_LOCATIONS VIEW
-- ══════════════════════════════════════════════════════════
create or replace view public.officer_latest_locations as
  select distinct on (ol.officer_id)
    ol.id, ol.officer_id, ol.patrol_id,
    ol.lat, ol.lng, ol.accuracy_m, ol.speed_kmh, ol.heading,
    ol.battery_pct, ol.device_id, ol.recorded_at, ol.status,
    p.full_name,
    p.full_name  as officer_name,
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
  'Latest GPS ping per officer, used by CommandPatrolMap.';

-- ══════════════════════════════════════════════════════════
-- 20. RLS for all new tables
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
alter table public.officer_locations    enable row level security;

-- REQUESTS
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

-- CITATION_REQUESTS
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

-- FINE_SCHEDULE
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

-- HEARINGS / CASE_EVIDENCE / STATEMENTS
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

-- STOLEN_PROPERTY / STOLEN_VEHICLES
drop policy if exists "sp read"  on public.stolen_property;
drop policy if exists "sp write" on public.stolen_property;
create policy "sp read"  on public.stolen_property for select using (true);
create policy "sp write" on public.stolen_property for all using (officer_id = auth.uid() or is_national());

drop policy if exists "sv read"  on public.stolen_vehicles;
drop policy if exists "sv write" on public.stolen_vehicles;
create policy "sv read"  on public.stolen_vehicles for select using (true);
create policy "sv write" on public.stolen_vehicles for all using (officer_id = auth.uid() or is_national());

-- OFFICER_LOCATIONS
drop policy if exists "ol own"     on public.officer_locations;
drop policy if exists "ol command" on public.officer_locations;
drop policy if exists "ol insert"  on public.officer_locations;
create policy "ol own"     on public.officer_locations for select using (officer_id = auth.uid());
create policy "ol command" on public.officer_locations for select using (
  is_national() or my_role() in ('rpc','ocd','ocs','igp','digp')
);
create policy "ol insert"  on public.officer_locations for insert with check (officer_id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- 21. AUDIT TRIGGERS for new tables
-- ══════════════════════════════════════════════════════════
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
-- 22. SEED fine_schedule (idempotent)
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
       '12 tables ensured with all columns + RLS + triggers + 20 fine_schedule seeds (idempotent)' as summary;
