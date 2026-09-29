# Arsitektur AyoMatch

> Versi 2.0 — 29 September 2026. Menggantikan arsitektur Next.js/PWA (v1). Latar keputusan ada di [PRD.md](./PRD.md) v1.3.

## 1. Gambaran Umum

AyoMatch dibangun sebagai **aplikasi mobile native dengan React Native (Expo) untuk Android**, dengan **Supabase** sebagai backend-as-a-service. Tidak ada server aplikasi sendiri: logika sensitif berjalan di **Supabase Edge Functions** dan fungsi Postgres.

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
1. Pengguna memasukkan email kampus → Supabase Auth mengirim **kode OTP 6 digit** (lebih andal di mobile daripada magic link karena tidak butuh deep link). Domain di-allowlist lewat Auth Hook.
2. Setelah verifikasi, aplikasi mewajibkan kuis kepribadian (6 pertanyaan).
3. Jawaban disimpan ke `personality_answers`; fungsi Postgres menghitung `personality_type` dan `learning_style` di `profiles`.
4. Masuk ke Beranda.

### 4.2 Match › Belajar
1. Rekomendasi partner: fungsi Postgres `recommend_study_partners(user_id)` menghitung skor kecocokan dari mata kuliah yang sama, gaya belajar, dan kepribadian.
2. Buat sesi: judul, mata kuliah, waktu, **zona kampus** (dari `campus_zones`), jenis, kuota → `study_sessions`. Pembuat otomatis masuk `study_session_members`.
3. Gabung sesi: insert ke `study_session_members`; trigger menolak jika kuota penuh.

### 4.3 Match › Lomba
1. Buat lowongan → `team_openings`.
2. Pengguna lain mengirim permintaan → `team_join_requests` (status `requested`).
3. Pembuat menyetujui/menolak → status `accepted`/`rejected`; RLS hanya mengizinkan pembuat mengubah status.

### 4.4 Match Map (BSSID → zona)
1. Pengguna menyalakan "Tampil di peta" → aplikasi meminta izin lokasi presisi dengan penjelasan "hanya untuk membaca Wi-Fi".
2. NetInfo membaca `details.bssid` Wi-Fi yang tersambung.
3. Aplikasi memanggil Edge Function `resolve-zone` dengan `{ bssid }` + JWT.
4. `resolve-zone`: normalisasi BSSID (huruf kecil) → cari di `wifi_access_points` → jika cocok, upsert `presence {user_id, zone_id, expires_at = now()+10 menit}`; jika tidak, hapus baris `presence` pengguna. BSSID **tidak** disimpan dan tidak masuk log.
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
3. RSVP: insert `event_rsvps` (status `going`); jika kuota penuh → `waitlist`. Trigger menaikkan waitlist teratas saat ada yang batal.
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
| `profiles` | id (FK auth.users), full_name, campus_email, major, semester, personality_type, learning_style, role (`student`/`curator`/`admin`), avatar_url, ktm_url, show_on_map (bool) | 1:1 dengan auth.users |
| `personality_answers` | profile_id, question_id, answer | Jawaban kuis |
| `courses` | id, code, name | Seed manual untuk MVP |
| `campus_zones` | id, name, parent_zone_id, level (`building`/`room`), map_x, map_y, map_w, map_h | Posisi untuk peta skematis (bukan koordinat GPS) |
| `wifi_access_points` | bssid (PK, lowercase), zone_id, label, registered_by, created_at | Data infrastruktur, bukan data pengguna |
| `presence` | user_id (PK), zone_id, updated_at, expires_at | Satu baris per pengguna; tanpa BSSID/IP/koordinat |
| `study_sessions` | id, host_id, course_id, title, starts_at, ends_at, zone_id, session_kind, capacity, status | |
| `study_session_members` | session_id, user_id, joined_at | Trigger cek kuota |
| `team_openings` | id, host_id, competition_name, category, registration_deadline, team_size, current_members, roles_needed (text[]), guidebook_url, description, status | |
| `team_join_requests` | opening_id, user_id, message, status (`requested`/`accepted`/`rejected`) | |
| `venues` | id, name, address, venue_type (`public`/`partner`), status (`pending`/`approved`) | Hanya venue `approved` yang bisa dipakai event |
| `events` | id, curator_id, event_kind (`monthly`/`hobby`/`partner`/`small_table`), title, description, starts_at, ends_at, venue_id, capacity, cost_note, status (`draft`/`published`/`cancelled`) | Acara luar kampus |
| `event_rsvps` | event_id, user_id, status (`going`/`waitlist`/`cancelled`), created_at | |
| `event_groups` / `event_group_members` | event_id, group_no / group_id, user_id | Meja Kecil (Could-have) |
| `reconnect_votes` | event_id, voter_id, target_id | Tidak pernah bisa dibaca oleh target (RLS) |
| `friendships` | requester_id, addressee_id, status | |
| `conversations` / `conversation_members` / `messages` | id / conversation_id, user_id / conversation_id, sender_id, content, created_at | Realtime |
| `reports` | reporter_id, target_user_id, target_event_id, reason, evidence_url, status | |

Skema detail ditulis sebagai SQL migration di `supabase/migrations/`.

## 6. Keamanan & Privasi (Wajib Dipatuhi)

- **Autentikasi**: hanya domain email kampus yang di-allowlist (Auth Hook). Tidak ada sign-up bebas.
- **Row Level Security** aktif di semua tabel. Contoh:
  - `presence`: pengguna hanya bisa melihat baris milik orang lain jika dirinya sendiri punya baris `presence` aktif (timbal balik) dan `expires_at > now()`.
  - `reconnect_votes`: hanya voter yang bisa membaca suaranya sendiri.
  - `events`: insert/update ditolak untuk role selain `curator`/`admin`.
  - `wifi_access_points`: hanya `admin` yang bisa insert/update; klien biasa tidak perlu membaca tabel ini sama sekali (dipakai Edge Function).
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
ayomatch/
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
