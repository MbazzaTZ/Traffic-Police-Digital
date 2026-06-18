-- =========================================================
-- TPDOP – citations alignment: driver_phone, ward_id,
-- and relax NOT NULL on legacy offence_code
-- =========================================================
-- driver_phone: collected at issue time for payment-reminder SMS.
--   Drivers swap SIMs and lend cars, so the phone-at-time-of-citation
--   is what matters for collection - persist it on the citation row.
--
-- ward_id: the new cascading location picker on the Issue Citation
--   form lets officers pick region -> district -> ward. region_id
--   and district_id were already on citations from 00004; ward_id
--   was the missing third level.
--
-- offence_code (British): from 00001 it was NOT NULL, but the code
--   uses the American spelling `offense_code` (added as an alias in
--   00004). Inserts that populate offense_code but not offence_code
--   were failing the NOT NULL check. Drop the NOT NULL so either
--   spelling can drive the row.
--
-- Idempotent + safe to re-run.
-- =========================================================

-- 1. driver_phone column
alter table public.citations
  add column if not exists driver_phone text;

-- 2. ward_id column with FK to wards
alter table public.citations
  add column if not exists ward_id uuid references public.wards(id) on delete set null;

-- 3. Relax NOT NULL on the legacy British column.
--    The American spelling offense_code (added in 00004) carries the
--    same data; the form populates both. NOT NULL on offence_code is
--    now redundant and blocks otherwise-valid inserts.
do $$ begin
  alter table public.citations alter column offence_code drop not null;
exception when others then
  raise notice 'offence_code NOT NULL drop: %', sqlerrm;
end $$;

-- 4. Backfill any rows where only one spelling is populated
update public.citations set offence_code = offense_code where offence_code is null and offense_code is not null;
update public.citations set offense_code = offence_code where offense_code is null and offence_code is not null;

-- 5. Indexes for fast filter queries
create index if not exists idx_citations_driver_phone
  on public.citations(driver_phone)
  where driver_phone is not null;

create index if not exists idx_citations_ward
  on public.citations(ward_id)
  where ward_id is not null;

select 'citations: driver_phone + ward_id added, offence_code NOT NULL relaxed' as result;
