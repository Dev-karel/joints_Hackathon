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
3. Install Supabase CLI lalu hubungkan project:

   ```powershell
   npm install -g supabase
   supabase login
   supabase link --project-ref <project-ref-anda>
   supabase db push                 # jalankan migration (schema + RLS)
   ```
4. **Authentication → Providers → Email**: aktifkan (dengan kata sandi dan konfirmasi email), lalu ubah template **Confirm signup** dan **Magic Link** agar mengirim **kode OTP** (`{{ .Token }}`), bukan hanya link. Allowlist domain `binus.ac.id` diterapkan lewat Auth Hook (lihat `supabase/migrations/`).
5. **Storage**: buat bucket privat `avatars`, `ktm-verification`, `report-evidence`, `session-materials`.
6. Aktifkan ekstensi **pg_cron** (Database → Extensions) untuk membersihkan `presence` yang kedaluwarsa.
7. Deploy Edge Functions dan set secret:

   ```powershell
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   supabase functions deploy resolve-zone
   supabase functions deploy register-access-point
   supabase functions deploy create-event
   ```
8. Isi data demo: jalankan `supabase/seed.sql` (zona, mata kuliah, venue, event contoh).
9. Beri role admin ke akun tim: `update profiles set role = 'admin' where campus_email = '<email-anda>';` (lakukan setelah akun tersebut login pertama kali).

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
