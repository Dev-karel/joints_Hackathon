# AyoMatch

> Aplikasi matching mahasiswa dalam satu kampus — nemuin partner belajar, partner lomba, partner mabar, dan teman baru berdasarkan kecocokan gaya belajar, hobi, dan kepribadian.

Dibuat untuk **Hackathon JOINTS UGM 2026** (FMIPA UGM) — track **Healthcare** (kesehatan mental & isolasi sosial mahasiswa), dengan sentuhan **Education** (peer learning).

---

## Latar Belakang

Interaksi dengan teman sebaya terbukti berkontribusi besar terhadap kemampuan kognitif dan rasa percaya diri mahasiswa dalam mengerjakan tugas. Tapi kelompok sebaya juga cenderung eksklusif — mahasiswa yang gagal menemukan "teman sefrekuensi" berisiko terisolasi.

Data I-NAMHS menunjukkan 1 dari 3 remaja Indonesia (34,9%, ±15,5 juta jiwa) punya masalah kesehatan mental, dan sebagian besar dari mereka melaporkan gangguan itu justru merusak kemampuan mereka berhubungan dengan teman sebaya (41,1%) dan berfungsi di sekolah/kampus (39,3%).

**AyoMatch** memutus siklus isolasi ↔ kerusakan mental ini dengan sistem *matching* yang mempertemukan mahasiswa berdasarkan gaya belajar, kepribadian, dan minat mereka sejak awal — bukan menunggu mereka "kebetulan" ketemu.

## Fitur Utama (MVP: Study Match)

| Fitur | Deskripsi |
|---|---|
| Login kampus | Autentikasi menggunakan email institusi (SSO/domain-restricted) |
| Kuis kepribadian | Onboarding quiz singkat → sistem mengklasifikasikan gaya belajar/kepribadian pengguna (contoh: slow/fast learner) |
| Study Match | Cocokkan mahasiswa berdasarkan mata kuliah, gaya belajar, dan kepribadian |
| Buat / Join Event | Buat sesi belajar (agenda, kapasitas peserta) atau join event orang lain; bisa ganti grup atau keluar |
| Match Map | Peta lokasi mahasiswa lain yang sedang online, bisa difilter berdasarkan kepribadian, hobi, jurusan, atau game — lokasi ditampilkan approximate demi privasi |
| Add Friend & Grup | Tambah teman, chat privat/grup |
| View Profile | Lihat profil & hasil kepribadian pengguna lain |
| Report & Moderasi | Lapor pengguna bermasalah → tinjauan → banned via email jika terverifikasi |

**Roadmap fitur lanjutan** (di luar MVP hackathon): Sport Match, Gaming Match, Art Match, Organisation Match — lihat [ROADMAP.md](./ROADMAP.md).

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Peta**: Leaflet + OpenStreetMap
- **State & Data Fetching**: TanStack Query + Zustand
- **Form & Validasi**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel (app) + Supabase Cloud (database)

Alasan lengkap pemilihan stack dan diagram arsitektur ada di [ARCHITECTURE.md](./ARCHITECTURE.md).

## Struktur Project

```
ayomatch/
├── src/
│   ├── app/                # Next.js App Router (pages, layouts, API routes)
│   ├── components/         # Komponen UI reusable
│   ├── lib/supabase/       # Supabase client & helper query
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   └── types/              # Tipe TypeScript & hasil generate Supabase
├── supabase/
│   ├── migrations/         # SQL migration (schema, RLS policy)
│   └── seed.sql            # Data dummy untuk demo
├── public/                 # Aset statis
├── tests/                  # Unit & integration test
├── package.json
└── README.md
```

## Cara Mulai

Lihat panduan lengkap di [INSTALLATION.md](./INSTALLATION.md). Ringkas:

```powershell
git clone <repo-url> ayomatch
cd ayomatch
npm install
copy .env.example .env.local   # isi kredensial Supabase
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

## Dokumentasi Lain

- [CLAUDE.md](./CLAUDE.md) — konteks & konvensi kerja untuk AI coding assistant
- [ARCHITECTURE.md](./ARCHITECTURE.md) — arsitektur sistem, data model, dan pertimbangan keamanan
- [INSTALLATION.md](./INSTALLATION.md) — panduan instalasi & setup environment
- [ROADMAP.md](./ROADMAP.md) — timeline pengembangan mengikuti jadwal hackathon

## Tim

Dikembangkan oleh tim **AAD** untuk Hackathon JOINTS UGM 2026.

## Lisensi

Belum ditentukan — tambahkan file `LICENSE` sesuai kebutuhan tim sebelum rilis publik.
