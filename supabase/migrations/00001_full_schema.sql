-- =========================================================
-- TPDOP – Full Schema (run AFTER 00000_drop_all.sql)
-- Tanzania Police Digital Operations Platform
-- =========================================================

-- ══════════════════════════════════════════════════════════
-- EXTENSIONS
-- ══════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ══════════════════════════════════════════════════════════
-- SHARED FUNCTION: auto-update updated_at
-- ══════════════════════════════════════════════════════════
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ══════════════════════════════════════════════════════════
-- LOCATION HIERARCHY
-- ══════════════════════════════════════════════════════════
create table public.zones (
  id   uuid primary key default uuid_generate_v4(),
  name text not null unique,
  code text unique
);

create table public.regions (
  id      uuid primary key default uuid_generate_v4(),
  name    text not null unique,
  code    text unique,
  zone_id uuid references zones on delete set null
);

create table public.districts (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null,
  code      text unique,
  region_id uuid not null references regions on delete cascade,
  unique(name, region_id)
);

create table public.stations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  code        text unique,
  type        text default 'police_station',
  district_id uuid references districts on delete set null,
  region_id   uuid references regions   on delete set null,
  address     text,
  phone       text,
  lat         double precision,
  lng         double precision,
  ocs_id      uuid,
  status      text default 'active',
  created_at  timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- ROLES
-- ══════════════════════════════════════════════════════════
create table public.roles (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  label_sw    text,
  label_en    text,
  scope       text not null,
  permissions jsonb not null default '[]'
);

insert into public.roles (name, label_sw, label_en, scope, permissions) values
  ('igp',             'Mkurugenzi Mkuu',              'Inspector General',         'national', '["all"]'),
  ('digp',            'Naibu Mkurugenzi Mkuu',        'Deputy IGP',                'national', '["all"]'),
  ('rpc',             'Kamanda wa Mkoa',              'Regional Commander',         'regional', '["view_intelligence","manage_region","all_reports","manage_officers"]'),
  ('ocd',             'Kamanda wa Wilaya',            'District Commander',         'district', '["manage_district","citations","arrests","cases","incidents","reports"]'),
  ('ocs',             'Kamanda wa Kituo',             'Station Commander',          'station',  '["manage_station","citations","arrests","incidents","detentions","cells"]'),
  ('inspector',       'Inspekta',                     'Inspector',                 'station',  '["citations","arrests","incidents","cases","persons","vehicles"]'),
  ('cid_officer',     'Afisa wa CID',                 'CID Officer',               'unit',     '["cases","evidence","warrants","forensics","persons","vehicles","arrests"]'),
  ('regular_officer', 'Afisa wa Kawaida',             'Regular Officer',            'station',  '["citations","arrests","incidents","patrol","persons","vehicles"]'),
  ('traffic_officer', 'Afisa wa Barabara',            'Traffic Officer',            'station',  '["citations","accidents","vehicles","persons","patrol"]'),
  ('admin_officer',   'Msimamizi wa Mfumo',           'Admin Officer',              'national', '["all","manage_users","create_accounts","system_settings","roles_management","audit_logs"]');

-- ══════════════════════════════════════════════════════════
-- PROFILES (Officers)
-- ══════════════════════════════════════════════════════════
create table public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  badge          text unique not null,
  full_name      text not null,
  rank           text not null,
  role           text not null references roles(name),
  station_id     uuid references stations,
  region_id      uuid references regions,
  district_id    uuid references districts,
  department     text,
  phone          text,
  email          text,
  photo_url      text,
  nida           text unique,
  device_id      text,
  status         text default 'active',
  last_login_at  timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index idx_profiles_badge   on profiles(badge);
create index idx_profiles_station on profiles(station_id);
create index idx_profiles_role    on profiles(role);

create trigger trg_profiles_upd before update on profiles
  for each row execute function update_updated_at();

-- Now set the FK from stations.ocs_id → profiles
alter table stations
  add constraint fk_ocs foreign key (ocs_id) references profiles(id) on delete set null;

