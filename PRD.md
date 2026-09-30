# Product Requirements Document (PRD) — AyokMatch

> Versi: 1.6 — 30 September 2026
> Untuk: Hackathon JOINTS UGM 2026 (FMIPA UGM), track **Healthcare** dengan sentuhan **Education**

Dokumen pelengkap: [README.md](./README.md) (latar belakang & fitur), [ARCHITECTURE.md](./ARCHITECTURE.md) (arsitektur & data model), [METHODOLOGY.md](./METHODOLOGY.md) (isi & skoring kuis kepribadian), [ROADMAP.md](./ROADMAP.md) (timeline), [CLAUDE.md](./CLAUDE.md) (konvensi kerja AI assistant).

### Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 25 Sep 2026 | Versi awal |
| 1.1 | 28 Sep 2026 | Match Map beralih dari grid koordinat ke zona bernama. Tambah bagian deteksi lokasi & integrasi Wi-Fi kampus. |
| 1.2 | 28 Sep 2026 | Tab Study & Competitions, data model sesi/lowongan, keputusan visibilitas timbal balik & zona kosong. |
| 1.3 | 29 Sep 2026 | **Pivot ke aplikasi native React Native (Expo), Android dulu.** Lokasi **hanya dari access point Wi-Fi (BSSID)** — QR, GPS, dan cek IP dihapus. Study & Competitions pindah ke tab **Match** (sub-tab Belajar & Lomba). Tab **Event** baru untuk acara di luar kampus, hanya dibuat kurator, **masuk scope MVP**. Strategi demo pakai hotspot. Tabel MVP ditulis ulang. |
| 1.4 | 29 Sep 2026 | Tambah §6.1: kuis kepribadian **tidak boleh diulang** setelah submit akhir (hasil jadi label permanen akun), tapi pengguna **boleh menekan "Kembali"** untuk mengubah jawaban sebelum submit akhir. Tambah wajib modal peringatan jumlah pertanyaan & anjuran isi jujur. |
| 1.5 | 29 Sep 2026 | Kuis kepribadian resmi jadi **15 pertanyaan** (bukan 6) dengan metodologi archetype tim 6 kategori (skoring berbobot 70/30) — lihat [METHODOLOGY.md](./METHODOLOGY.md). Menjawab Open Question #1 di §14. |
| 1.6 | 30 Sep 2026 | **Kampus pilot BINUS @Kemanggisan** (`@binus.ac.id`); zona contoh BeeHub, LKC, Lab Komputer, Creative Space, Gazebo. **`learning_style` keluar dari MVP** — kartu pengguna menampilkan archetype. Login: OTP hanya saat Daftar dan dari HP baru; tombol Google/Facebook/Apple hanya tampilan. Sesi belajar: **tanpa daftar tunggu dan tanpa ganti sesi**, keluar lewat konfirmasi, kuota dijaga di database, agenda berjam, **materi dari host**. Aturan **host keluar** (§8.1). **Daftar tunggu Event dihapus.** METHODOLOGY naik ke v1.1 (pemetaan archetype diseimbangkan). |

---

## 1. Latar Belakang & Masalah

Interaksi dengan teman sebaya berkontribusi besar terhadap kemampuan kognitif dan rasa percaya diri mahasiswa. Namun kelompok sebaya cenderung eksklusif, sehingga mahasiswa yang gagal menemukan "teman sefrekuensi" berisiko terisolasi secara sosial.

Data I-NAMHS: 1 dari 3 remaja Indonesia (34,9%, ±15,5 juta jiwa) punya masalah kesehatan mental, dan sebagian besar melaporkan gangguan tersebut merusak kemampuan mereka berhubungan dengan teman sebaya (41,1%) dan berfungsi di sekolah/kampus (39,3%).

**Masalah inti**: tidak ada cara sistematis bagi mahasiswa baru/introvert/pindahan untuk menemukan partner belajar atau teman yang cocok secara kepribadian, mata kuliah, dan minat — mereka bergantung pada pertemuan kebetulan.

## 2. Solusi & Tujuan Produk

**AyokMatch** adalah **aplikasi mobile native (React Native + Expo), Android lebih dulu**, yang mempertemukan mahasiswa dalam satu kampus berdasarkan kepribadian (archetype tim), mata kuliah, dan minat — di dalam kampus lewat **Match** (belajar & lomba) dan **Match Map** berbasis Wi-Fi kampus, dan di luar kampus lewat **Event** yang dikurasi.

Alasan memilih native: hanya aplikasi native yang bisa membaca access point Wi-Fi yang sedang tersambung (BSSID), dan itulah dasar deteksi lokasi per ruangan tanpa GPS (§7).

