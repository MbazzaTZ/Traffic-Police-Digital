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