-- ══════════════════════════════════════════════════════════
-- PERSONS
-- ══════════════════════════════════════════════════════════
create table public.persons (
  id           uuid primary key default uuid_generate_v4(),
  nida         text unique,
  tin          text unique,
  inec         text unique,
  passport     text unique,
  full_name    text not null,
  gender       text,
  dob          date,
  nationality  text default 'Tanzanian',
  phone        text,
  email        text,
  address      text,
  region       text,
  district     text,
  ward         text,
  father_name  text,
  mother_name  text,
  photo_url    text,
  license_no   text unique,
  license_class text,
  license_expires date,
  warning      boolean default false,
  watchlist    boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_persons_nida      on persons(nida);
create index idx_persons_tin       on persons(tin);
create index idx_persons_passport  on persons(passport);
create index idx_persons_license   on persons(license_no);
create index idx_persons_phone     on persons(phone);
create index idx_persons_name      on persons using gin(full_name gin_trgm_ops);

create trigger trg_persons_upd before update on persons
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════════════════
-- VEHICLES
-- ══════════════════════════════════════════════════════════
create table public.vehicles (
  id             uuid primary key default uuid_generate_v4(),
  plate          text unique not null,
  make           text,
  model          text,
  year           int,
  color          text,
  vin            text unique,
  owner_id       uuid references persons on delete set null,
  insurance_co   text,
  insurance_exp  date,
  stolen         boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index idx_vehicles_plate  on vehicles(plate);
create index idx_vehicles_owner  on vehicles(owner_id);
create index idx_vehicles_stolen on vehicles(stolen) where stolen = true;

create trigger trg_vehicles_upd before update on vehicles
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════════════════
-- AUTO-NUMBERING SEQUENCES
-- ══════════════════════════════════════════════════════════
create sequence seq_citation  start 1;
create sequence seq_arrest    start 1;
create sequence seq_detention start 1;
create sequence seq_incident  start 1;
create sequence seq_accident  start 1;
create sequence seq_case      start 1;
create sequence seq_evidence  start 1;
create sequence seq_warrant   start 1;
create sequence seq_intel     start 1;
create sequence seq_prisoner  start 1;
create sequence seq_patrol    start 1;

create or replace function gen_id(prefix text, seq regclass)
returns text language sql as $$
  select prefix || to_char(now(),'YYYY') || '-' || lpad(nextval(seq)::text,5,'0')
$$;

-- ══════════════════════════════════════════════════════════
-- CITATIONS
-- ══════════════════════════════════════════════════════════
create table public.citations (
  id            uuid primary key default uuid_generate_v4(),
  citation_no   text unique default gen_id('CIT-','seq_citation'),
  suspect_id    uuid references persons  on delete set null,
  vehicle_id    uuid references vehicles on delete set null,
  officer_id    uuid not null references profiles,
  station_id    uuid references stations,
  offence_code  text not null,
  offence_name  text,
  law_section   text,
  fine_amount   bigint not null default 0,
  location      text,
  lat           double precision,
  lng           double precision,
  photos        jsonb default '[]',
  notes         text,
  device_id     text,
  paid_at       timestamptz,
  payment_ref   text,
  status        text default 'issued' check (status in ('draft','issued','paid','unpaid','cancelled')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_citations_officer  on citations(officer_id);
create index idx_citations_station  on citations(station_id);
create index idx_citations_status   on citations(status);
create index idx_citations_created  on citations(created_at desc);

create trigger trg_citations_upd before update on citations
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════════════════
-- ARRESTS
-- ══════════════════════════════════════════════════════════
create table public.arrests (
  id                uuid primary key default uuid_generate_v4(),
  arrest_no         text unique default gen_id('AR-','seq_arrest'),
  suspect_id        uuid references persons on delete set null,
  officer_id        uuid not null references profiles,
  station_id        uuid references stations,
  arrest_time       timestamptz not null default now(),
  location          text,
  lat               double precision,
  lng               double precision,
  method            text,
  rights_read       boolean default false,
  witnesses         jsonb default '[]',
  officers_present  jsonb default '[]',
  photos            jsonb default '[]',
  description       text,
  device_id         text,
  status            text default 'pending' check (status in ('pending','detained','court','released','completed')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table public.arrest_charges (
  id          uuid primary key default uuid_generate_v4(),
  arrest_id   uuid not null references arrests on delete cascade,
  charge_code text not null,
  charge_name text,
  law_section text,
  charge_type text,
  created_at  timestamptz default now()
);

create index idx_arrests_officer on arrests(officer_id);
create index idx_arrests_station on arrests(station_id);
create index idx_arrests_status  on arrests(status);
create index idx_arrests_time    on arrests(arrest_time desc);

create trigger trg_arrests_upd before update on arrests
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════════════════
-- DETENTIONS
-- ══════════════════════════════════════════════════════════
create table public.detentions (
  id             uuid primary key default uuid_generate_v4(),
  detention_no   text unique default gen_id('DET-','seq_detention'),
  person_id      uuid references persons on delete set null,
  arrest_id      uuid references arrests on delete set null,
  officer_id     uuid not null references profiles,
  station_id     uuid references stations,
  cell_no        text,
  reason         text,
  checkin_time   timestamptz default now(),
  checkout_time  timestamptz,
  max_hours      int default 48,
  status         text default 'active' check (status in ('active','released','transferred')),
  created_at     timestamptz default now()
);

create index idx_detentions_station on detentions(station_id);
create index idx_detentions_status  on detentions(status);

-- ══════════════════════════════════════════════════════════
-- INCIDENT REPORTS
-- ══════════════════════════════════════════════════════════
create table public.incident_reports (
  id           uuid primary key default uuid_generate_v4(),
  report_no    text unique default gen_id('INC-','seq_incident'),
  type         text not null,
  description  text,
  officer_id   uuid not null references profiles,
  station_id   uuid references stations,
  location     text,
  lat          double precision,
  lng          double precision,
  occurred_at  timestamptz,
  priority     text default 'medium' check (priority in ('low','medium','high','critical')),
  damage_value bigint default 0,
  injured      boolean default false,
  witnesses    jsonb default '[]',
  attachments  jsonb default '[]',
  status       text default 'pending' check (status in ('pending','investigating','resolved','closed')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger trg_incidents_upd before update on incident_reports
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════════════════
-- ACCIDENT REPORTS
-- ══════════════════════════════════════════════════════════
create table public.accident_reports (
  id             uuid primary key default uuid_generate_v4(),
  report_no      text unique default gen_id('ACC-','seq_accident'),
  officer_id     uuid not null references profiles,
  station_id     uuid references stations,
  location       text,
  lat            double precision,
  lng            double precision,
  occurred_at    timestamptz,
  type           text,
  vehicles_count int default 0,
  casualties     int default 0,
  description    text,
  damage_value   bigint default 0,
  photos         jsonb default '[]',
  status         text default 'pending',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- CASES
-- ══════════════════════════════════════════════════════════
create table public.cases (
  id          uuid primary key default uuid_generate_v4(),
  case_no     text unique default gen_id('CASE-','seq_case'),
  title       text not null,
  type        text not null,
  officer_id  uuid not null references profiles,
  station_id  uuid references stations,
  priority    text default 'medium' check (priority in ('low','medium','high','critical')),
  status      text default 'open'   check (status in ('open','investigating','pending','court','closed')),
  description text,
  suspects    jsonb default '[]',
  witnesses   jsonb default '[]',
  closed_at   timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table public.case_updates (
  id         uuid primary key default uuid_generate_v4(),
  case_id    uuid not null references cases on delete cascade,
  officer_id uuid not null references profiles,
  type       text default 'update',
  content    text not null,
  created_at timestamptz default now()
);

create index idx_cases_officer  on cases(officer_id);
create index idx_cases_station  on cases(station_id);
create index idx_cases_status   on cases(status);
create index idx_cases_priority on cases(priority);

create trigger trg_cases_upd before update on cases
  for each row execute function update_updated_at();

-- ══════════════════════════════════════════════════════════
-- EVIDENCE
-- ══════════════════════════════════════════════════════════
create table public.evidence (
  id           uuid primary key default uuid_generate_v4(),
  evidence_no  text unique default gen_id('EVD-','seq_evidence'),
  case_id      uuid not null references cases on delete cascade,
  type         text not null,
  description  text,
  file_url     text,
  file_name    text,
  file_size    bigint,
  file_hash    text,
  collected_by uuid not null references profiles,
  collected_at timestamptz default now(),
  location     text,
  status       text default 'active',
  created_at   timestamptz default now()
);

create table public.evidence_chain (
  id          uuid primary key default uuid_generate_v4(),
  evidence_id uuid not null references evidence on delete cascade,
  officer_id  uuid not null references profiles,
  action      text not null,
  notes       text,
  created_at  timestamptz default now()
);

create index idx_evidence_case on evidence(case_id);

-- ══════════════════════════════════════════════════════════
-- WARRANTS
-- ══════════════════════════════════════════════════════════
create table public.warrants (
  id          uuid primary key default uuid_generate_v4(),
  warrant_no  text unique default gen_id('WRT-','seq_warrant'),
  person_id   uuid references persons on delete set null,
  case_id     uuid references cases   on delete set null,
  type        text not null check (type in ('arrest','search','seizure')),
  court       text not null,
  judge       text,
  description text,
  issued_at   timestamptz,
  expires_at  timestamptz,
  executed_at timestamptz,
  urgent      boolean default false,
  status      text default 'active' check (status in ('active','executed','expired','cancelled')),
  created_at  timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- WANTED PERSONS
-- ══════════════════════════════════════════════════════════
create table public.wanted_persons (
  id          uuid primary key default uuid_generate_v4(),
  person_id   uuid references persons on delete set null,
  case_id     uuid references cases   on delete set null,
  crime       text not null,
  alias       text,
  description text,
  last_seen   text,
  last_seen_at timestamptz,
  region      text,
  reward      bigint default 0,
  dangerous   boolean default false,
  armed       boolean default false,
  added_by    uuid references profiles,
  status      text default 'active' check (status in ('active','captured','cancelled')),
  created_at  timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- MISSING PERSONS
-- ══════════════════════════════════════════════════════════
create table public.missing_persons (
  id               uuid primary key default uuid_generate_v4(),
  person_id        uuid references persons on delete set null,
  reporter_name    text,
  reporter_phone   text,
  last_seen        text,
  last_seen_at     timestamptz,
  description      text,
  officer_id       uuid references profiles,
  station_id       uuid references stations,
  status           text default 'active' check (status in ('active','found','closed')),
  found_at         timestamptz,
  created_at       timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- OPERATIONS
-- ══════════════════════════════════════════════════════════
create table public.patrols (
  id          uuid primary key default uuid_generate_v4(),
  patrol_no   text unique default gen_id('PAT-','seq_patrol'),
  officer_id  uuid not null references profiles,
  station_id  uuid references stations,
  route       text,
  start_time  timestamptz default now(),
  end_time    timestamptz,
  lat         double precision,
  lng         double precision,
  status      text default 'active' check (status in ('active','completed','aborted')),
  created_at  timestamptz default now()
);

create table public.officer_locations (
  officer_id uuid primary key references profiles on delete cascade,
  lat        double precision not null,
  lng        double precision not null,
  accuracy   double precision,
  status     text default 'on_duty',
  updated_at timestamptz default now()
);

create table public.checkpoints (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  officer_id   uuid not null references profiles,
  station_id   uuid references stations,
  location     text,
  lat          double precision,
  lng          double precision,
  start_time   timestamptz default now(),
  end_time     timestamptz,
  checks_count int default 0,
  status       text default 'active',
  created_at   timestamptz default now()
);

create table public.roadblocks (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  location     text,
  lat          double precision,
  lng          double precision,
  officer_id   uuid not null references profiles,
  station_id   uuid references stations,
  start_time   timestamptz not null,
  end_time     timestamptz,
  checks_count int default 0,
  arrests_count int default 0,
  status       text default 'active',
  created_at   timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- INTELLIGENCE
-- ══════════════════════════════════════════════════════════
create table public.intelligence_files (
  id             uuid primary key default uuid_generate_v4(),
  intel_no       text unique default gen_id('INT-','seq_intel'),
  title          text not null,
  classification text not null default 'confidential'
                 check (classification in ('restricted','confidential','secret','top_secret')),
  threat_level   text default 'medium' check (threat_level in ('low','medium','high','critical')),
  content        text,
  region         text,
  source         text,
  created_by     uuid not null references profiles,
  status         text default 'active',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- ALERTS & MESSAGES
-- ══════════════════════════════════════════════════════════
create table public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null check (type in ('critical','urgent','info','reminder')),
  title       text not null,
  message     text,
  region      text,
  target_role text,
  created_by  uuid references profiles,
  expires_at  timestamptz,
  status      text default 'active',
  created_at  timestamptz default now()
);

create table public.messages (
  id         uuid primary key default uuid_generate_v4(),
  from_id    uuid not null references profiles on delete cascade,
  to_id      uuid references profiles on delete set null,
  content    text not null,
  priority   text default 'normal',
  read_at    timestamptz,
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- MANAGEMENT: Cells · Prisoners · Courts · Firearms · HR
-- ══════════════════════════════════════════════════════════
create table public.cells (
  id         uuid primary key default uuid_generate_v4(),
  cell_no    text not null,
  station_id uuid not null references stations on delete cascade,
  capacity   int  not null default 4,
  type       text default 'holding',
  gender     text default 'mixed',
  status     text default 'available',
  created_at timestamptz default now(),
  unique(cell_no, station_id)
);

create table public.prisoners (
  id             uuid primary key default uuid_generate_v4(),
  prisoner_no    text unique default gen_id('PRN-','seq_prisoner'),
  person_id      uuid not null references persons on delete restrict,
  arrest_id      uuid references arrests  on delete set null,
  cell_id        uuid references cells    on delete set null,
  station_id     uuid not null references stations,
  checkin_time   timestamptz default now(),
  checkout_time  timestamptz,
  reason         text,
  officer_id     uuid not null references profiles,
  status         text default 'active' check (status in ('active','released','transferred','court')),
  created_at     timestamptz default now()
);

create table public.court_cases (
  id         uuid primary key default uuid_generate_v4(),
  case_id    uuid references cases   on delete cascade,
  arrest_id  uuid references arrests on delete set null,
  court      text not null,
  judge      text,
  next_hearing date,
  verdict    text,
  status     text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.firearms (
  id          uuid primary key default uuid_generate_v4(),
  serial_no   text unique not null,
  type        text not null,
  make        text,
  model       text,
  caliber     text,
  station_id  uuid references stations,
  issued_to   uuid references profiles on delete set null,
  date_issued date,
  condition   text default 'Good',
  status      text default 'armory',
  created_at  timestamptz default now()
);

create table public.assets (
  id          uuid primary key default uuid_generate_v4(),
  asset_no    text unique not null,
  name        text not null,
  type        text,
  station_id  uuid references stations,
  assigned_to uuid references profiles on delete set null,
  condition   text default 'Good',
  status      text default 'active',
  created_at  timestamptz default now()
);

create table public.hr_records (
  id          uuid primary key default uuid_generate_v4(),
  officer_id  uuid not null references profiles on delete cascade,
  type        text not null,
  title       text,
  description text,
  date        date,
  created_by  uuid references profiles,
  created_at  timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- AUDIT LOGS (Immutable)
-- ══════════════════════════════════════════════════════════
create table public.audit_logs (
  id           uuid primary key default uuid_generate_v4(),
  officer_id   uuid references profiles on delete set null,
  badge        text,
  rank         text,
  full_name    text,
  station_name text,
  action       text not null,
  table_name   text,
  record_id    uuid,
  record_no    text,
  old_data     jsonb,
  new_data     jsonb,
  lat          double precision,
  lng          double precision,
  device_id    text,
  ip_address   text,
  created_at   timestamptz default now()
);

create index idx_audit_officer on audit_logs(officer_id, created_at desc);
create index idx_audit_action  on audit_logs(action);
create index idx_audit_date    on audit_logs(created_at desc);

-- Prevent deletion of audit records
create rule no_delete_audit as on delete to audit_logs do instead nothing;
create rule no_update_audit as on update to audit_logs do instead nothing;

-- ══════════════════════════════════════════════════════════
-- PF3 FORMS
-- ══════════════════════════════════════════════════════════
create table public.pf3_forms (
  id         uuid primary key default uuid_generate_v4(),
  form_no    text unique not null,
  person_id  uuid references persons on delete set null,
  officer_id uuid not null references profiles,
  station_id uuid references stations,
  type       text not null,
  details    jsonb default '{}',
  status     text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- AUDIT TRIGGER – log every action automatically
-- ══════════════════════════════════════════════════════════
create or replace function log_audit()
returns trigger language plpgsql security definer as $$
declare
  v_officer profiles%rowtype;
  v_station_name text;
  v_action text;
  v_id uuid;
begin
  select * into v_officer from profiles where id = auth.uid();
  select name into v_station_name from stations where id = v_officer.station_id;
  v_action := TG_OP || '_' || upper(TG_TABLE_NAME);
  v_id := case when TG_OP = 'DELETE' then OLD.id else NEW.id end;

  insert into audit_logs(officer_id, badge, rank, full_name, station_name, action, table_name, record_id,
    old_data, new_data)
  values (v_officer.id, v_officer.badge, v_officer.rank, v_officer.full_name, v_station_name,
    v_action, TG_TABLE_NAME, v_id,
    case when TG_OP != 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP != 'DELETE' then to_jsonb(NEW) else null end);

  if TG_OP = 'DELETE' then return OLD; else return NEW; end if;
end;
$$;

create trigger aud_citations after insert or update or delete on citations          for each row execute function log_audit();
create trigger aud_arrests   after insert or update or delete on arrests            for each row execute function log_audit();
create trigger aud_cases     after insert or update or delete on cases              for each row execute function log_audit();
create trigger aud_evidence  after insert or update or delete on evidence           for each row execute function log_audit();
create trigger aud_warrants  after insert or update or delete on warrants           for each row execute function log_audit();
create trigger aud_intel     after insert or update or delete on intelligence_files for each row execute function log_audit();
create trigger aud_prisoners after insert or update or delete on prisoners          for each row execute function log_audit();

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════
alter table profiles           enable row level security;
alter table citations          enable row level security;
alter table arrests            enable row level security;
alter table arrest_charges     enable row level security;
alter table detentions         enable row level security;
alter table incident_reports   enable row level security;
alter table cases              enable row level security;
alter table evidence           enable row level security;
alter table warrants           enable row level security;
alter table intelligence_files enable row level security;
alter table audit_logs         enable row level security;
alter table prisoners          enable row level security;
alter table cells              enable row level security;
alter table messages           enable row level security;
alter table alerts             enable row level security;

-- Helper functions
create or replace function my_role()     returns text    language sql security definer stable as $$ select role        from profiles where id = auth.uid() $$;
create or replace function my_station()  returns uuid    language sql security definer stable as $$ select station_id  from profiles where id = auth.uid() $$;
create or replace function my_region()   returns uuid    language sql security definer stable as $$ select region_id   from profiles where id = auth.uid() $$;
create or replace function my_district() returns uuid    language sql security definer stable as $$ select district_id from profiles where id = auth.uid() $$;
create or replace function is_national() returns boolean language sql security definer stable as $$ select my_role() in ('igp','digp') $$;

-- PROFILES
create policy "view own profile"    on profiles for select using (id = auth.uid());
create policy "national view all"   on profiles for select using (is_national());
create policy "update own profile"  on profiles for update using (id = auth.uid());

-- CITATIONS
create policy "national citations"  on citations for all    using (is_national());
create policy "station citations"   on citations for select using (station_id = my_station());
create policy "create citation"     on citations for insert with check (officer_id = auth.uid());
create policy "update own citation" on citations for update using (officer_id = auth.uid());

-- ARRESTS
create policy "national arrests"    on arrests for all    using (is_national());
create policy "station arrests"     on arrests for select using (station_id = my_station());
create policy "create arrest"       on arrests for insert with check (officer_id = auth.uid());
create policy "update own arrest"   on arrests for update using (officer_id = auth.uid());

-- CASES
create policy "national cases"      on cases for all    using (is_national());
create policy "cid cases"           on cases for all    using (my_role() in ('cid_officer','inspector'));
create policy "station cases"       on cases for select using (station_id = my_station());

-- EVIDENCE
create policy "national evidence"   on evidence for all    using (is_national());
create policy "case evidence"       on evidence for select using (
  case_id in (select id from cases where station_id = my_station()) or is_national()
);

-- INTELLIGENCE: RPC and above only
create policy "intel rpc+"          on intelligence_files for all using (my_role() in ('igp','digp','rpc'));

-- AUDIT LOGS: national read-only
create policy "audit national"      on audit_logs for select using (is_national());
create policy "audit insert"        on audit_logs for insert with check (officer_id = auth.uid());

-- ALERTS
create policy "alerts read"         on alerts for select using (target_role is null or target_role = my_role() or is_national());
create policy "alerts create"       on alerts for insert with check (created_by = auth.uid());

-- MESSAGES
create policy "messages own"        on messages for select using (from_id = auth.uid() or to_id = auth.uid());
create policy "messages send"       on messages for insert with check (from_id = auth.uid());

-- PRISONERS/CELLS
create policy "prisoners station"   on prisoners for select using (station_id = my_station() or is_national());
create policy "cells station"       on cells     for select using (station_id = my_station() or is_national());

select 'TPDOP SCHEMA COMPLETE ✓' as status;