### Tujuan (Goals)

1. Memutus siklus isolasi ↔ kerusakan kesehatan mental dengan mempertemukan mahasiswa secara proaktif, bukan menunggu "kebetulan".
2. Memvalidasi bahwa matching berbasis kepribadian (archetype tim) bisa mendorong pembentukan kelompok belajar baru dan pertemanan di luar kelas.
3. Menyediakan MVP yang bisa didemokan penuh di HP Android (bukan mockup) pada Grand Final, dengan fondasi data model yang extensible untuk fitur match lain.

### Non-Goals (MVP ini)

- Bukan aplikasi kencan/dating.
- **Bukan aplikasi iOS** di MVP. Membaca BSSID di iOS butuh entitlement *Access Wi-Fi Information* dan kemungkinan akun Apple Developer berbayar — ditunda.
- Tidak memakai GPS, QR check-in, atau cek IP untuk lokasi. **Satu-satunya sumber lokasi adalah access point Wi-Fi kampus.**
- Tidak ada fitur pembayaran di aplikasi. Event berbayar dibayar langsung di tempat.
- Pengguna biasa **tidak bisa** membuat Event (luar kampus). Hanya akun kurator.
- Sport Match, Gaming Match, Art Match, Organisation Match **tidak** diimplementasikan penuh — hanya disiapkan strukturnya.
- Tab Lomba bukan matching otomatis anggota tim berdasarkan skill dan bukan platform pendaftaran lomba — hanya lowongan anggota tim + permintaan bergabung.
- Bukan model klasifikasi kepribadian berbasis ML — cukup rule/skor sederhana dari kuis.
- Tidak melacak lokasi di background dan tidak menyimpan riwayat pergerakan pengguna.

## 3. Target Pengguna

| Persona | Kebutuhan |
|---|---|
| Mahasiswa baru/pindahan | Cepat kenal lingkungan kampus, cari teman & partner belajar sejak awal semester |
| Mahasiswa introvert/kesulitan bersosialisasi | Cara berinteraksi yang terstruktur & tidak mengintimidasi — termasuk datang ke acara tanpa harus sendirian |
| Mahasiswa yang butuh partner belajar/lomba spesifik | Cocok berdasarkan mata kuliah, archetype, jadwal, atau peran tim |
| Mahasiswa yang ingin menjaga privasi lokasi | Tetap bisa terhubung lewat Match Map yang hanya menampilkan **nama ruangan** (misalnya "BeeHub"), bukan titik koordinat |
| **Kurator** (tim AyokMatch, UKM, kafe/komunitas mitra) | Membuat dan mengelola Event di luar kampus yang aman dan relevan untuk mahasiswa |

Batasan akses: hanya mahasiswa dengan email institusi kampus (domain di-allowlist). Kurator juga harus punya akun terverifikasi dengan role `curator` yang diberikan admin.

## 4. Struktur Navigasi

Bottom navigation: **Beranda · Match · Event · Peta · Profil**

| Tab | Isi |
|---|---|
| Beranda | Ringkasan: badge kepribadian, rekomendasi teman, sesi terdekat, event pilihan |
| Match | Dua sub-tab: **Belajar** (Study Match — rekomendasi partner + sesi belajar) dan **Lomba** (Competition Match — lowongan anggota tim) |
| Event | Acara **di luar kampus** yang dikurasi (nongkrong, hobi, event langka bulanan, acara mitra) |
| Peta | Match Map: siapa yang online per ruangan, berdasarkan access point Wi-Fi kampus |
| Profil | Profil, hasil kuis, statistik, pengaturan privasi |

## 5. Scope MVP

Semua fitur di tabel ini **masuk scope hackathon**. Prioritas menentukan urutan pengerjaan: Must-have harus selesai dan stabil sebelum Should-have dikerjakan.

| # | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| 1 | Login kampus | Email `@binus.ac.id` + kata sandi. **Kode OTP 6 digit** ke email kampus hanya diminta saat **Daftar** dan saat masuk dari **HP yang belum dikenali**. Tombol Google/Facebook/Apple hanya tampilan di MVP | Must-have |
| 2 | Kuis kepribadian | Onboarding quiz 15 pertanyaan, wajib sebelum masuk Beranda → klasifikasi archetype tim rule-based (lihat [METHODOLOGY.md](./METHODOLOGY.md)). Sekali submit, terkunci permanen (boleh "Kembali" sebelum submit akhir) — detail §6.1 | Must-have |
| 3 | Match › Belajar (Study Match) | Rekomendasi partner belajar (skor kecocokan) + buat/gabung sesi belajar di zona kampus | Must-have |
| 4 | Match Map via Wi-Fi | Zona ditentukan dari BSSID access point yang tersambung; peta skematis per gedung/ruangan; visibilitas timbal balik. Detail §7 | Must-have (inti inovasi) |
| 5 | Mode admin: daftarkan Wi-Fi | Layar khusus admin untuk mendaftarkan BSSID yang sedang tersambung ke sebuah zona — dipakai untuk survei AP dan demo hotspot | Must-have (syarat demo) |
| 6 | Event luar kampus (kurasi) | Daftar event, detail, RSVP dengan kuota, pengingat, form buat event khusus kurator. Detail §9 | Should-have |
| 7 | Match › Lomba (Competition Match) | Lowongan anggota tim lomba + permintaan bergabung yang disetujui pembuat. Detail §8 | Should-have |
| 8 | Add Friend & Chat | Tambah teman, chat privat/grup realtime | Should-have |
| 9 | View Profile | Lihat profil & hasil kepribadian pengguna lain | Should-have |
| 10 | Report & Moderasi | Lapor pengguna/event → `pending_review` → tinjauan manual → banned jika terverifikasi | Should-have |
| 11 | Meja Kecil (Event) | Sistem membagi peserta RSVP menjadi grup 4–6 orang berdasarkan kepribadian | Could-have |
| 12 | "Mau ketemu lagi?" | Setelah event, peserta memilih siapa yang ingin ditemui lagi; jika saling pilih → otomatis berteman | Could-have |

## 6. User Stories (Ringkas)

- Sebagai mahasiswa baru, saya ingin login dengan email kampus saya agar hanya sesama mahasiswa yang bisa mengakses aplikasi ini.
- Sebagai pengguna baru, saya ingin mengisi kuis kepribadian singkat agar sistem tahu archetype (peran saya di tim) sebelum mulai mencari match.
- Sebagai pengguna baru, saya ingin tahu dari awal berapa banyak pertanyaan kuis dan bahwa hasilnya jadi label permanen, agar saya menjawab dengan jujur, bukan asal cepat selesai.
- Sebagai pengguna yang sedang mengisi kuis, saya ingin bisa kembali ke pertanyaan sebelumnya untuk mengubah jawaban yang salah pilih, selama saya belum menekan submit akhir.
- Sebagai mahasiswa yang kesulitan di mata kuliah tertentu, saya ingin dicocokkan dengan mahasiswa lain yang mengambil mata kuliah sama dan archetype-nya cocok dengan saya.
- Sebagai host belajar kelompok, saya ingin membuat sesi belajar dengan waktu, ruangan, dan kuota agar orang yang tepat bisa bergabung.
- Sebagai host, saya ingin membagikan materi (PDF/gambar) dan agenda berjam agar peserta tahu apa yang dibahas dan bisa bersiap.
- Sebagai host yang berhalangan, saya ingin bisa memindahkan peran host atau membatalkan sesi dengan persetujuan peserta, bukan menghilang begitu saja.
- Sebagai peserta, saya ingin melihat sesi belajar per tanggal dan jam, beserta berapa teman saya yang sudah ikut.
- Sebagai mahasiswa yang ikut lomba, saya ingin memasang lowongan anggota tim dengan peran yang saya butuhkan.
- Sebagai peserta, saya ingin melihat mahasiswa lain yang sedang online di ruangan yang sama (misalnya "BeeHub") tanpa membagikan titik lokasi saya.
- Sebagai pengguna, saya ingin memilih sendiri kapan lokasi saya terlihat, dan status saya hilang otomatis saat saya berhenti memakai aplikasi.
- Sebagai mahasiswa introvert, saya ingin ikut acara di luar kampus yang aman dan dikurasi, dan tahu bahwa saya tidak akan datang sendirian.
- Sebagai kurator, saya ingin membuat event dengan tempat, waktu, kuota, dan perkiraan biaya agar mahasiswa bisa RSVP.
- Sebagai peserta event, saya ingin diingatkan sebelum acara dan bisa memilih siapa yang ingin saya temui lagi setelahnya.
- Sebagai pengguna, saya ingin melaporkan pengguna atau event yang tidak pantas dan yakin laporan saya ditinjau sebelum ada tindakan.

## 6.1 Aturan Kuis Kepribadian (Sekali Seumur Hidup Akun)

