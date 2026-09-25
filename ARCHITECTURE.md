# Arsitektur AyoMatch

## 1. Gambaran Umum

AyoMatch dibangun sebagai **web app mobile-first (PWA)** dengan Next.js full-stack (frontend + API route sekaligus) dan Supabase sebagai backend-as-a-service. Pilihan ini dipilih karena:

- Tim 4 orang, waktu terbatas sampai submission (± 3 minggu dari technical meeting ke pengumpulan).
- Satu codebase (Next.js) mengurangi overhead koordinasi frontend/backend terpisah.
- Supabase memberi auth, database, realtime, dan storage tanpa perlu membangun server sendiri — cocok untuk fitur seperti Match Map (realtime presence) dan chat.
- Deploy ke Vercel + Supabase Cloud gratis dan cukup stabil untuk demo Grand Final.

Mockup Figma/UI (lihat wireframe tim) tetap dijadikan deliverable "Prototype/mockup" sesuai ketentuan lomba, terpisah dari source code yang benar-benar berjalan.

## 2. Diagram Arsitektur (High Level)

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser/PWA)                 │
│   Next.js App Router (React) + Tailwind + shadcn/ui         │
│   TanStack Query (server state) + Zustand (UI state)        │
└───────────────┬───────────────────────────────┬─────────────┘
                │ HTTPS                          │ WebSocket
                ▼                                 ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│   Next.js API Routes /    │         │   Supabase Realtime        │
│   Server Actions          │         │   (presence, chat, event)  │
│   - validasi Zod          │         └───────────────────────────┘
│   - rounding lokasi       │
│   - business logic        │
└──────────────┬────────────┘
                │ Supabase JS client (service role utk operasi sensitif)
                ▼
