-- =========================================================
-- Seed 01: Tanzania's 26 Regions + Zones
-- =========================================================

insert into zones (name, code) values
  ('Kanda ya Kaskazini',   'NORTH'),
  ('Kanda ya Mashariki',   'EAST'),
  ('Kanda ya Kati',        'CENTRAL'),
  ('Kanda ya Kusini',      'SOUTH'),
  ('Kanda ya Magharibi',   'WEST'),
  ('Kanda ya Nyanda za Juu Kusini', 'HIGHLANDS'),
  ('Kanda ya Ziwa',        'LAKE'),
  ('Kanda ya Visiwani',    'ISLANDS');

-- Insert all 26 regions
with z as (select id, code from zones)
insert into regions (name, code, zone_id) values
  -- Islands
  ('Zanzibar Kaskazini Unguja', 'ZNZ-NORTH', (select id from z where code='ISLANDS')),
  ('Zanzibar Kusini Unguja',    'ZNZ-SOUTH', (select id from z where code='ISLANDS')),
  ('Zanzibar Mjini Magharibi',  'ZNZ-URBAN', (select id from z where code='ISLANDS')),
  ('Kaskazini Pemba',           'PEMBA-N',   (select id from z where code='ISLANDS')),
  ('Kusini Pemba',              'PEMBA-S',   (select id from z where code='ISLANDS')),
  -- Eastern
  ('Dar es Salaam',             'DSM',       (select id from z where code='EAST')),
  ('Pwani',                     'PWT',       (select id from z where code='EAST')),
  ('Tanga',                     'TNG',       (select id from z where code='EAST')),
  ('Morogoro',                  'MRG',       (select id from z where code='EAST')),
  -- Northern
  ('Kilimanjaro',               'KLM',       (select id from z where code='NORTH')),
  ('Arusha',                    'ARU',       (select id from z where code='NORTH')),
  ('Manyara',                   'MNY',       (select id from z where code='NORTH')),
  -- Central
  ('Dodoma',                    'DDM',       (select id from z where code='CENTRAL')),
  ('Singida',                   'SGD',       (select id from z where code='CENTRAL')),
  -- Lake
  ('Mwanza',                    'MWZ',       (select id from z where code='LAKE')),
  ('Geita',                     'GTA',       (select id from z where code='LAKE')),
  ('Kagera',                    'KGR',       (select id from z where code='LAKE')),
  ('Mara',                      'MRA',       (select id from z where code='LAKE')),
  ('Simiyu',                    'SMY',       (select id from z where code='LAKE')),
  ('Shinyanga',                 'SHY',       (select id from z where code='LAKE')),
  -- Highlands
  ('Iringa',                    'IRG',       (select id from z where code='HIGHLANDS')),
  ('Njombe',                    'NJM',       (select id from z where code='HIGHLANDS')),
  ('Mbeya',                     'MBY',       (select id from z where code='HIGHLANDS')),
  -- South
  ('Lindi',                     'LND',       (select id from z where code='SOUTH')),
  ('Mtwara',                    'MTW',       (select id from z where code='SOUTH')),
  -- West
  ('Tabora',                    'TBR',       (select id from z where code='WEST')),
  ('Kigoma',                    'KGM',       (select id from z where code='WEST')),
  ('Rukwa',                     'RKW',       (select id from z where code='WEST')),
  ('Katavi',                    'KTV',       (select id from z where code='WEST')),
  ('Ruvuma',                    'RVA',       (select id from z where code='WEST'));
