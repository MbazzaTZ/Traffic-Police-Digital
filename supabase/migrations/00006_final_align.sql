-- =========================================================
-- TPDOP – Final Column & CHECK Alignment Migration
-- =========================================================
-- Closes out the remaining schema-vs-code drift identified
-- by the page-by-page column scan.
--
-- What this migration does:
-- 1. Widens 9 CHECK constraints that the 00004 migration missed
-- 2. Adds location FK columns to persons (region_id/district_id/ward_id)
-- 3. Adds alias columns to missing_persons, stolen_property, stolen_vehicles
--    so the generic RegistriesPage form keeps working
-- 4. Adds alias columns to citation_requests (driver_phone, officer_notes)
-- 5. Adds alias columns to persons (alias, tribe, notes, photo_urls, created_by)
-- 6. Adds patrols.region_id, district_id, duration_mins for PatrolDashboardPage
-- 7. Adds detentions.detained_at alias
-- 8. Adds firearms.lost_stolen_date
-- 9. Adds court_cases.concluded_date
-- 10. Adds missing_persons.found_date alias (for RegistriesPage)
-- 11. Adds alerts.type widening to allow 'warning','danger','emergency'
--
-- All changes are idempotent and additive.
-- =========================================================

-- ══════════════════════════════════════════════════════════
-- 1. WIDEN CHECK CONSTRAINTS
-- ══════════════════════════════════════════════════════════

-- incident_reports.status: add 'open' (IncidentReportsPage writes "open")
alter table public.incident_reports drop constraint if exists incident_reports_status_check;
alter table public.incident_reports add constraint incident_reports_status_check
  check (status in ('pending','open','active','investigating','resolved','closed','cancelled'));

-- citations.status: add 'open','partial','contested'
alter table public.citations drop constraint if exists citations_status_check;
alter table public.citations add constraint citations_status_check
  check (status in ('draft','issued','paid','unpaid','cancelled','open','partial','contested','overdue','waived'));

-- alerts.type: add 'warning','danger','emergency'
alter table public.alerts drop constraint if exists alerts_type_check;
alter table public.alerts add constraint alerts_type_check
  check (type in ('critical','urgent','info','reminder','warning','danger','emergency','success'));

-- hearings.hearing_type: add 'plea','prosecution_evidence','defence_evidence','judgment','sentence','appeal'
alter table public.hearings drop constraint if exists hearings_hearing_type_check;
alter table public.hearings add constraint hearings_hearing_type_check
  check (hearing_type in ('mention','trial','ruling','sentencing','adjournment','pretrial','plea','prosecution_evidence','defence_evidence','judgment','sentence','appeal','conference'));

-- court_cases.status: add 'concluded','appealed'
alter table public.court_cases drop constraint if exists court_cases_status_check;
alter table public.court_cases add constraint court_cases_status_check
  check (status in ('pending','open','active','adjourned','hearing','ruling','sentencing','closed','acquitted','convicted','dismissed','withdrawn','concluded','appealed'));

-- firearm_licenses.license_type: add 'civilian_carry','hunting','security','collector'
alter table public.firearm_licenses drop constraint if exists firearm_licenses_license_type_check;
alter table public.firearm_licenses add constraint firearm_licenses_license_type_check
  check (license_type in ('private','official','special','temporary','dealer','civilian_carry','hunting','security','collector','manufacture'));

-- payments.method: add 'tigo_pesa','ezypesa','bank_transfer' (with underscore, as used in PaymentsPage)
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check
  check (method in ('cash','mpesa','tigopesa','tigo_pesa','airtel_money','halopesa','ezypesa','bank','bank_transfer','card','other'));

-- requests.priority: add 'emergency'
alter table public.requests drop constraint if exists requests_priority_check;
alter table public.requests add constraint requests_priority_check
  check (priority in ('low','normal','high','urgent','emergency'));

-- missing_persons.status: add 'missing','deceased'
alter table public.missing_persons drop constraint if exists missing_persons_status_check;
alter table public.missing_persons add constraint missing_persons_status_check
  check (status in ('active','missing','found','closed','deceased'));

-- ══════════════════════════════════════════════════════════
-- 2. PERSONS — add location FKs + alias columns
-- (PersonSearchPage writes these via Add Person modal)
-- ══════════════════════════════════════════════════════════
alter table public.persons add column if not exists alias        text;
alter table public.persons add column if not exists tribe        text;
alter table public.persons add column if not exists region_id    uuid references public.regions;
alter table public.persons add column if not exists district_id  uuid references public.districts;
alter table public.persons add column if not exists ward_id      uuid references public.wards;
alter table public.persons add column if not exists notes        text;
alter table public.persons add column if not exists photo_urls   jsonb default '[]';
alter table public.persons add column if not exists created_by   uuid references public.profiles;
alter table public.persons add column if not exists passport_country text;
alter table public.persons add column if not exists middle_name  text;

-- Backfill region_id/district_id from text columns where possible
update public.persons p
  set region_id = r.id
  from public.regions r
  where p.region_id is null and lower(p.region) = lower(r.name);

