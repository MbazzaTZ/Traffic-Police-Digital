-- =========================================================
-- TPDOP – Intelligence Module Extension Migration
-- =========================================================
-- Adds alias columns to the intelligence_files table so the new
-- IntelligencePage can store richer intel: linked case, location
-- details, subject info, expiry, review dates, source reliability,
-- dissemination controls.
--
-- The base table (from 00001) has:
--   id, intel_no, title, classification, threat_level, content,
--   region, source, created_by, status, created_at, updated_at
--
-- RLS already restricts to RPC+ (igp, digp, rpc).
--
-- Idempotent — safe to re-run.
-- =========================================================

alter table public.intelligence_files add column if not exists ref_number     text;
alter table public.intelligence_files add column if not exists case_id        uuid references public.cases on delete set null;
alter table public.intelligence_files add column if not exists region_id      uuid references public.regions;
alter table public.intelligence_files add column if not exists district_id    uuid references public.districts;
alter table public.intelligence_files add column if not exists station_id     uuid references public.stations;
alter table public.intelligence_files add column if not exists location_text  text;
alter table public.intelligence_files add column if not exists subject_name   text;
alter table public.intelligence_files add column if not exists subject_nida   text;
alter table public.intelligence_files add column if not exists expires_at            timestamptz;
alter table public.intelligence_files add column if not exists reviewed_at    timestamptz;
alter table public.intelligence_files add column if not exists reviewed_by    uuid references public.profiles;
alter table public.intelligence_files add column if not exists source_reliability text check (source_reliability in ('a','b','c','d','f','unverified'));
alter table public.intelligence_files add column if not exists dissemination  text[] default '{}';
alter table public.intelligence_files add column if not exists tags           text[] default '{}';
alter table public.intelligence_files add column if not exists attachments    jsonb default '[]';
alter table public.intelligence_files add column if not exists notes          text;

-- Backfill ref_number from intel_no
update public.intelligence_files set ref_number = intel_no where ref_number is null and intel_no is not null;

-- Set default for ref_number to use gen_id (sequence already exists from 00001)
alter table public.intelligence_files alter column ref_number set default gen_id('INT-','seq_intel');

-- Widen status CHECK
alter table public.intelligence_files drop constraint if exists intelligence_files_status_check;
alter table public.intelligence_files add constraint intelligence_files_status_check
  check (status in ('active','pending_review','verified','disseminated','archived','expired','recalled'));

create index if not exists idx_intel_classification on public.intelligence_files(classification);
create index if not exists idx_intel_threat         on public.intelligence_files(threat_level);
create index if not exists idx_intel_status         on public.intelligence_files(status);
create index if not exists idx_intel_region         on public.intelligence_files(region_id);
create index if not exists idx_intel_case           on public.intelligence_files(case_id);
create index if not exists idx_intel_created_by     on public.intelligence_files(created_by);
create index if not exists idx_intel_created_at     on public.intelligence_files(created_at desc);

-- Add admin_officer to the RLS access list (intelligence is shared with admin)
-- The original policy only allowed igp/digp/rpc. We add admin_officer.
drop policy if exists "intel rpc+" on public.intelligence_files;
create policy "intel rpc+" on public.intelligence_files for all using (
  my_role() in ('igp','digp','rpc','admin_officer')
) with check (
  my_role() in ('igp','digp','rpc','admin_officer')
);

-- Audit trigger (already exists from 00001, but ensure it's there)
drop trigger if exists aud_intel on public.intelligence_files;
create trigger aud_intel after insert or update or delete on public.intelligence_files
  for each row execute function log_audit();

select 'TPDOP INTELLIGENCE EXTENDED' as status;
