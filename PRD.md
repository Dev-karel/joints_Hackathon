# Product Requirements Document (PRD) — AyoMatch

> Versi: 1.0 — 25 September 2026
> Untuk: Hackathon JOINTS UGM 2026 (FMIPA UGM), track **Healthcare** dengan sentuhan **Education**

Dokumen pelengkap: [README.md](./README.md) (latar belakang & fitur), [ARCHITECTURE.md](./ARCHITECTURE.md) (arsitektur & data model), [ROADMAP.md](./ROADMAP.md) (timeline), [CLAUDE.md](./CLAUDE.md) (konvensi kerja AI assistant).

---

## 1. Latar Belakang & Masalah

Interaksi dengan teman sebaya berkontribusi besar terhadap kemampuan kognitif dan rasa percaya diri mahasiswa. Namun kelompok sebaya cenderung eksklusif, sehingga mahasiswa yang gagal menemukan "teman sefrekuensi" berisiko terisolasi secara sosial.

Data I-NAMHS: 1 dari 3 remaja Indonesia (34,9%, ±15,5 juta jiwa) punya masalah kesehatan mental, dan sebagian besar melaporkan gangguan tersebut merusak kemampuan mereka berhubungan dengan teman sebaya (41,1%) dan berfungsi di sekolah/kampus (39,3%).

**Masalah inti**: tidak ada cara sistematis bagi mahasiswa baru/introvert/pindahan untuk menemukan partner belajar atau teman yang cocok secara gaya belajar, kepribadian, dan minat — mereka bergantung pada pertemuan kebetulan.

## 2. Solusi & Tujuan Produk

**AyoMatch** adalah web app (mobile-first, PWA) yang mempertemukan mahasiswa dalam satu kampus berdasarkan gaya belajar, kepribadian, dan minat, dimulai dari kebutuhan paling konkret: mencari partner belajar (Study Match).

### Tujuan (Goals)

1. Memutus siklus isolasi ↔ kerusakan kesehatan mental dengan mempertemukan mahasiswa secara proaktif, bukan menunggu "kebetulan".
2. Memvalidasi bahwa matching berbasis kepribadian & gaya belajar bisa mendorong pembentukan kelompok belajar baru.
3. Menyediakan MVP yang bisa didemokan penuh (bukan mockup) pada Grand Final, dengan fondasi data model yang extensible untuk fitur match lain pasca-hackathon.

### Non-Goals (MVP ini)

- Bukan aplikasi kencan/dating.
- Bukan native mobile app (Flutter/React Native) — web app biasa (SSR/CSR Next.js).
- Tidak ada fitur pembayaran/monetisasi.
- Sport Match, Gaming Match, Art Match, Organisation Match **tidak** diimplementasikan penuh — hanya disiapkan strukturnya (`match_type` extensible).
- Bukan model klasifikasi kepribadian berbasis ML — cukup rule/skor sederhana dari kuis.

## 3. Target Pengguna

| Persona | Kebutuhan |
|---|---|
| Mahasiswa baru/pindahan | Cepat kenal lingkungan kampus, cari teman & partner belajar sejak awal semester |
| Mahasiswa introvert/kesulitan bersosialisasi | Cara berinteraksi yang lebih terstruktur & tidak mengintimidasi dibanding forum umum |
| Mahasiswa yang butuh partner belajar spesifik | Cocok berdasarkan mata kuliah, gaya belajar (slow/fast learner), dan jadwal |
| Mahasiswa yang ingin menjaga privasi lokasi | Tetap bisa terhubung lewat Match Map tanpa membagikan lokasi presisi |

Batasan akses: hanya mahasiswa dengan email institusi kampus (domain di-allowlist), tidak terbuka untuk publik umum.

## 4. Scope MVP (Study Match)

Scope hackathon **hanya** fitur berikut. Urutan sesuai prioritas implementasi (lihat juga [ROADMAP.md](./ROADMAP.md) untuk pemetaan waktu).

| # | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| 1 | Login kampus | Autentikasi via email institusi (domain allowlist), tanpa sign-up email bebas | Must-have |
| 2 | Kuis kepribadian | Onboarding quiz singkat, wajib diisi sebelum akses dashboard → klasifikasi rule-based (contoh: slow/fast learner) | Must-have |
| 3 | Study Match | Cocokkan mahasiswa berdasarkan mata kuliah, gaya belajar, kepribadian | Must-have |
| 4 | Buat / Join Event | Buat sesi belajar (agenda, kuota peserta), join event orang lain, ganti/keluar grup | Must-have |
| 5 | Match Map | Peta lokasi approximate (grid ~100–300m) mahasiswa online, filter berdasarkan kepribadian/hobi/jurusan/game | Should-have |
| 6 | Add Friend & Grup | Tambah teman, chat privat/grup realtime | Should-have |
| 7 | View Profile | Lihat profil & hasil kepribadian pengguna lain | Should-have |
| 8 | Report & Moderasi | Lapor pengguna → `pending_review` → tinjauan manual → banned jika terverifikasi | Should-have |

