-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  TPDOP – CONSOLIDATED MIGRATION (all 5 migrations in one file)   ║
-- ║  Run this ONCE in Supabase SQL Editor after 00001 + 00002.       ║
-- ╚══════════════════════════════════════════════════════════════════╝
--
-- This file combines (in order):
--   00003_runtime_tables.sql     — 12 new tables + ALTERs + RLS + triggers
--   00004_column_align.sql       — align existing table columns with code
--   00005_checkpoints_extend.sql — counter columns on checkpoints/roadblocks
--   00006_final_align.sql        — widen CHECKs + alias columns + sync triggers
--   00007_system_settings.sql    — system_settings table for AdminSettingsPage
--
-- FULLY IDEMPOTENT — safe to run any number of times. If it fails
-- partway, fix the error and re-run the whole thing; every statement
-- uses IF NOT EXISTS / DROP IF EXISTS guards.
--
-- Apply order:
--   1. 00001_full_schema.sql      (already applied — the base schema)
--   2. 00002_wards.sql            (already applied — wards table)
--   3. THIS FILE                  (consolidated 00003-00007)
--
-- Expected final output:
--   TPDOP RUNTIME TABLES COMPLETE
--   TPDOP COLUMN ALIGN COMPLETE
--   TPDOP CHECKPOINTS EXTENDED
--   TPDOP FINAL ALIGN COMPLETE
--   TPDOP SYSTEM SETTINGS COMPLETE
--
-- ════════════════════════════════════════════════════════════════════



-- ════════════════════════════════════════════════════════════════════
-- SECTION 3: 00003_runtime_tables.sql
-- ════════════════════════════════════════════════════════════════════

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




-- ════════════════════════════════════════════════════════════════════
-- SECTION 4: 00004_column_align.sql
-- ════════════════════════════════════════════════════════════════════

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




-- ════════════════════════════════════════════════════════════════════
-- SECTION 5: 00005_checkpoints_extend.sql
-- ════════════════════════════════════════════════════════════════════

-- =========================================================
-- TPDOP – Checkpoints & Roadblocks Counters Migration
-- =========================================================
-- Extends the existing checkpoints + roadblocks tables with
-- the counter columns the rewritten CheckpointsPage writes:
--   - passed_count: total vehicles that drove through
--   - checked_count: vehicles actually inspected
--   - cited_count: citations issued during the session
--   - arrested_count: arrests made during the session
--
-- The original schema had only `checks_count` (int) and (on
-- roadblocks) `arrests_count`. We keep those for backwards
-- compatibility and add the more granular counters.
--
-- Also adds a checkpoint_sessions alias columns (officer_name,
-- station_name) that the page's history table reads.
-- =========================================================

alter table public.checkpoints add column if not exists passed_count   int default 0;
alter table public.checkpoints add column if not exists checked_count  int default 0;
alter table public.checkpoints add column if not exists cited_count    int default 0;
alter table public.checkpoints add column if not exists arrested_count int default 0;
alter table public.checkpoints add column if not exists region_id      uuid references public.regions;
alter table public.checkpoints add column if not exists district_id    uuid references public.districts;
alter table public.checkpoints add column if not exists ward_id        uuid references public.wards;
alter table public.checkpoints add column if not exists officer_name   text;
alter table public.checkpoints add column if not exists station_name   text;
alter table public.checkpoints add column if not exists notes          text;

-- Relax status check (code uses 'active','completed','cancelled')
alter table public.checkpoints drop constraint if exists checkpoints_status_check;
alter table public.checkpoints add constraint checkpoints_status_check
  check (status in ('active','completed','cancelled','aborted','paused'));

create index if not exists idx_checkpoints_officer on public.checkpoints(officer_id);
create index if not exists idx_checkpoints_station on public.checkpoints(station_id);
create index if not exists idx_checkpoints_status  on public.checkpoints(status);

