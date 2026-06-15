-- ============================================================
-- TPDOP: Add wards table
-- Run AFTER 00001_full_schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wards (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  code        text,
  district_id uuid not null references public.districts(id) on delete cascade,
  region_id   uuid references public.regions(id) on delete set null,
  created_at  timestamptz default now(),
  unique(name, district_id)
);

-- Add ward_id to stations
ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS ward_id uuid references public.wards(id) on delete set null;

-- RLS
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_wards" ON public.wards
  FOR SELECT USING (true);

CREATE POLICY "auth_all_wards" ON public.wards
  FOR ALL USING (auth.role() IN ('authenticated','service_role'));

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_wards_district ON public.wards(district_id);
CREATE INDEX IF NOT EXISTS idx_stations_ward   ON public.stations(ward_id);