## 5. User Stories (Ringkas)

- Sebagai mahasiswa baru, saya ingin login dengan email kampus saya agar hanya sesama mahasiswa yang bisa mengakses platform ini.
- Sebagai pengguna baru, saya ingin mengisi kuis kepribadian singkat agar sistem tahu gaya belajar saya sebelum mulai mencari match.
- Sebagai mahasiswa yang kesulitan memahami mata kuliah tertentu, saya ingin dicocokkan dengan mahasiswa lain yang mengambil mata kuliah sama dan gaya belajarnya cocok dengan saya.
- Sebagai host belajar kelompok, saya ingin membuat event belajar dengan agenda dan kuota agar orang yang tepat bisa join.
- Sebagai peserta, saya ingin melihat mahasiswa lain yang sedang online di sekitar saya (lokasi approximate) agar bisa cari teman belajar dadakan tanpa harus membagikan lokasi presis saya.
- Sebagai pengguna, saya ingin melaporkan pengguna yang berperilaku tidak pantas dan yakin laporan saya ditinjau sebelum ada tindakan banned.

## 6. Requirement Non-Fungsional

- **Privasi lokasi**: koordinat GPS presisi tidak pernah dikirim ke client lain — wajib dibulatkan (geohash/grid ~100–300m) di server. Non-negotiable, lihat [ARCHITECTURE.md §5](./ARCHITECTURE.md).
- **Keamanan data**: RLS aktif di semua tabel yang menyimpan data personal (lokasi, hasil kepribadian, kontak, KTM). Service role key Supabase tidak pernah diekspos ke client.
- **Autentikasi terbatas domain**: hanya email kampus yang di-allowlist yang bisa daftar/login.
- **Moderasi bertahap**: status `pending_review` sebelum `banned`, tidak ada auto-ban dari satu laporan.
- **Mobile-first & responsive**: mayoritas mahasiswa akan mengakses dari HP saat demo maupun penggunaan nyata.
- **Availability saat demo**: harus bisa jalan offline/lokal sebagai fallback Grand Final jika koneksi venue bermasalah.
- **Performa dasar**: rate limiting di endpoint rawan spam (report, kirim pesan, buat event).

## 7. Metrik Keberhasilan

Untuk hackathon (evaluasi juri, bobot sesuai sistem penilaian di [ROADMAP.md](./ROADMAP.md)):

- Inovasi (25%), Implementasi Teknis (30%), Fungsionalitas & Desain (20%), Dampak & Kelayakan (15%), Presentasi (10%).
- Demo end-to-end berjalan tanpa error kritis: login → kuis → match → buat/join event → (jika sempat) Match Map & chat.

Untuk validasi produk (indikatif, bukan syarat lomba):

- Jumlah event belajar yang berhasil dibuat & di-join selama masa uji/demo.
- Tingkat penyelesaian kuis onboarding (tidak drop di tengah).
- Jumlah pertemanan baru yang terbentuk lewat platform (metrik pasca-hackathon, lihat [ROADMAP.md](./ROADMAP.md)).

## 8. Asumsi & Batasan (Constraints)

- Tim 4 orang, waktu efektif pengembangan ±3 minggu (25 Sep – 16 Okt 2026).
- Tech stack sudah ditentukan dan tidak boleh diganti tanpa alasan kuat (lihat [CLAUDE.md](./CLAUDE.md)).
- Klasifikasi kepribadian MVP berbasis rule/skor sederhana, bukan ML — keterbatasan yang disadari dan disampaikan transparan ke juri.
- Fitur match selain Study Match hanya disiapkan strukturnya, tidak diimplementasikan penuh.
- Deploy gratis (Vercel + Supabase free tier) — perlu diperhatikan batas kuota jika demo diakses banyak orang bersamaan saat Grand Final.

## 9. Timeline Acuan

Lihat [ROADMAP.md](./ROADMAP.md) untuk breakdown fase per minggu. Milestone kunci:

| Tahap | Tanggal |
|---|---|
| Pengumpulan deliverables (kode, video demo, pitch deck, prototype) | 15–16 Oktober 2026, 23.50 WIB |
| Pengumuman finalis | 23 Oktober 2026 |
| Grand Final (pitching di FMIPA UGM) | 1 November 2026 |

## 10. Open Questions

- Sumber pertanyaan kuis kepribadian & bobot skoringnya — perlu difinalisasi tim sebelum Fase 1 (lihat ROADMAP.md Fase 1).
- Definisi "online" untuk Match Map (threshold waktu presence sebelum dianggap offline).
- Kebijakan retensi data setelah lomba selesai (apakah akun mahasiswa dihapus atau dilanjutkan sebagai produk nyata — lihat roadmap pasca-hackathon).