-- Same for roadblocks (already had arrests_count, just add the others)
alter table public.roadblocks add column if not exists passed_count   int default 0;
alter table public.roadblocks add column if not exists checked_count  int default 0;
alter table public.roadblocks add column if not exists cited_count    int default 0;
-- arrests_count already exists on roadblocks
alter table public.roadblocks add column if not exists region_id      uuid references public.regions;
alter table public.roadblocks add column if not exists district_id    uuid references public.districts;
alter table public.roadblocks add column if not exists ward_id        uuid references public.wards;
alter table public.roadblocks add column if not exists officer_name   text;
alter table public.roadblocks add column if not exists station_name   text;

alter table public.roadblocks drop constraint if exists roadblocks_status_check;
alter table public.roadblocks add constraint roadblocks_status_check
  check (status in ('active','completed','cancelled','aborted','paused'));

create index if not exists idx_roadblocks_officer on public.roadblocks(officer_id);
create index if not exists idx_roadblocks_station on public.roadblocks(station_id);

-- Backfill: try to derive passed/checked from existing checks_count
update public.checkpoints set checked_count = checks_count where checked_count = 0 and checks_count > 0;
update public.roadblocks set checked_count = checks_count where checked_count = 0 and checks_count > 0;
update public.roadblocks set arrested_count = arrests_count where arrested_count = 0 and arrests_count > 0;

select 'TPDOP CHECKPOINTS EXTENDED' as status;




-- ════════════════════════════════════════════════════════════════════
-- SECTION 6: 00006_final_align.sql
-- ════════════════════════════════════════════════════════════════════

-- =========================================================
-- TPDOP – Final Column & CHECK Alignment Migration
-- =========================================================
-- Closes out the remaining schema-vs-code drift identified
-- by the page-by-page column scan.
--
-- What this migration does:
-- 1. Widens 9 CHECK constraints that the 00004 migration missed
-- 2. Adds location FK columns to persons (region_id/district_id/ward_id)
-- 3. Adds alias columns to missing_persons, stolen_property, stolen_vehicles
--    so the generic RegistriesPage form keeps working
-- 4. Adds alias columns to citation_requests (driver_phone, officer_notes)
-- 5. Adds alias columns to persons (alias, tribe, notes, photo_urls, created_by)
-- 6. Adds patrols.region_id, district_id, duration_mins for PatrolDashboardPage
-- 7. Adds detentions.detained_at alias
-- 8. Adds firearms.lost_stolen_date
-- 9. Adds court_cases.concluded_date
-- 10. Adds missing_persons.found_date alias (for RegistriesPage)
-- 11. Adds alerts.type widening to allow 'warning','danger','emergency'
--
-- All changes are idempotent and additive.
-- =========================================================

-- ══════════════════════════════════════════════════════════
-- 1. WIDEN CHECK CONSTRAINTS
-- ══════════════════════════════════════════════════════════

-- incident_reports.status: add 'open' (IncidentReportsPage writes "open")
alter table public.incident_reports drop constraint if exists incident_reports_status_check;
alter table public.incident_reports add constraint incident_reports_status_check
  check (status in ('pending','open','active','investigating','resolved','closed','cancelled'));

-- citations.status: add 'open','partial','contested'
alter table public.citations drop constraint if exists citations_status_check;
alter table public.citations add constraint citations_status_check
  check (status in ('draft','issued','paid','unpaid','cancelled','open','partial','contested','overdue','waived'));

-- alerts.type: add 'warning','danger','emergency'
alter table public.alerts drop constraint if exists alerts_type_check;
alter table public.alerts add constraint alerts_type_check
  check (type in ('critical','urgent','info','reminder','warning','danger','emergency','success'));

-- hearings.hearing_type: add 'plea','prosecution_evidence','defence_evidence','judgment','sentence','appeal'
alter table public.hearings drop constraint if exists hearings_hearing_type_check;
alter table public.hearings add constraint hearings_hearing_type_check
  check (hearing_type in ('mention','trial','ruling','sentencing','adjournment','pretrial','plea','prosecution_evidence','defence_evidence','judgment','sentence','appeal','conference'));

