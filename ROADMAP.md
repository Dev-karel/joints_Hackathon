# Roadmap AyoMatch

Roadmap ini dipetakan ke timeline resmi **Hackathon JOINTS UGM 2026**. Diperbarui: **29 September 2026** (setelah pivot ke React Native — lihat [PRD.md](./PRD.md) v1.3).

## Timeline Resmi Lomba (acuan deadline)

| Tahap | Tanggal |
|---|---|
| Pendaftaran | 18 Agustus – **9 Oktober 2026** |
| Technical Meeting | 12 Oktober 2026 |
| **Pengumpulan deliverables** | **15–16 Oktober 2026, pukul 23.50 WIB** |
| Pengumuman finalis | 23 Oktober 2026 |
| Technical Meeting Final | 26 Oktober 2026 |
| **Grand Final (pitching di FMIPA UGM)** | **1 November 2026, 07.00–15.30 WIB** |

Deliverables wajib saat pengumpulan: Video demo (≤2 menit, YouTube publik), Source Code (GitHub), Pitch Deck (PDF), Prototype/Mockup UI-UX. Proposal PDF opsional di guidebook, tetapi juri menyeleksi proposal untuk Grand Final — anggap wajib.

> **Aturan tim**: Must-have (PRD §5 #1–5) harus stabil di HP Android sebelum ada yang mengerjakan Should-have. Could-have hanya jika semua Should-have selesai.

---

## Fase 0 — Pivot & Persiapan (29 Sep – 1 Okt 2026)

- [x] Finalisasi ide & problem statement
- [x] Putuskan pivot ke React Native (Expo), Android dulu, lokasi per access point Wi-Fi
- [ ] Buat project Expo SDK 57 + expo-router + NativeWind sesuai struktur di README
- [ ] **Development build berhasil jalan di HP Android semua anggota** (`npx expo run:android`)
- [ ] Setup project Supabase, Supabase CLI, dan migration awal (`profiles`, `campus_zones`, `wifi_access_points`, `presence`)
- [ ] Spike teknis: baca BSSID dengan NetInfo di HP fisik (izin lokasi presisi) — **buktikan jalan sebelum Fase 2**
- [ ] Bagi peran (contoh: 1 backend/Supabase + Edge Functions, 2 aplikasi RN, 1 UI/UX + pitch deck + survei Wi-Fi)

## Fase 1 — Auth & Onboarding (2 – 5 Okt 2026)

- [ ] Login OTP email kampus + allowlist domain (Auth Hook)
- [ ] Kuis kepribadian 6 pertanyaan + klasifikasi rule-based
- [ ] Profil dasar (avatar, jurusan, semester)
- [ ] Shell navigasi: Beranda · Match · Event · Peta · Profil
- [ ] Survei access point di kampus mulai (mode admin sementara lewat SQL jika layar belum jadi)

## Fase 2 — Match Belajar & Match Map (6 – 9 Okt 2026)

- [ ] Rekomendasi partner belajar (fungsi Postgres skor kecocokan)
- [ ] Buat/gabung sesi belajar (zona kampus, kuota, status Penuh)
- [ ] Edge Function `resolve-zone` + heartbeat presence di foreground
- [ ] Layar **Daftarkan Wi-Fi** (role admin) + Edge Function `register-access-point`
- [ ] Peta zona skematis (react-native-svg) + sheet daftar per ruangan + visibilitas timbal balik
- [ ] **Pastikan pendaftaran tim lomba sudah beres sebelum 9 Oktober**

## Fase 3 — Event Luar Kampus (10 – 12 Okt 2026)

- [ ] Tabel `venues`, `events`, `event_rsvps` + RLS role kurator
- [ ] Daftar event, detail, RSVP dengan kuota & daftar tunggu
- [ ] Form buat event (hanya kurator) via Edge Function `create-event`
- [ ] Notifikasi lokal pengingat H-1 dan 3 jam sebelum acara
- [ ] Seed event & venue demo
- [ ] Ikuti **Technical Meeting** (12 Okt)

## Fase 4 — Lomba & Sosial (13 – 14 Okt 2026)

- [ ] Match › Lomba: lowongan tim + permintaan bergabung
- [ ] Add friend & chat dasar (Realtime)
- [ ] View profile pengguna lain
- [ ] Laporan pengguna/event (`pending_review`)
- [ ] Jika semua di atas stabil: Meja Kecil dan "Mau ketemu lagi?" (Could-have)

## Fase 5 — Polish & Deliverables (15 – 16 Okt 2026, deadline 23.50 WIB)

- [ ] QA semua flow di minimal 2 HP Android berbeda
- [ ] Build APK final (EAS profil `preview`)
- [ ] Rekam video demo (maks 2 menit) → YouTube (public). Tunjukkan Match Map berpindah zona saat pindah Wi-Fi
- [ ] Susun Pitch Deck (PDF) & proposal
- [ ] Rapikan README & source code di GitHub
- [ ] Export prototype/mockup Figma
- [ ] **Submit semua deliverables sebelum 16 Oktober 2026, 23.50 WIB**

## Fase 6 — Menunggu Hasil & Persiapan Final (17 – 31 Okt 2026)

- [ ] Pantau pengumuman finalis (23 Oktober 2026)
- [ ] Jika lolos: Technical Meeting Final (26 Oktober 2026)
- [ ] Materi pitching (10–12 menit) + antisipasi tanya jawab (privasi BSSID, presisi zona, keamanan event luar kampus)
- [ ] Latihan demo langsung dengan **hotspot perangkat ketiga** (lihat INSTALLATION.md §9)
- [ ] Siapkan fallback Supabase lokal di laptop

## Fase 7 — Grand Final (1 November 2026)

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