Kuis kepribadian menentukan `personality_type` (archetype tim, lihat [METHODOLOGY.md](./METHODOLOGY.md)) dan `personality_scores` yang dipakai untuk Study Match dan ditampilkan ke pengguna lain di View Profile. **`learning_style` (contoh "Visual Learner") tidak dipakai di MVP** — kuis ini satu-satunya kuis onboarding, dan kartu pengguna menampilkan archetype. Karena label ini menempel ke akun **seumur hidup** (bukan sekadar preferensi yang bisa diganti-ganti), berikut aturannya:

1. **Modal pembuka wajib**, muncul sebelum pertanyaan pertama, sebelum pengguna bisa menekan "Mulai". Isinya minimal:
   - Jumlah total pertanyaan (15 pertanyaan, estimasi ±2–3 menit).
   - Peringatan eksplisit: hasil kuis akan jadi **label kepribadian permanen** di akun pengguna dan terlihat mahasiswa lain, jadi harus dijawab **jujur sesuai kepribadian asli**, bukan jawaban yang "kelihatan bagus".
   - Penjelasan bahwa jawaban **tidak bisa diubah lagi setelah disubmit**.
2. **Boleh navigasi maju/mundur ("Kembali") selama belum submit akhir.** Selama sesi pengisian belum selesai, pengguna bebas kembali ke pertanyaan sebelumnya dan mengganti jawaban. Jawaban selama fase ini adalah **draft**, disimpan sementara di state lokal (atau tabel draft sisi server, lihat ARCHITECTURE §4.1) — belum final.
3. **Progress indicator**: setiap layar pertanyaan menampilkan posisi saat ini (contoh "3 / 15") supaya pengguna tahu berapa lagi sebelum submit akhir.
4. **Konfirmasi submit akhir**: setelah pertanyaan terakhir dijawab, tampilkan ringkasan/konfirmasi ("Setelah ini jawabanmu tidak bisa diubah lagi — lanjutkan?") sebelum benar-benar mengunci hasil.
5. **Setelah submit akhir, kuis terkunci permanen.** Tidak ada menu "Ulangi Kuis" atau "Edit Jawaban" di MVP. Pengguna yang sudah submit dan membuka lagi rute kuis harus diarahkan ke Beranda (kuis sudah tidak bisa diakses lagi, bukan ditampilkan sebagai form terisi yang bisa diedit).
6. **Penguncian ditegakkan di server (RLS), bukan hanya disembunyikan di UI** — lihat detail teknis di [ARCHITECTURE.md §4.1](./ARCHITECTURE.md) dan §6.
7. Pengecualian manual (misalnya pengguna salah isi total dan minta reset) hanya lewat intervensi admin langsung di database, bukan fitur yang diekspos ke pengguna.

## 7. Deteksi Lokasi per Access Point Wi-Fi

### 7.1 Prinsip

1. **Zona, bukan koordinat.** Unit lokasi terkecil yang disimpan atau ditampilkan adalah **zona bernama** (contoh: "BeeHub Anggrek", "LKC Kemanggisan"), yang dipetakan dari satu atau beberapa access point.
2. **Satu sumber: access point Wi-Fi.** Aplikasi membaca BSSID dari Wi-Fi yang **sedang tersambung**. Tidak ada GPS, QR, atau cek IP.
3. **Tidak tersambung Wi-Fi kampus = tidak tampil.** Pengguna yang memakai data seluler atau Wi-Fi yang tidak terdaftar tidak muncul di Match Map (status "Kamu di luar jaringan kampus").
4. **Opt-in dan hanya saat aplikasi dibuka.** BSSID hanya dikirim saat toggle "Tampil di peta" aktif dan aplikasi di foreground. Tidak ada pelacakan di background.
5. **Kedaluwarsa otomatis.** Status kehadiran hilang setelah TTL 10 menit tanpa heartbeat.
6. **Tanpa riwayat.** Hanya status terkini per pengguna yang disimpan (satu baris, di-overwrite).
7. **Visibilitas timbal balik.** Pengguna yang tidak tampil juga tidak bisa melihat siapa yang online.
8. **Zona kosong tetap ditampilkan** dengan label "sepi".

### 7.2 Cara Kerja di Android

- BSSID dibaca lewat `@react-native-community/netinfo` (`details.bssid` saat tipe koneksi `wifi`).
- Android mewajibkan izin **lokasi presisi** (`ACCESS_FINE_LOCATION`) dan **layanan lokasi aktif** untuk membaca BSSID; tanpa itu nilainya `02:00:00:00:00:00`. Aplikasi harus menjelaskan ini saat meminta izin: izin lokasi dipakai **hanya** untuk membaca nama Wi-Fi, bukan GPS.
- Satu access point biasanya punya beberapa BSSID (per band 2,4 GHz / 5 GHz dan per SSID). Semua BSSID dari AP yang sama didaftarkan ke zona yang sama.
- Jangkauan AP bisa menembus ruangan sebelah, jadi presisi zona = jangkauan AP. Ini keterbatasan yang disampaikan transparan.
- Target minimum: Android 10 (API 29).

