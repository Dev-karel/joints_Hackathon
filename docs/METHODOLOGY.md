# Metodologi Kuis Kepribadian AyokMatch

> Versi 1.2 — 11 Oktober 2026. Menjawab [PRD.md §14](./PRD.md) Open Question #1 ("sumber pertanyaan kuis kepribadian & bobot skoringnya"). Dokumen ini adalah rujukan tunggal untuk isi pertanyaan, bobot skor, dan cara menghitung `personality_type` yang disebut di [ARCHITECTURE.md §4.1 & §5](./ARCHITECTURE.md) dan aturan penguncian di [PRD.md §6.1](./PRD.md).

### Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 29 Sep 2026 | Versi awal: 15 pertanyaan, 6 archetype, bobot 70/30 |
| 1.1 | 30 Sep 2026 | **Pemetaan diseimbangkan**: tiap archetype tepat 5× primer dan 5× sekunder (sebelumnya Mindsmith 7× primer, Groundbreaker 3×). 5 opsi berubah: Q3A, Q6B, Q8A, Q10B, Q14B. Contoh hitungan §7–§8 dibetulkan. Aturan seri no. 2 diperjelas. `learning_style` tidak dipakai di MVP. |
| 1.2 | 11 Okt 2026 | **Teks 15 pertanyaan dan pemetaan skor diganti** (isi §4 seluruhnya baru; usulan tim). Tiap archetype tetap tepat 5× primer dan 5× sekunder. Bobot 70/30 dan algoritma §5 tidak berubah. Angka §5.2, §8, dan §10 dihitung ulang. Pengguna yang sudah submit kuis memakai hasil lama (terkunci). Juga ditambahkan **§15 Rencana (Draft)** tentang pemakaian archetype untuk pencocokan. |

## 0. Cakupan & Batas Dokumen

- Dokumen ini mendefinisikan **isi kuis dan algoritma skoring** untuk kolom `profiles.personality_type`.
- Kuis ini adalah **satu-satunya kuis onboarding** di MVP. `profiles.learning_style` (contoh: "Visual Learner") **tidak dipakai di MVP**; 6 soal gaya belajar di mockup lama hanya contoh dan tidak dibangun. Kartu pengguna di UI menampilkan archetype.
- Aturan produk (modal peringatan, boleh "Kembali" sebelum submit, terkunci permanen sesudahnya) sudah ditetapkan di [PRD.md §6.1](./PRD.md) dan **tidak diulang penuh di sini** — dokumen ini fokus ke *apa* yang ditanyakan dan *bagaimana* dihitung, bukan *alur UI*-nya.

## 1. Tujuan

Kuis ini memakai sistem dua pilihan (`A`/`B`) di setiap pertanyaan untuk menentukan **archetype tim** utama seorang pengguna. Pengguna hanya melihat pertanyaan situasional singkat, bukan pertanyaan psikologi formal — tujuannya terasa seperti kuis kepribadian ringan, bukan inventori psikologi konvensional.

Setiap jawaban dikonversi menjadi poin berbobot ke dua archetype, lalu sistem menentukan archetype utama dari akumulasi skor.

**Archetype hasil kuis ini adalah identitas tim yang bersifat kreatif, bukan diagnosis psikologis klinis atau alat yang divalidasi secara ilmiah.** Ini konsisten dengan [PRD.md §12](./PRD.md): "Bukan model klasifikasi kepribadian berbasis ML."

## 2. Prinsip Desain

### 2.1 Pertanyaan singkat dari sudut pandang pengguna

Setiap pertanyaan hanya punya dua pilihan jawaban singkat, `A` dan `B`, yang menggambarkan situasi sehari-hari, preferensi, reaksi, atau perilaku dalam tim — bukan pertanyaan langsung soal trait ("Apakah kamu pemimpin alami?").

Contoh yang **dihindari**:
> "Apakah kamu seorang pemimpin alami?"

