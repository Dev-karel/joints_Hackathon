# Instalasi & Setup AyoMatch

Panduan ini untuk menjalankan AyoMatch di komputer lokal (Windows/macOS/Linux) dan menyiapkan project Supabase.

## 1. Prasyarat

- [Node.js](https://nodejs.org/) versi 20 LTS atau lebih baru
- npm (ikut terpasang dengan Node.js)
- Git
- Akun [Supabase](https://supabase.com/) (gratis)
- Editor kode (Kiro/VS Code direkomendasikan)

Cek versi Node & npm (PowerShell):

```powershell
node -v
npm -v
```

## 2. Clone Repository

```powershell
git clone <repo-url> ayomatch
cd ayomatch
```

## 3. Install Dependencies

```powershell
npm install
```

## 4. Setup Project Supabase

1. Buka [supabase.com](https://supabase.com/) → buat project baru, pilih region terdekat (Singapore).
2. Di dashboard Supabase, buka **Project Settings → API**, catat:
   - `Project URL`
   - `anon public key`
   - `service_role key` (rahasia, jangan expose ke client/browser)
3. Buka **SQL Editor** di dashboard, jalankan migration yang ada di `supabase/migrations/` secara berurutan (atau gunakan Supabase CLI, lihat langkah 5).
4. Aktifkan **Row Level Security** untuk setiap tabel yang dibuat (lihat detail policy di `supabase/migrations/`).
5. Di **Authentication → Providers**, aktifkan Email provider. Di **Authentication → URL Configuration**, tambahkan domain email kampus ke allowlist sesuai kebutuhan (implementasi allowlist domain ada di Auth Hook / API route, lihat ARCHITECTURE.md bagian keamanan).
6. Di **Storage**, buat bucket privat: `avatars`, `ktm-verification`, `report-evidence`.

### 4.1 (Opsional) Pakai Supabase CLI untuk migration lokal

```powershell
npm install -g supabase
supabase login
supabase link --project-ref <project-ref-anda>
supabase db push
```

## 5. Konfigurasi Environment Variable

Salin file contoh environment lalu isi dengan kredensial dari langkah 4:

```powershell
Copy-Item .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAIN=mail.ugm.ac.id
```

> `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server (API route/server action). Jangan pernah menambahkan prefix `NEXT_PUBLIC_` pada key ini karena akan terekspos ke browser.

## 6. Jalankan Development Server

```powershell
npm run dev
```

Buka `http://localhost:3000` di browser.

## 7. Perintah Lain yang Tersedia

```powershell
npm run build        # build production, jalankan sebelum submission untuk memastikan tidak ada error
npm run start         # jalankan hasil build production secara lokal
npm run lint          # cek linting
npm run test          # jalankan unit test (vitest --run)
npm run test:watch    # jalankan test mode watch (untuk development, jangan dipakai di CI)
```

## 8. Deploy ke Vercel (untuk demo/Grand Final)

1. Push repo ke GitHub.
2. Buka [vercel.com](https://vercel.com/) → Import Project → pilih repo.
3. Tambahkan environment variable yang sama seperti `.env.local` di **Project Settings → Environment Variables** pada Vercel.
4. Deploy. Vercel akan otomatis build ulang setiap ada push ke branch `main`.

## 9. Troubleshooting Umum

| Masalah | Solusi |
|---|---|
| `Invalid API key` saat memanggil Supabase | Pastikan `.env.local` terisi benar dan server dev di-restart setelah mengubah env |
| RLS error "new row violates row-level security policy" | Pastikan user sudah login dan policy RLS sudah dijalankan sesuai migration |
| Peta (Leaflet) tidak muncul / blank | Pastikan CSS Leaflet ter-import di layout, dan komponen map di-render hanya di client (`dynamic import` dengan `ssr: false`) |
| Perubahan `.env.local` tidak terbaca | Next.js perlu restart dev server (`Ctrl+C` lalu `npm run dev` lagi) |

Untuk pertanyaan arsitektur lebih lanjut, lihat [ARCHITECTURE.md](./ARCHITECTURE.md).
