# TPDOP — Database Migrations Guide

This guide explains how to apply schema migrations to your Supabase project, both via the CLI (recommended) and via the Dashboard (fallback).

---

## 📁 Migration files

All migrations live in `supabase/migrations/`. Apply them in **filename order** (which is why they're prefixed with `00000`, `00001`, etc.).

| File | Purpose | Status |
|---|---|---|
| `00000_drop_all.sql` | ⚠️ **DESTRUCTIVE** — drops all tables. Only run on a fresh DB or to reset. | Pre-existing |
| `00001_full_schema.sql` | Base schema: 37 tables, RLS, audit triggers, helper functions | Pre-existing |
| `00002_wards.sql` | Adds `wards` table | Pre-existing |
| `00003_runtime_tables.sql` | 12 new tables + ALTERs + RLS + triggers + fine_schedule seeds | ✅ Applied |
| `00004_column_align.sql` | ~150 columns added to 13 existing tables; 18 NOT NULLs dropped; 8 CHECKs widened | ✅ Applied |
| `00005_checkpoints_extend.sql` | Counter columns on `checkpoints` + `roadblocks` | ✅ Applied |
| `00006_final_align.sql` | 10 more CHECKs widened; 62 alias columns; 3 sync triggers | ✅ Applied |
| `00007_system_settings.sql` | `system_settings` table for AdminSettingsPage | ✅ Applied |
| `ALL_MIGRATIONS_CONSOLIDATED.sql` | One-shot file combining 00003–00007 (for Dashboard paste-and-run) | ✅ Applied |

> ✅ **All migrations are currently applied** to the production Supabase project (as of the latest session).

---

## 🚀 Option A — Apply via Supabase CLI (recommended)

### One-time setup

1. **Install the CLI** (if not already):
   ```bash
   # macOS
   brew install supabase/tap/supabase

   # Windows (PowerShell)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase

   # Or via npm (works everywhere)
   npm install -g supabase
   ```

2. **Link your project** (from the repo root):
   ```bash
   cd Traffic-Police-Digital
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Find `YOUR_PROJECT_REF` at: Supabase Dashboard → Settings → General → Reference ID (looks like `abcdefghijklmno`).

   You'll be prompted for your **database password** (the one you set when creating the project). If you don't have it, reset it at: Dashboard → Settings → Database → Database password → Reset.

3. **Verify the link**:
   ```bash
   supabase projects list
   ```
   Your project should appear with a green "linked" status.

### Applying new migrations

When you (or a teammate) adds a new migration file (e.g. `00008_add_xxx.sql`), apply it with:

```bash
supabase db push
```

This command:
- Reads all files in `supabase/migrations/`
- Checks `supabase_migrations.schema_migrations` table in your DB to see which have been applied
- Runs only the new ones, in order
- Records each successful apply in the migrations table

**You'll never have to remember which migrations have been applied** — the CLI tracks it for you.

### Pulling schema changes from a teammate

If someone else pushes a new migration to GitHub:

```bash
git pull
supabase db push
```

### Resetting the DB to match migrations (DESTRUCTIVE)

If your DB has drifted from the migration files (e.g. someone made manual changes via Dashboard):

```bash
supabase db reset
```

⚠️ **This drops and recreates everything.** All data is lost. Only use on a fresh dev DB or if you have a backup.

---

## 📝 Option B — Apply via Supabase Dashboard (fallback)

If the CLI isn't working or you prefer a GUI:

1. Open https://supabase.com/dashboard → select your TPDOP project
2. Click **SQL Editor** in the left sidebar → **New query**
3. Paste the contents of the migration file (e.g. `00008_add_xxx.sql`)
4. Click **Run**
5. Look for the success message at the bottom of the result panel

**For one-shot application of multiple migrations**, use the consolidated file:
```
supabase/migrations/ALL_MIGRATIONS_CONSOLIDATED.sql
```
This combines 00003–00007 into a single paste-and-run. All statements are idempotent, so it's safe to re-run if it fails partway.

---

## 🛠️ Creating a new migration

When you need to add a new table, column, or constraint:

### Step 1 — Create the migration file

```bash
# Create a new migration with the next number in sequence
touch supabase/migrations/00008_describe_what_it_does.sql
```

### Step 2 — Write the SQL

Follow the **idempotent pattern** used in 00003–00007. Every statement must be safe to re-run:

```sql
-- ✅ GOOD — idempotent
create table if not exists public.my_new_table (
  id uuid primary key default uuid_generate_v4()
);
alter table public.my_new_table add column if not exists name text;
alter table public.my_new_table add column if not exists created_at timestamptz default now();

create index if not exists idx_my_new_table_name on public.my_new_table(name);

-- RLS
alter table public.my_new_table enable row level security;
drop policy if exists "mnt select" on public.my_new_table;
create policy "mnt select" on public.my_new_table for select using (true);

-- Audit trigger (reuses log_audit() from 00001)
drop trigger if exists aud_my_new_table on public.my_new_table;
create trigger aud_my_new_table after insert or update or delete on public.my_new_table
  for each row execute function log_audit();

select 'MY NEW TABLE COMPLETE' as status;
```

```sql
-- ❌ BAD — will fail on re-run
create table public.my_new_table (           -- fails if table exists
  id uuid primary key,
  name text
);
create index idx_my_new_table_name on public.my_new_table(name);  -- fails if index exists
```

### Step 3 — Test locally (optional but recommended)

```bash
# Start local Supabase (Docker required)
supabase start

# Apply migrations to local DB
supabase db reset

# Check the result at http://localhost:54323 (local Supabase Studio)
```

### Step 4 — Apply to production

```bash
supabase db push
```

### Step 5 — Commit + push the migration file

```bash
git add supabase/migrations/00008_describe_what_it_does.sql
git commit -m "feat(schema): add my_new_table for X"
git push
```

### Step 6 — Update the consolidated file (if you want)

If you want to keep `ALL_MIGRATIONS_CONSOLIDATED.sql` in sync for Dashboard users, append your new migration to it. Or just delete the consolidated file — it's only a convenience for one-shot application.

---

## 🔍 Verifying migration state

### Via CLI

```bash
# List all migrations and their apply status
supabase migration list
```

### Via SQL (Dashboard)

```sql
-- Check which migrations the CLI has recorded
select * from supabase_migrations.schema_migrations order by version;

-- Verify key tables/columns exist
select
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='system_settings') as has_system_settings,
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='requests') as has_requests,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='officer_locations' and column_name='recorded_at') as has_officer_locs_cols,
  (select count(*) from information_schema.views
    where table_schema='public' and table_name='officer_latest_locations') as has_patrol_map_view,
  (select count(*) from fine_schedule) as fine_schedule_seeds,
  (select count(*) from system_settings) as system_settings_seeds;
