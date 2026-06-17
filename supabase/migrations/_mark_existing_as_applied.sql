-- =========================================================
-- TPDOP – Mark Existing Migrations as Applied (CLI sync)
-- =========================================================
-- PURPOSE
-- -------
-- If you applied migrations manually via the Supabase Dashboard
-- (paste-and-run in SQL Editor) instead of via `supabase db push`,
-- the CLI's migration tracking table doesn't know about them.
-- When you later run `supabase db push`, the CLI tries to re-apply
-- 00001_full_schema.sql and fails with:
--
--   ERROR: relation "zones" already exists (SQLSTATE 42P07)
--
-- This script inserts records into supabase_migrations.schema_migrations
-- for all 7 existing migration files (00000 through 00007), so the CLI
-- knows they've been applied and won't try to re-run them.
--
-- RUN THIS ONCE in Supabase SQL Editor, then `supabase db push`
-- will work cleanly for future migrations.
--
-- Idempotent: uses ON CONFLICT DO NOTHING, safe to run multiple times.
-- =========================================================

-- Create the tracking schema + table if they don't exist
-- (Supabase CLI creates these automatically when linked, but if you
-- applied via Dashboard they may be missing)
create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements jsonb,
  name text
);

-- Mark all 7 existing migrations as applied
-- (00000_drop_all.sql is intentionally excluded — it's destructive and
-- was removed from the migration sequence. The base schema starts at 00001.)
-- The "version" column matches the migration filename prefix (without leading zeros stripped)
-- The "name" column is the full filename
insert into supabase_migrations.schema_migrations (version, name, statements) values
  ('00001', '00001_full_schema.sql',        '[]'::jsonb),
  ('00002', '00002_wards.sql',              '[]'::jsonb),
  ('00003', '00003_runtime_tables.sql',     '[]'::jsonb),
  ('00004', '00004_column_align.sql',       '[]'::jsonb),
  ('00005', '00005_checkpoints_extend.sql', '[]'::jsonb),
  ('00006', '00006_final_align.sql',        '[]'::jsonb),
  ('00007', '00007_system_settings.sql',    '[]'::jsonb)
on conflict (version) do nothing;

-- Verify
select version, name from supabase_migrations.schema_migrations order by version;

-- Done — `supabase db push` will now work cleanly for future migrations
select 'TPDOP MIGRATIONS MARKED AS APPLIED' as status,
       '7 migrations recorded in supabase_migrations.schema_migrations' as summary;