┌─────────────────────────────────────────────────────────────┐
│                          Supabase                            │
│  - PostgreSQL (data utama + Row Level Security)              │
│  - Auth (email domain kampus, session JWT)                   │
│  - Storage (foto profil, KTM, bukti report)                  │
│  - Realtime channel (presence Match Map, chat)               │
└─────────────────────────────────────────────────────────────┘
```

## 3. Alur Pengguna Utama

### 3.1 Onboarding
1. User login/sign up pakai email kampus → Supabase Auth (magic link atau OTP, domain di-allowlist lewat Auth Hook).
2. Redirect ke halaman kuis kepribadian (wajib diisi sebelum akses dashboard).
3. Jawaban kuis dikirim ke API route → diproses jadi kategori kepribadian (contoh: slow/fast learner, introvert/extrovert) → disimpan di tabel `profiles`.
4. User masuk ke Dashboard utama.

### 3.2 Study Match & Event
1. Dari dashboard, user pilih jenis match (MVP: Study Match).
2. User bisa **buat event** (isi agenda, mata kuliah/topik, kuota peserta) atau **join event** yang sudah ada.
3. Setelah join, user masuk ke ruang grup event: bisa ganti course/group atau leave.
4. Event dan keanggotaan disimpan di tabel `events` dan `event_members`.

### 3.3 Match Map
1. Client mengirim lokasi kasar (dibulatkan di sisi client sebelum dikirim, lalu dibulatkan ulang di server) secara periodik via channel realtime saat user aktif di halaman map.
2. Server menyimpan lokasi presence di tabel sementara/`presence` dengan presisi rendah (grid ~100-300m), bukan koordinat asli.
3. Client menerima daftar user lain di sekitar (sudah dibulatkan) dan bisa filter berdasarkan kepribadian, hobi, jurusan, atau game.

### 3.4 Sosial: Friend, Grup, Report
1. Add friend → request masuk tabel `friendships` dengan status `pending`/`accepted`.
2. Grup dibuat otomatis setelah beberapa syarat (misal setelah accept friend, atau manual create group).
3. Report: user submit report → status `pending_review` → admin/moderator review manual → jika valid, status akun jadi `banned` dan email tidak bisa login lagi.

## 4. Data Model (Ringkas)

| Tabel | Kolom Penting | Catatan |
|---|---|---|
| `profiles` | id (FK ke auth.users), full_name, campus_email, major, personality_type, avatar_url, ktm_url | 1:1 dengan `auth.users` |
| `personality_answers` | id, profile_id, question_id, answer | Jawaban kuis onboarding |
| `events` | id, creator_id, match_type (study/sport/game/...), title, agenda, capacity, course_name, status | `match_type` enum, extensible untuk roadmap |
| `event_members` | id, event_id, profile_id, role (host/member), joined_at | |
| `friendships` | id, requester_id, addressee_id, status (pending/accepted/blocked) | |
| `groups` | id, name, created_by | Grup chat, bisa terkait event atau standalone |
| `group_members` | group_id, profile_id | |
| `messages` | id, group_id / DM pair, sender_id, content, created_at | Realtime via Supabase channel |
| `presence_locations` | profile_id, geohash_rounded, updated_at | TTL pendek, hanya untuk user yang online & opt-in |
| `reports` | id, reporter_id, target_id, reason, evidence_url, status (pending_review/valid/dismissed) | |

Skema detail (tipe kolom, constraint) ditulis sebagai SQL migration di `supabase/migrations/`, bukan hanya di dokumen ini — dokumen ini adalah ringkasan konseptual.

## 5. Keamanan & Privasi (Wajib Dipatuhi)

Karena AyoMatch adalah layanan yang terhubung ke internet dan menyimpan data pribadi mahasiswa (lokasi, hasil kepribadian, foto KTM), berikut aturan keamanan minimum:

- **Autentikasi**: hanya email domain kampus yang di-allowlist (contoh `@mail.ugm.ac.id`). Tidak ada sign-up bebas.
- **Row Level Security (RLS)** aktif di semua tabel Postgres. Contoh: user hanya bisa update baris `profiles` miliknya sendiri, hanya bisa baca `messages` dari grup yang dia ikuti.
- **Lokasi tidak pernah presisi**: koordinat GPS asli tidak boleh disimpan permanen atau dikirim ke client lain. Gunakan pembulatan grid/geohash dengan presisi rendah, dan hanya untuk user yang aktif opt-in ke Match Map.
- **Data sensitif** (foto KTM) disimpan di Supabase Storage bucket privat, hanya bisa diakses lewat signed URL berdurasi pendek untuk keperluan verifikasi, bukan bucket publik.
- **Moderasi report**: perubahan status ke `banned` harus melalui review, tidak auto-ban dari satu laporan.
- **Rate limiting** dasar di API route yang rawan spam (kirim report, kirim pesan, buat event) untuk mencegah abuse.
- Karena ini adalah service yang diakses publik (mahasiswa) melalui internet, pastikan environment variable kunci (service role key Supabase) **tidak pernah** diekspos ke client — hanya dipakai di server (API route/server action), sementara client memakai anon key dengan RLS aktif.

## 6. Deployment

- **Frontend + API**: Vercel (auto-deploy dari branch `main`, preview deploy per PR).
- **Database/Auth/Storage/Realtime**: Supabase Cloud (free tier untuk hackathon, upgrade jika perlu saat Grand Final).
- **Environment variables** dikelola lewat `.env.local` (dev) dan Vercel Project Settings (production) — lihat [INSTALLATION.md](./INSTALLATION.md).

## 7. Keterbatasan yang Disadari (untuk transparansi ke juri)

- Match Map versi hackathon menggunakan lokasi approximate, bukan GPS real-time presisi tinggi — trade-off yang disengaja demi privasi.
- Sistem klasifikasi kepribadian di MVP berbasis rule/skor sederhana dari kuis, bukan model ML — bisa dikembangkan lebih lanjut (lihat ROADMAP.md).
- Fitur match selain Study Match (sport, gaming, art, organisasi) belum diimplementasikan penuh di MVP, hanya disiapkan strukturnya agar extensible.
