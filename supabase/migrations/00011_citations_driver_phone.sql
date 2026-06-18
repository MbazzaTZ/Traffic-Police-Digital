-- =========================================================
-- TPDOP – Add driver_phone to citations
-- =========================================================
-- The citation form collects the driver's phone at issue time so
-- payment reminder SMS messages can be sent against the citation
-- record itself (not via a person lookup that may change).
--
-- Idempotent + safe to re-run.
-- =========================================================

alter table public.citations
  add column if not exists driver_phone text;

create index if not exists idx_citations_driver_phone
  on public.citations(driver_phone)
  where driver_phone is not null;

select 'driver_phone column added to citations' as result;
