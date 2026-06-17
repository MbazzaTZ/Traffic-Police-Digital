-- =========================================================
-- TPDOP – System Settings Migration (run AFTER 00006_final_align.sql)
-- =========================================================
-- Adds a key/value system_settings table so the AdminSettingsPage
-- can persist its toggles and config values instead of being a mock.
--
-- Design: each setting is one row with a unique key. Value is stored
-- as text (booleans as 'true'/'false', numbers as their string form,
-- JSON for complex values). This keeps the schema simple and lets
-- the page read/write arbitrary settings without migrations.
--
-- RLS: only admin_officer / igp / digp can read or write.
-- Audit: trigger log_audit() captures all changes.
-- =========================================================

create table if not exists public.system_settings (
  id           uuid primary key default uuid_generate_v4(),
  key          text unique not null,
  value        text,
  value_type   text default 'string' check (value_type in ('string','boolean','number','json')),
  category     text default 'general',
  description  text,
  updated_by   uuid references public.profiles,
  updated_at   timestamptz default now(),
  created_at   timestamptz default now()
);

create index if not exists idx_system_settings_key      on public.system_settings(key);
create index if not exists idx_system_settings_category on public.system_settings(category);

-- Trigger to keep updated_at current
drop trigger if exists trg_system_settings_upd on public.system_settings;
create trigger trg_system_settings_upd before update on public.system_settings
  for each row execute function update_updated_at();

-- RLS: only admin/national can read or write
alter table public.system_settings enable row level security;

drop policy if exists "ss admin read"  on public.system_settings;
drop policy if exists "ss admin write" on public.system_settings;
create policy "ss admin read"  on public.system_settings for select using (
  is_national() or my_role() = 'admin_officer'
);
create policy "ss admin write" on public.system_settings for all using (
  is_national() or my_role() = 'admin_officer'
) with check (
  is_national() or my_role() = 'admin_officer'
);

-- Audit trigger
drop trigger if exists aud_system_settings on public.system_settings;
create trigger aud_system_settings after insert or update or delete on public.system_settings
  for each row execute function log_audit();

-- Seed default settings (matches AdminSettingsPage defaults)
insert into public.system_settings (key, value, value_type, category, description) values
  ('systemName',           'TPDOP – Tanzania Police Digital Operations Platform', 'string',  'general',     'Display name of the system'),
  ('version',              '1.0.0',                                                'string',  'general',     'Current software version'),
  ('sessionTimeout',       '30',                                                   'number',  'security',    'Session idle timeout in minutes'),
  ('maxLoginAttempts',     '5',                                                    'number',  'security',    'Max failed login attempts before lockout'),
  ('require2fa',           'true',                                                 'boolean', 'security',    'Require 2FA for all officers'),
  ('auditLogging',         'true',                                                 'boolean', 'security',    'Audit logging enabled'),
  ('gpsTracking',          'true',                                                 'boolean', 'security',    'GPS tracking active for field officers'),
  ('maintenanceMode',      'false',                                                'boolean', 'security',    'Maintenance mode (blocks non-admin logins)'),
  ('emailNotifications',   'true',                                                 'boolean', 'notifications','Email notifications enabled'),
  ('smsNotifications',     'true',                                                 'boolean', 'notifications','SMS notifications enabled'),
  ('language',             'en',                                                   'string',  'general',     'Default system language')
on conflict (key) do nothing;

select 'TPDOP SYSTEM SETTINGS COMPLETE' as status,
       'system_settings table + RLS + audit trigger + 11 default settings' as summary;