Contoh yang **dipakai**:
> "Saat kelompok tidak menemukan solusi, kamu akan..."
> `A. Berani mencoba pendekatan yang belum pernah dicoba.`
> `B. Membantu anggota berdiskusi sampai menemukan kesepakatan.`

Ini membuat hasil akhir tidak terlalu mudah ditebak oleh pengguna saat mengisi, sehingga jawaban lebih mencerminkan reaksi asli — sejalan dengan peringatan "isi jujur" di modal pembuka (PRD §6.1).

### 2.2 Pemetaan bobot tersembunyi

Satu jawaban bisa berkontribusi ke lebih dari satu archetype. Setiap opsi jawaban punya:

- **Bobot archetype primer:** `0.70`
- **Bobot archetype sekunder:** `0.30`

Sehingga setiap jawaban yang dipilih menyumbang total `1.00` poin ke sistem archetype.

### 2.3 Hasil relatif, bukan diagnosis absolut

Persentase akhir merepresentasikan distribusi skor relatif pengguna **di dalam kuis ini saja**. Persentase ini harus disebut sebagai **persentase skor kuis**, bukan probabilitas statistik atau ukuran kepribadian yang telah divalidasi.

## 3. Enam Archetype

| Archetype | Peran/Tagline | Trait Inti | Kontribusi ke Tim |
|---|---|---|---|
| **Wildheart** | Sang Jiwa | keharmonisan, kebebasan, kesadaran | Membawa makna, keterbukaan, dan perspektif yang lebih luas |
| **Heartkeeper** | Sang Hati | empati, kepedulian, keterhubungan | Menjaga orang lain tetap didukung dan terhubung |
| **Mindsmith** | Sang Ahli Strategi | logika, kreativitas, pemecahan masalah | Menemukan solusi praktis dan cara-cara baru |
| **Groundbreaker** | Sang Penantang | keberanian, kemandirian, ketegasan | Mempertanyakan asumsi dan mendorong batasan |
| **Kindled Flame** | Sang Penggerak | ketekunan, daya tahan, pertumbuhan | Menjaga momentum saat keadaan sulit |
| **Sagekeeper** | Sang Penuntun | kebijaksanaan, ketenangan, perspektif | Membawa kejernihan dan bimbingan yang matang |

Nama archetype (Wildheart, Heartkeeper, dst.) tetap dalam Bahasa Inggris sebagai identitas — mengikuti pola yang sama dengan istilah fitur lain seperti "Study Match" dan "Match Map" (lihat [CLAUDE.md](../CLAUDE.md) bagian Konvensi Kode). Tagline ("Sang Jiwa" dst.) dan deskripsi ditampilkan dalam Bahasa Indonesia di UI.

### 3.1 Deskripsi Archetype

#### Wildheart — Sang Jiwa

Kamu menghargai keharmonisan, kebebasan, dan dunia di sekitarmu. Kamu secara alami melihat lebih jauh dari masalah yang ada di depan mata dan peduli pada gambaran yang lebih besar.

**Peran:** Yang membawa makna dan keharmonisan ke tim.

#### Heartkeeper — Sang Hati

Kamu peka terhadap perasaan orang lain. Kamu peduli pada orang-orang di sekitarmu dan ingin semua orang merasa didukung dan terhubung.

**Peran:** Yang menjaga tim tetap terhubung.

#### Mindsmith — Sang Ahli Strategi

Kamu senang menemukan solusi dan mengubah masalah rumit menjadi sesuatu yang bisa dikelola. Saat orang lain melihat masalah, kamu cenderung melihat kemungkinan.

**Peran:** Yang menemukan jalan ke depan.

#### Groundbreaker — Sang Penantang

Kamu nyaman mempertanyakan asumsi dan mengambil jalan yang tidak konvensional. Kamu menghargai keaslian dan berani menantang sebuah ide kalau kamu yakin ada cara yang lebih baik.

**Peran:** Yang mendorong tim untuk melangkah lebih jauh.

