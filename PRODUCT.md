# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
- **Pengguna utama:** mahasiswa BINUS @Kemanggisan (kampus Anggrek, Syahdan, Kijang) yang ingin menemukan teman belajar, anggota tim lomba, dan teman untuk acara di luar kampus. Situasinya: di kampus atau menuju kampus, memakai HP Android, sering sambil berpindah antar ruangan.
- **Audiens evaluasi (dikonfirmasi 11 Okt 2026):** juri Hackathon JOINTS UGM 2026 yang menilai lewat video demo (≤ 2 menit), APK, pitch deck, dan source code; Grand Final 1 Nov 2026. Keputusan desain harus tetap benar bagi mahasiswa dan mudah dibaca juri dalam demo singkat.

## Product Purpose
AyokMatch mencocokkan mahasiswa dalam satu kampus untuk belajar bareng (Study Match), cari tim lomba (Competition Match), melihat siapa yang sedang ada di zona kampus mana (Match Map), dan mengikuti acara luar kampus yang dikurasi (Event), berdasarkan archetype kepribadian dan mata kuliah. Keberhasilan: pengguna menemukan partner belajar/tim yang cocok dan benar-benar bertemu.

## Positioning
Lokasi hanya berupa **zona bernama dari access point Wi-Fi kampus** (tanpa GPS dan koordinat), bersifat opt-in, dan **timbal balik**: yang tidak tampil juga tidak bisa melihat orang lain; zona berisi satu orang hanya menampilkan jumlah. Dipadukan dengan 6 archetype tim dan kecocokan mata kuliah. Pembeda ini dikonfirmasi pengguna (11 Okt 2026).

## Operating Context
- Aplikasi Android native (Expo / React Native), satu kampus pilot, login `@binus.ac.id` atau `@gmail.com` (kata sandi + OTP email saat daftar dan saat HP baru) atau login Google (sejak 15 Okt 2026).
- Kuis kepribadian 15 pertanyaan diisi sekali seumur akun; hasilnya terkunci permanen.
- Backend Supabase (Postgres + RLS, Auth, Edge Functions). BSSID dibaca di HP saat aplikasi di foreground, dikirim hanya ke Edge Function, tidak disimpan dan tidak di-log.
- Demo Grand Final memakai hotspot sebagai "access point kampus".

## Capabilities and Constraints
- Teks UI dalam Bahasa Indonesia (nama archetype, Study Match, Competition Match, Match Map, dan nama jurusan versi BINUS tetap Inggris).
- Tidak ada GPS/QR check-in, tidak ada pembayaran (biaya event hanya catatan), Android saja untuk MVP, tombol Facebook/Apple hanya tampilan (Google aktif).
- Event luar kampus hanya dibuat role curator/admin; kuota sesi dan event dijaga di database; tanpa daftar tunggu.
- Gerbang "HP baru wajib OTP" dicek di aplikasi dan **bukan 2FA sungguhan**; tidak boleh diklaim sebagai 2FA.
- Belum diputuskan: opsi grup sesama gender di Meja Kecil, kebijakan retensi data setelah lomba, kategori lomba baku, kurator dan venue nyata.

## Brand Commitments
- Nama **AyokMatch**; 6 archetype (Wildheart, Heartkeeper, Mindsmith, Groundbreaker, Kindled Flame, Sagekeeper) beserta tagline Indonesia ("Sang Jiwa", dst.).
- **Tema warna dan identitas dari Figma bersifat mengikat** (pernyataan pengguna, 11 Okt 2026): biru utama `#0072B8`, aksen kuning `#F39C12`, teks aksen `#A65C00`, token di `tailwind.config.js` dan `src/components/onboarding/palette.ts`. Pekerjaan desain tidak boleh mengganti palet atau identitas; elemen baru hanya boleh memakai token yang ada.
- Suara: Bahasa Indonesia santai, menyapa dengan "kamu", jujur soal keterbatasan.

## Evidence on Hand
- Dokumen produk: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/METHODOLOGY.md`, `docs/ROADMAP.md`.
- Desain Figma AyokMatch (file key tercatat di komentar `tailwind.config.js`); aset merek di `assets/brand/`.
- Ilustrasi 6 archetype di `assets/archetypes/archetype_svg/` (dikonversi jadi komponen). **Asal-usul dan lisensinya belum dikonfirmasi**; jangan diklaim sebagai karya manusia atau asli tanpa konfirmasi.
- **Tidak ada** foto kampus asli, testimoni, data pengguna nyata, kurator atau venue mitra nyata, maupun daftar mata kuliah resmi: mata kuliah dan venue di seed hanyalah contoh dan tidak boleh disajikan sebagai data nyata.

## Product Principles
1. **Privasi lebih dulu:** lokasi opt-in, hanya zona, tanpa koordinat, tanpa riwayat, kedaluwarsa otomatis; aturan privasi ditegakkan di database, bukan hanya di UI.
2. **Jujur soal batas:** presisi zona = jangkauan access point; OTP HP baru bukan 2FA; pencocokan adalah heuristik, bukan diagnosis psikologis.
3. **Kampus tepercaya:** hanya email kampus, kurasi event, venue disetujui, moderasi bertahap (tanpa auto-ban).
4. **Pertemuan nyata di atas fitur ramai:** Must-have (login, kuis, Study Match, Match Map, mode admin Wi-Fi) stabil di HP sungguhan sebelum fitur lain.
5. **Identitas tetap:** perubahan tampilan memperhalus, bukan mengganti identitas Figma.

## Accessibility & Inclusion
Praktik baik tanpa standar formal (dikonfirmasi 11 Okt 2026): kontras teks ≥ 4,5:1, area sentuh ≥ 48 dp, label screen reader pada kontrol interaktif, teks mengikuti ukuran font sistem, dan tidak mengandalkan warna saja. Tanpa klaim WCAG formal.