-- court_cases.status: add 'concluded','appealed'
alter table public.court_cases drop constraint if exists court_cases_status_check;
alter table public.court_cases add constraint court_cases_status_check
  check (status in ('pending','open','active','adjourned','hearing','ruling','sentencing','closed','acquitted','convicted','dismissed','withdrawn','concluded','appealed'));

-- firearm_licenses.license_type: add 'civilian_carry','hunting','security','collector'
alter table public.firearm_licenses drop constraint if exists firearm_licenses_license_type_check;
alter table public.firearm_licenses add constraint firearm_licenses_license_type_check
  check (license_type in ('private','official','special','temporary','dealer','civilian_carry','hunting','security','collector','manufacture'));

-- payments.method: add 'tigo_pesa','ezypesa','bank_transfer' (with underscore, as used in PaymentsPage)
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check
  check (method in ('cash','mpesa','tigopesa','tigo_pesa','airtel_money','halopesa','ezypesa','bank','bank_transfer','card','other'));

-- requests.priority: add 'emergency'
alter table public.requests drop constraint if exists requests_priority_check;
alter table public.requests add constraint requests_priority_check
  check (priority in ('low','normal','high','urgent','emergency'));

-- missing_persons.status: add 'missing','deceased'
alter table public.missing_persons drop constraint if exists missing_persons_status_check;
alter table public.missing_persons add constraint missing_persons_status_check
  check (status in ('active','missing','found','closed','deceased'));

-- ══════════════════════════════════════════════════════════
-- 2. PERSONS — add location FKs + alias columns
-- (PersonSearchPage writes these via Add Person modal)
-- ══════════════════════════════════════════════════════════
alter table public.persons add column if not exists alias        text;
alter table public.persons add column if not exists tribe        text;
alter table public.persons add column if not exists region_id    uuid references public.regions;
alter table public.persons add column if not exists district_id  uuid references public.districts;
alter table public.persons add column if not exists ward_id      uuid references public.wards;
alter table public.persons add column if not exists notes        text;
alter table public.persons add column if not exists photo_urls   jsonb default '[]';
alter table public.persons add column if not exists created_by   uuid references public.profiles;
alter table public.persons add column if not exists passport_country text;
alter table public.persons add column if not exists middle_name  text;

-- Backfill region_id/district_id from text columns where possible
update public.persons p
  set region_id = r.id
  from public.regions r
  where p.region_id is null and lower(p.region) = lower(r.name);

update public.persons p
  set district_id = d.id
  from public.districts d
  where p.district_id is null
    and p.region_id is not null
    and d.region_id = p.region_id
    and lower(p.district) = lower(d.name);

create index if not exists idx_persons_region_id   on public.persons(region_id);
create index if not exists idx_persons_district_id on public.persons(district_id);
create index if not exists idx_persons_created_by   on public.persons(created_by);

-- ══════════════════════════════════════════════════════════
-- 3. MISSING_PERSONS — alias columns used by RegistriesPage
-- ══════════════════════════════════════════════════════════
alter table public.missing_persons add column if not exists ref_number          text;
alter table public.missing_persons add column if not exists full_name           text;
alter table public.missing_persons add column if not exists nida                text;
alter table public.missing_persons add column if not exists age                 int;
alter table public.missing_persons add column if not exists gender              text;
alter table public.missing_persons add column if not exists last_seen_location  text;
alter table public.missing_persons add column if not exists last_seen_date      timestamptz;
alter table public.missing_persons add column if not exists clothing            text;
alter table public.missing_persons add column if not exists relationship        text;
alter table public.missing_persons add column if not exists photo_urls          jsonb default '[]';
alter table public.missing_persons add column if not exists region_id           uuid references public.regions;
alter table public.missing_persons add column if not exists district_id         uuid references public.districts;
alter table public.missing_persons add column if not exists ward_id             uuid references public.wards;
alter table public.missing_persons add column if not exists reported_by         uuid references public.profiles;
alter table public.missing_persons add column if not exists found_date          timestamptz; -- alias for found_at