#### Kindled Flame — Sang Penggerak

Sekali kamu peduli pada sesuatu, kamu tidak mudah menyerah. Tantangan justru jadi bahan bakar yang membuatmu berkembang dan terus bergerak.

**Peran:** Yang menjaga tim tetap bergerak.

#### Sagekeeper — Sang Penuntun

Kamu lebih suka memahami dulu sebelum bereaksi. Kamu membawa ketenangan, perspektif, dan saran yang matang saat situasi mulai kacau.

**Peran:** Yang membantu tim menemukan kejernihan.

## 4. Pertanyaan Kuis & Pemetaan Skor

15 pertanyaan, masing-masing tepat dua opsi. Setiap opsi memetakan ke tepat dua archetype: satu primer (`0.70`), satu sekunder (`0.30`). `question_id` (`q1`–`q15`) dan `answer` (`A`/`B`) inilah yang disimpan di tabel `personality_answers` (lihat §6).

### Q1 (`q1`) — Masalah Tim

**Saat tim menghadapi masalah, kamu biasanya...**

- `A. Mencari cara paling masuk akal untuk menyelesaikannya.` → **Mindsmith 0.70 + Groundbreaker 0.30**
- `B. Memastikan semua anggota merasa didengar.` → **Heartkeeper 0.70 + Sagekeeper 0.30**

### Q2 (`q2`) — Situasi Baru

**Saat berada di tempat atau situasi baru, kamu lebih suka...**

- `A. Langsung mencoba dan menjelajah.` → **Wildheart 0.70 + Heartkeeper 0.30**
- `B. Mengamati dulu sebelum bertindak.` → **Sagekeeper 0.70 + Mindsmith 0.30**

### Q3 (`q3`) — Perbedaan Pendapat

**Saat berbeda pendapat dengan orang lain, kamu cenderung...**

- `A. Mendengarkan dan memahami alasan mereka terlebih dahulu.` → **Sagekeeper 0.70 + Mindsmith 0.30**
- `B. Berani menyampaikan pendapatmu secara langsung.` → **Groundbreaker 0.70 + Kindled Flame 0.30**

### Q4 (`q4`) — Tugas Sulit

**Saat mendapat tugas yang sulit, kamu lebih memilih...**

- `A. Mencari ide atau cara baru.` → **Mindsmith 0.70 + Groundbreaker 0.30**
- `B. Terus berusaha sampai tugas selesai.` → **Kindled Flame 0.70 + Wildheart 0.30**

### Q5 (`q5`) — Teman dalam Kesulitan

**Ketika teman sedang mengalami kesulitan, kamu biasanya...**

- `A. Mendengarkan dan membantu mencari jalan keluar.` → **Heartkeeper 0.70 + Sagekeeper 0.30**
- `B. Menyemangatinya agar tidak menyerah.` → **Kindled Flame 0.70 + Wildheart 0.30**

### Q6 (`q6`) — Gaya Kerja

**Kamu lebih nyaman...**

- `A. Mengikuti keadaan dan mencoba hal baru.` → **Wildheart 0.70 + Heartkeeper 0.30**
- `B. Membuat rencana sebelum bertindak.` → **Mindsmith 0.70 + Groundbreaker 0.30**

### Q7 (`q7`) — Solusi Buntu

**Saat kelompok tidak menemukan solusi, kamu akan...**

- `A. Berani mencoba pendekatan yang belum pernah dicoba.` → **Groundbreaker 0.70 + Kindled Flame 0.30**
- `B. Membantu anggota berdiskusi sampai menemukan kesepakatan.` → **Heartkeeper 0.70 + Sagekeeper 0.30**

### Q8 (`q8`) — Cara Mengerjakan

**Saat mengerjakan sesuatu, kamu lebih suka...**