### 7.3 Pendaftaran Access Point (Mode Admin)

Tidak ada data AP dari IT kampus di MVP, jadi AP didaftarkan manual lewat survei:

1. Admin berjalan ke sebuah ruangan dengan HP tersambung ke Wi-Fi kampus.
2. Di layar **Daftarkan Wi-Fi**, aplikasi menampilkan BSSID saat ini; admin memilih zona (atau membuat zona baru) lalu menyimpan.
3. Ulangi untuk setiap AP/band di ruangan tersebut.

Pasca-hackathon: daftar AP bisa diminta resmi dari IT kampus, atau integrasi langsung dengan controller Wi-Fi kampus (lihat §7.7).

### 7.4 Urutan Penentuan Zona (Server)

1. Pengguna opt-in dan terautentikasi → lanjut; jika tidak → tolak.
2. BSSID cocok di `wifi_access_points` → zona AP tersebut.
3. BSSID tidak dikenal atau tidak ada Wi-Fi → hapus baris `presence` pengguna → pengguna tidak tampil.

### 7.5 Alur End-to-End

```mermaid
sequenceDiagram
    participant A as HP Pengguna A (Android)
    participant S as Supabase Edge Function resolve-zone
    participant D as Database (presence)
    participant B as HP Pengguna B

    A->>A: Toggle "Tampil di peta" ON + izin lokasi presisi
    A->>A: NetInfo: baca BSSID Wi-Fi yang tersambung
    A->>S: POST resolve-zone {bssid} (HTTPS + JWT)
    S->>S: Cocokkan BSSID dengan wifi_access_points
    S->>S: BSSID tidak disimpan & tidak di-log
    S->>D: UPSERT presence {user_id, zone_id, expires_at} atau DELETE jika tidak cocok
    D-->>B: Supabase Realtime: jumlah & daftar per zona berubah (RLS)
    B->>B: Peta: "BeeHub · 4 online" → tap → daftar mahasiswa
    loop Tiap 2 menit & setiap Wi-Fi berganti, selama app di foreground
        A->>S: Heartbeat {bssid}
    end
    Note over D: Tanpa heartbeat > 10 menit → kedaluwarsa, A hilang dari peta
```

### 7.6 Strategi Demo Grand Final (Hotspot)

Wi-Fi venue (FMIPA UGM) bukan Wi-Fi kampus tim (BINUS @Kemanggisan), jadi demo memakai **hotspot sebagai "access point kampus"**:

- Satu perangkat khusus (HP ketiga atau laptop dengan data seluler) menyalakan hotspot. **Jangan pakai HP demo sendiri sebagai hotspot**: perangkat yang menjadi hotspot tidak tersambung ke AP mana pun, sehingga pemiliknya tidak akan muncul di zona.
- HP demo A dan B tersambung ke hotspot tersebut. Hotspot memberi akses internet ke Supabase.
- Pada hari H, admin membuka **Daftarkan Wi-Fi** di HP A dan mendaftarkan BSSID hotspot sebagai zona "Ruang Pitching". Daftarkan di hari yang sama karena beberapa HP Android mengacak alamat hotspot setiap kali hotspot dinyalakan ulang.
- Alur demo: A dan B menyalakan "Tampil di peta" → keduanya muncul di "Ruang Pitching · 2 online" → B mematikan Wi-Fi → B hilang dari peta.
- Cadangan jika internet venue/seluler bermasalah: laptop menjalankan Supabase lokal (Docker) dan menjadi hotspot; aplikasi demo diarahkan ke IP laptop.

### 7.7 Pasca-hackathon

- Dukungan iOS (entitlement *Access Wi-Fi Information*).
- Integrasi controller/RADIUS Wi-Fi kampus lewat MoU dengan IT kampus, sehingga daftar AP tidak perlu disurvei manual.

## 8. Tab Match: Belajar & Lomba

Tab Match punya dua sub-tab dengan satu tombol tambah yang labelnya menyesuaikan: **"Buat sesi"** di Belajar dan **"Cari anggota tim"** di Lomba.

