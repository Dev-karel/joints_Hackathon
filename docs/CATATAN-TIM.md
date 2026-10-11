# Catatan untuk Tim — Perubahan Besar 4 Oktober 2026

Dokumen ini menjelaskan dua hal yang kemungkinan membingungkan saat kamu pertama kali
`git pull` setelah tanggal ini:

1. Kenapa perubahannya **banyak sekali sekaligus**
2. Kenapa ada **berkas yang tidak kelihatan** di repo maupun di editor (misalnya `.env`)

Untuk panduan instalasi lengkap, tetap lihat [INSTALLATION.md](./INSTALLATION.md). Dokumen ini
hanya menjelaskan konteks perubahan dan jebakan yang sudah kami temukan supaya kamu tidak
mengalaminya lagi.

---

## 1. Kenapa perubahannya banyak

Sebelum tanggal ini, repo **hanya berisi dokumen markdown dan `package.json`** — belum ada satu
pun berkas kode. Dalam satu hari, project di-bootstrap dari nol sampai bisa jalan di HP Android.

Yang masuk:

| Kelompok | Isi |
|---|---|
| Konfigurasi build | `app.config.ts`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `tsconfig.json`, `eas.json`, `eslint.config.js`, `.prettierrc` |
| Kerangka folder | `app/` (expo-router), `src/` (components, features, lib, stores, types), `supabase/` (migrations, functions) |
| UI pertama | 5 layar di `app/(onboarding)/` — 4 layar onboarding + Welcome Page, diimplementasikan dari Figma |
| Komponen bersama | `src/components/onboarding/` — layout, header, progress, navigasi, backdrop SVG |
| Desain | 19 token warna di `tailwind.config.js`, app icon + splash dari logo Figma, aset di `assets/` |
| Dokumentasi | Lima dokumen dipindah dari root ke `docs/` |
| Lisensi | `LICENSE` — All Rights Reserved (lihat §5) |

**Dokumen yang "hilang" dari root sebenarnya cuma pindah.** `PRD.md`, `ARCHITECTURE.md`,
`METHODOLOGY.md`, `ROADMAP.md`, dan `INSTALLATION.md` sekarang ada di `docs/`. Hanya `README.md`
dan `CLAUDE.md` yang tetap di root — README karena jadi halaman depan repo di GitHub, CLAUDE.md
karena dibaca otomatis dari root oleh AI coding assistant. Semua tautan antar-dokumen sudah
diperbarui.

---

## 2. Kenapa ada berkas yang tidak kelihatan di editor

Ini **bukan** berkas yang hilang. Ada dua lapis penyebab.

### 2.1 Beberapa berkas memang tidak ikut ke Git

Lihat `.gitignore`. Yang sengaja tidak masuk repo:

| Berkas/folder | Kenapa tidak di-commit | Cara mendapatkannya |
|---|---|---|
| `.env` | Berisi kredensial Supabase | Salin dari `.env.example`, minta nilainya ke pemilik project Supabase |
| `node_modules/` | Besar dan bisa dibuat ulang | `npm install` |
| `android/` | Di-generate ulang dari `app.config.ts` | otomatis saat `npx expo run:android` |
| `.expo/`, `expo-env.d.ts` | Cache & tipe hasil generate Expo | otomatis saat `expo start` |
| `.kiro/settings/` | Konfigurasi MCP personal per mesin | buat sendiri kalau pakai Kiro |
| `.agents/` | Catatan kerja AI assistant | tidak dibutuhkan |
| `*.apk`, `*.aab`, `*.keystore` | Artefak build & kredensial signing | hasil build |

> **Jangan pernah** meng-commit `.env` atau menaruh `SUPABASE_SERVICE_ROLE_KEY` di dalamnya.
> Semua variabel berawalan `EXPO_PUBLIC_*` ikut terbundel ke dalam APK dan bisa dibaca siapa pun
> yang memegang berkas APK. Service role key hanya boleh jadi secret Edge Function.
> Lihat [ARCHITECTURE.md §6](./ARCHITECTURE.md).

