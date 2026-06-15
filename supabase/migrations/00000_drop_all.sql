-- =========================================================
-- TPDOP – NUCLEAR RESET: Drop Everything & Start Clean
-- Run this FIRST before any other migration
-- =========================================================

-- ── STEP 1: Drop all triggers ──
do $$ declare r record; begin
  for r in (
    select trigger_name, event_object_table
    from information_schema.triggers
    where trigger_schema = 'public'
  ) loop
    execute 'drop trigger if exists ' || quote_ident(r.trigger_name) || ' on public.' || quote_ident(r.event_object_table) || ' cascade';
  end loop;
end $$;

-- ── STEP 2: Drop all functions ──
do $$ declare r record; begin
  for r in (
    select proname, oid
    from pg_proc
    where pronamespace = 'public'::regnamespace
  ) loop
    execute 'drop function if exists public.' || quote_ident(r.proname) || ' cascade';
  end loop;
end $$;

-- ── STEP 3: Drop all sequences ──
do $$ declare r record; begin
  for r in (
    select sequence_name from information_schema.sequences
    where sequence_schema = 'public'
  ) loop
    execute 'drop sequence if exists public.' || quote_ident(r.sequence_name) || ' cascade';
  end loop;
end $$;

-- ── STEP 4: Drop all RLS policies ──
do $$ declare r record; begin
  for r in (
    select policyname, tablename from pg_policies
    where schemaname = 'public'
  ) loop
    execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on public.' || quote_ident(r.tablename);
  end loop;
end $$;

-- ── STEP 5: Drop ALL tables (handles dependencies) ──
do $$ declare r record; begin
  for r in (
    select tablename from pg_tables
    where schemaname = 'public'
  ) loop
    execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
  end loop;
end $$;

-- ── STEP 6: Drop all views ──
do $$ declare r record; begin
  for r in (
    select viewname from pg_views
    where schemaname = 'public'
  ) loop
    execute 'drop view if exists public.' || quote_ident(r.viewname) || ' cascade';
  end loop;
end $$;

-- ── STEP 7: Drop all types ──
do $$ declare r record; begin
  for r in (
    select typname from pg_type
    where typnamespace = 'public'::regnamespace
    and typtype = 'e'
  ) loop
    execute 'drop type if exists public.' || quote_ident(r.typname) || ' cascade';
  end loop;
end $$;

select 'NUCLEAR RESET COMPLETE – all public schema objects dropped' as status;