| | Belajar (Study Match) | Lomba (Competition Match) |
|---|---|---|
| Tujuan | Sesi belajar bareng dalam waktu dekat di kampus | Mencari anggota tim untuk lomba |
| Pengelompokan | Strip tanggal + grup per jam | Grup per deadline pendaftaran |
| Filter | Mata kuliah, jenis sesi | Kategori lomba |
| Field wajib | Judul, mata kuliah, tanggal, jam, zona kampus, jenis (Belajar kelompok / Tutor sebaya / Diskusi), kuota | Nama lomba, kategori, deadline, ukuran tim, anggota saat ini, peran yang dicari |
| Field opsional | Agenda berjam (jam + kegiatan), materi dari host (file), yang perlu dibawa | Tautan panduan lomba, tentang tim |
| Cara bergabung | Langsung, sampai kuota penuh. Tidak ada daftar tunggu | Permintaan → disetujui/ditolak pembuat |
| Keluar | Peserta: lewat dialog konfirmasi. Host: aturan khusus §8.1. Tidak ada ganti sesi | — |
| Hilang dari daftar | Setelah jam selesai | Setelah deadline lewat atau tim penuh |

Aturan sesi belajar:

- Tempat sesi dipilih dari daftar zona (bukan teks bebas) sehingga sesi muncul di sheet zona pada Peta. Pembuat otomatis jadi anggota pertama (host).
- **Kuota dijaga di database**, bukan di aplikasi: gabung ditolak jika sesi sudah penuh, termasuk saat dua orang merebut tempat terakhir bersamaan.
- **Keluar wajib dikonfirmasi dulu** lewat dialog "Keluar dari sesi ini?" ("Ya, keluar" / "Batal"). Setelah dikonfirmasi, tempat langsung terbuka untuk orang lain dan tidak dijamin bisa didapat lagi — risiko pengguna.
- **Tidak ada daftar tunggu dan tidak ada ganti sesi.** Sesi penuh tetap tampil di daftar dengan label "Penuh" dan tidak bisa digabung; tidak ada layar khusus untuk sesi penuh. Pengguna yang ingin pindah sesi keluar dulu, lalu gabung sesi lain sendiri.
- **Materi dari host**: PDF atau gambar, maks. 5 file per sesi, maks. 10 MB per file. Nama file terlihat oleh semua pengguna; isi file hanya bisa dibuka anggota sesi. Hanya host yang bisa menambah atau menghapus materi.
- Agenda ditulis sebagai daftar jam + kegiatan dan ditampilkan sebagai rundown di detail sesi.
- Setelah gabung, aplikasi menjadwalkan notifikasi lokal 1 jam sebelum sesi mulai.

### 8.1 Host Keluar dari Sesi

Host tidak bisa keluar seperti peserta biasa, dan peran host **tidak pernah pindah otomatis**.

1. **Batas H-24**: host **tidak bisa keluar maupun memindahkan host kurang dari 24 jam sebelum sesi mulai**. Di rentang itu tombol Keluar untuk host nonaktif, dengan keterangan "Host nggak bisa keluar kurang dari 24 jam sebelum sesi mulai." Konsekuensi yang diterima: sesi yang dibuat kurang dari 24 jam sebelum mulai (sesi "hari ini") membuat host terkunci sejak sesi dibuat.
2. **Host sendirian** (belum ada peserta lain): sesi langsung batal, **tanpa voting dan tanpa batas H-24** — membatalkan sesi tanpa peserta tidak merugikan siapa pun.
3. Host menekan "Keluar", lalu **wajib menulis alasan** (tidak boleh kosong) dan memilih salah satu. Host lama langsung keluar saat mengajukan, tidak menunggu hasilnya.
   - **Pindahkan host → polling calon host.** Semua peserta selain host memilih satu peserta untuk jadi host baru (boleh memilih diri sendiri). Suara terbanyak menang; kalau seri, yang lebih dulu gabung sesi. **Batas waktu 1 jam.**
   - **Batalkan sesi → voting setuju/tidak.** Lolos jika yang setuju **≥ 80% dari peserta selain host, dibulatkan ke atas** (2 peserta → 2 setuju; 3 → 3; 5 → 4). **Batas waktu 1 jam.**
4. **Kalau gagal** (polling tanpa suara sama sekali, atau pembatalan kurang dari 80% dalam 1 jam): sesi tetap berjalan **tanpa host dan terkunci**. Tidak ada yang bisa menambah materi atau mengubah detail sesi apa pun (judul, waktu, tempat, kuota, agenda, materi).
5. Setiap kali host keluar, tercatat di **riwayat keluar host** (alasan, pilihan, hasil, waktu). Riwayat ini **hanya bisa dilihat peserta sesi itu**.
6. Peserta sesi itu mendapat **tombol "Laporkan"** untuk host tersebut. Laporan masuk alur moderasi yang sama (`pending_review`, tanpa auto-ban).

