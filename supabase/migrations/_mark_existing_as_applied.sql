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
-- for all 7 existing migration files (00001 through 00007), so the CLI
-- knows they've been applied and won't try to re-run them.
--
-- RUN THIS ONCE in Supabase SQL Editor, then `supabase db push`
-- will work cleanly for future migrations.
--
-- IDEMPOTENT: uses ON CONFLICT DO NOTHING, safe to run multiple times.
--
-- COMPATIBILITY
-- -------------
-- Different Supabase CLI versions use different column types for
-- `statements`:
--   - Older versions (pre-2.0): text[]
--   - Newer versions (2.0+):    jsonb
--
-- This script detects which type your DB has and uses the correct cast.
-- =========================================================

-- Create the tracking schema + table if they don't exist
create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);

-- ── Detect the statements column type ──
-- Some CLI versions use text[], others use jsonb. Build the INSERT
-- dynamically based on what the actual column type is.
do $$
declare
  col_type text;
begin
  select data_type into col_type
    from information_schema.columns
    where table_schema = 'supabase_migrations'
      and table_name = 'schema_migrations'
      and column_name = 'statements';

  -- Default to text[] if for some reason we can't determine the type
  if col_type is null then
    col_type := 'ARRAY';
  end if;

  -- Insert based on the column type
  if col_type = 'ARRAY' then
    -- text[] (older CLI versions)
    execute $q$
      insert into supabase_migrations.schema_migrations (version, name, statements) values
        ('00001', '00001_full_schema.sql',        ARRAY[]::text[]),
        ('00002', '00002_wards.sql',              ARRAY[]::text[]),
        ('00003', '00003_runtime_tables.sql',     ARRAY[]::text[]),
        ('00004', '00004_column_align.sql',       ARRAY[]::text[]),
        ('00005', '00005_checkpoints_extend.sql', ARRAY[]::text[]),
        ('00006', '00006_final_align.sql',        ARRAY[]::text[]),
        ('00007', '00007_system_settings.sql',    ARRAY[]::text[])
      on conflict (version) do nothing
    $q$;
  else
    -- jsonb (newer CLI versions)
    execute $q$
      insert into supabase_migrations.schema_migrations (version, name, statements) values
        ('00001', '00001_full_schema.sql',        '[]'::jsonb),
        ('00002', '00002_wards.sql',              '[]'::jsonb),
        ('00003', '00003_runtime_tables.sql',     '[]'::jsonb),
        ('00004', '00004_column_align.sql',       '[]'::jsonb),
        ('00005', '00005_checkpoints_extend.sql', '[]'::jsonb),
        ('00006', '00006_final_align.sql',        '[]'::jsonb),
        ('00007', '00007_system_settings.sql',    '[]'::jsonb)
      on conflict (version) do nothing
    $q$;
  end if;
end $$;

-- Verify
select version, name from supabase_migrations.schema_migrations order by version;

-- Done — `supabase db push` will now work cleanly for future migrations
select 'TPDOP MIGRATIONS MARKED AS APPLIED' as status,
       '7 migrations recorded in supabase_migrations.schema_migrations' as summary;
