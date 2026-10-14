-- Data demo AyokMatch (event, sesi belajar, lowongan lomba) supaya aplikasi tidak kosong saat demo.
--
-- BUKAN migration: jangan taruh di supabase/migrations dan tidak ikut `db push`.
-- Jalankan manual di Dashboard → SQL Editor (role postgres) SETELAH:
--   1. semua migration diterapkan (`npx supabase@latest db push`),
--   2. minimal 2 akun mendaftar lewat aplikasi (email @binus.ac.id) dan menyelesaikan kuis,
--   3. satu akun dijadikan kurator/admin:
--        update profiles set role = 'curator' where campus_email = '<email>@binus.ac.id';
--
-- Aman dijalankan berulang: tiap baris dicek dulu berdasarkan judul/nama, jadi tidak menggandakan.
-- Semua waktu relatif terhadap saat skrip dijalankan; jalankan lagi di hari demo supaya
-- sesi "hari ini" dan tanggal event tetap di masa depan. Ganti venue contoh di seed dengan
-- venue sebenarnya bila perlu (nama dan alamat di tabel venues).

do $$
declare
  v_curator uuid;
  v_host_a uuid;
  v_host_b uuid;
  v_today timestamptz := date_trunc('day', now());
begin
  -- Kurator/admin pembuat event.
  select id into v_curator from public.profiles
  where role in ('curator', 'admin') order by created_at limit 1;
  if v_curator is null then
    raise exception 'Belum ada akun kurator/admin. Jalankan: update profiles set role = ''curator'' where campus_email = ''<email>'';';
  end if;

  -- Host sesi/lowongan: dua mahasiswa pertama yang sudah menyelesaikan kuis (boleh akun yang sama
  -- bila baru ada satu).
  select id into v_host_a from public.profiles
  where personality_quiz_completed_at is not null and id <> v_curator order by created_at limit 1;
  if v_host_a is null then
    v_host_a := v_curator;
  end if;
  select id into v_host_b from public.profiles
  where personality_quiz_completed_at is not null and id not in (v_curator, v_host_a)
  order by created_at limit 1;
  if v_host_b is null then
    v_host_b := v_host_a;
  end if;

  -- ───────────────────────── Event (published, venue approved) ─────────────────────────
  insert into public.events (curator_id, event_kind, title, description, starts_at, ends_at, venue_id, capacity, cost_note, status)
  select v_curator, e.kind::public.event_kind, e.title, e.descr, v_today + e.starts, v_today + e.starts + interval '2 hours',
         v.id, e.cap, e.cost, 'published'
  from (values
    ('hobby',       'Nongkrong Board Game',       'Santai main board game bareng mahasiswa dari jurusan lain. Pemula sangat boleh ikut.', interval '3 days 16 hours',  12, 'Bayar di tempat, sekitar Rp25.000',  'Kafe Mitra (contoh)'),
    ('monthly',     'Jogging Pagi Bareng',        'Lari santai 5 km, cocok untuk yang baru mulai. Kumpul di gerbang taman.',               interval '5 days 6 hours',   20, 'Gratis',                              'Taman Kota (contoh)'),
    ('small_table', 'Meja Kecil: Kenalan Sefrekuensi', 'Kami membagi peserta jadi meja kecil 4–6 orang. Ngobrol santai, tanpa tekanan.',     interval '7 days 18 hours',  18, 'Bayar di tempat (minuman sendiri)',   'Kafe Mitra (contoh)'),
    ('partner',     'Mini Workshop UI/UX',        'Workshop singkat bareng komunitas desain mitra. Bawa laptop.',                          interval '9 days 14 hours',  15, 'Gratis untuk mahasiswa',              'Lapangan Olahraga Umum (contoh)')
  ) as e(kind, title, descr, starts, cap, cost, venue_name)
  join public.venues v on v.name = e.venue_name and v.status = 'approved'
  where not exists (select 1 from public.events x where x.title = e.title);

  -- ───────────────────────── Sesi belajar (hari ini dan besok) ─────────────────────────
  -- Host otomatis jadi anggota pertama lewat trigger; grup chat sesi dibuat trigger juga.
  insert into public.study_sessions (host_id, course_id, title, starts_at, ends_at, zone_id, session_kind, capacity, agenda, bring_note)
  select s.host, c.id, s.title, now() + s.starts, now() + s.starts + s.dur, z.id, s.kind::public.session_kind, s.cap,
         -- Agenda: jam format JJ.MM (WIB), butir kedua 45 menit setelah mulai.
         case when s.a1 is null then '[]'::jsonb else
           jsonb_build_array(jsonb_build_object('time', to_char((now() + s.starts) at time zone 'Asia/Jakarta', 'HH24.MI'), 'text', s.a1))
           || case when s.a2 is null then '[]'::jsonb else
                jsonb_build_array(jsonb_build_object('time', to_char((now() + s.starts + interval '45 minutes') at time zone 'Asia/Jakarta', 'HH24.MI'), 'text', s.a2))
              end
         end,
         s.bring
  from (values
    (v_host_a, 'Algorithm and Programming', 'Latihan soal rekursi sebelum kuis',   interval '3 hours',       interval '2 hours', 'Lobby Anggrek', 'belajar_kelompok', 6,  'Review konsep rekursi',        'Latihan soal bareng',         'Laptop dan catatan'),
    (v_host_b, 'Database Systems',           'Diskusi normalisasi dan ERD',        interval '5 hours',       interval '2 hours', 'BeeHub',        'diskusi',          5,  'Bahas studi kasus ERD',        null,                          'Catatan kuliah'),
    (v_host_a, 'Data Structures',            'Tutor sebaya: linked list & tree',   interval '1 day 2 hours', interval '2 hours', 'Lab Komputer',  'tutor_sebaya',     8,  'Penjelasan linked list',       'Praktik tree traversal',      'Laptop'),
    (v_host_b, 'Statistics',                 'Belajar bareng persiapan UTS',       interval '1 day 6 hours', interval '2 hours', 'Auditorium',    'belajar_kelompok', 10, null,                       null,                          null)
  ) as s(host, course_name, title, starts, dur, zone_name, kind, cap, a1, a2, bring)
  join public.courses c on c.name = s.course_name
  join public.campus_zones z on z.name = s.zone_name
  where not exists (select 1 from public.study_sessions x where x.title = s.title);

  -- ───────────────────────── Lowongan tim lomba ─────────────────────────
  insert into public.team_openings (host_id, competition_name, category, registration_deadline, team_size, current_members, roles_needed, guidebook_url, description)
  select o.host, o.name, o.category, now() + o.deadline, o.size, 1, o.roles, o.guide, o.descr
  from (values
    (v_host_a, 'Hackathon Nasional Mahasiswa',  'Hackathon',      interval '4 days',  4, array['Frontend', 'UI/UX Designer', 'Backend'], 'https://example.com/guidebook-hackathon', 'Cari tim untuk hackathon 24 jam. Semangat belajar lebih penting daripada pengalaman.'),
    (v_host_b, 'Data Science Challenge',        'Sains data',     interval '10 days', 3, array['Data Analyst', 'ML Engineer'],           null,                                      'Butuh dua orang untuk kompetisi prediksi dataset. Online, bisa diatur jadwalnya.'),
    (v_host_a, 'Business Plan Competition',     'Rencana bisnis', interval '14 days', 5, array['Finance', 'Marketing', 'Pitching'],      null,                                      'Tim ide bisnis sosial; tim sudah punya konsep awal, butuh pelengkap.')
  ) as o(host, name, category, deadline, size, roles, guide, descr)
  where not exists (select 1 from public.team_openings x where x.competition_name = o.name);

  raise notice 'Seed demo selesai. Kurator: %, host A: %, host B: %', v_curator, v_host_a, v_host_b;
end;
$$;