Karena ada batas H-24, polling dan voting 1 jam selalu selesai sebelum sesi mulai. Tanpa push notification, peserta baru tahu ada polling/voting kalau membuka app dalam 1 jam itu.

## 9. Tab Event: Acara di Luar Kampus

### 9.1 Konsep

Match = akademik, di dalam kampus, bisa hari ini juga. **Event = sosial, di luar kampus, jarang dan terasa spesial.** Semua event **dikurasi**: hanya akun berperan `curator` yang bisa membuatnya.

### 9.2 Jenis Event di MVP

| Jenis | Contoh | Catatan |
|---|---|---|
| Event langka bulanan | Nobar final, trip pantai, workshop | Satu sorotan per bulan di bagian atas tab |
| Hobi | Lari pagi, badminton, board game, photowalk | Jembatan ke Sport/Gaming/Art Match |
| Dari mitra | Acara UKM, komunitas, kafe mitra | Menunjukkan model keberlanjutan (Dampak & Kelayakan) |
| Meja Kecil *(Could-have)* | Nongkrong grup 4–6 orang yang dicocokkan sistem | Peserta RSVP, lalu dibagi grup berdasarkan kepribadian H-1 |

### 9.3 Aturan

- **Tempat publik atau mitra terverifikasi saja**, tidak boleh alamat rumah. Kurator memilih venue dari daftar venue yang sudah disetujui admin.
- Kartu event menampilkan: kurator, judul, tanggal & jam, nama venue, perkiraan biaya ("Gratis" atau "± Rp35.000, bayar di tempat"), kuota, dan jumlah teman yang ikut.
- **RSVP dengan kuota**; jika penuh, event ditandai "Penuh" dan tidak bisa di-RSVP. **Tidak ada daftar tunggu** (tanpa push notification, orang yang naik dari antrean tidak akan tahu). Tempat dari orang yang batal langsung terbuka untuk siapa saja. Kuota dijaga di database, sama seperti sesi belajar.
- **Pengingat**: notifikasi lokal H-1 dan 3 jam sebelum acara, dengan tombol "Masih ikut / Batal". Tujuannya menekan no-show.
- **Keamanan**: tombol "Bagikan detail ke teman" (share sheet bawaan Android) dan tombol lapor event/peserta lewat alur moderasi yang sama.
- **Setelah acara** *(Could-have)*: "Mau ketemu lagi?" — peserta memilih siapa yang ingin ditemui lagi; jika saling memilih, otomatis berteman. Pilihan yang tidak berbalas tidak pernah ditampilkan ke pihak lain.

## 10. Requirement Non-Fungsional

- **Privasi lokasi**: BSSID yang dikirim HP pengguna **tidak disimpan** dan **tidak di-log**; server hanya menyimpan `zone_id` terkini dengan TTL. Pengguna lain hanya menerima nama zona dan jumlah/daftar yang opt-in. Non-negotiable, lihat [ARCHITECTURE.md §6](./ARCHITECTURE.md).
- **Persetujuan eksplisit**: fitur lokasi default **off**, izin lokasi presisi diminta dengan penjelasan bahwa izin itu hanya untuk membaca Wi-Fi. Pengguna bisa mematikan kapan saja dan status langsung dihapus. Sejalan dengan UU No. 27/2022 tentang Pelindungan Data Pribadi.
- **Keamanan data**: RLS aktif di semua tabel data personal (presence, hasil kepribadian, kontak, KTM, RSVP). Service role key Supabase hanya ada di Edge Function, tidak pernah di dalam aplikasi.
- **Autentikasi terbatas domain**: hanya email kampus (`@binus.ac.id`) yang di-allowlist. Kode OTP ke email kampus diminta saat **Daftar** (verifikasi email) dan saat masuk dari **HP yang belum dikenali**; di HP yang sudah terverifikasi cukup email + kata sandi. Akun tanpa email kampus terverifikasi tidak bisa masuk. **Tombol Google/Facebook/Apple hanya tampilan di MVP** (belum ada OAuth).
- **Integritas hasil kuis kepribadian**: setelah submit akhir, `personality_answers` dan hasil di `profiles` tidak bisa di-update/insert ulang oleh pengguna (ditegakkan RLS + trigger, lihat ARCHITECTURE §4.1 & §6). Navigasi ulang ("Kembali") hanya diperbolehkan sebelum submit akhir terjadi.
- **Role**: `student` (default), `curator` (buat event), `admin` (daftarkan Wi-Fi, beri role kurator, moderasi). Pengecekan role di RLS dan Edge Function, bukan hanya di UI.
- **Moderasi bertahap**: `pending_review` sebelum `banned`, tidak ada auto-ban dari satu laporan.
- **Platform**: Android 10+, distribusi APK untuk demo.
- **Availability saat demo**: fallback Supabase lokal di laptop (§7.6).
- **Rate limiting**: lapor, kirim pesan, buat sesi/lowongan/event, `resolve-zone`.
- **Hemat baterai**: heartbeat lokasi maksimal tiap 2 menit dan saat Wi-Fi berganti, hanya di foreground.

