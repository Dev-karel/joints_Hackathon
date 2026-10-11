# Arsitektur AyokMatch

> Versi 2.2 — 30 September 2026. Menggantikan arsitektur Next.js/PWA (v1). Latar keputusan ada di [PRD.md](./PRD.md) v1.6. Isi & skoring kuis kepribadian ada di [METHODOLOGY.md](./METHODOLOGY.md) v1.2.

## 1. Gambaran Umum

AyokMatch dibangun sebagai **aplikasi mobile native dengan React Native (Expo) untuk Android**, dengan **Supabase** sebagai backend-as-a-service. Tidak ada server aplikasi sendiri: logika sensitif berjalan di **Supabase Edge Functions** dan fungsi Postgres.

Alasan:

- **Native wajib untuk lokasi per ruangan.** Hanya aplikasi native yang bisa membaca BSSID access point Wi-Fi yang tersambung (PRD §7). Browser/PWA tidak bisa.
- **Expo mempercepat tim 4 orang**: satu codebase TypeScript, build APK tanpa harus mengelola proyek Android mentah, library native umum (NetInfo, notifikasi, secure storage) sudah tersedia.
- **Supabase tetap dipakai**: auth, Postgres + RLS, Realtime (presence peta, chat), Storage, dan Edge Functions — tanpa membangun server.
- **Android dulu**: iOS butuh entitlement Wi-Fi khusus; ditunda pasca-hackathon.

Mockup Figma tetap menjadi deliverable "Prototype/Mockup UI-UX", terpisah dari source code.

## 2. Diagram Arsitektur (High Level)

```
┌──────────────────────────────────────────────────────────────┐
│              Aplikasi Android (Expo / React Native)           │
│  expo-router · NativeWind · TanStack Query · Zustand          │
│  NetInfo (BSSID) · expo-notifications · expo-secure-store     │
└───────┬──────────────────────┬──────────────────────┬─────────┘
        │ HTTPS (PostgREST)     │ HTTPS (Functions)     │ WebSocket
        ▼                       ▼                       ▼
┌────────────────┐   ┌─────────────────────────┐  ┌──────────────────┐
│ Postgres + RLS │   │ Edge Functions (Deno)   │  │ Supabase Realtime│
│ query langsung │   │ - resolve-zone          │  │ - presence peta  │
│ dari client    │   │ - register-access-point │  │ - chat           │
│ (anon key+JWT) │   │ - create-event (kurator)│  │ - kuota sesi/RSVP│
│                │   │ - rate limiting         │  └──────────────────┘
└───────┬────────┘   └───────────┬─────────────┘
        │                        │ service role (hanya di server)
        ▼                        ▼
┌──────────────────────────────────────────────────────────────┐
│ Supabase: Postgres · Auth (OTP email kampus) · Storage        │
└──────────────────────────────────────────────────────────────┘
```

Aturan pembagian: operasi CRUD biasa yang cukup dijaga RLS boleh langsung dari aplikasi. Operasi yang menyentuh data sensitif (BSSID), butuh cek role, atau rawan spam **wajib** lewat Edge Function.

## 3. Tech Stack Client