update public.persons p
  set district_id = d.id
  from public.districts d
  where p.district_id is null
    and p.region_id is not null
    and d.region_id = p.region_id
    and lower(p.district) = lower(d.name);

create index if not exists idx_persons_region_id   on public.persons(region_id);
create index if not exists idx_persons_district_id on public.persons(district_id);
create index if not exists idx_persons_created_by   on public.persons(created_by);

-- ══════════════════════════════════════════════════════════
-- 3. MISSING_PERSONS — alias columns used by RegistriesPage
-- ══════════════════════════════════════════════════════════
alter table public.missing_persons add column if not exists ref_number          text;
alter table public.missing_persons add column if not exists full_name           text;
alter table public.missing_persons add column if not exists nida                text;
alter table public.missing_persons add column if not exists age                 int;
alter table public.missing_persons add column if not exists gender              text;
alter table public.missing_persons add column if not exists last_seen_location  text;
alter table public.missing_persons add column if not exists last_seen_date      timestamptz;
alter table public.missing_persons add column if not exists clothing            text;
alter table public.missing_persons add column if not exists relationship        text;
alter table public.missing_persons add column if not exists photo_urls          jsonb default '[]';
alter table public.missing_persons add column if not exists region_id           uuid references public.regions;
alter table public.missing_persons add column if not exists district_id         uuid references public.districts;
alter table public.missing_persons add column if not exists ward_id             uuid references public.wards;
alter table public.missing_persons add column if not exists reported_by         uuid references public.profiles;
alter table public.missing_persons add column if not exists found_date          timestamptz; -- alias for found_at

-- Backfill
update public.missing_persons set last_seen_location = last_seen where last_seen_location is null and last_seen is not null;
update public.missing_persons set last_seen_date     = last_seen_at where last_seen_date is null and last_seen_at is not null;
update public.missing_persons set reported_by        = officer_id where reported_by is null and officer_id is not null;
update public.missing_persons set found_date         = found_at where found_date is null and found_at is not null;