- `A. Memecah masalah menjadi langkah-langkah yang jelas.` → **Mindsmith 0.70 + Groundbreaker 0.30**
- `B. Menjelajahi berbagai kemungkinan dan mencoba cara baru.` → **Wildheart 0.70 + Heartkeeper 0.30**

### Q9 (`q9`) — Menghadapi Kegagalan

**Ketika mengalami kegagalan, kamu biasanya...**

- `A. Bangkit dan mencoba lagi dengan lebih kuat.` → **Kindled Flame 0.70 + Wildheart 0.30**
- `B. Berhenti sejenak untuk memahami penyebabnya.` → **Sagekeeper 0.70 + Mindsmith 0.30**

### Q10 (`q10`) — Peran dalam Kelompok

**Saat berada dalam kelompok, kamu biasanya...**

- `A. Menjaga agar semua anggota tetap akrab dan terlibat.` → **Heartkeeper 0.70 + Sagekeeper 0.30**
- `B. Berani menyampaikan hal yang mungkin dihindari orang lain.` → **Groundbreaker 0.70 + Kindled Flame 0.30**

### Q11 (`q11`) — Aturan yang Kurang Tepat

**Jika ada aturan yang menurutmu kurang tepat, kamu akan...**

- `A. Berani mempertanyakan aturan tersebut.` → **Groundbreaker 0.70 + Kindled Flame 0.30**
- `B. Mencari tahu alasan di balik aturan tersebut.` → **Sagekeeper 0.70 + Mindsmith 0.30**

### Q12 (`q12`) — Rencana Tidak Lancar

**Saat rencana tidak berjalan lancar, kamu akan...**

- `A. Tetap fokus dan berusaha sampai tuntas.` → **Kindled Flame 0.70 + Wildheart 0.30**
- `B. Mencari alternatif yang lebih efektif.` → **Mindsmith 0.70 + Groundbreaker 0.30**

### Q13 (`q13`) — Dasar Keputusan

**Saat membuat keputusan, kamu lebih sering mengandalkan...**

- `A. Intuisi dan perasaanmu terhadap situasi sekitar.` → **Wildheart 0.70 + Heartkeeper 0.30**
- `B. Pengalaman dan pertimbangan yang matang.` → **Sagekeeper 0.70 + Mindsmith 0.30**

### Q14 (`q14`) — Pertimbangan Keputusan

**Ketika harus mengambil keputusan, kamu lebih memikirkan...**

- `A. Dampaknya bagi orang-orang yang terlibat.` → **Heartkeeper 0.70 + Sagekeeper 0.30**
- `B. Tujuan yang ingin dicapai dan usaha untuk meraihnya.` → **Kindled Flame 0.70 + Wildheart 0.30**

### Q15 (`q15`) — Ingin Dikenal

**Kamu ingin dikenal sebagai orang yang...**

- `A. Membawa dampak baik bagi orang dan lingkungan sekitar.` → **Wildheart 0.70 + Heartkeeper 0.30**
- `B. Berani mengambil langkah berbeda saat orang lain ragu.` → **Groundbreaker 0.70 + Kindled Flame 0.30**

## 5. Algoritma Skoring

Inisialisasi semua skor archetype ke nol:

```text
wildheart = 0
heartkeeper = 0
mindsmith = 0
groundbreaker = 0
kindled_flame = 0
sagekeeper = 0
```

Untuk setiap jawaban yang dipilih:

```text
primary_archetype += 0.70
secondary_archetype += 0.30
```

Setelah 15 pertanyaan terjawab:

```text
total_score = jumlah semua skor archetype = 15.00
percentage[archetype] = (score[archetype] / total_score) * 100
```

Archetype dengan persentase tertinggi menjadi **Primary Archetype** — nilai yang disimpan sebagai `profiles.personality_type`.

### 5.1 Pseudocode

