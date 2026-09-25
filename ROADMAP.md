# Roadmap AyoMatch

Roadmap ini dipetakan ke timeline resmi **Hackathon JOINTS UGM 2026** (lihat Guidebook Hackathon JOINTS 2026). Hari ini: **25 September 2026**.

## Timeline Resmi Lomba (acuan deadline)

| Tahap | Tanggal |
|---|---|
| Pendaftaran | 18 Agustus – 9 Oktober 2026 |
| Technical Meeting | 12 Oktober 2026 |
| **Pengumpulan deliverables** | **15–16 Oktober 2026, pukul 23.50 WIB** |
| Pengumuman finalis | 23 Oktober 2026 |
| Technical Meeting Final | 26 Oktober 2026 |
| **Grand Final (pitching di FMIPA UGM)** | **1 November 2026, 07.00–15.30 WIB** |

Deliverables wajib saat pengumpulan: Video demo (≤2 menit, YouTube publik), Source Code (GitHub), Pitch Deck (PDF), Prototype/Mockup UI-UX. Proposal PDF bersifat opsional.

---

## Fase 0 — Persiapan (25 Sep – 5 Okt 2026)

- [x] Finalisasi ide & problem statement (AyoMatch — done, lihat README.md)
- [x] Tentukan tech stack (lihat ARCHITECTURE.md)
- [ ] Setup repo GitHub, project board, dan branch protection dasar
- [ ] Setup project Supabase + Vercel
- [ ] Finalisasi wireframe/mockup UI-UX (lanjutan dari wireframe tim yang sudah ada) di Figma
- [ ] Definisikan skema database awal (`profiles`, `events`, `event_members`, `friendships`)
- [ ] Bagi peran tim (contoh: 1 backend/Supabase, 2 frontend, 1 UI/UX & pitch deck)

## Fase 1 — Core MVP: Auth & Onboarding (6 – 9 Okt 2026)

- [ ] Setup Next.js project sesuai struktur di README.md
- [ ] Integrasi Supabase Auth dengan allowlist domain email kampus
- [ ] Halaman kuis kepribadian + logic klasifikasi sederhana (rule-based)
- [ ] Halaman profil (isi data diri, upload avatar/KTM ke Supabase Storage)
- [ ] Dashboard utama (shell navigasi ke fitur match)

## Fase 2 — Core MVP: Study Match & Event (10 – 12 Okt 2026)

- [ ] CRUD event (buat event, isi agenda & kuota)
- [ ] Join / leave / change event
- [ ] List & detail event dengan filter dasar (mata kuliah/topik)
- [ ] Ikuti **Technical Meeting** (12 Okt) — pastikan semua anggota tahu update aturan terbaru dari panitia

## Fase 3 — Fitur Sosial & Match Map (13 – 14 Okt 2026)

- [ ] Add friend & daftar teman
- [ ] Grup & chat dasar (realtime via Supabase channel)
- [ ] Match Map dengan Leaflet + lokasi approximate + filter (kepribadian/hobi/jurusan/game)
- [ ] Fitur report pengguna (status pending_review)

## Fase 4 — Polish & Deliverables (15 – 16 Okt 2026, deadline 23.50 WIB)

- [ ] QA menyeluruh: cek semua flow utama tidak error, responsive di mobile
- [ ] Deploy final ke Vercel, cek environment variable production
- [ ] Rekam video demo (maks 2 menit) → upload YouTube (public)
- [ ] Susun & finalisasi Pitch Deck (PDF)
- [ ] Rapikan README & source code di GitHub (repository publik/sesuai ketentuan)
- [ ] Export/rapikan prototype/mockup UI-UX sebagai deliverable terpisah
- [ ] **Submit semua deliverables sebelum 16 Oktober 2026, 23.50 WIB**

## Fase 5 — Menunggu Hasil & Persiapan Final (17 – 26 Okt 2026)

- [ ] Pantau pengumuman finalis (23 Oktober 2026)
- [ ] Jika lolos: ikuti Technical Meeting Final (26 Oktober 2026)
- [ ] Siapkan materi pitching sesuai format Grand Final (pitching 10–12 menit, tanya jawab 5–8 menit)
- [ ] Latihan demo langsung (bukan cuma video) — antisipasi pertanyaan juri soal implementasi teknis & privasi data lokasi

## Fase 6 — Grand Final (1 November 2026)

- [ ] Bawa laptop dengan environment siap demo offline (fallback jika internet venue bermasalah — siapkan build lokal atau video cadangan)
- [ ] Pitching + demo sesuai sistem penilaian (Inovasi 25%, Implementasi Teknis 30%, Fungsionalitas & Desain 20%, Dampak & Kelayakan 15%, Presentasi 10%)

---

## Roadmap Pasca-Hackathon (di luar scope lomba, opsional)

Ide dari brainstorming awal tim yang bisa dikembangkan setelah lomba jika AyoMatch ingin dilanjutkan sebagai produk nyata:

- **Sport Match, Gaming Match, Art Match, Organisation Match** — perluasan dari `match_type` yang sudah disiapkan extensible di data model
- Model klasifikasi kepribadian yang lebih matang (bukan cuma rule-based) berbasis riset yang dikutip di README (Jurnal Pendidikan & Pembelajaran SD, Jurnal Citra Pendidikan Anak)
- Notifikasi push (web push) untuk event & chat
- Versi kampus lain dengan branding berbeda (sesuai catatan tim: "misal apk nya ga sukses di lomba, bisa lanjut pakai nama kampus lain")
- Analitik dampak: seberapa banyak pertemanan/kelompok belajar baru yang terbentuk lewat platform
