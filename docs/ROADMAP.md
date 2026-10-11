# Roadmap AyokMatch

Roadmap ini dipetakan ke timeline resmi **Hackathon JOINTS UGM 2026**. Diperbarui: **10 Oktober 2026** (disusun ulang karena Fase 0–1 versi lama meleset; lihat [PRD.md](./PRD.md) v1.6).

## Timeline Resmi Lomba (acuan deadline)

| Tahap | Tanggal |
|---|---|
| Pendaftaran | 18 Agustus – **9 Oktober 2026** (sudah lewat — pastikan tim sudah terdaftar) |
| Technical Meeting | 12 Oktober 2026 |
| **Pengumpulan deliverables** | **15–16 Oktober 2026, pukul 23.50 WIB** |
| Pengumuman finalis | 23 Oktober 2026 |
| Technical Meeting Final | 26 Oktober 2026 |
| **Grand Final (pitching di FMIPA UGM)** | **1 November 2026, 07.00–15.30 WIB** |

Deliverables wajib saat pengumpulan: Video demo (≤2 menit, YouTube publik), Source Code (GitHub), Pitch Deck (PDF), Prototype/Mockup UI-UX. Proposal PDF opsional di guidebook, tetapi juri menyeleksi proposal untuk Grand Final — anggap wajib.