```text
scores = {
  wildheart: 0, heartkeeper: 0, mindsmith: 0,
  groundbreaker: 0, kindled_flame: 0, sagekeeper: 0
}

for answer in answers:            // 15 jawaban, satu per question_id
    scores[answer.primary] += 0.70
    scores[answer.secondary] += 0.30

totalScore = sum(scores.values())  // = 15.00

for archetype in scores:
    percentage[archetype] = (scores[archetype] / totalScore) * 100

primaryArchetype = archetypeWithHighestScore(scores)
```

### 5.2 Aturan Tie-Breaking

Seri (tie) **tidak jarang**: dari semua 32.768 kombinasi jawaban, skor tertinggi seri di sekitar 14,7% kombinasi (pemetaan v1.2). Gunakan aturan deterministik berikut, berurutan:

1. Bandingkan archetype yang seri berdasarkan jumlah kemunculan sebagai **bobot primer (`0.70`)**. Terbanyak menang.
2. Jika masih seri, telusuri pertanyaan dari `q1` ke `q15` dan berhenti di **pertanyaan pertama di mana archetype yang seri mendapat bobot berbeda**; yang bobotnya lebih besar di pertanyaan itu menang.
3. Jika masih seri, gunakan urutan archetype sesuai §3 (Wildheart → Heartkeeper → Mindsmith → Groundbreaker → Kindled Flame → Sagekeeper). Dengan pemetaan v1.2, aturan ini tidak pernah tercapai di seluruh 32.768 kombinasi, tapi tetap dipertahankan sebagai pengaman.

Ini mencegah hasil yang tidak konsisten antar-klien atau antar-perhitungan ulang.

## 6. Integrasi dengan Skema Data & Aturan Penguncian

Bagian ini menyambungkan metodologi ke tabel yang sudah didefinisikan di [ARCHITECTURE.md §5](./ARCHITECTURE.md) dan aturan kunci di [PRD.md §6.1](./PRD.md).

| Tabel/Kolom | Perubahan dari yang sudah ada | Catatan |
|---|---|---|
| `personality_answers.question_id` | tetap | Nilai: `q1`…`q15` |
| `personality_answers.answer` | tetap | Nilai: `A` atau `B` — inilah yang di-*upsert* selama fase draft (boleh "Kembali") dan dikunci setelah submit akhir, sesuai ARCHITECTURE §4.1 |
| `profiles.personality_type` | isi nilainya sekarang terdefinisi | Salah satu dari: `wildheart`, `heartkeeper`, `mindsmith`, `groundbreaker`, `kindled_flame`, `sagekeeper` |
| `profiles.personality_scores` | **kolom baru**, `jsonb` | Menyimpan 6 persentase hasil akhir (contoh `{"heartkeeper": 32.0, "kindled_flame": 18.0, ...}`), dipakai untuk menampilkan *secondary traits* di View Profile (§7). Ditulis sekali oleh `submit_personality_quiz`, ikut terkunci bersama `personality_type` |

Fungsi `submit_personality_quiz(profile_id)` (`security definer`, sudah disebut di ARCHITECTURE §4.1 langkah 6) yang menjalankan algoritma §5 di atas: membaca 15 baris `personality_answers` milik `profile_id`, menghitung skor, menulis `personality_type` (archetype tertinggi) dan `personality_scores` (semua persentase) ke `profiles`, lalu mengisi `personality_quiz_completed_at`. Validasi kelengkapan sebelum menghitung sama dengan §11 di bawah.

Nama, tagline, dan deskripsi archetype (§3) adalah **data statis di kode aplikasi** (konstanta/i18n di `src/lib/validation/` atau `src/features/personality/`), bukan kolom database — karena deterministik dari `personality_type`, tidak perlu disimpan ulang per pengguna.

## 7. Presentasi Hasil

Aplikasi menampilkan satu identitas utama sekaligus memperlihatkan trait sekunder pengguna, memakai data `personality_type` + `personality_scores`.

Contoh struktur hasil:

