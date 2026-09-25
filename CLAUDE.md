# CLAUDE.md

Dokumen ini memberi konteks kerja untuk AI coding assistant (Claude/Kiro/LLM lain) yang membantu pengembangan **AyoMatch**. Baca dulu sebelum membuat atau mengubah kode di repo ini.

## Ringkasan Project

AyoMatch adalah web app (mobile-first, PWA) yang mencocokkan mahasiswa dalam satu kampus untuk belajar bareng, mabar, ikut lomba bareng, dll, berdasarkan kepribadian dan minat. Dibangun untuk Hackathon JOINTS UGM 2026, deadline submission **16 Oktober 2026** dan Grand Final **1 November 2026**.

Scope MVP hackathon = **Study Match** saja. Fitur match lain (sport, gaming, art, organisasi) adalah roadmap pasca-MVP — jangan implementasikan penuh dulu kecuali diminta eksplisit, cukup sediakan struktur data yang extensible.

Detail fitur & alasan produk ada di [README.md](./README.md). Detail arsitektur & data model ada di [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tech Stack (wajib diikuti, jangan ganti tanpa alasan kuat)

- Next.js 14 App Router + TypeScript (strict mode)
- Tailwind CSS + shadcn/ui untuk semua komponen UI
- Supabase untuk auth, database (Postgres), realtime, dan storage
- Leaflet + OpenStreetMap untuk Match Map (jangan pakai Google Maps — butuh billing/API key)
- TanStack Query untuk data fetching dari Supabase, Zustand untuk state UI lokal (bukan server state)
- React Hook Form + Zod untuk semua form dan validasi input
- Vitest + Testing Library untuk test

## Konvensi Kode

- Semua komponen baru pakai TypeScript (`.tsx`), tidak ada `.jsx`.
- Komponen UI generik (button, card, dsb) taruh di `src/components/ui/` — cek dulu apakah shadcn/ui sudah punya sebelum membuat sendiri.
- Komponen spesifik fitur taruh di `src/components/<feature>/` (contoh: `src/components/match/`, `src/components/event/`).
- Query/mutation ke Supabase dibungkus di `src/lib/supabase/queries/` atau custom hook di `src/hooks/`, jangan panggil Supabase client langsung dari dalam komponen halaman.
- Skema database & Row Level Security policy hidup di `supabase/migrations/`, bukan diatur manual lewat dashboard tanpa migration file — supaya reproducible.
- Semua tabel yang menyimpan data personal (lokasi, hasil kepribadian, kontak) **wajib** punya RLS policy sebelum dianggap selesai.
- Gunakan Zod schema yang sama untuk validasi client (React Hook Form) dan server (API route) — definisikan sekali di `src/types/` atau `src/lib/validation/`, import di kedua sisi.
- Commit kecil dan deskriptif. Jangan gabungkan perubahan skema database dengan perubahan UI yang tidak berhubungan.

## Batasan & Keputusan Desain Penting

- **Privasi lokasi (Match Map)**: jangan pernah expose koordinat GPS presisi pengguna lain ke client. Lokasi harus dibulatkan ke area/gedung (geohash atau grid, presisi ~100–300m) sebelum dikirim. Ini non-negotiable — lihat bagian keamanan di ARCHITECTURE.md.
- **Login kampus**: autentikasi dibatasi ke domain email institusi (allowlist domain), bukan email bebas. Jangan implementasikan sign-up dengan email sembarang.
- **Moderasi/report**: akun yang di-report harus melalui status `pending_review` sebelum benar-benar `banned` — jangan auto-ban dari satu report saja kecuali diminta.
- **Tidak ada fitur pembayaran** di scope MVP. Jangan tambahkan integrasi payment gateway tanpa diminta.
- App ini SSR/CSR web biasa (Next.js), **bukan** native mobile app. Jangan sarankan Flutter/React Native kecuali user eksplisit minta pivot.

## Yang TIDAK perlu dilakukan tanpa diminta

- Jangan menambah dependency baru di luar stack yang sudah ditentukan tanpa konfirmasi.
- Jangan menulis test untuk setiap perubahan kecil kalau user tidak minta (tapi tetap jalankan test yang sudah ada sebelum menganggap task selesai).
- Jangan membuat ulang skema database dari nol kalau migration sudah ada — tambahkan migration baru.

## Git: Jangan Commit atau Push Sendiri

- **Jangan pernah menjalankan `git commit` atau `git push` secara mandiri**, dengan alasan apa pun, kecuali user secara eksplisit memintanya di pesan tersebut.
- Ini berlaku juga untuk operasi git lain yang mengubah riwayat/remote: `git add` diikuti commit otomatis, `git merge`, `git rebase`, `git tag`, dan sejenisnya.
- Setelah selesai mengubah file, cukup laporkan file apa yang berubah dan biarkan user yang review lalu commit/push sendiri.
- Jika user memang minta commit, tetap ikuti aturan di bagian git_safety pada system prompt (stage file spesifik, jangan `git add .`, jangan force push ke `main`/`master`, jangan `--amend` kecuali diminta).

## Cara Menjalankan & Verifikasi

```powershell
npm install
npm run dev        # dev server
npm run lint        # linting
npm run test        # unit test (vitest --run)
npm run build       # verifikasi build production sebelum submission
```

Lihat [INSTALLATION.md](./INSTALLATION.md) untuk setup Supabase project dan environment variable.
