-- =========================================================
-- TPDOP – Add driver_phone + ward_id to citations
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
-- Idempotent + safe to re-run.
-- =========================================================

alter table public.citations
  add column if not exists driver_phone text;

alter table public.citations
  add column if not exists ward_id uuid references public.wards(id) on delete set null;

create index if not exists idx_citations_driver_phone
  on public.citations(driver_phone)
  where driver_phone is not null;

create index if not exists idx_citations_ward
  on public.citations(ward_id)
  where ward_id is not null;

select 'citations: driver_phone + ward_id columns added' as result;
