-- AyokMatch: data awal (seed).
-- Aman dijalankan sekali pada database kosong. Tidak membuat akun pengguna.
-- Data contoh (courses, venues) wajib diganti dengan data sebenarnya sebelum demo.

-- ───────────────────────── Pemetaan skor kuis (METHODOLOGY v1.1 §4) ─────────────────────────
-- 30 opsi; tiap archetype muncul tepat 5× sebagai primer dan 5× sebagai sekunder (§10).

insert into personality_scoring (question_id, question_no, answer, primary_archetype, secondary_archetype) values
  ('q1', 1, 'A', 'mindsmith', 'groundbreaker'),
  ('q1', 1, 'B', 'heartkeeper', 'sagekeeper'),
  ('q2', 2, 'A', 'wildheart', 'groundbreaker'),
  ('q2', 2, 'B', 'sagekeeper', 'mindsmith'),
  ('q3', 3, 'A', 'wildheart', 'heartkeeper'),
  ('q3', 3, 'B', 'kindled_flame', 'groundbreaker'),
  ('q4', 4, 'A', 'mindsmith', 'wildheart'),
  ('q4', 4, 'B', 'kindled_flame', 'groundbreaker'),
  ('q5', 5, 'A', 'sagekeeper', 'heartkeeper'),
  ('q5', 5, 'B', 'kindled_flame', 'mindsmith'),
  ('q6', 6, 'A', 'wildheart', 'sagekeeper'),
  ('q6', 6, 'B', 'mindsmith', 'kindled_flame'),
  ('q7', 7, 'A', 'groundbreaker', 'kindled_flame'),
  ('q7', 7, 'B', 'heartkeeper', 'sagekeeper'),
  ('q8', 8, 'A', 'mindsmith', 'kindled_flame'),
  ('q8', 8, 'B', 'heartkeeper', 'wildheart'),
  ('q9', 9, 'A', 'kindled_flame', 'wildheart'),
  ('q9', 9, 'B', 'sagekeeper', 'heartkeeper'),
  ('q10', 10, 'A', 'heartkeeper', 'sagekeeper'),
  ('q10', 10, 'B', 'groundbreaker', 'mindsmith'),
  ('q11', 11, 'A', 'groundbreaker', 'wildheart'),
  ('q11', 11, 'B', 'sagekeeper', 'heartkeeper'),
  ('q12', 12, 'A', 'kindled_flame', 'groundbreaker'),
  ('q12', 12, 'B', 'mindsmith', 'wildheart'),
  ('q13', 13, 'A', 'wildheart', 'sagekeeper'),
  ('q13', 13, 'B', 'sagekeeper', 'mindsmith'),
  ('q14', 14, 'A', 'heartkeeper', 'kindled_flame'),
  ('q14', 14, 'B', 'groundbreaker', 'mindsmith'),
  ('q15', 15, 'A', 'wildheart', 'heartkeeper'),
  ('q15', 15, 'B', 'groundbreaker', 'kindled_flame');

-- ───────────────────────── Mata kuliah (CONTOH, ganti dengan kurikulum sebenarnya) ─────────────────────────

insert into courses (code, name) values
  ('CONTOH-ALGO', 'Algorithm and Programming'),
  ('CONTOH-DS', 'Data Structures'),
  ('CONTOH-DB', 'Database Systems'),
  ('CONTOH-OOP', 'Object Oriented Programming'),
  ('CONTOH-WEB', 'Web Programming'),
  ('CONTOH-MOB', 'Mobile Application Development'),
  ('CONTOH-NET', 'Computer Networks'),
  ('CONTOH-DM', 'Discrete Mathematics'),
  ('CONTOH-STAT', 'Statistics'),
  ('CONTOH-ENG', 'English for Academic Purposes');

-- ───────────────────────── Zona kampus BINUS @Kemanggisan ─────────────────────────
-- Koordinat map_x/y/w/h adalah placeholder skematis (skala 0–100 per gedung), BUKAN GPS.
-- Zona awal untuk survei access point: Lobby Anggrek. Ruang lain dari mockup (PRD §12).

insert into campus_zones (name, level, map_x, map_y, map_w, map_h) values
  ('Kampus Anggrek', 'building', 0, 0, 100, 100),
  ('Kampus Syahdan', 'building', 0, 0, 100, 100),
  ('Kampus Kijang', 'building', 0, 0, 100, 100);

insert into campus_zones (name, parent_zone_id, level, map_x, map_y, map_w, map_h)
select r.name, b.id, 'room'::zone_level, r.x, r.y, r.w, r.h
from (values
  ('Lobby Anggrek', 'Kampus Anggrek', 5, 70, 90, 25),
  ('BeeHub', 'Kampus Anggrek', 5, 5, 40, 30),
  ('LKC', 'Kampus Anggrek', 55, 5, 40, 30),
  ('Lab Komputer', 'Kampus Anggrek', 5, 40, 40, 25),
  ('Auditorium', 'Kampus Anggrek', 55, 40, 40, 25),
  ('Creative Space', 'Kampus Syahdan', 5, 10, 40, 40),
  ('Drawing Studio', 'Kampus Syahdan', 55, 10, 40, 40),
  ('Gazebo', 'Kampus Kijang', 5, 10, 40, 40),
  ('Moot Court', 'Kampus Kijang', 55, 10, 40, 40)
) as r(name, building, x, y, w, h)
join campus_zones b on b.name = r.building and b.level = 'building';

-- ───────────────────────── Venue event (CONTOH, ganti sebelum demo) ─────────────────────────

insert into venues (name, address, venue_type, status) values
  ('Taman Kota (contoh)', 'Alamat contoh, ganti sebelum demo', 'public', 'approved'),
  ('Kafe Mitra (contoh)', 'Alamat contoh, ganti sebelum demo', 'partner', 'approved'),
  ('Lapangan Olahraga Umum (contoh)', 'Alamat contoh, ganti sebelum demo', 'public', 'approved');

-- ───────────────────────── Peran kurator/admin (JALANKAN MANUAL, jangan di migration) ─────────────────────────
-- Akun dibuat lewat aplikasi (Daftar). Setelah Daniel mendaftar dengan email @binus.ac.id,
-- jalankan di SQL Editor (role postgres, lolos dari guard_profile_update):
--
--   update profiles set role = 'curator' where campus_email = '<email-daniel>@binus.ac.id';
--
-- Admin (mode Daftarkan Wi-Fi) dengan cara yang sama: set role = 'admin'.