```text
KAMU ADALAH SANG PENUNTUN
Sagekeeper

Sagekeeper — 24.7%

Kamu lebih suka memahami dulu sebelum bereaksi. Kamu membawa
ketenangan, perspektif, dan saran yang matang saat situasi
mulai kacau.

Perananmu: Yang membantu tim menemukan kejernihan.

Trait sekunder:
Heartkeeper — 20.0%
Wildheart — 20.0%
Mindsmith — 17.3%
Kindled Flame — 14.0%
Groundbreaker — 4.0%
```

UI membedakan:

- **Archetype utama:** skor ternormalisasi tertinggi (`personality_type`).
- **Trait sekunder:** archetype sisanya, diurutkan dari tertinggi ke terendah (dibaca dari `personality_scores`).

Kalimat wajib ditampilkan bersama hasil (lihat §12):

> **Hasil ini mencerminkan trait yang paling menonjol dari jawabanmu di kuis ini. Ini archetype kreatif, bukan diagnosis psikologis.**

## 8. Contoh Perhitungan

Urutan jawaban contoh:

```text
q1 A   q2 B   q3 A   q4 A   q5 B
q6 A   q7 B   q8 B   q9 A   q10 A
q11 B  q12 A  q13 B  q14 A  q15 A
```

Skor akumulasi:

| Archetype | Skor | Persentase |
|---|---:|---:|
| Sagekeeper | 3.7 | 24.7% |
| Wildheart | 3.0 | 20.0% |
| Heartkeeper | 3.0 | 20.0% |
| Mindsmith | 2.6 | 17.3% |
| Kindled Flame | 2.1 | 14.0% |
| Groundbreaker | 0.6 | 4.0% |
| **Total** | **15.0** | **100.0%** |

Hasil utama: `sagekeeper`. Angka ini dihitung dengan kode terhadap pemetaan v1.2.

Urutan tampilan untuk skor yang sama (Wildheart dan Heartkeeper di atas) mengikuti urutan §3.

## 9. Struktur Data Implementasi

Sesuai konvensi [CLAUDE.md](../CLAUDE.md) (TypeScript strict, skema Zod di `src/lib/validation/`), kuis direpresentasikan sebagai data terstruktur, bukan percabangan `if/else` yang di-*hardcode*, supaya UI dan Edge Function/fungsi Postgres membaca sumber yang sama.

```typescript
// src/lib/validation/personalityQuiz.ts
export type ArchetypeId =
  | "wildheart" | "heartkeeper" | "mindsmith"
  | "groundbreaker" | "kindled_flame" | "sagekeeper";

export interface PersonalityQuestion {
  id: `q${number}`;           // "q1".."q15"
  question: string;           // teks Bahasa Indonesia, lihat §4
  options: {
    id: "A" | "B";
    text: string;
    scoring: {
      primary: ArchetypeId;
      primaryWeight: 0.7;
      secondary: ArchetypeId;
      secondaryWeight: 0.3;
    };
  }[];
}
```

Aplikasi menyimpan **ID opsi yang dipilih** (`A`/`B`) per `question_id`, bukan hanya kategori akhirnya — supaya hasil bisa direproduksi dan dihitung ulang kalau model skoring berubah di versi mendatang (lihat §14).

## 10. Validasi & Pengecekan Kualitas Data

Implementasi wajib menegakkan:

- Setiap pertanyaan punya tepat dua opsi.
- Setiap opsi punya tepat satu archetype primer dan satu archetype sekunder.
- Bobot primer + sekunder = `1.00`.
- Nilai bobot numerik dan tidak negatif.
- ID archetype harus cocok dengan daftar resmi di §3.
- **Keseimbangan pemetaan**: dari 30 opsi, tiap archetype muncul tepat 5× sebagai primer dan 5× sebagai sekunder. Setiap perubahan pertanyaan atau bobot wajib dicek ulang dengan menghitung pemenang di seluruh 32.768 kombinasi jawaban. Pemetaan v1.2 menghasilkan peluang menang 14,8%–18,1% per archetype (ideal 16,7%).
- Kuis yang dianggap selesai harus punya jawaban untuk seluruh 15 pertanyaan (dicek di `submit_personality_quiz` sebelum menghitung — jika belum lengkap, tolak submit, bukan menghitung skor parsial).
- Persentase ternormalisasi akhir harus berjumlah mendekati `100%`, dengan toleransi pembulatan floating-point:

