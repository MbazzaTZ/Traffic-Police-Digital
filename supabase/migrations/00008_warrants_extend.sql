-- =========================================================
-- TPDOP – Warrants Page Support Migration
-- =========================================================
-- Adds alias columns to the warrants table so the new WarrantsPage
-- can store denormalized person info (for display when person_id is
-- null), execution location, executing officer, and notes.
--
-- The base warrants table (from 00001) has:
--   id, warrant_no, person_id, case_id, type, court, judge,
--   description, issued_at, expires_at, executed_at, urgent,
--   status, created_at
--
-- This migration adds:
--   ref_number (alias for warrant_no)
--   person_name, person_nida (denormalized for display)
--   location (where warrant should be executed)
--   executed_by (officer who executed the warrant)
--   notes
--
-- Idempotent — safe to re-run.
-- =========================================================

alter table public.warrants add column if not exists ref_number   text;
alter table public.warrants add column if not exists person_name  text;
alter table public.warrants add column if not exists person_nida  text;
alter table public.warrants add column if not exists location     text;
alter table public.warrants add column if not exists executed_by  uuid references public.profiles;
alter table public.warrants add column if not exists notes        text;
alter table public.warrants add column if not exists issued_by    uuid references public.profiles;
alter table public.warrants add column if not exists region_id    uuid references public.regions;
alter table public.warrants add column if not exists district_id  uuid references public.districts;
alter table public.warrants add column if not exists station_id   uuid references public.stations;

-- Backfill ref_number from warrant_no
update public.warrants set ref_number = warrant_no where ref_number is null and warrant_no is not null;

-- Set default for ref_number to use gen_id (sequence already exists from 00001)
alter table public.warrants alter column ref_number set default gen_id('WRT-','seq_warrant');

-- Widen the status CHECK to include values the page uses
alter table public.warrants drop constraint if exists warrants_status_check;
alter table public.warrants add constraint warrants_status_check
  check (status in ('active','executed','expired','cancelled','pending','draft'));

-- Widen the type CHECK to include more warrant types
alter table public.warrants drop constraint if exists warrants_type_check;
alter table public.warrants add constraint warrants_type_check
  check (type in ('arrest','search','seizure','bench','telegraphic','production','detention','other'));

create index if not exists idx_warrants_status    on public.warrants(status);
create index if not exists idx_warrants_type      on public.warrants(type);
create index if not exists idx_warrants_person    on public.warrants(person_id);
create index if not exists idx_warrants_case      on public.warrants(case_id);
create index if not exists idx_warrants_expires   on public.warrants(expires_at);

-- RLS already enabled in 00001. Add policies for CID access.
drop policy if exists "warrants national"   on public.warrants;
drop policy if exists "warrants cid"        on public.warrants;
drop policy if exists "warrants station"    on public.warrants;
drop policy if exists "warrants create"     on public.warrants;
drop policy if exists "warrants update"     on public.warrants;

create policy "warrants national"   on public.warrants for select using (is_national());
create policy "warrants cid"        on public.warrants for select using (
  my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp')
);
create policy "warrants station"    on public.warrants for select using (
  station_id = my_station() and my_role() in ('ocs','ocd','rpc')
);
create policy "warrants create"     on public.warrants for insert with check (
  my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp','admin_officer')
);
create policy "warrants update"     on public.warrants for update using (
  my_role() in ('cid_officer','forensic_officer','inspector','ocs','ocd','rpc','igp','digp','admin_officer')
);

-- Audit trigger
drop trigger if exists aud_warrants on public.warrants;
create trigger aud_warrants after insert or update or delete on public.warrants
  for each row execute function log_audit();

select 'TPDOP WARRANTS EXTENDED' as status;