```

Expected output (everything applied):
```
has_system_settings=1, has_requests=1, has_officer_locs_cols=1,
has_patrol_map_view=1, fine_schedule_seeds=20, system_settings_seeds=11
```

---

## 🆘 Troubleshooting

### "Project has not been linked"

Run `supabase link --project-ref YOUR_PROJECT_REF` first. If you've already linked, the link file lives at `supabase/.temp/project-ref` — check it exists.

### "Password authentication failed"

Your DB password is different from your Supabase dashboard password. Reset it at:
Dashboard → Settings → Database → Database password → Reset.

Then re-link:
```bash
supabase unlink
supabase link --project-ref YOUR_PROJECT_REF
```

### "migration failed: column X does not exist"

This means a migration tried to use a column before it was created. Either:
1. Re-run the migration (if it's idempotent, the failed part will retry)
2. Or check if a previous migration in the sequence failed — fix that first

### "cannot change name of view column"

Postgres refuses to `CREATE OR REPLACE VIEW` if the new column list renames or reorders existing columns. Fix: use `DROP VIEW IF EXISTS` + `CREATE VIEW` instead.

### CLI is out of date

```bash
supabase --version  # check current
npm install -g supabase@latest  # update
```

---

## 📚 References

- Supabase CLI docs: https://supabase.com/docs/reference/cli/introduction
- Local dev workflow: https://supabase.com/docs/guides/local-development
- Migration management: https://supabase.com/docs/guides/local-development#database-migrations
- RLS policies: https://supabase.com/docs/guides/auth/row-level-security

---

## Quick reference card

```bash
# One-time setup
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF

# Apply new migrations (run after git pull)
supabase db push

# Check what's been applied
supabase migration list

# Reset DB to match migrations (DESTRUCTIVE — dev only)
supabase db reset
```
