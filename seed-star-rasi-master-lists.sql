-- Run this once in the Supabase SQL Editor.
-- Seeds the "star" and "rasi" dropdown options using the exact spellings
-- that src/utils/porutham.js matches on, so every profile saved through the
-- dropdown will always calculate correctly (no more "Horoscope details
-- missing" false alarms from free-text spelling mismatches).

insert into master_lists (list_type, value) values
  ('star', 'Ashwini'), ('star', 'Bharani'), ('star', 'Krithikai'), ('star', 'Rohini'),
  ('star', 'Mrigashirsham'), ('star', 'Thiruvathirai'), ('star', 'Punarpoosam'), ('star', 'Poosam'),
  ('star', 'Ayilyam'), ('star', 'Magam'), ('star', 'Pooram'), ('star', 'Uthiram'),
  ('star', 'Hastham'), ('star', 'Chithirai'), ('star', 'Swathi'), ('star', 'Visakam'),
  ('star', 'Anusham'), ('star', 'Kettai'), ('star', 'Moolam'), ('star', 'Pooradam'),
  ('star', 'Uthiradam'), ('star', 'Thiruvonam'), ('star', 'Avittam'), ('star', 'Sadayam'),
  ('star', 'Poorattathi'), ('star', 'Uthirattathi'), ('star', 'Revathi')
on conflict (list_type, value) do nothing;

insert into master_lists (list_type, value) values
  ('rasi', 'Mesham'), ('rasi', 'Rishabam'), ('rasi', 'Mithunam'), ('rasi', 'Kadagam'),
  ('rasi', 'Simmam'), ('rasi', 'Kanni'), ('rasi', 'Thulam'), ('rasi', 'Vrichigam'),
  ('rasi', 'Dhanusu'), ('rasi', 'Magaram'), ('rasi', 'Kumbam'), ('rasi', 'Meenam')
on conflict (list_type, value) do nothing;
