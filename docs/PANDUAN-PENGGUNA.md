# Panduan Pengguna AyokMatch

Panduan singkat untuk mencoba AyokMatch (aplikasi Android). Untuk menjalankan dari kode sumber, lihat [INSTALLATION.md](./INSTALLATION.md).

## 1. Memasang

1. Unduh APK terbaru dari [Releases](https://github.com/Dev-karel/joints_Hackathon/releases/latest).
2. Buka file APK di HP Android 10 atau lebih baru. Bila diminta, izinkan pemasangan dari sumber tidak dikenal.
3. Buka aplikasi **AyokMatch**. Tidak ada pengaturan tambahan; koneksi ke server sudah tertanam di aplikasi.

## 2. Daftar dan masuk

- Gunakan email **`@binus.ac.id`** atau **`@gmail.com`**, atau tombol **Masuk dengan Google**.
- Saat **Daftar** (dan saat masuk dari HP yang belum dikenali), aplikasi meminta **kode OTP 6 angka** yang dikirim ke email. Cek folder Spam bila belum masuk.
- Tombol Facebook dan Apple hanya tampilan; belum aktif di MVP.

## 3. Kuis kepribadian (sekali seumur hidup akun)

- 15 pertanyaan A/B. Isi jujur, karena **hasilnya menjadi label permanen** akun dan tidak bisa diulang.
- Sebelum menekan submit akhir, tombol **Kembali** boleh dipakai untuk mengubah jawaban sebelumnya.
- Hasilnya salah satu dari 6 archetype tim: Wildheart, Heartkeeper, Mindsmith, Groundbreaker, Kindled Flame, Sagekeeper. Metodologi lengkap di [METHODOLOGY.md](./METHODOLOGY.md).
- Setelah kuis, pilih **mata kuliah** yang kamu ambil (dipakai untuk mencocokkan partner belajar).

## 4. Alur uji yang disarankan

Gunakan dua akun (dua HP, atau keluar-masuk akun) agar interaksi antar pengguna terlihat.

| Langkah | Yang dilakukan | Yang terlihat |
|---|---|---|
| Beranda | Buka tab Beranda | Ringkasan aktivitas, sesi, dan event terdekat |
| Match › Belajar | Lihat rekomendasi partner; buat sesi belajar atau gabung sesi yang ada | Skor kecocokan, kuota sesi, dan grup chat sesi otomatis |
| Match › Lomba | Buka lowongan tim, atau buat lowongan sendiri; kirim permintaan bergabung | Pemilik lowongan menerima dan menolak permintaan |
| Event | Buka detail event, lalu RSVP | Kuota, tanpa daftar tunggu; pengingat lokal dikirim sebelum acara |
| Profil orang lain | Buka profil dari rekomendasi atau peta, lalu **Tambah Teman** | Akun kedua menerima permintaan dan bisa menerimanya |
| Pesan | Setelah berteman, **Kirim Pesan** | Chat langsung realtime dengan status Terkirim/Dibaca |
| Laporkan | Tekan **Laporkan Pengguna** di profil, atau tekan lama sebuah pesan | Laporan masuk ke tinjauan admin (tidak ada ban otomatis) |

Catatan aturan sesi belajar: tanpa daftar tunggu dan tanpa "ganti sesi"; peserta keluar lewat dialog konfirmasi. Aturan host keluar ada di [PRD.md §8.1](./PRD.md).

## 5. Event

- Event luar kampus **hanya dibuat oleh kurator/admin**, di venue yang sudah disetujui. Akun biasa hanya bisa melihat dan RSVP.
- Tidak ada pembayaran di aplikasi. Biaya event hanya catatan ("bayar di tempat").

## 6. Match Map (Peta)

Match Map menampilkan siapa yang online per ruangan, berdasarkan **access point Wi-Fi** yang sedang tersambung.

- **Tanpa GPS dan tanpa koordinat.** Aplikasi hanya meminta izin lokasi karena Android mewajibkannya untuk membaca alamat access point (BSSID). Alamat itu dikirim sekali ke server untuk dipetakan ke ruangan, lalu dibuang; BSSID tidak disimpan.
- **Tidak tersambung Wi-Fi kampus yang terdaftar = tidak tampil di peta.** Itu memang disengaja, jadi peta bisa kosong saat dicoba di rumah.
- **Timbal balik:** kamu hanya bisa melihat orang lain di peta bila kamu sendiri menyalakan **Tampil di peta**.
- Lokasi hanya dikirim saat aplikasi terbuka (foreground) dan toggle menyala.
- Sebelum mencoba, aktifkan **layanan lokasi (GPS)** di pengaturan HP dan izinkan lokasi presisi.

Cara mencoba tanpa berada di kampus: akun berrole **admin** membuka **Profil › Admin › Daftarkan Wi-Fi** sambil tersambung ke sebuah Wi-Fi (mis. hotspot), mendaftarkannya sebagai ruangan; lalu dua akun yang tersambung ke Wi-Fi yang sama menyalakan **Tampil di peta** dan akan muncul di ruangan itu. Detail di [INSTALLATION.md §7 dan §9](./INSTALLATION.md).

## 7. Privasi dan keamanan singkat

- Data pribadi dilindungi RLS di database; pengguna yang tidak tampil di peta tidak bisa membaca keberadaan orang lain.
- Akun `@gmail.com` tidak terbukti mahasiswa BINUS; karena itu Match Map tetap hanya aktif di Wi-Fi kampus (alasan di [PRD.md §15.7](./PRD.md)).
- **Hapus akun** tersedia di Profil, dengan konfirmasi.

## 8. Kendala umum

| Masalah | Penyebab dan solusi |
|---|---|
| Kode OTP tidak datang | Tunggu satu menit, cek Spam, lalu minta kirim ulang. Email dikirim lewat SMTP, jadi bisa tertunda |
| Peta kosong / tidak muncul | Belum tersambung Wi-Fi kampus terdaftar, layanan lokasi mati, izin lokasi ditolak, atau toggle Tampil di peta mati |
| Tidak bisa kirim pesan | Chat langsung hanya antar teman; grup chat sesi otomatis untuk peserta sesi |
| Tidak bisa membuat event | Hanya kurator/admin yang boleh |
| Tidak bisa mengulang kuis | Disengaja: hasil kuis terkunci permanen setelah submit akhir |
| APK tidak mau terpasang | Izinkan sumber tidak dikenal; pastikan Android 10 atau lebih baru |