```text
abs(sum(percentages) - 100) < 0.01
```

## 11. Batasan Interpretasi

Kuis ini adalah **sistem klasifikasi archetype kreatif** untuk identitas tim, ekspresi peran, atau tagline — bukan:

- penilaian psikologis klinis;
- tes kepribadian yang divalidasi secara ilmiah;
- diagnosis;
- ukuran kesehatan mental;
- probabilitas statistik yang divalidasi bahwa seseorang termasuk tipe kepribadian tertentu.

Persentase yang ditampilkan murni output ternormalisasi dari aturan skoring yang didefinisikan di §5. Kalimat wajib untuk pengguna ada di §7.

## 12. Asumsi MVP

| Parameter | Nilai MVP |
|---|---:|
| Jumlah pertanyaan | 15 |
| Jawaban per pertanyaan | 2 |
| Bobot primer | 0.70 |
| Bobot sekunder | 0.30 |
| Jumlah archetype | 6 |
| Tipe hasil | Skor ternormalisasi tertinggi |
| Jawaban yang disimpan | ID opsi yang dipilih (`A`/`B`) per `question_id` |
| Validasi ilmiah | Tidak diklaim (lihat §11) |

Nilai-nilai ini adalah **baseline desain**, bukan parameter yang telah divalidasi secara empiris. Boleh dikalibrasi ulang setelah tim mengumpulkan data respons pengguna nyata.

## 13. Kalibrasi di Masa Depan

Jika data respons anonim cukup tersedia (pasca-hackathon), kuis bisa dievaluasi untuk:

- apakah satu archetype dipilih secara tidak proporsional lebih sering;
- apakah ada pertanyaan yang gagal membedakan antar-archetype;
- apakah opsi tertentu menciptakan dominasi skor yang tidak diinginkan;
- distribusi skor rata-rata antar-archetype;
- frekuensi hasil seri/mendekati seri;
- konsistensi hasil untuk pola jawaban yang sebanding.

Revisi berikutnya hanya boleh mengubah model skoring setelah mencatat asumsi baru dan memberi versi baru ke dokumen ini (lihat header versi di atas), sejalan dengan format riwayat perubahan di [PRD.md](./PRD.md).

```text
Metodologi Kuis v1.1
- 15 pertanyaan
- 6 archetype, masing-masing 5× primer + 5× sekunder
- Skoring berbobot 70/30
```

## 14. Ringkasan

```text
2 pilihan per pertanyaan
        ↓
Setiap pilihan memetakan ke 2 archetype
        ↓
Primer = +0.70
Sekunder = +0.30
        ↓
Akumulasi 15 jawaban
        ↓
Normalisasi setiap skor archetype ke 100%
        ↓
Skor tertinggi = Archetype Utama (personality_type)
        ↓
Tampilkan Archetype + Peran + Deskripsi (§7)
```

Sistem ini sengaja dibuat sederhana agar bisa diimplementasikan penuh di dalam aplikasi (fungsi Postgres + konstanta client), tanpa memerlukan layanan atau API pihak ketiga untuk tes kepribadian — sejalan dengan [PRD.md §12](./PRD.md) ("Bukan model klasifikasi kepribadian berbasis ML").

## 15. Rencana (Draft): Pemakaian Archetype untuk Pencocokan

> **Status: DRAFT, belum divalidasi.** Bagian ini hanya menjelaskan bagaimana hasil kuis (`personality_type`) dipakai aplikasi. Ia **tidak mengubah** isi pertanyaan, bobot skor, atau algoritma di §4–§5. Bobot di bawah adalah tebakan awal; lihat §13 untuk rencana kalibrasi.