### 2.2 Editor menyembunyikannya

Repo ini meng-commit `.vscode/settings.json` yang berisi:

```json
"explorer.excludeGitIgnore": true
```

Artinya **semua berkas yang masuk `.gitignore` disembunyikan dari panel Explorer.** Jadi `.env`,
`node_modules/`, `android/`, dan `.agents/` tidak akan muncul di sidebar walaupun ada di disk.

Ini disengaja: yang terlihat di sidebar = yang benar-benar ikut ke GitHub.

Kalau kamu perlu mengedit `.env`, ada dua cara:

- Buka langsung tanpa sidebar, misalnya lewat `Win + R` → `notepad d:\path\ke\project\.env`
- Atau ubah setting itu jadi `false` sementara

---

## 3. Jebakan yang sudah kami temukan — baca sebelum build

Empat hal di bawah ini memakan waktu berjam-jam untuk didiagnosis. Semoga kamu tidak perlu
mengulanginya.

### 3.1 Butuh JDK 17, BUKAN JDK bawaan Android Studio

Android Studio versi sekarang membawa JDK 25. Dengan JDK 24 ke atas, build **gagal** di tahap
CMake:

```
Execution failed for task ':react-native-worklets:configureCMakeDebug[arm64-v8a]'
> WARNING: A restricted method in java.lang.System has been called
```

Penyebabnya JEP 472 di JDK 24 yang membatasi akses native (JNI), dan tooling CMake React Native
belum mendukungnya. Gagalnya baru muncul setelah ~24 menit build.

**Solusi:** pasang JDK 17 (Eclipse Temurin), lalu arahkan `JAVA_HOME` ke sana:

```powershell
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
```

Tutup semua terminal, buka baru, pastikan `java -version` menampilkan 17. Kalau sebelumnya sudah
pernah build dengan JDK salah, hapus folder `android/` supaya prebuild membuatnya ulang bersih.

### 3.2 Windows PowerShell memblokir `npm` dan `npx`

Kalau muncul:

```
npm.ps1 cannot be loaded because running scripts is disabled on this system
```

Pakai **`npm.cmd`** dan **`npx.cmd`**, atau jalankan dari CMD. Yang berbahaya: beberapa perintah
gagal **diam-diam** tanpa pesan error jelas — `expo install` sempat berhasil menulis ke
`package.json` tapi instalasi paketnya tidak pernah terjadi.

### 3.3 `npm install` bisa kena konflik peer dependency

`package.json` memaku `react` versi 19.2.3, sementara `react-dom` yang ditarik Expo menuntut
`^19.3.0`. Install pertama lolos dengan peringatan, tapi install berikutnya bisa gagal keras.

Jalan keluarnya:

```powershell
npm.cmd install --legacy-peer-deps
```

Perbaikan permanennya menaikkan `react` ke 19.3.0, tapi itu mengubah versi yang sudah dikunci
tim — perlu disepakati dulu, jangan diubah sendiri.

### 3.4 Aset logo sudah dipotong manual — jangan export ulang sembarangan

Export PNG dari Figma menghasilkan kanvas jauh lebih besar dari konten logonya. Contoh:
`brand-logo-stacked.png` ter-export 939×621 padahal logonya hanya 342×270 dan menempel di
kiri-atas, sisanya padding transparan. Akibatnya logo tampak kecil dan tidak terpusat.

Kedua aset di `assets/brand/` sudah dipotong tepat di batas kontennya, dan rasio di kode mengacu
ke ukuran hasil potong. **Kalau kamu export ulang dari Figma, padding-nya kembali** dan rasio di
`app/(onboarding)/welcome.tsx` serta `src/components/onboarding/OnboardingHeader.tsx` harus
dihitung ulang. Catatan ini juga ada sebagai komentar di kedua berkas itu.

---

## 4. Catatan implementasi yang perlu diketahui