## 11. Metrik Keberhasilan

Untuk hackathon: Inovasi (25%), Implementasi Teknis (30%), Fungsionalitas & Desain (20%), Dampak & Kelayakan (15%), Presentasi (10%). Demo end-to-end di HP Android tanpa error kritis: login → kuis → Match Belajar (buat/gabung sesi) → Peta via hotspot → (jika sempat) Event RSVP, Lomba, chat.

Untuk validasi produk (indikatif):

- Jumlah sesi belajar yang dibuat & diikuti.
- Tingkat penyelesaian kuis onboarding.
- Persentase pengguna yang mengaktifkan Match Map.
- Tingkat kehadiran event (RSVP yang tidak batal) dan persentase "Mau ketemu lagi?" yang saling memilih.
- Jumlah tim lomba yang terisi penuh.
- Jumlah pertemanan baru yang terbentuk.

## 12. Asumsi & Batasan (Constraints)

- Tim 4 orang. Sisa waktu efektif ±17 hari (29 Sep – 16 Okt 2026).
- **Risiko terbesar**: pivot dari Next.js ke React Native di tengah jalan. Anggota tim yang belum pernah memakai React Native butuh waktu adaptasi (navigasi, build Android, izin). Must-have harus dikunci dulu sebelum menyentuh Should-have.
- Tech stack: Expo (React Native) + TypeScript, Supabase. Lihat [CLAUDE.md](./CLAUDE.md).
- Android saja; iOS pasca-hackathon.
- **Kampus pilot: BINUS @Kemanggisan** (Kampus Anggrek, Syahdan, Kijang). Email yang diizinkan: `@binus.ac.id`. Mockup memakai zona BeeHub, LKC, Lab Komputer, Auditorium (Anggrek), Creative Space, Drawing Studio (Syahdan), Gazebo, Moot Court (Kijang).
- Daftar access point didapat dari survei manual; presisi zona sama dengan jangkauan access point.
- Klasifikasi kepribadian berbasis rule/skor sederhana, bukan ML.
- Supabase free tier — perhatikan batas koneksi Realtime saat Grand Final.

## 13. Timeline Acuan

Lihat [ROADMAP.md](./ROADMAP.md). Milestone kunci:

| Tahap | Tanggal |
|---|---|
| Pengumpulan deliverables (kode, video demo, pitch deck, prototype) | 15–16 Oktober 2026, 23.50 WIB |
| Pengumuman finalis | 23 Oktober 2026 |
| Grand Final (pitching di FMIPA UGM) | 1 November 2026 |

## 14. Open Questions
- ~~Sumber pertanyaan kuis kepribadian & bobot skoringnya~~ — **selesai**, lihat [METHODOLOGY.md](./METHODOLOGY.md) v1.1.
- Definisi "online" untuk Match Map (threshold waktu presence sebelum dianggap offline).
- Chip di Profil ("Fast learner", "Belajar kelompok", "Produktif pagi", "Terjadwal") asalnya dari kuis gaya belajar yang sudah keluar dari MVP: diganti trait sekunder dari `personality_scores`, jadi tag yang diisi sendiri pengguna, atau dihapus?
- Ruangan BINUS @Kemanggisan mana saja yang jadi zona awal untuk survei access point (daftar di §12 masih usulan dari mockup)?
- Siapa kurator awal Event, dan daftar venue awal yang disetujui.
- Apakah Meja Kecil perlu opsi grup sesama gender untuk rasa aman?
- Daftar mata kuliah untuk sesi belajar: seed manual atau data kurikulum kampus?
- Apakah lowongan tim Lomba wajib menyertakan link guidebook untuk mencegah spam?
- Apakah zona dengan hanya 1 orang online tetap ditampilkan? (Kalau ya, identitas orang itu praktis terungkap.)
- Kebijakan retensi data setelah lomba selesai (apakah akun mahasiswa dihapus atau dilanjutkan sebagai produk nyata — lihat roadmap pasca-hackathon).