create index if not exists idx_missing_persons_status    on public.missing_persons(status);
create index if not exists idx_missing_persons_full_name on public.missing_persons using gin(full_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- 4. STOLEN_PROPERTY — alias columns used by RegistriesPage
-- ══════════════════════════════════════════════════════════
alter table public.stolen_property add column if not exists category       text; -- alias for item_type
alter table public.stolen_property add column if not exists serial_number  text; -- alias for serial_no
alter table public.stolen_property add column if not exists imei           text;
alter table public.stolen_property add column if not exists reported_by    uuid references public.profiles; -- alias for officer_id
alter table public.stolen_property add column if not exists recovered_date timestamptz;

-- Backfill
update public.stolen_property set category      = item_type where category is null and item_type is not null;
update public.stolen_property set serial_number = serial_no where serial_number is null and serial_no is not null;
update public.stolen_property set reported_by   = officer_id where reported_by is null and officer_id is not null;

-- ══════════════════════════════════════════════════════════
-- 5. STOLEN_VEHICLES — alias columns used by RegistriesPage
-- ══════════════════════════════════════════════════════════
alter table public.stolen_vehicles add column if not exists notes          text; -- alias for description
alter table public.stolen_vehicles add column if not exists reported_by    uuid references public.profiles; -- alias for officer_id
alter table public.stolen_vehicles add column if not exists recovered_date timestamptz;

-- Backfill
update public.stolen_vehicles set notes       = description where notes is null and description is not null;
update public.stolen_vehicles set reported_by = officer_id  where reported_by is null and officer_id is not null;

-- ══════════════════════════════════════════════════════════
-- 6. CITATION_REQUESTS — alias columns used by CitationRequestsPage
-- ══════════════════════════════════════════════════════════
alter table public.citation_requests add column if not exists driver_phone  text;
alter table public.citation_requests add column if not exists officer_notes text; -- alias for notes

-- Backfill
update public.citation_requests set officer_notes = notes where officer_notes is null and notes is not null;

-- ══════════════════════════════════════════════════════════
-- 7. PATROLS — PatrolDashboardPage writes region_id, district_id, duration_mins
-- ══════════════════════════════════════════════════════════
alter table public.patrols add column if not exists region_id     uuid references public.regions;
alter table public.patrols add column if not exists district_id   uuid references public.districts;
alter table public.patrols add column if not exists ward_id       uuid references public.wards;
alter table public.patrols add column if not exists duration_mins int;
alter table public.patrols add column if not exists route_text    text; -- alias for route
alter table public.patrols add column if not exists notes         text;

-- Backfill duration_mins from start/end times
update public.patrols
  set duration_mins = extract(epoch from (coalesce(end_time, now()) - start_time))::int / 60
  where duration_mins is null and start_time is not null;

create index if not exists idx_patrols_officer on public.patrols(officer_id);
create index if not exists idx_patrols_station on public.patrols(station_id);

-- ══════════════════════════════════════════════════════════
-- 8. DETENTIONS — DetentionsPage reads detained_at (alias for checkin_time)
-- ══════════════════════════════════════════════════════════
alter table public.detentions add column if not exists detained_at timestamptz;
update public.detentions set detained_at = checkin_time where detained_at is null and checkin_time is not null;

-- ══════════════════════════════════════════════════════════
-- 9. FIREARMS — FirearmsPage status update writes lost_stolen_date
-- ══════════════════════════════════════════════════════════
alter table public.firearms add column if not exists lost_stolen_date timestamptz;

-- Relax firearms.status (code uses 'active','lost','stolen','repair','retired')
alter table public.firearms drop constraint if exists firearms_status_check;
alter table public.firearms add constraint firearms_status_check
  check (status in ('armory','active','issued','lost','stolen','repair','retired','destroyed'));

-- ══════════════════════════════════════════════════════════
-- 10. COURT_CASES — CourtCasesPage verdict update writes concluded_date
-- ══════════════════════════════════════════════════════════
alter table public.court_cases add column if not exists concluded_date timestamptz;
alter table public.court_cases add column if not exists verdict        text; -- alias if not present

-- ══════════════════════════════════════════════════════════
-- 11. CITATIONS — CitationsPage reads c.fine_paid (alias)
-- ══════════════════════════════════════════════════════════
alter table public.citations add column if not exists fine_paid bigint default 0;
-- Trigger to keep fine_paid in sync with amount_paid
create or replace function sync_citation_fine_paid()
returns trigger language plpgsql as $$
begin
  new.fine_paid := coalesce(new.amount_paid, 0);
  return new;
end;
$$;
drop trigger if exists trg_citations_fine_paid on public.citations;
create trigger trg_citations_fine_paid before insert or update on public.citations
  for each row execute function sync_citation_fine_paid();

-- ══════════════════════════════════════════════════════════
-- 12. VEHICLES — VehicleProfilePage + PersonProfilePage read various alias columns
-- ══════════════════════════════════════════════════════════
alter table public.vehicles add column if not exists is_stolen         boolean default false;
alter table public.vehicles add column if not exists stolen_date       timestamptz;
alter table public.vehicles add column if not exists vehicle_type      text;
alter table public.vehicles add column if not exists engine_number     text;
alter table public.vehicles add column if not exists chassis_number    text;
alter table public.vehicles add column if not exists registration_date date;
alter table public.vehicles add column if not exists insurance_company text;
alter table public.vehicles add column if not exists insurance_expiry  date;
alter table public.vehicles add column if not exists insurance_valid   boolean default false;
alter table public.vehicles add column if not exists owner_name        text;
alter table public.vehicles add column if not exists owner_phone       text;

-- Backfill aliases from canonical columns
update public.vehicles set is_stolen         = stolen         where is_stolen is null;
update public.vehicles set insurance_company = insurance_co   where insurance_company is null and insurance_co is not null;
update public.vehicles set insurance_expiry  = insurance_exp  where insurance_expiry is null and insurance_exp is not null;
update public.vehicles set insurance_valid   = (insurance_exp is not null and insurance_exp > current_date);

-- Sync trigger: keep is_stolen in sync with stolen
create or replace function sync_vehicle_stolen()
returns trigger language plpgsql as $$
begin
  new.is_stolen := coalesce(new.stolen, false);
  return new;
end;
$$;
drop trigger if exists trg_vehicles_stolen on public.vehicles;
create trigger trg_vehicles_stolen before insert or update on public.vehicles
  for each row execute function sync_vehicle_stolen();

-- ══════════════════════════════════════════════════════════
-- 13. PROFILES — OfficersPage writes ward_id; reads region/district text + last_sign_in_at
-- ══════════════════════════════════════════════════════════
alter table public.profiles add column if not exists ward_id        uuid references public.wards;
alter table public.profiles add column if not exists region         text; -- denormalized text
alter table public.profiles add column if not exists district       text; -- denormalized text
alter table public.profiles add column if not exists station_name   text; -- denormalized
alter table public.profiles add column if not exists last_sign_in_at timestamptz; -- alias for last_login_at

-- Backfill region/district text from FK tables
update public.profiles p
  set region = r.name
  from public.regions r
  where p.region is null and p.region_id = r.id;

update public.profiles p
  set district = d.name
  from public.districts d
  where p.district is null and p.district_id = d.id;

update public.profiles p
  set station_name = s.name
  from public.stations s
  where p.station_name is null and p.station_id = s.id;

update public.profiles set last_sign_in_at = last_login_at where last_sign_in_at is null and last_login_at is not null;

-- Trigger: keep last_sign_in_at synced from last_login_at
create or replace function sync_profile_signin()
returns trigger language plpgsql as $$
begin
  if new.last_login_at is distinct from old.last_login_at and new.last_login_at is not null then
    new.last_sign_in_at := new.last_login_at;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profiles_signin on public.profiles;
create trigger trg_profiles_signin before update on public.profiles
  for each row execute function sync_profile_signin();

-- ══════════════════════════════════════════════════════════
-- DONE
-- ══════════════════════════════════════════════════════════
select 'TPDOP FINAL ALIGN COMPLETE' as status,
       '10 CHECKs widened, ~50 alias columns added, 4 sync triggers, 6 backfill passes' as summary;
