# AyokMatch

> Aplikasi Android untuk mahasiswa dalam satu kampus — nemuin partner belajar, partner lomba, dan teman baru berdasarkan kecocokan kepribadian (archetype tim), mata kuliah, dan hobi. Di dalam kampus lewat Match dan Match Map, di luar kampus lewat Event yang dikurasi.

Dibuat untuk **Hackathon JOINTS UGM 2026** (FMIPA UGM) — track **Healthcare** (kesehatan mental & isolasi sosial mahasiswa), dengan sentuhan **Education** (peer learning).

---

## Latar Belakang

Interaksi dengan teman sebaya terbukti berkontribusi besar terhadap kemampuan kognitif dan rasa percaya diri mahasiswa dalam mengerjakan tugas. Tapi kelompok sebaya juga cenderung eksklusif — mahasiswa yang gagal menemukan "teman sefrekuensi" berisiko terisolasi.

Data I-NAMHS menunjukkan 1 dari 3 remaja Indonesia (34,9%, ±15,5 juta jiwa) punya masalah kesehatan mental, dan sebagian besar dari mereka melaporkan gangguan itu justru merusak kemampuan mereka berhubungan dengan teman sebaya (41,1%) dan berfungsi di sekolah/kampus (39,3%).

**AyokMatch** memutus siklus isolasi ↔ kerusakan mental ini dengan sistem *matching* yang mempertemukan mahasiswa berdasarkan kepribadian, mata kuliah, dan minat mereka sejak awal — bukan menunggu mereka "kebetulan" ketemu.

## Fitur Utama (MVP)

| Tab | Fitur | Deskripsi |
|---|---|---|
| — | Login kampus | Email `@binus.ac.id` + kata sandi; kode OTP ke email kampus saat daftar dan di HP baru |
| — | Kuis kepribadian | 15 pertanyaan A/B onboarding → salah satu dari 6 archetype tim (contoh: Sagekeeper). Metodologi & skoring di [METHODOLOGY.md](./docs/METHODOLOGY.md). Boleh navigasi "Kembali" sebelum submit akhir, tapi hasilnya jadi label permanen akun setelah disubmit — lihat [PRD.md §6.1](./docs/PRD.md) |
| Match › Belajar | Study Match | Rekomendasi partner belajar + buat/gabung sesi belajar di ruangan kampus |
| Match › Lomba | Competition Match | Lowongan anggota tim lomba + permintaan bergabung |
| Peta | Match Map | Siapa yang online per ruangan, dideteksi dari **access point Wi-Fi kampus** (BSSID) — tanpa GPS, tanpa titik koordinat |
| Event | Event luar kampus | Nongkrong, hobi, event langka bulanan, acara mitra — **hanya dibuat kurator**, dengan RSVP dan pengingat |
| Profil | Profil & sosial | Profil, teman, chat, laporan & moderasi |

**Roadmap** (di luar MVP): Sport/Gaming/Art/Organisation Match, dukungan iOS, integrasi controller Wi-Fi kampus — lihat [ROADMAP.md](./docs/ROADMAP.md).

## Tech Stack

- **Aplikasi**: React Native + Expo SDK 57 (TypeScript), Android
- **Navigasi**: expo-router
- **UI**: NativeWind (Tailwind untuk React Native), react-native-svg (peta zona)
- **Backend**: Supabase (PostgreSQL + RLS, Auth, Realtime, Storage, Edge Functions)
- **Wi-Fi/BSSID**: @react-native-community/netinfo
- **State & Data Fetching**: TanStack Query + Zustand
- **Form & Validasi**: React Hook Form + Zod
- **Testing**: Jest (jest-expo) + React Native Testing Library
- **Distribusi**: APK via EAS Build

Alasan pemilihan stack dan diagram arsitektur ada di [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Struktur Project

```
ayokmatch/
├── app/                # expo-router: (auth), (tabs), admin
├── src/
│   ├── components/     # komponen UI reusable
│   ├── features/       # match, map, event, social
│   ├── lib/            # supabase, wifi (BSSID), validation (Zod)
│   ├── stores/         # Zustand stores
│   └── types/          # tipe TypeScript & hasil generate Supabase
├── supabase/
│   ├── migrations/     # SQL schema + RLS policy
│   ├── functions/      # Edge Functions (resolve-zone, register-access-point, create-event)
│   └── seed.sql        # data demo
├── assets/
├── app.config.ts
├── eas.json
└── package.json
```

## Cara Mulai

Lihat panduan lengkap di [INSTALLATION.md](./docs/INSTALLATION.md). Ringkas:

```powershell
git clone <repo-url> ayokmatch
cd ayokmatch
npm install
copy .env.example .env   # isi URL & anon key Supabase
npx expo run:android     # pasang development build ke HP Android via USB
npm run start
```

Fitur Match Map harus diuji di HP Android fisik yang tersambung Wi-Fi.

## Dokumentasi Lain

- **[CATATAN-TIM.md](./docs/CATATAN-TIM.md) — baca ini dulu kalau baru `git pull`**: ringkasan perubahan besar, penjelasan berkas yang tidak ikut repo (`.env` dll), dan jebakan build yang sudah terdiagnosis (JDK 17, `npm.cmd`, aset logo)
- [PRD.md](./docs/PRD.md) — kebutuhan produk & scope MVP
- [CLAUDE.md](./CLAUDE.md) — konteks & konvensi kerja untuk AI coding assistant
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — arsitektur sistem, data model, dan pertimbangan keamanan
- [METHODOLOGY.md](./docs/METHODOLOGY.md) — metodologi & skoring kuis kepribadian (archetype tim)
- [INSTALLATION.md](./docs/INSTALLATION.md) — panduan instalasi & setup environment
- [ROADMAP.md](./docs/ROADMAP.md) — timeline pengembangan mengikuti jadwal hackathon

## Tim

Dikembangkan oleh tim **AAD** untuk Hackathon JOINTS UGM 2026.

## Lisensi

**All Rights Reserved** — lihat [LICENSE](./LICENSE). Repo ini dipublikasikan untuk keperluan penilaian Hackathon JOINTS UGM 2026, tanpa memberi izin pihak lain memakai ulang kodenya. Alasan pemilihannya ada di [CATATAN-TIM.md §5](./docs/CATATAN-TIM.md).