> **Aturan tim**: Must-have (PRD §5 #1–5) harus stabil di HP Android sebelum ada yang mengerjakan Should-have. Could-have hanya jika semua Should-have selesai.

## Cara Menguji: Dua Jalur

| Jalur | Dipakai untuk | Catatan |
|---|---|---|
| **Expo Go** (`npx expo start --go`, scan QR, satu Wi-Fi) | Layar, navigasi, NativeWind, form, login/query Supabase, kuis, sesi belajar, event | Tanpa Android Studio/kabel. Syarat: Expo Go di Play Store mendukung SDK 57 — cek dulu. Tidak mewakili hasil akhir untuk BSSID & notifikasi |
| **Dev build / APK sendiri** (EAS Build profil `development`, atau APK dari yang punya setup lokal) | Baca BSSID, izin Android, notifikasi lokal, library native (document-picker, file-system, image-picker, crypto) | Dibuat sekali, dibangun ulang hanya jika ada library native baru atau `app.config.ts` berubah. `EXPO_PUBLIC_*` harus diset lewat `eas env` karena `.env` tidak ikut build cloud |

Aturan kode: semua pembacaan BSSID berada di `src/lib/wifi/` di balik satu fungsi yang mengembalikan `null` bila BSSID tidak tersedia (mis. di Expo Go), sehingga layar Peta tidak crash dan sejalan dengan aturan "tidak tersambung Wi-Fi kampus = tidak tampil di peta".

---

## Fase 0 — Pivot & Persiapan (selesai sebagian, 29 Sep – 9 Okt 2026)

- [x] Finalisasi ide & problem statement
- [x] Putuskan pivot ke React Native (Expo), Android dulu, lokasi per access point Wi-Fi
- [x] Buat project Expo SDK 57 + expo-router + NativeWind (scaffold + 5 layar onboarding sudah di `main`)
- [x] Draf ERD (`docs/schema.dbml`)
- [ ] Setup project Supabase dan Supabase CLI (migration awal dipindah ke Fase 1)
- [ ] Dev build berjalan di minimal 1 HP Android (lihat "Cara Menguji")
- [ ] Bagi peran (contoh: 1 backend/Supabase + Edge Functions, 2 aplikasi RN, 1 UI/UX + pitch deck + survei Wi-Fi)

## Fase 1 — Fondasi Data, Spike BSSID & Auth (10 – 12 Okt 2026)

**10 Okt**
- [ ] Tes Expo Go (`npx expo start --go`); isi `.env`; minta/bangun dev build (Dev-karel atau EAS)
- [ ] Putuskan pertanyaan terbuka yang memengaruhi skema (PRD §14: zona awal, mata kuliah, kurator & venue awal, perilaku zona 1 orang) dan **finalkan ERD** di dbdiagram.io

**11 Okt**
- [x] Migration SQL ditulis di `supabase/migrations/` (bukan Prisma) — **belum diterapkan/diuji di Supabase**; panduan di [INSTALLATION.md](./INSTALLATION.md) §4.1
- [ ] Terapkan 5 migration ke Supabase (plugin/CLI/SQL Editor) dan jalankan cek cepat di INSTALLATION §4.1
- [ ] **Spike BSSID di HP fisik** dengan dev build: layar sederhana yang menampilkan `details.bssid` NetInfo; uji izin lokasi + layanan lokasi hidup, pindah access point. **Wajib terbukti sebelum Match Map dibangun**
- [x] Login `@binus.ac.id` + kata sandi + OTP (Daftar & HP baru) — kode selesai (`app/(auth)`, `src/features/auth`), allowlist domain lewat trigger DB; **belum diuji di perangkat**

**12 Okt** *(Technical Meeting)*
- [x] (kode selesai, belum diuji di perangkat) Kuis kepribadian 15 pertanyaan + modal peringatan + "Kembali" sebelum submit + `submit_personality_quiz` + penguncian permanen di RLS/trigger (lihat [METHODOLOGY.md](./METHODOLOGY.md) v1.1, PRD §6.1)
- [x] Shell navigasi: Beranda · Match · Event · Peta · Profil (placeholder "Segera hadir" untuk Match/Event/Peta)
- [ ] Profil dasar (avatar, jurusan, semester)

## Fase 2 — Match Belajar & Match Map (13 – 14 Okt 2026)

**13 Okt**
- [ ] Buat/gabung/keluar sesi belajar (kuota dijaga trigger + kunci baris; status Penuh; agenda berjam)
- [ ] Rekomendasi partner belajar (`recommend_study_partners`)
- [x] (kode selesai, belum di-deploy/diuji di HP) Edge Function `resolve-zone` + heartbeat presence di foreground
- [x] (kode selesai, belum di-deploy/diuji di HP) Layar admin **Daftarkan Wi-Fi** + Edge Function `register-access-point`

**14 Okt**
- [x] (kode selesai, belum diuji di HP) Peta zona skematis (react-native-svg) + sheet daftar per ruangan + visibilitas timbal balik
- [ ] **Feature freeze Must-have**; bangun APK `preview` pertama (`npm run build:apk`)
- [ ] *Hanya jika Must-have stabil:* Event (daftar, detail, RSVP berkuota, seed event & venue demo)
- [ ] Ditunda ke Should-have/pasca bila waktu tidak cukup: materi dari host (butuh 4 library native), host keluar (`host_leave_session`, polling/voting), Lomba, Chat, Laporan

## Fase 3 — QA, Polish & Deliverables (15 – 16 Okt 2026, deadline 23.50 WIB)

**15 Okt**
- [ ] QA semua flow Must-have di minimal 2 HP Android berbeda memakai **APK `preview`** (bukan hanya Expo Go)
- [ ] Rekam video demo (maks 2 menit) → YouTube (public). Tunjukkan Match Map berpindah zona saat pindah Wi-Fi
- [ ] Susun Pitch Deck (PDF) & proposal; export prototype/mockup Figma
- [ ] Rapikan README & source code di GitHub

**16 Okt**
- [ ] Perbaikan bug saja, tanpa fitur baru
- [ ] **Submit semua deliverables dengan target selesai ≤ 20.00 WIB** (batas resmi 23.50 WIB)

## Fase 4 — Menunggu Hasil & Persiapan Final (17 – 31 Okt 2026)

- [ ] Pantau pengumuman finalis (23 Oktober 2026)
- [ ] Jika lolos: Technical Meeting Final (26 Oktober 2026)
- [ ] Selesaikan item yang ditunda dari Fase 2 sesuai prioritas PRD §5: Event, Lomba, Add Friend & Chat, View Profile, Laporan; lalu Could-have (Meja Kecil, "Mau ketemu lagi?")
- [ ] Materi pitching (10–12 menit) + antisipasi tanya jawab (privasi BSSID, presisi zona, keamanan event luar kampus)
- [ ] Latihan demo langsung dengan **hotspot perangkat ketiga** (lihat INSTALLATION.md §9). Uji ulang apakah BSSID hotspot stabil antarsesi
- [ ] Siapkan fallback Supabase lokal di laptop
- [ ] Jalankan graphify setelah kode cukup banyak (`graphify update .` rutin)

## Fase 5 — Grand Final (1 November 2026)

- [ ] Bawa 2 HP demo + perangkat hotspot + laptop fallback, semua terisi penuh
- [ ] Daftarkan BSSID hotspot sebagai zona "Ruang Pitching" di pagi hari
- [ ] Pitching + demo sesuai sistem penilaian (Inovasi 25%, Implementasi Teknis 30%, Fungsionalitas & Desain 20%, Dampak & Kelayakan 15%, Presentasi 10%)

---

## Roadmap Pasca-Hackathon (opsional)

- Dukungan **iOS** (entitlement *Access Wi-Fi Information*)
- Integrasi **controller/RADIUS Wi-Fi kampus** lewat MoU dengan IT kampus (daftar AP otomatis)
- **Sport Match, Gaming Match, Art Match, Organisation Match** — perluasan dari struktur yang sudah disiapkan
- Model klasifikasi kepribadian yang lebih matang (bukan cuma rule-based)
- Notifikasi push (FCM) untuk chat & event
- Program kurator mitra (UKM, komunitas, kafe) sebagai model keberlanjutan
- Versi kampus lain dengan branding berbeda
- Analitik dampak: pertemanan & kelompok belajar baru yang terbentuk