| Kebutuhan | Library | Catatan |
|---|---|---|
| Framework | Expo SDK (React Native) + TypeScript strict | Pakai *development build* (`expo-dev-client`), bukan hanya Expo Go |
| Navigasi | expo-router | Tab: Beranda, Match, Event, Peta, Profil |
| Styling | NativeWind (Tailwind untuk RN) | Token warna mengikuti Figma (biru #0072B8, aksen kuning 50–900) |
| Data server | @supabase/supabase-js + TanStack Query | Session disimpan di expo-secure-store |
| State UI lokal | Zustand | |
| Form & validasi | React Hook Form + Zod | Skema Zod yang sama dipakai di Edge Function |
| Wi-Fi / BSSID | @react-native-community/netinfo | Butuh izin `ACCESS_FINE_LOCATION` + layanan lokasi aktif |
| Izin lokasi | expo-location (hanya untuk meminta izin) | GPS **tidak** dipakai untuk posisi |
| Peta zona | react-native-svg | Peta skematis gedung/ruangan, bukan tile peta — tanpa API key |
| Notifikasi | expo-notifications (notifikasi lokal) | Pengingat RSVP H-1 dan 3 jam sebelum acara |
| Berbagi | Share API bawaan React Native | "Bagikan detail event ke teman" |
| Testing | Jest (jest-expo) + React Native Testing Library | |

## 4. Alur Pengguna Utama

### 4.1 Onboarding

1. Pengguna memasukkan email `@binus.ac.id` + kata sandi. **Kode OTP 6 digit** ke email kampus hanya diminta saat Daftar dan saat masuk dari HP yang belum dikenali. Kode, bukan magic link, karena tidak butuh deep link. Domain di-allowlist lewat Auth Hook.
   - **Daftar**: `signUp({ email, password })` dengan template konfirmasi berisi `{{ .Token }}`, lalu `verifyOtp({ type: 'signup' })`. Ini native Supabase: akun belum bisa dipakai sebelum email kampus terkonfirmasi. HP tempat mendaftar langsung dicatat sebagai HP terverifikasi.
   - **Masuk**: `signInWithPassword`. Aplikasi menyimpan `device_id` acak di expo-secure-store; kalau `device_id` itu belum ada di `trusted_devices` milik pengguna, aplikasi meminta OTP (`signInWithOtp({ email, options: { shouldCreateUser: false } })` + `verifyOtp({ type: 'email' })`) lalu mencatat HP itu. Supabase MFA hanya mendukung TOTP dan SMS, bukan OTP email sebagai faktor kedua, jadi gerbang HP baru ini dicek di aplikasi — **jangan diklaim sebagai 2FA** di depan juri. Versi kuat (pasca-MVP): kode dari Edge Function + klaim `otp_verified` lewat Custom Access Token Hook yang dicek RLS.
   - **Google/Facebook/Apple**: tombolnya hanya tampilan di MVP, belum ada OAuth.
2. Setelah verifikasi, aplikasi mewajibkan kuis kepribadian (15 pertanyaan, sistem archetype tim — isi lengkap & skoring di [METHODOLOGY.md](./METHODOLOGY.md)). `profiles.personality_quiz_completed_at` masih `null` untuk pengguna baru — ini penanda kuis belum final.
3. **Sebelum pertanyaan pertama muncul**, tampilkan modal peringatan (blocking, harus ditutup dengan tombol "Mulai"): jumlah pertanyaan, estimasi waktu, dan peringatan bahwa hasil kuis jadi **label kepribadian permanen** di akun sehingga harus dijawab jujur (lihat PRD §6.1).
4. **Fase pengisian (draft, sebelum submit akhir)**: setiap jawaban di-*upsert* ke `personality_answers` per `question_id` (bukan insert-only), supaya pengguna bisa menekan "Kembali" ke pertanyaan sebelumnya dan menimpa jawaban draft-nya. Selama `personality_quiz_completed_at` masih `null`, upsert ini diperbolehkan RLS. Layar menampilkan progress ("Pertanyaan n dari 15") dan tombol Kembali/Lanjut.
5. Setelah pertanyaan terakhir, tampilkan konfirmasi submit akhir ("jawaban tidak bisa diubah lagi setelah ini").
6. Submit akhir memanggil fungsi Postgres `submit_personality_quiz(profile_id)` (`security definer`), yang: memvalidasi semua 15 pertanyaan sudah terjawab → menghitung `personality_type` (archetype tertinggi) & `personality_scores` (persentase keenam archetype, algoritma di [METHODOLOGY.md §5](./METHODOLOGY.md)) → menulis hasil ke `profiles` → mengisi `profiles.personality_quiz_completed_at = now()`. Sejak baris ini terisi, trigger dan RLS menolak semua insert/update lanjutan ke `personality_answers` milik pengguna itu maupun ke kolom hasil di `profiles` — lihat §6.
7. Jika pengguna yang sudah submit membuka kembali rute kuis, aplikasi mengarahkan langsung ke Beranda (dicek dari `personality_quiz_completed_at`, bukan menampilkan form terisi yang bisa diedit).
8. Masuk ke Beranda.

### 4.2 Match › Belajar
1. Rekomendasi partner: fungsi Postgres `recommend_study_partners(user_id)` menghitung skor 0–100 dari mata kuliah yang sama (`user_courses`, persentase irisan: `matkul_sama / matkul_milikku × 60`), archetype **sama** (`personality_type`, 20 bila sama / 10 bila beda), jurusan sama (10), dan sesi yang pernah diikuti bersama (maks. 10). Bobot adalah heuristik awal, belum dikalibrasi.
2. Buat sesi: judul, mata kuliah, waktu, **zona kampus** (dari `campus_zones`), jenis, kuota, agenda berjam (opsional), yang perlu dibawa (opsional) → `study_sessions`. Pembuat otomatis masuk `study_session_members` sebagai host.
3. Materi (opsional): host mengunggah file ke bucket Storage privat `session-materials` dengan path `<session_id>/<nama-file>`, lalu metadata-nya masuk `study_session_materials`. Peserta mengunduh lewat signed URL berdurasi pendek.
4. Gabung sesi: insert ke `study_session_members`. Trigger `before insert` mengunci baris sesi (`select ... from study_sessions where id = ... for update`), menghitung anggota, lalu menolak jika sudah sama dengan `capacity`. Kunci baris ini yang mencegah dua orang merebut tempat terakhir dan membuat sesi melebihi kuota; cek di aplikasi saja tidak cukup.
5. Keluar sesi (peserta): setelah pengguna mengonfirmasi dialog "Keluar dari sesi ini?" di aplikasi, hapus baris milik sendiri di `study_session_members` (RLS: `user_id = auth.uid()` **dan** bukan host sesi). Tidak ada daftar tunggu; tempat langsung terbuka untuk orang lain.
6. Keluar sesi (host, PRD §8.1): lewat fungsi Postgres `host_leave_session(session_id, reason, action)`. `reason` wajib diisi. Setiap pemanggilan mencatat satu baris `session_host_exits`, yang sekaligus menjadi wadah polling/voting.
   - **Batas H-24**: fungsi menolak (raise exception) jika `now() > starts_at - interval '24 hours'` **dan** sesi punya anggota selain host. Aplikasi juga menonaktifkan tombol Keluar host di rentang itu, tapi penegakannya di database.
   - **Host sendirian** (tidak ada anggota lain): `status` → `cancelled` langsung, `result = 'n/a'`, tanpa voting dan tanpa batas H-24.
   - Selain itu, host lama langsung keluar (`host_id` → `null`, baris anggotanya dihapus) dan polling/voting dibuka: `eligible_voters` = jumlah peserta selain host saat diajukan, `vote_deadline = now() + interval '1 hour'`, `result = 'pending'`.
   - `action = 'transfer'` (**polling calon host**): tiap peserta memilih satu `candidate_id` (anggota sesi, boleh diri sendiri) di `session_host_votes`. Saat `vote_deadline` lewat atau semua peserta sudah memilih: kandidat dengan suara terbanyak menang (seri → `joined_at` paling awal) → `host_id` dan `new_host_id` diisi, `result = 'passed'`. Tanpa suara sama sekali → `failed`.
   - `action = 'cancel'` (**voting setuju/tidak**): `required_votes = ceil(0.8 × eligible_voters)`; peserta mengisi `approve`. Trigger: begitu jumlah setuju ≥ `required_votes` sebelum `vote_deadline` → `status = 'cancelled'`, `result = 'passed'`.
   - Job pg_cron tiap menit menyelesaikan polling/voting yang lewat `vote_deadline`. Yang gagal → sesi tetap berjalan tanpa host.
   - **Sesi tanpa host otomatis terkunci lewat RLS**: update `study_sessions` dan insert/delete `study_session_materials` hanya diizinkan jika `host_id = auth.uid()`. Saat `host_id` null, tidak ada yang lolos, jadi tidak perlu kolom "locked" terpisah.
   - `session_host_exits` dan `session_host_votes` hanya bisa dibaca anggota sesi itu (RLS cek `study_session_members`).
   - Peserta sesi bisa melaporkan host lewat `reports` dengan `target_user_id` = host dan `target_session_id` = sesi.
7. Setelah gabung, aplikasi menjadwalkan notifikasi lokal 1 jam sebelum `starts_at`, dan membatalkannya saat keluar.

### 4.3 Match › Lomba
0. Keputusan produk: rekomendasi anggota tim Lomba memakai archetype **berbeda** (tim yang saling melengkapi), kebalikan dari Belajar. Fungsi rekomendasi Lomba belum dibuat (Should-have); saat dibuat, balik arah pembanding archetype di `recommend_study_partners`.
1. Buat lowongan → `team_openings`.
2. Pengguna lain mengirim permintaan → `team_join_requests` (status `requested`).
3. Pembuat menyetujui/menolak → status `accepted`/`rejected`; RLS hanya mengizinkan pembuat mengubah status.

### 4.4 Match Map (BSSID → zona)
1. Pengguna menyalakan "Tampil di peta" → aplikasi meminta izin lokasi presisi dengan penjelasan "hanya untuk membaca Wi-Fi".
2. NetInfo membaca `details.bssid` Wi-Fi yang tersambung.
3. Aplikasi memanggil Edge Function `resolve-zone` dengan `{ bssid }` + JWT.
4. `resolve-zone`: normalisasi BSSID (huruf kecil) → cari di `wifi_access_points` → jika cocok, upsert `presence {user_id, zone_id, expires_at = now()+15 menit}`; jika tidak, hapus baris `presence` pengguna. BSSID **tidak** disimpan dan tidak masuk log.
5. Heartbeat tiap 2 menit dan saat NetInfo mendeteksi Wi-Fi berganti, hanya selama aplikasi di foreground (AppState `active`). Saat toggle dimatikan atau app ke background, aplikasi memanggil `resolve-zone` dengan `{ leave: true }`.
6. Klien lain berlangganan Realtime pada `presence`; RLS memastikan hanya pengguna yang juga opt-in yang bisa membaca (visibilitas timbal balik).
7. Job terjadwal (pg_cron) menghapus baris `presence` yang kedaluwarsa tiap menit.

### 4.5 Mode Admin: Daftarkan Wi-Fi
1. Layar hanya muncul untuk role `admin`.
2. Menampilkan BSSID saat ini (dari NetInfo) → admin memilih/membuat zona → Edge Function `register-access-point` (cek role admin) insert ke `wifi_access_points`.
3. Dipakai untuk survei kampus dan untuk mendaftarkan hotspot demo pada hari Grand Final.

### 4.6 Event (luar kampus)
1. Daftar event dibaca langsung dari `events` (status `published`).
2. Hanya role `curator` yang bisa membuat event, lewat Edge Function `create-event` (cek role + venue harus berstatus `approved`).
3. RSVP: insert `event_rsvps` (status `going`). Trigger mengunci baris event dan menolak jika kuota penuh (pola yang sama dengan sesi belajar). **Tidak ada daftar tunggu**; RSVP yang dibatalkan langsung membuka tempat.
4. Setelah RSVP, aplikasi menjadwalkan notifikasi lokal H-1 dan 3 jam sebelum acara.
5. *(Could-have)* Meja Kecil: fungsi `form_event_groups(event_id)` dijalankan H-1 untuk membagi peserta `going` menjadi grup 4–6 orang berdasarkan kepribadian → `event_groups`, `event_group_members`.
6. *(Could-have)* Setelah acara: peserta mengisi `reconnect_votes`; trigger membuat `friendships` berstatus `accepted` jika dua pengguna saling memilih.

### 4.7 Sosial: Teman, Chat, Laporan
1. Tambah teman → `friendships` (`pending`/`accepted`/`blocked`).
2. Chat → `conversations`, `conversation_members`, `messages` (Realtime).
3. Laporan pengguna atau event → `reports` (`pending_review` → `valid`/`dismissed`); banned hanya lewat tinjauan admin.

## 5. Data Model (Ringkas)

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `profiles` | id (FK auth.users), full_name, campus_email, major, semester, personality_type, personality_scores (jsonb), personality_quiz_completed_at (timestamptz, null = belum submit), role (`student`/`curator`/`admin`), avatar_url, ktm_url, show_on_map (bool) | 1:1 dengan auth.users. `personality_type` = archetype dengan skor tertinggi dari 6 archetype (lihat [METHODOLOGY.md](./METHODOLOGY.md)); `personality_scores` menyimpan persentase keenamnya untuk ditampilkan sebagai trait sekunder. Keduanya terkunci (read-only bagi pengguna) begitu `personality_quiz_completed_at` terisi. **`learning_style` tidak dipakai di MVP** |
| `trusted_devices` | user_id, device_id_hash, verified_at, last_seen_at | HP yang sudah lolos OTP; HP lain wajib OTP saat masuk. RLS: hanya pemilik |
| `personality_answers` | profile_id, question_id (`q1`–`q15`), answer (`A`/`B`) | Jawaban kuis, isi & pemetaan skor lengkap di [METHODOLOGY.md §4](./METHODOLOGY.md). Bisa di-upsert bebas oleh pemiliknya **selama** `profiles.personality_quiz_completed_at` masih null (fase draft, mendukung tombol "Kembali"); terkunci permanen sesudahnya |
| `courses` | id, code, name | Seed manual untuk MVP |
| `user_courses` | user_id, course_id | Mata kuliah yang diambil pengguna; dipilih di layar "Mata kuliah saya". Dipakai `recommend_study_partners` untuk kecocokan mata kuliah. RLS: hanya pemilik |
| `campus_zones` | id, name, parent_zone_id, level (`building`/`room`), map_x, map_y, map_w, map_h | Posisi untuk peta skematis (bukan koordinat GPS) |
| `wifi_access_points` | bssid (PK, lowercase), zone_id, label, registered_by, created_at | Data infrastruktur, bukan data pengguna |
| `presence` | user_id (PK), zone_id, updated_at, expires_at | Satu baris per pengguna; tanpa BSSID/IP/koordinat |
| `study_sessions` | id, host_id (nullable), course_id, title, starts_at, ends_at, zone_id, session_kind, capacity, agenda (jsonb: `[{time, activity}]`), bring_note, status (`open`/`cancelled`/`done`) | `host_id` null = sesi tanpa host, terkunci |
| `study_session_members` | session_id, user_id, joined_at | Trigger cek kuota dengan kunci baris sesi. Tidak ada status waitlist |
| `study_session_materials` | id, session_id, uploaded_by, file_path, file_name, mime_type, size_bytes, created_at | File di bucket privat `session-materials`; maks. 5 file × 10 MB per sesi |
| `session_host_exits` | id, session_id, host_id, reason, action (`transfer`/`cancel`), new_host_id (hasil polling), eligible_voters, required_votes (khusus `cancel`), vote_deadline, result (`pending`/`passed`/`failed`/`n/a`), created_at | Riwayat keluar host + polling/voting; hanya bisa dibaca anggota sesi itu |
| `session_host_votes` | exit_id, voter_id, candidate_id (untuk `transfer`), approve (untuk `cancel`), created_at | Satu suara per peserta; host lama tidak ikut memilih |
| `team_openings` | id, host_id, competition_name, category, registration_deadline, team_size, current_members, roles_needed (text[]), guidebook_url, description, status | |
| `team_join_requests` | opening_id, user_id, message, status (`requested`/`accepted`/`rejected`) | |
| `venues` | id, name, address, venue_type (`public`/`partner`), status (`pending`/`approved`) | Hanya venue `approved` yang bisa dipakai event |
| `events` | id, curator_id, event_kind (`monthly`/`hobby`/`partner`/`small_table`), title, description, starts_at, ends_at, venue_id, capacity, cost_note, status (`draft`/`published`/`cancelled`) | Acara luar kampus |
| `event_rsvps` | event_id, user_id, status (`going`/`cancelled`), created_at | Trigger cek kuota dengan kunci baris event. Tidak ada status waitlist |
| `event_groups` / `event_group_members` | event_id, group_no / group_id, user_id | Meja Kecil (Could-have) |
| `reconnect_votes` | event_id, voter_id, target_id | Tidak pernah bisa dibaca oleh target (RLS) |
| `friendships` | requester_id, addressee_id, status | |
| `conversations` / `conversation_members` / `messages` | id / conversation_id, user_id / conversation_id, sender_id, content, created_at | Realtime |
| `reports` | reporter_id, target_user_id, target_event_id, target_session_id, reason, evidence_url, status | `target_session_id` dipakai untuk laporan host yang keluar |

Skema detail ditulis sebagai SQL migration di `supabase/migrations/`.

## 6. Keamanan & Privasi (Wajib Dipatuhi)

- **Autentikasi**: hanya domain email kampus yang di-allowlist (Auth Hook). Tidak ada sign-up bebas.
- **Row Level Security** aktif di semua tabel. Contoh:
  - `personality_answers`: policy `UPDATE`/`INSERT` untuk pemilik baris memakai `USING`/`WITH CHECK` yang mengecek `(select personality_quiz_completed_at from profiles where id = auth.uid()) is null` — begitu kuis submit akhir, semua insert/update ditolak di level database, bukan cuma disembunyikan di UI. Ini yang menegakkan aturan "boleh Kembali sebelum submit, terkunci sesudahnya" dari PRD §6.1.
  - `profiles`: kolom `personality_type`, `personality_scores`, `personality_quiz_completed_at` tidak boleh diubah lewat client sama sekali oleh pengguna biasa (hanya ditulis oleh fungsi `submit_personality_quiz`, `security definer`) — gunakan trigger `BEFORE UPDATE` yang menolak perubahan kolom tersebut jika pemanggil bukan role internal, sebagai lapisan kedua selain RLS.
  - `presence`: pengguna hanya bisa melihat baris milik orang lain jika dirinya sendiri punya baris `presence` aktif (timbal balik) dan `expires_at > now()`. Zona yang hanya berisi 1 pengguna aktif hanya menampilkan jumlah (1), tanpa identitas; identitas baru terlihat bila zona berisi ≥ 2 pengguna aktif. Dibaca lewat view/fungsi `security definer` agar tabel `presence` tidak dibaca langsung oleh klien.
  - `reconnect_votes`: hanya voter yang bisa membaca suaranya sendiri.
  - `events`: insert/update ditolak untuk role selain `curator`/`admin`.
  - `wifi_access_points`: hanya `admin` yang bisa insert/update; klien biasa tidak perlu membaca tabel ini sama sekali (dipakai Edge Function).
  - `study_session_materials` + bucket `session-materials`: metadata (nama file) boleh dibaca semua pengguna login; objek file hanya bisa diunduh anggota sesi (policy Storage cek `study_session_members`); hanya host sesi yang bisa upload/hapus. Saat `host_id` null, tidak ada yang bisa mengubah apa pun (PRD §8.1).
- **BSSID pengguna tidak pernah disimpan**: hanya diproses di memori `resolve-zone`. Jangan log body request fungsi ini.
- **Tidak ada GPS**: expo-location hanya dipakai untuk meminta izin; aplikasi tidak memanggil API posisi.
- **Kunci rahasia**: service role key hanya disimpan sebagai secret Edge Function. Aplikasi hanya memegang `EXPO_PUBLIC_SUPABASE_URL` dan anon key (aman karena dijaga RLS). Jangan pernah menaruh service role key di `.env` aplikasi — semua variabel `EXPO_PUBLIC_*` ikut terbundel di APK.
- **Session** disimpan di expo-secure-store, bukan AsyncStorage biasa.
- **Data sensitif** (foto KTM) di bucket Storage privat, diakses lewat signed URL berdurasi pendek.
- **Moderasi**: tidak ada auto-ban dari satu laporan.
- **Rate limiting** di Edge Function: `resolve-zone` (maks. 1 panggilan/20 detik per pengguna), `create-event`, laporan, pesan, pembuatan sesi/lowongan.

## 7. Build, Distribusi & Environment

- **Development**: `npx expo start` dengan development build di HP Android fisik (NetInfo BSSID tidak bisa diuji di emulator dengan andal).
- **Build APK**: EAS Build profil `preview` (output `.apk`) atau build lokal `npx expo run:android --variant release`.
- **Backend**: Supabase Cloud (free tier). Edge Functions di-deploy dengan `supabase functions deploy`.
- **Fallback demo**: Supabase lokal (`supabase start`, Docker) di laptop yang sekaligus menjadi hotspot; APK demo diarahkan ke IP laptop lewat build profil `demo-local`.
- **Environment aplikasi** (`.env`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_ALLOWED_EMAIL_DOMAIN`. Secret server (`SUPABASE_SERVICE_ROLE_KEY`) hanya diset lewat `supabase secrets set`.

## 8. Struktur Project

```
ayokmatch/
├── app/                      # expo-router (file-based routes)
│   ├── (auth)/               # login OTP, kuis onboarding
│   ├── (tabs)/               # beranda, match, event, peta, profil
│   └── admin/                # daftarkan Wi-Fi (role admin)
├── src/
│   ├── components/           # komponen UI & per fitur
│   ├── features/             # match, map, event, social (hooks + query)
│   ├── lib/supabase/         # client & helper query
│   ├── lib/wifi/             # pembacaan BSSID + heartbeat presence
│   ├── lib/validation/       # skema Zod (dipakai juga di Edge Functions)
│   ├── stores/               # Zustand
│   └── types/                # tipe TS & hasil generate Supabase
├── supabase/
│   ├── migrations/           # SQL schema + RLS
│   ├── functions/            # resolve-zone, register-access-point, create-event
│   └── seed.sql              # data demo: zona, mata kuliah, venue, event
├── assets/
├── app.json / app.config.ts
├── eas.json
└── package.json
```

## 9. Keterbatasan yang Disadari (untuk transparansi ke juri)

- Presisi zona = jangkauan access point; AP bisa menjangkau ruangan sebelah.
- Pengguna yang tidak tersambung Wi-Fi kampus tidak tampil di peta (keputusan privasi yang disengaja).
- Daftar access point MVP berasal dari survei manual, belum dari IT kampus.
- Android saja; iOS menyusul.
- Klasifikasi kepribadian berbasis rule/skor sederhana, bukan ML.
- Fitur match selain Study & Competition Match baru disiapkan strukturnya.
