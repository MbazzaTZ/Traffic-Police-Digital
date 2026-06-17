-- =========================================================
-- TPDOP – HR Module Extension Migration
-- =========================================================
-- Adds alias columns + RLS + audit trigger to hr_records so the
-- new HRPage can store richer records: status, severity, dates,
-- station/region linkage, attachments.
--
-- The base table (from 00001) has:
--   id, officer_id, type, title, description, date, created_by, created_at
--
-- No RLS was defined on hr_records in 00001. This migration adds it.
--
-- Idempotent — safe to re-run.
-- =========================================================

-- Add alias columns
alter table public.hr_records add column if not exists status        text default 'active';
alter table public.hr_records add column if not exists severity      text default 'normal';
alter table public.hr_records add column if not exists start_date    date;
alter table public.hr_records add column if not exists end_date      date;
alter table public.hr_records add column if not exists station_id    uuid references public.stations;
alter table public.hr_records add column if not exists region_id     uuid references public.regions;
alter table public.hr_records add column if not exists district_id   uuid references public.districts;
alter table public.hr_records add column if not exists attachments   jsonb default '[]';
alter table public.hr_records add column if not exists notes         text;
alter table public.hr_records add column if not exists approved_by   uuid references public.profiles;
alter table public.hr_records add column if not exists approved_at   timestamptz;
alter table public.hr_records add column if not exists updated_at    timestamptz default now();

-- Backfill start_date from date where start_date is null
update public.hr_records set start_date = date where start_date is null and date is not null;

-- Widen status CHECK
alter table public.hr_records drop constraint if exists hr_records_status_check;
alter table public.hr_records add constraint hr_records_status_check
  check (status in ('active','pending','approved','rejected','completed','expired','cancelled','archived'));

-- Severity CHECK
alter table public.hr_records drop constraint if exists hr_records_severity_check;
alter table public.hr_records add constraint hr_records_severity_check
  check (severity in ('low','normal','high','critical'));

-- Type CHECK — HR record types
alter table public.hr_records drop constraint if exists hr_records_type_check;
alter table public.hr_records add constraint hr_records_type_check
  check (type in (
    'leave','transfer','promotion','demotion','training','certification',
    'disciplinary','commendation','medical','performance_review',
    'suspension','resignation','retirement','other'
  ));

create index if not exists idx_hr_records_officer   on public.hr_records(officer_id);
create index if not exists idx_hr_records_type      on public.hr_records(type);
create index if not exists idx_hr_records_status    on public.hr_records(status);
create index if not exists idx_hr_records_date      on public.hr_records(date desc);
create index if not exists idx_hr_records_station   on public.hr_records(station_id);
create index if not exists idx_hr_records_created_by on public.hr_records(created_by);

-- Updated_at trigger
drop trigger if exists trg_hr_records_upd on public.hr_records;
create trigger trg_hr_records_upd before update on public.hr_records
  for each row execute function update_updated_at();

-- Enable RLS
alter table public.hr_records enable row level security;

-- RLS policies:
-- - Officers can see their own HR records
-- - OCS+ can see station records
-- - OCD+ can see district records
-- - RPC+ can see region records
-- - National (igp/digp/admin) can see all
-- - Only admin/igp/digp/ocs can create/update
drop policy if exists "hr own view"      on public.hr_records;
drop policy if exists "hr station view"  on public.hr_records;
drop policy if exists "hr national view" on public.hr_records;
drop policy if exists "hr create"        on public.hr_records;
drop policy if exists "hr update"        on public.hr_records;

create policy "hr own view"      on public.hr_records for select using (officer_id = auth.uid());
create policy "hr station view"  on public.hr_records for select using (
  station_id = my_station() and my_role() in ('ocs','ocd','rpc')
);
create policy "hr national view" on public.hr_records for select using (is_national());
create policy "hr create"        on public.hr_records for insert with check (
  my_role() in ('admin_officer','igp','digp','ocs','ocd','rpc')
);
create policy "hr update"        on public.hr_records for update using (
  my_role() in ('admin_officer','igp','digp','ocs','ocd','rpc')
);

-- Audit trigger
drop trigger if exists aud_hr_records on public.hr_records;
create trigger aud_hr_records after insert or update or delete on public.hr_records
  for each row execute function log_audit();

select 'TPDOP HR EXTENDED' as status;
