# Instalasi & Setup AyokMatch

Panduan ini untuk menjalankan AyokMatch (aplikasi Android, React Native + Expo) dan menyiapkan project Supabase.

## 1. Prasyarat

- [Node.js](https://nodejs.org/) versi 20 LTS atau lebih baru
- Git
- **HP Android fisik** (Android 10 atau lebih baru) dengan *USB debugging* aktif — fitur Wi-Fi/BSSID tidak bisa diuji dengan andal di emulator
- [Android Studio](https://developer.android.com/studio) (untuk Android SDK & JDK) — dibutuhkan untuk `npx expo run:android`
- Akun [Supabase](https://supabase.com/) (gratis)
- Akun [Expo](https://expo.dev/) (gratis) — untuk EAS Build APK
- Docker Desktop — **opsional**, hanya untuk Supabase lokal (fallback demo)
- Editor kode (Kiro/VS Code)

Cek versi (PowerShell):

```powershell
node -v
npm -v
adb devices   # HP Android harus muncul di sini
```

## 2. Clone Repository

```powershell
git clone <repo-url> ayokmatch
cd ayokmatch
```

## 3. Install Dependencies

```powershell
npm install
npx expo-doctor   # cek kecocokan versi library dengan Expo SDK
```

Untuk menambah library native baru, selalu gunakan `npx expo install <paket>`, bukan `npm install`.

## 4. Setup Project Supabase

1. Buka [supabase.com](https://supabase.com/) → buat project baru, region Singapore.
2. **Project Settings → API**, catat `Project URL` dan `anon public key`. `service_role key` hanya dipakai sebagai secret Edge Function — **jangan** masukkan ke aplikasi.
3. Install Supabase CLI lalu hubungkan project. **Catatan:** `npm install -g supabase` sudah **tidak didukung** lagi oleh Supabase (muncul error "Installing Supabase CLI as a global module is not supported"). Pakai salah satu cara di bawah.

   Cara tanpa install (paling cepat, cocok untuk pemakaian sesekali):

   ```powershell
   npx supabase@latest login
   npx supabase@latest link --project-ref <project-ref-anda>
   npx supabase@latest db push      # jalankan migration (schema + RLS)
   ```

   Cara dengan Scoop (dapat perintah `supabase` global, cocok kalau sering dipakai):

   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   supabase login
   supabase link --project-ref <project-ref-anda>
   supabase db push
   ```

   CLI ini baru dibutuhkan saat sudah ada migration/Edge Function — bukan syarat untuk menjalankan aplikasi pertama kali.
4. **Authentication → Providers → Email**: aktifkan (dengan kata sandi dan konfirmasi email), lalu ubah template **Confirm signup** dan **Magic Link** agar mengirim **kode OTP** (`{{ .Token }}`), bukan hanya link. Allowlist domain `binus.ac.id` ditegakkan oleh trigger di database (`supabase/migrations/20261010000200_auth_guards.sql`), jadi tidak butuh Auth Hook. Detail pengaturan di §4.1.
5. **Storage**: buat bucket privat `avatars`, `ktm-verification`, `report-evidence`, `session-materials`.
6. Aktifkan ekstensi **pg_cron** (Database → Extensions) untuk membersihkan `presence` yang kedaluwarsa.
7. Deploy Edge Functions. **Tanpa CLI** (paling mudah): Dashboard → **Edge Functions** → **Deploy a new function** → beri nama persis `resolve-zone` lalu tempel isi `supabase/functions/resolve-zone/index.ts`; ulangi untuk `register-access-point`. Biarkan *Verify JWT* aktif. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` sudah tersedia otomatis di runtime, jadi tidak perlu diatur manual. Dengan CLI:

   ```powershell
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   supabase functions deploy resolve-zone
   supabase functions deploy register-access-point
   supabase functions deploy create-event
   ```
8. Data awal (pemetaan skor kuis, zona kampus, mata kuliah contoh, venue contoh) sudah ada di migration `20261010000500_seed.sql`, jadi tidak ada `seed.sql` terpisah. Mata kuliah dan venue di situ hanya CONTOH, ganti sebelum demo.
9. Beri role ke akun tim setelah akun tersebut mendaftar lewat aplikasi (jalankan di SQL Editor): `update profiles set role = 'curator' where campus_email = '<email>';` untuk kurator event, `role = 'admin'` untuk admin (mode Daftarkan Wi-Fi).

### 4.1 Migration, SMTP, dan pengaturan Auth (Fase 1)

Urutan migration (jalankan berurutan; satu file per tahap supaya mudah di-debug). Pakai `supabase db push` atau tempel satu per satu di **SQL Editor**:

1. `20261010000100_init_schema.sql` — enum, tabel, FK, index
2. `20261010000200_auth_guards.sql` — allowlist `@binus.ac.id`, profil otomatis saat daftar, fungsi bantu RLS
3. `20261010000300_rls.sql` — RLS semua tabel + view `public_profiles`
4. `20261010000400_functions_triggers.sql` — `submit_personality_quiz`, kuota sesi/event, `get_zone_presence`, `recommend_study_partners`, pembersih presence (pg_cron)
5. `20261010000500_seed.sql` — data awal
6. `20261011000100_user_courses.sql` — tabel `user_courses`, `set_my_courses`, dan rekomendasi partner belajar v2 (mata kuliah sama)

Pengaturan di **Dashboard → Authentication** (tidak bisa lewat migration):

- **Providers → Email**: *Confirm email* ON; panjang kata sandi minimal 8.
- **Email Templates**: template **Confirm signup** dan **Magic Link** harus memuat `{{ .Token }}` (kode 6 angka), mis. `Kode verifikasi AyokMatch kamu: {{ .Token }}`.
- **SMTP Settings → Custom SMTP**: wajib diisi kalau mau mengetes OTP berulang. SMTP bawaan Supabase hanya mengizinkan beberapa email per jam dan akan memblokir pengetesan. Contoh Resend: host `smtp.resend.com`, port `465`, username `resend`, password = API key. Contoh Gmail: host `smtp.gmail.com`, port `465`, password = *App Password* (butuh verifikasi 2 langkah di akun Google). Isi kredensial hanya di Dashboard, jangan di repo.
- **Rate limits**: naikkan jumlah email per jam setelah SMTP sendiri aktif.
- **Database → Extensions**: aktifkan `pg_cron` bila migration 4 mencetak notice bahwa pg_cron tidak aktif, lalu jalankan ulang blok `do $$ ... $$` di akhir file itu.

Cek cepat setelah migration (SQL Editor):

```sql
-- harus GAGAL: email non-kampus ditolak trigger
insert into auth.users (id, email) values (gen_random_uuid(), 'x@gmail.com');
-- harus 30 baris, tiap archetype 5x primer dan 5x sekunder
select primary_archetype, count(*) from personality_scoring group by 1;
-- semua tabel harus rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
```

Catatan: gerbang "HP baru wajib OTP" dicek di aplikasi (tabel `trusted_devices`), **bukan 2FA sungguhan**; jangan diklaim sebagai 2FA saat pitching.

## 5. Konfigurasi Environment Variable

```powershell
Copy-Item .env.example .env
```

Isi `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
EXPO_PUBLIC_ALLOWED_EMAIL_DOMAIN=binus.ac.id
```

> Semua variabel `EXPO_PUBLIC_*` ikut terbundel ke dalam APK dan bisa dibaca siapa pun. Jangan pernah menaruh `service_role key` di file ini.

## 6. Jalankan di HP Android

Sambungkan HP lewat USB, lalu:

```powershell
npx expo run:android   # build & pasang development build (sekali di awal, dan setiap menambah library native)
npm run start          # dev server; buka aplikasi AyokMatch (dev build) di HP
```

Saat pertama kali menyalakan "Tampil di peta", izinkan **lokasi presisi** dan pastikan **layanan lokasi (GPS) di HP aktif** — Android mewajibkan keduanya untuk membaca BSSID Wi-Fi, walaupun aplikasi tidak memakai GPS.

## 7. Mendaftarkan Access Point (Survei Wi-Fi)

1. Login dengan akun berrole `admin`.
2. Buka **Profil → Admin → Daftarkan Wi-Fi** sambil tersambung ke Wi-Fi kampus di ruangan yang ingin didaftarkan.
3. Pilih zona (atau buat zona baru), simpan. Ulangi untuk setiap access point/band di ruangan itu.

## 8. Build APK (demo & submission)

```powershell
npm install -g eas-cli
eas login
eas build:configure
npm run build:apk      # profil "preview" di eas.json menghasilkan file .apk
```

Unduh APK dari link hasil build, lalu pasang di HP demo.

## 9. Persiapan Demo Grand Final (hotspot)

1. Siapkan **perangkat ketiga** (HP cadangan atau laptop dengan data seluler) sebagai hotspot. Jangan jadikan HP demo sendiri sebagai hotspot.
2. Sambungkan HP demo A dan B ke hotspot tersebut.
3. Di HP A (akun admin), buka **Daftarkan Wi-Fi** dan daftarkan hotspot sebagai zona "Ruang Pitching". Lakukan di hari H, karena alamat hotspot di beberapa HP Android berubah setiap hotspot dinyalakan ulang.
4. Nyalakan "Tampil di peta" di A dan B, lalu cek keduanya muncul di "Ruang Pitching".

### 9.1 Fallback tanpa internet: Supabase lokal

```powershell
supabase start           # butuh Docker
supabase db reset        # migration + seed
supabase functions serve
```

Jadikan laptop sebagai hotspot, lalu build APK dengan profil `demo-local` yang mengarah ke IP laptop (contoh `http://192.168.137.1:54321`).

## 10. Perintah Lain

```powershell
npm run lint
npm run typecheck
npm run test
npm run doctor
```

## 11. Troubleshooting Umum

| Masalah | Solusi |
|---|---|
| BSSID terbaca `02:00:00:00:00:00` atau kosong | Izin lokasi presisi belum diberikan, atau layanan lokasi HP mati. Nyalakan keduanya |
| BSSID tidak terbaca di emulator | Uji di HP Android fisik |
| Pengguna tidak muncul di peta padahal tersambung Wi-Fi | BSSID belum didaftarkan ke zona — daftarkan lewat mode admin (ingat: satu AP bisa punya BSSID berbeda untuk 2,4 GHz dan 5 GHz) |
| `adb devices` kosong | Aktifkan USB debugging dan izinkan komputer di HP |
| Error versi library setelah `npm install` | Jalankan `npx expo install --fix` |
| RLS error "new row violates row-level security policy" | Pastikan sudah login dan migration RLS sudah dijalankan |

Untuk pertanyaan arsitektur, lihat [ARCHITECTURE.md](./ARCHITECTURE.md).
