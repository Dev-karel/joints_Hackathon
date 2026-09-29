# CLAUDE.md

Dokumen ini memberi konteks kerja untuk AI coding assistant (Claude/Kiro/LLM lain) yang membantu pengembangan **AyoMatch**. Baca dulu sebelum membuat atau mengubah kode di repo ini.

## Ringkasan Project

AyoMatch adalah **aplikasi Android native (React Native + Expo)** yang mencocokkan mahasiswa dalam satu kampus untuk belajar bareng, ikut lomba bareng, dan bertemu di acara luar kampus, berdasarkan kepribadian dan minat. Dibangun untuk Hackathon JOINTS UGM 2026, deadline submission **16 Oktober 2026** dan Grand Final **1 November 2026**.


Scope MVP ada di [PRD.md](./PRD.md) §5 — ikuti urutan prioritas (Must-have dulu). Fitur match lain (sport, gaming, art, organisasi) adalah roadmap — jangan implementasikan penuh kecuali diminta eksplisit.

Detail arsitektur & data model ada di [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tech Stack (wajib diikuti, jangan ganti tanpa alasan kuat)

- Expo SDK 57 (React Native 0.86) + TypeScript strict, pakai **development build** (`expo-dev-client`)
- expo-router untuk navigasi (file-based, folder `app/`)
- NativeWind (Tailwind untuk React Native) untuk styling
- Supabase: Auth (OTP email kampus), Postgres + RLS, Realtime, Storage, **Edge Functions** untuk logika sensitif
- TanStack Query untuk data server, Zustand untuk state UI lokal
- React Hook Form + Zod untuk semua form dan validasi
- `@react-native-community/netinfo` untuk membaca BSSID Wi-Fi
- react-native-svg untuk peta zona skematis (**jangan** pakai Google Maps / react-native-maps — butuh API key & billing, dan kita memang tidak memakai koordinat)
- expo-notifications (notifikasi lokal) untuk pengingat RSVP
- Jest (jest-expo) + React Native Testing Library untuk test

Tambah library native baru selalu lewat `npx expo install <paket>` agar versinya cocok dengan SDK.

## Konvensi Kode

- Semua file baru TypeScript (`.ts`/`.tsx`), tidak ada `.js`/`.jsx`.
- Route/layar di `app/` (expo-router). Logika fitur di `src/features/<fitur>/` (hooks, query, komponen khusus fitur). Komponen generik di `src/components/`.
- Jangan panggil Supabase client langsung dari layar — bungkus di hook/query di `src/features/` atau `src/lib/supabase/`.
- Skema database, RLS, dan Edge Functions hidup di `supabase/` sebagai migration/kode — jangan ubah manual lewat dashboard tanpa migration.
- Semua tabel data personal **wajib** punya RLS policy sebelum dianggap selesai.
- Skema Zod didefinisikan sekali di `src/lib/validation/` dan dipakai juga oleh Edge Functions.
- Teks UI dalam **Bahasa Indonesia**. Istilah fitur tetap: Study Match, Competition Match, Match Map, Visual Learner (dan tipe kepribadian lain). Sub-tab Match bernama "Belajar" dan "Lomba".
- Warna mengikuti Figma: biru utama `#0072B8`; aksen kuning 50–900 (dasar `#F39C12`). Teks aksen pakai 700 (`#A65C00`), bukan 500.
- Commit kecil dan deskriptif. Jangan gabungkan perubahan skema database dengan perubahan UI yang tidak berhubungan.

## Batasan & Keputusan Desain Penting

- **Lokasi hanya dari access point Wi-Fi (BSSID).** Jangan gunakan GPS/koordinat, QR check-in, atau cek IP untuk lokasi. `expo-location` hanya dipakai untuk **meminta izin** yang diwajibkan Android untuk membaca BSSID — jangan memanggil API posisi.
- **BSSID pengguna tidak boleh disimpan atau di-log.** Kirim hanya ke Edge Function `resolve-zone`, yang memetakan ke `zone_id` lalu membuangnya.
- **Tidak tersambung Wi-Fi kampus = tidak tampil di peta.** Jangan tambahkan fallback lokasi lain tanpa diminta.
- **Visibilitas timbal balik** di Match Map: pengguna yang tidak tampil tidak boleh bisa membaca presence orang lain (ditegakkan di RLS, bukan hanya UI).
- **Lokasi hanya dikirim saat app di foreground** dan toggle aktif. Tidak ada background location/task.
- **Event luar kampus hanya bisa dibuat role `curator`/`admin`**, dicek di RLS dan Edge Function `create-event`. Venue harus berstatus `approved`.
- **Login kampus**: domain email institusi di-allowlist; login via kode OTP. Jangan implementasikan sign-up email bebas.
- **Kuis kepribadian diisi sekali, seumur hidup akun.** 15 pertanyaan, sistem archetype tim 6 kategori dengan skoring berbobot 70/30 — isi pertanyaan, pemetaan skor, dan algoritmanya **sudah final**, ada di [METHODOLOGY.md](./METHODOLOGY.md). Jangan mengubah isi pertanyaan/bobot skor kuis tanpa merujuk dan memperbarui dokumen itu. Setelah pengguna submit akhir, jawaban dan hasil (`personality_type`, `personality_scores`, `learning_style`) terkunci permanen — tidak ada menu ulang/reset kuis di MVP. Sebelum submit akhir, pengguna boleh menekan "Kembali" untuk melihat dan mengubah jawaban pertanyaan sebelumnya (jawaban yang belum di-submit dianggap draft). Wajib ada modal peringatan sebelum kuis dimulai (jumlah pertanyaan + peringatan isi jujur karena hasil jadi label permanen) dan konfirmasi terakhir sebelum submit. Penguncian harus ditegakkan di RLS, bukan hanya UI. Detail di [PRD.md §6.1](./PRD.md) dan [ARCHITECTURE.md §4.1](./ARCHITECTURE.md).
- **Moderasi**: `pending_review` sebelum `banned`; tidak ada auto-ban dari satu laporan.
- **Tidak ada pembayaran** di aplikasi. Biaya event hanya ditampilkan sebagai catatan ("bayar di tempat").
- **Android saja** untuk MVP. Jangan menambah kode khusus iOS kecuali diminta.
- **Service role key Supabase tidak boleh ada di aplikasi.** Semua variabel `EXPO_PUBLIC_*` ikut terbundel di APK dan bisa dibaca siapa pun.

## Yang TIDAK perlu dilakukan tanpa diminta

- Jangan menambah dependency baru di luar stack yang sudah ditentukan tanpa konfirmasi.
- Jangan menulis test untuk setiap perubahan kecil kalau user tidak minta (tapi tetap jalankan test yang sudah ada sebelum menganggap task selesai).
- Jangan membuat ulang skema database dari nol kalau migration sudah ada — tambahkan migration baru.
- Jangan eject ke bare workflow atau mengedit folder `android/` secara manual; gunakan config plugin di `app.config.ts`.

## Git: Jangan Commit atau Push Sendiri

- **Jangan pernah menjalankan `git commit` atau `git push` secara mandiri**, dengan alasan apa pun, kecuali user secara eksplisit memintanya di pesan tersebut.
- Ini berlaku juga untuk operasi git lain yang mengubah riwayat/remote: `git add` diikuti commit otomatis, `git merge`, `git rebase`, `git tag`, dan sejenisnya.
- Setelah selesai mengubah file, cukup laporkan file apa yang berubah dan biarkan user yang review lalu commit/push sendiri.
- Jika user memang minta commit, tetap ikuti aturan git safety (stage file spesifik, jangan `git add .`, jangan force push ke `main`/`master`, jangan `--amend` kecuali diminta).

## Cara Menjalankan & Verifikasi

```powershell
npm install
npx expo run:android   # build & pasang development build ke HP Android (sekali di awal / setelah ganti library native)
npm run start          # dev server untuk development build
npm run lint
npm run typecheck
npm run test
npm run build:apk      # APK untuk demo/submission (EAS Build profil preview)
```

Uji fitur Wi-Fi/BSSID di **HP Android fisik**, bukan emulator. Lihat [INSTALLATION.md](./INSTALLATION.md) untuk setup Supabase, Edge Functions, dan environment variable. Lihat [METHODOLOGY.md](./METHODOLOGY.md) untuk isi lengkap kuis kepribadian.