### 15.1 Study Match (Belajar)
Skor 0–100 per calon partner, dihitung di fungsi Postgres `recommend_study_partners`:

| Komponen | Poin | Catatan |
|---|---:|---|
| Irisan mata kuliah | `round(matkul_sama / matkul_milikku × 60)` | 0–60. Pembagi = jumlah mata kuliah **milikku**; bila belum memilih, bernilai 0 |
| Archetype | 20 bila **sama**, 10 bila berbeda | Belajar paling efektif dengan gaya yang mirip |
| Jurusan | 10 bila sama | |
| Sesi bersama | `min(jumlah, 2) × 5` | 0–10, dari sesi belajar yang pernah diikuti bersama |
| **Total maksimum** | **100** | Hasil diurutkan menurun, 20 teratas |

Hanya pengguna yang sudah menyelesaikan kuis yang ikut dihitung.

#### Rencana: bobot mata kuliah berdasarkan SKS (draft)
Komponen mata kuliah (maks. 60) diubah dari hitungan jumlah menjadi **hitungan SKS**:

`poin_matkul = round( Σ SKS(matkul yang sama) / Σ SKS(semua matkul milikku) × 60 )`

- Pengguna memilih **maksimal 5 mata kuliah** (ditegakkan di database lewat trigger pada `user_courses`).
- Butuh kolom `courses.credits` (SKS, bilangan bulat 1–6), diisi saat seed.
- Contoh: aku memilih A (4 SKS), B (2 SKS), C (2 SKS) = 8 SKS. Partner mengambil A dan C: (4+2)/8 × 60 = 45 poin. Tanpa SKS, hasilnya 2/3 × 60 = 40.
- Alasan: mata kuliah ber-SKS besar menuntut waktu belajar lebih banyak, jadi kesamaannya lebih bermakna. Masih asumsi, belum diuji.
- Tetap tidak simetris (lihat 15.3) dan bernilai 0 bila belum memilih mata kuliah.

#### Asal skor 100
| Komponen | Maks. | Sumber data |
|---|---:|---|
| Mata kuliah (berbobot SKS) | 60 | `user_courses` + `courses.credits` |
| Archetype sama / berbeda | 20 / 10 | `profiles.personality_type` |
| Jurusan sama | 10 | `profiles.major` |
| Sesi belajar bersama | 10 | `study_session_members` (maks. 2 sesi × 5) |
| **Total** | **100** | |

### 15.2 Competition Match (Lomba), belum dibuat
Arah archetype dibalik: **berbeda** bernilai lebih tinggi karena tim lomba butuh peran yang saling melengkapi. Komponen lain menyesuaikan saat fiturnya dikerjakan. Saat ini Lomba hanya berupa lowongan dan permintaan bergabung.

### 15.3 Keterbatasan yang harus diakui
- **Heuristik sederhana**, bukan model ML dan bukan prediksi yang divalidasi. Bobot belum diuji dengan data nyata.
- **Tidak simetris:** skor dihitung dari sudut pandang pengguna yang bertanya. Bila A memilih 2 mata kuliah dan B memilih 10 yang mencakup keduanya, A melihat B 60 poin untuk komponen matkul, sedangkan B melihat A hanya 12. Jangan tampilkan sebagai "kecocokan dua arah".
- Hasil kuis bukan diagnosis psikologis (§11); pencocokan memakai archetype sebagai petunjuk, bukan penentu.
- Pengguna lain hanya melihat archetype lewat `public_profiles`; jawaban kuis dan persentase mentah tidak dibuka ke pengguna lain.

### 15.4 Rencana kalibrasi
Setelah ada data pemakaian: bandingkan skor dengan sesi yang benar-benar diikuti dan dinilai berguna, lalu sesuaikan bobot. Perubahan bobot dicatat sebagai versi baru dokumen ini, sama seperti perubahan skoring kuis (§13).
