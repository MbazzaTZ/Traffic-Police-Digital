-- =========================================================
-- Seed 02: Dar es Salaam Districts + Key Stations
-- =========================================================

-- DSM Districts
insert into districts (name, code, region_id) values
  ('Kinondoni',  'DSM-KIN', (select id from regions where code='DSM')),
  ('Ilala',      'DSM-ILA', (select id from regions where code='DSM')),
  ('Temeke',     'DSM-TEM', (select id from regions where code='DSM')),
  ('Ubungo',     'DSM-UBN', (select id from regions where code='DSM')),
  ('Kigamboni',  'DSM-KIG', (select id from regions where code='DSM'));

-- Key Police Stations – Kinondoni
insert into stations (name, code, type, district_id, region_id, address, lat, lng) values
  ('Oysterbay Police Station',  'DSM-KIN-OYS', 'police_station', (select id from districts where code='DSM-KIN'), (select id from regions where code='DSM'), 'Morogoro Rd, Oysterbay, Dar es Salaam', -6.7874, 39.2826),
  ('Kinondoni Police Station',  'DSM-KIN-KIN', 'police_station', (select id from districts where code='DSM-KIN'), (select id from regions where code='DSM'), 'Kinondoni, Dar es Salaam', -6.7792, 39.2629),
  ('Mwananyamala Police Station','DSM-KIN-MWN','police_station', (select id from districts where code='DSM-KIN'), (select id from regions where code='DSM'), 'Mwananyamala, Dar es Salaam', -6.7756, 39.2413),
  ('Msasani Police Station',    'DSM-KIN-MSS', 'police_station', (select id from districts where code='DSM-KIN'), (select id from regions where code='DSM'), 'Msasani Peninsula, Dar es Salaam', -6.7475, 39.2831),
  -- Ilala
  ('Kariakoo Police Station',   'DSM-ILA-KAR', 'police_station', (select id from districts where code='DSM-ILA'), (select id from regions where code='DSM'), 'Kariakoo, Dar es Salaam', -6.8142, 39.2812),
  ('Ilala Police Station',      'DSM-ILA-ILA', 'district_hq',   (select id from districts where code='DSM-ILA'), (select id from regions where code='DSM'), 'Ilala, Dar es Salaam', -6.8271, 39.2713),
  ('Buguruni Police Station',   'DSM-ILA-BUG', 'police_station', (select id from districts where code='DSM-ILA'), (select id from regions where code='DSM'), 'Buguruni, Dar es Salaam', -6.8412, 39.2543),
  -- Temeke
  ('Temeke Police Station',     'DSM-TEM-TEM', 'district_hq',   (select id from districts where code='DSM-TEM'), (select id from regions where code='DSM'), 'Temeke, Dar es Salaam', -6.8760, 39.2027),
  ('Mbagala Police Station',    'DSM-TEM-MBA', 'police_station', (select id from districts where code='DSM-TEM'), (select id from regions where code='DSM'), 'Mbagala, Dar es Salaam', -6.8953, 39.2341),
  -- DSM Regional HQ
  ('DSM Regional Police HQ',    'DSM-RHQ',     'regional_hq',   null,                                             (select id from regions where code='DSM'), 'Makao Makuu ya Polisi, Dar es Salaam', -6.8120, 39.2813);