-- Backfill
update public.missing_persons set last_seen_location = last_seen where last_seen_location is null and last_seen is not null;
update public.missing_persons set last_seen_date     = last_seen_at where last_seen_date is null and last_seen_at is not null;
update public.missing_persons set reported_by        = officer_id where reported_by is null and officer_id is not null;
update public.missing_persons set found_date         = found_at where found_date is null and found_at is not null;

create index if not exists idx_missing_persons_status    on public.missing_persons(status);
create index if not exists idx_missing_persons_full_name on public.missing_persons using gin(full_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- 4. STOLEN_PROPERTY — alias columns used by RegistriesPage
-- ══════════════════════════════════════════════════════════
alter table public.stolen_property add column if not exists category       text; -- alias for item_type
alter table public.stolen_property add column if not exists serial_number  text; -- alias for serial_no
alter table public.stolen_property add column if not exists imei           text;
alter table public.stolen_property add column if not exists reported_by    uuid references public.profiles; -- alias for officer_id
alter table public.stolen_property add column if not exists recovered_date timestamptz;

-- Backfill
update public.stolen_property set category      = item_type where category is null and item_type is not null;
update public.stolen_property set serial_number = serial_no where serial_number is null and serial_no is not null;
update public.stolen_property set reported_by   = officer_id where reported_by is null and officer_id is not null;

-- ══════════════════════════════════════════════════════════
-- 5. STOLEN_VEHICLES — alias columns used by RegistriesPage
-- ══════════════════════════════════════════════════════════
alter table public.stolen_vehicles add column if not exists notes          text; -- alias for description
alter table public.stolen_vehicles add column if not exists reported_by    uuid references public.profiles; -- alias for officer_id
alter table public.stolen_vehicles add column if not exists recovered_date timestamptz;

-- Backfill
update public.stolen_vehicles set notes       = description where notes is null and description is not null;
update public.stolen_vehicles set reported_by = officer_id  where reported_by is null and officer_id is not null;

-- ══════════════════════════════════════════════════════════
-- 6. CITATION_REQUESTS — alias columns used by CitationRequestsPage
-- ══════════════════════════════════════════════════════════
alter table public.citation_requests add column if not exists driver_phone  text;
alter table public.citation_requests add column if not exists officer_notes text; -- alias for notes

-- Backfill
update public.citation_requests set officer_notes = notes where officer_notes is null and notes is not null;

-- ══════════════════════════════════════════════════════════
-- 7. PATROLS — PatrolDashboardPage writes region_id, district_id, duration_mins
-- ══════════════════════════════════════════════════════════
alter table public.patrols add column if not exists region_id     uuid references public.regions;
alter table public.patrols add column if not exists district_id   uuid references public.districts;
alter table public.patrols add column if not exists ward_id       uuid references public.wards;
alter table public.patrols add column if not exists duration_mins int;
alter table public.patrols add column if not exists route_text    text; -- alias for route
alter table public.patrols add column if not exists notes         text;

-- Backfill duration_mins from start/end times
update public.patrols
  set duration_mins = extract(epoch from (coalesce(end_time, now()) - start_time))::int / 60
  where duration_mins is null and start_time is not null;

create index if not exists idx_patrols_officer on public.patrols(officer_id);
create index if not exists idx_patrols_station on public.patrols(station_id);

-- ══════════════════════════════════════════════════════════
-- 8. DETENTIONS — DetentionsPage reads detained_at (alias for checkin_time)
-- ══════════════════════════════════════════════════════════
alter table public.detentions add column if not exists detained_at timestamptz;
update public.detentions set detained_at = checkin_time where detained_at is null and checkin_time is not null;

-- ══════════════════════════════════════════════════════════
-- 9. FIREARMS — FirearmsPage status update writes lost_stolen_date
-- ══════════════════════════════════════════════════════════
alter table public.firearms add column if not exists lost_stolen_date timestamptz;

-- Relax firearms.status (code uses 'active','lost','stolen','repair','retired')
alter table public.firearms drop constraint if exists firearms_status_check;
alter table public.firearms add constraint firearms_status_check
  check (status in ('armory','active','issued','lost','stolen','repair','retired','destroyed'));

-- ══════════════════════════════════════════════════════════
-- 10. COURT_CASES — CourtCasesPage verdict update writes concluded_date
-- ══════════════════════════════════════════════════════════
alter table public.court_cases add column if not exists concluded_date timestamptz;
alter table public.court_cases add column if not exists verdict        text; -- alias if not present

-- ══════════════════════════════════════════════════════════
-- 11. CITATIONS — CitationsPage reads c.fine_paid (alias)
-- ══════════════════════════════════════════════════════════
alter table public.citations add column if not exists fine_paid bigint default 0;
-- Trigger to keep fine_paid in sync with amount_paid
create or replace function sync_citation_fine_paid()
returns trigger language plpgsql as $$
begin
  new.fine_paid := coalesce(new.amount_paid, 0);
  return new;
end;
$$;
drop trigger if exists trg_citations_fine_paid on public.citations;
create trigger trg_citations_fine_paid before insert or update on public.citations
  for each row execute function sync_citation_fine_paid();

-- ══════════════════════════════════════════════════════════
-- 12. VEHICLES — VehicleProfilePage + PersonProfilePage read various alias columns
-- ══════════════════════════════════════════════════════════
alter table public.vehicles add column if not exists is_stolen         boolean default false;
alter table public.vehicles add column if not exists stolen_date       timestamptz;
alter table public.vehicles add column if not exists vehicle_type      text;
alter table public.vehicles add column if not exists engine_number     text;
alter table public.vehicles add column if not exists chassis_number    text;
alter table public.vehicles add column if not exists registration_date date;
alter table public.vehicles add column if not exists insurance_company text;
alter table public.vehicles add column if not exists insurance_expiry  date;
alter table public.vehicles add column if not exists insurance_valid   boolean default false;
alter table public.vehicles add column if not exists owner_name        text;
alter table public.vehicles add column if not exists owner_phone       text;

-- Backfill aliases from canonical columns
update public.vehicles set is_stolen         = stolen         where is_stolen is null;
update public.vehicles set insurance_company = insurance_co   where insurance_company is null and insurance_co is not null;
update public.vehicles set insurance_expiry  = insurance_exp  where insurance_expiry is null and insurance_exp is not null;
update public.vehicles set insurance_valid   = (insurance_exp is not null and insurance_exp > current_date);

-- Sync trigger: keep is_stolen in sync with stolen
create or replace function sync_vehicle_stolen()
returns trigger language plpgsql as $$
begin
  new.is_stolen := coalesce(new.stolen, false);
  return new;
end;
$$;
drop trigger if exists trg_vehicles_stolen on public.vehicles;
create trigger trg_vehicles_stolen before insert or update on public.vehicles
  for each row execute function sync_vehicle_stolen();

-- ══════════════════════════════════════════════════════════
-- 13. PROFILES — OfficersPage writes ward_id; reads region/district text + last_sign_in_at
-- ══════════════════════════════════════════════════════════
alter table public.profiles add column if not exists ward_id        uuid references public.wards;
alter table public.profiles add column if not exists region         text; -- denormalized text
alter table public.profiles add column if not exists district       text; -- denormalized text
alter table public.profiles add column if not exists station_name   text; -- denormalized
alter table public.profiles add column if not exists last_sign_in_at timestamptz; -- alias for last_login_at

-- Backfill region/district text from FK tables
update public.profiles p
  set region = r.name
  from public.regions r
  where p.region is null and p.region_id = r.id;

update public.profiles p
  set district = d.name
  from public.districts d
  where p.district is null and p.district_id = d.id;

update public.profiles p
  set station_name = s.name
  from public.stations s
  where p.station_name is null and p.station_id = s.id;

update public.profiles set last_sign_in_at = last_login_at where last_sign_in_at is null and last_login_at is not null;

-- Trigger: keep last_sign_in_at synced from last_login_at
create or replace function sync_profile_signin()
returns trigger language plpgsql as $$
begin
  if new.last_login_at is distinct from old.last_login_at and new.last_login_at is not null then
    new.last_sign_in_at := new.last_login_at;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profiles_signin on public.profiles;
create trigger trg_profiles_signin before update on public.profiles
  for each row execute function sync_profile_signin();

-- ══════════════════════════════════════════════════════════
-- DONE
-- ══════════════════════════════════════════════════════════
select 'TPDOP FINAL ALIGN COMPLETE' as status,
       '10 CHECKs widened, ~50 alias columns added, 4 sync triggers, 6 backfill passes' as summary;




-- ════════════════════════════════════════════════════════════════════
-- SECTION 7: 00007_system_settings.sql
-- ════════════════════════════════════════════════════════════════════

-- =========================================================
-- TPDOP – System Settings Migration (run AFTER 00006_final_align.sql)
-- =========================================================
-- Adds a key/value system_settings table so the AdminSettingsPage
-- can persist its toggles and config values instead of being a mock.
--
-- Design: each setting is one row with a unique key. Value is stored
-- as text (booleans as 'true'/'false', numbers as their string form,
-- JSON for complex values). This keeps the schema simple and lets
-- the page read/write arbitrary settings without migrations.
--
-- RLS: only admin_officer / igp / digp can read or write.
-- Audit: trigger log_audit() captures all changes.
-- =========================================================

create table if not exists public.system_settings (
  id           uuid primary key default uuid_generate_v4(),
  key          text unique not null,
  value        text,
  value_type   text default 'string' check (value_type in ('string','boolean','number','json')),
  category     text default 'general',
  description  text,
  updated_by   uuid references public.profiles,
  updated_at   timestamptz default now(),
  created_at   timestamptz default now()
);

create index if not exists idx_system_settings_key      on public.system_settings(key);
create index if not exists idx_system_settings_category on public.system_settings(category);

-- Trigger to keep updated_at current
drop trigger if exists trg_system_settings_upd on public.system_settings;
create trigger trg_system_settings_upd before update on public.system_settings
  for each row execute function update_updated_at();

-- RLS: only admin/national can read or write
alter table public.system_settings enable row level security;

drop policy if exists "ss admin read"  on public.system_settings;
drop policy if exists "ss admin write" on public.system_settings;
create policy "ss admin read"  on public.system_settings for select using (
  is_national() or my_role() = 'admin_officer'
);
create policy "ss admin write" on public.system_settings for all using (
  is_national() or my_role() = 'admin_officer'
) with check (
  is_national() or my_role() = 'admin_officer'
);

-- Audit trigger
drop trigger if exists aud_system_settings on public.system_settings;
create trigger aud_system_settings after insert or update or delete on public.system_settings
  for each row execute function log_audit();

-- Seed default settings (matches AdminSettingsPage defaults)
insert into public.system_settings (key, value, value_type, category, description) values
  ('systemName',           'TPDOP – Tanzania Police Digital Operations Platform', 'string',  'general',     'Display name of the system'),
  ('version',              '1.0.0',                                                'string',  'general',     'Current software version'),
  ('sessionTimeout',       '30',                                                   'number',  'security',    'Session idle timeout in minutes'),
  ('maxLoginAttempts',     '5',                                                    'number',  'security',    'Max failed login attempts before lockout'),
  ('require2fa',           'true',                                                 'boolean', 'security',    'Require 2FA for all officers'),
  ('auditLogging',         'true',                                                 'boolean', 'security',    'Audit logging enabled'),
  ('gpsTracking',          'true',                                                 'boolean', 'security',    'GPS tracking active for field officers'),
  ('maintenanceMode',      'false',                                                'boolean', 'security',    'Maintenance mode (blocks non-admin logins)'),
  ('emailNotifications',   'true',                                                 'boolean', 'notifications','Email notifications enabled'),
  ('smsNotifications',     'true',                                                 'boolean', 'notifications','SMS notifications enabled'),
  ('language',             'en',                                                   'string',  'general',     'Default system language')
on conflict (key) do nothing;

select 'TPDOP SYSTEM SETTINGS COMPLETE' as status,
       'system_settings table + RLS + audit trigger + 11 default settings' as summary;