**Status bar di Figma itu mockup.** Semua frame Figma punya elemen jam "09:41" plus ikon sinyal,
wifi, dan baterai. Itu hiasan desain, bukan elemen aplikasi — HP sungguhan menampilkan status bar
sendiri. Jangan pernah mengimplementasikannya; pakai `react-native-safe-area-context` agar konten
tidak tertutup status bar asli.

**Label step kuis dihitung, tidak dikopi dari Figma.** Keempat layar onboarding di Figma menulis
`1 / 4` padahal progress bar-nya terisi 1, 2, 3, dan 4 segmen. Itu kelihatannya copy-paste yang
terlewat. Kode menghitung label dari nomor step agar konsisten dengan progress bar.

**Font belum sesuai Figma.** Figma memakai Inter, tapi `@expo-google-fonts/inter` belum ada di
`package.json`. Sementara memakai font default Android (Roboto) dengan berat huruf tetap dipetakan.
Bentuk huruf akan sedikit berbeda dari mockup.

**Izin `RECORD_AUDIO` aktif tapi belum terpakai.** Disuntikkan otomatis oleh config plugin
`expo-image-picker` karena library-nya mendukung rekam video. Dibiarkan aktif atas keputusan tim.
Karena privasi adalah inti produk ([PRD.md §10](./PRD.md)) dan juri kemungkinan menanyakannya
([ROADMAP.md](./ROADMAP.md) Fase 4), siapkan jawabannya — atau matikan dengan menambahkan
`{ microphonePermission: false }` di `app.config.ts`.

**Tombol di Welcome Page masih sementara.** "Daftar Akun" sengaja dibuat non-aktif dan "Masuk"
diganti jadi "Exit" yang menutup aplikasi, karena layar login dan pendaftaran belum ada. Keduanya
ditandai komentar TODO di `app/(onboarding)/welcome.tsx`.

---

## 5. Lisensi

`LICENSE` di root berisi **All Rights Reserved**. Repo boleh publik untuk keperluan penilaian
hackathon, tapi tidak memberi izin pihak lain memakai ulang kodenya. Dipilih karena
[ROADMAP.md](./ROADMAP.md) merencanakan kelanjutan AyokMatch sebagai produk pasca-hackathon.

Keputusan ini reversibel — beralih ke lisensi open source seperti MIT di kemudian hari mudah,
sedangkan arah sebaliknya sulit.

---

## 6. Yang masih kosong dan menunggu dikerjakan

Folder-folder ini sengaja dibiarkan kosong (hanya berisi `.gitkeep`) agar strukturnya terlacak
Git dan sesuai [ARCHITECTURE.md §8](./ARCHITECTURE.md):

- `supabase/migrations/` — skema database & RLS policy **belum ada sama sekali**. Ini penghalang
  terbesar berikutnya; tabel, enum, dan policy-nya sudah didokumentasikan detail di
  [ARCHITECTURE.md §5 & §6](./ARCHITECTURE.md), jadi bisa langsung dikerjakan
- `supabase/functions/` — Edge Functions `resolve-zone`, `register-access-point`, `create-event`
- `src/lib/supabase/` — client & helper query
- `src/lib/wifi/` — pembacaan BSSID & heartbeat presence
- `src/lib/validation/` — skema Zod
- `src/features/*` — logika per fitur
- `app/(auth)/`, `app/(tabs)/`, `app/admin/` — layar login, tab utama, dan mode admin
- `src/types/database.ts` — menunggu hasil `supabase gen types typescript`

**Risiko terbesar yang belum diuji: spike BSSID.** [ROADMAP.md](./ROADMAP.md) menandainya
"buktikan jalan sebelum Fase 2". Seluruh inti inovasi Match Map bergantung pada kemampuan NetInfo
membaca `details.bssid` di HP fisik. Kalau ternyata tidak bisa, tim butuh rencana cadangan — dan
itu lebih baik diketahui sekarang.
