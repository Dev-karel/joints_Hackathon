// Kuis kepribadian AyokMatch v1.2 — SUMBER: docs/METHODOLOGY.md (§3 archetype, §4
// pertanyaan & pemetaan, §5 skoring). Jangan ubah isi/bobot tanpa memperbarui dokumen itu
// dan menjalankan ulang cek keseimbangan (METHODOLOGY §10; ada tesnya di
// personalityQuiz.test.ts). Pemetaan yang sama diseed di tabel personality_scoring
// (supabase/migrations/*_seed.sql); skor resmi dihitung di fungsi Postgres
// submit_personality_quiz — fungsi di file ini hanya untuk pratinjau dan tes.
import { z } from 'zod';

export const ARCHETYPE_IDS = [
  'wildheart',
  'heartkeeper',
  'mindsmith',
  'groundbreaker',
  'kindled_flame',
  'sagekeeper',
] as const; // urutan = METHODOLOGY §3 (dipakai sebagai tie-break terakhir)

export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];
export type AnswerId = 'A' | 'B';

export const archetypeIdSchema = z.enum(ARCHETYPE_IDS);
export const answerIdSchema = z.enum(['A', 'B']);
export const personalityScoresSchema = z.record(archetypeIdSchema, z.number());

export const PRIMARY_WEIGHT = 0.7;
export const SECONDARY_WEIGHT = 0.3;

export type ArchetypeInfo = {
  id: ArchetypeId;
  name: string;
  tagline: string;
  description: string;
  role: string;
};

export const ARCHETYPES: Record<ArchetypeId, ArchetypeInfo> = {
  wildheart: {
    id: 'wildheart',
    name: 'Wildheart',
    tagline: 'Sang Jiwa',
    description:
      'Kamu menghargai keharmonisan, kebebasan, dan dunia di sekitarmu. Kamu secara alami melihat lebih jauh dari masalah yang ada di depan mata dan peduli pada gambaran yang lebih besar.',
    role: 'Yang membawa makna dan keharmonisan ke tim.',
  },
  heartkeeper: {
    id: 'heartkeeper',
    name: 'Heartkeeper',
    tagline: 'Sang Hati',
    description:
      'Kamu peka terhadap perasaan orang lain. Kamu peduli pada orang-orang di sekitarmu dan ingin semua orang merasa didukung dan terhubung.',
    role: 'Yang menjaga tim tetap terhubung.',
  },
  mindsmith: {
    id: 'mindsmith',
    name: 'Mindsmith',
    tagline: 'Sang Ahli Strategi',
    description:
      'Kamu senang menemukan solusi dan mengubah masalah rumit menjadi sesuatu yang bisa dikelola. Saat orang lain melihat masalah, kamu cenderung melihat kemungkinan.',
    role: 'Yang menemukan jalan ke depan.',
  },
  groundbreaker: {
    id: 'groundbreaker',
    name: 'Groundbreaker',
    tagline: 'Sang Penantang',
    description:
      'Kamu nyaman mempertanyakan asumsi dan mengambil jalan yang tidak konvensional. Kamu menghargai keaslian dan berani menantang sebuah ide kalau kamu yakin ada cara yang lebih baik.',
    role: 'Yang mendorong tim untuk melangkah lebih jauh.',
  },
  kindled_flame: {
    id: 'kindled_flame',
    name: 'Kindled Flame',
    tagline: 'Sang Penggerak',
    description:
      'Sekali kamu peduli pada sesuatu, kamu tidak mudah menyerah. Tantangan justru jadi bahan bakar yang membuatmu berkembang dan terus bergerak.',
    role: 'Yang menjaga tim tetap bergerak.',
  },
  sagekeeper: {
    id: 'sagekeeper',
    name: 'Sagekeeper',
    tagline: 'Sang Penuntun',
    description:
      'Kamu lebih suka memahami dulu sebelum bereaksi. Kamu membawa ketenangan, perspektif, dan saran yang matang saat situasi mulai kacau.',
    role: 'Yang membantu tim menemukan kejernihan.',
  },
};

// Kalimat wajib di layar hasil (METHODOLOGY §7).
export const RESULT_DISCLAIMER =
  'Hasil ini mencerminkan trait yang paling menonjol dari jawabanmu di kuis ini. Ini archetype kreatif, bukan diagnosis psikologis.';

export type QuizOption = {
  id: AnswerId;
  text: string;
  primary: ArchetypeId;
  secondary: ArchetypeId;
};

export type QuizQuestion = {
  id: string; // "q1".."q15"
  title: string;
  prompt: string;
  options: [QuizOption, QuizOption];
};

const q = (
  n: number,
  title: string,
  prompt: string,
  a: [string, ArchetypeId, ArchetypeId],
  b: [string, ArchetypeId, ArchetypeId]
): QuizQuestion => ({
  id: `q${n}`,
  title,
  prompt,
  options: [
    { id: 'A', text: a[0], primary: a[1], secondary: a[2] },
    { id: 'B', text: b[0], primary: b[1], secondary: b[2] },
  ],
});

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  q(
    1,
    'Masalah Tim',
    'Saat tim menghadapi masalah, kamu biasanya...',
    ['Mencari cara paling masuk akal untuk menyelesaikannya.', 'mindsmith', 'groundbreaker'],
    ['Memastikan semua anggota merasa didengar.', 'heartkeeper', 'sagekeeper']
  ),
  q(
    2,
    'Situasi Baru',
    'Saat berada di tempat atau situasi baru, kamu lebih suka...',
    ['Langsung mencoba dan menjelajah.', 'wildheart', 'heartkeeper'],
    ['Mengamati dulu sebelum bertindak.', 'sagekeeper', 'mindsmith']
  ),
  q(
    3,
    'Perbedaan Pendapat',
    'Saat berbeda pendapat dengan orang lain, kamu cenderung...',
    ['Mendengarkan dan memahami alasan mereka terlebih dahulu.', 'sagekeeper', 'mindsmith'],
    ['Berani menyampaikan pendapatmu secara langsung.', 'groundbreaker', 'kindled_flame']
  ),
  q(
    4,
    'Tugas Sulit',
    'Saat mendapat tugas yang sulit, kamu lebih memilih...',
    ['Mencari ide atau cara baru.', 'mindsmith', 'groundbreaker'],
    ['Terus berusaha sampai tugas selesai.', 'kindled_flame', 'wildheart']
  ),
  q(
    5,
    'Teman dalam Kesulitan',
    'Ketika teman sedang mengalami kesulitan, kamu biasanya...',
    ['Mendengarkan dan membantu mencari jalan keluar.', 'heartkeeper', 'sagekeeper'],
    ['Menyemangatinya agar tidak menyerah.', 'kindled_flame', 'wildheart']
  ),
  q(
    6,
    'Gaya Kerja',
    'Kamu lebih nyaman...',
    ['Mengikuti keadaan dan mencoba hal baru.', 'wildheart', 'heartkeeper'],
    ['Membuat rencana sebelum bertindak.', 'mindsmith', 'groundbreaker']
  ),
  q(
    7,
    'Solusi Buntu',
    'Saat kelompok tidak menemukan solusi, kamu akan...',
    ['Berani mencoba pendekatan yang belum pernah dicoba.', 'groundbreaker', 'kindled_flame'],
    ['Membantu anggota berdiskusi sampai menemukan kesepakatan.', 'heartkeeper', 'sagekeeper']
  ),
  q(
    8,
    'Cara Mengerjakan',
    'Saat mengerjakan sesuatu, kamu lebih suka...',
    ['Memecah masalah menjadi langkah-langkah yang jelas.', 'mindsmith', 'groundbreaker'],
    ['Menjelajahi berbagai kemungkinan dan mencoba cara baru.', 'wildheart', 'heartkeeper']
  ),
  q(
    9,
    'Menghadapi Kegagalan',
    'Ketika mengalami kegagalan, kamu biasanya...',
    ['Bangkit dan mencoba lagi dengan lebih kuat.', 'kindled_flame', 'wildheart'],
    ['Berhenti sejenak untuk memahami penyebabnya.', 'sagekeeper', 'mindsmith']
  ),
  q(
    10,
    'Peran dalam Kelompok',
    'Saat berada dalam kelompok, kamu biasanya...',
    ['Menjaga agar semua anggota tetap akrab dan terlibat.', 'heartkeeper', 'sagekeeper'],
    ['Berani menyampaikan hal yang mungkin dihindari orang lain.', 'groundbreaker', 'kindled_flame']
  ),
  q(
    11,
    'Aturan yang Kurang Tepat',
    'Jika ada aturan yang menurutmu kurang tepat, kamu akan...',
    ['Berani mempertanyakan aturan tersebut.', 'groundbreaker', 'kindled_flame'],
    ['Mencari tahu alasan di balik aturan tersebut.', 'sagekeeper', 'mindsmith']
  ),
  q(
    12,
    'Rencana Tidak Lancar',
    'Saat rencana tidak berjalan lancar, kamu akan...',
    ['Tetap fokus dan berusaha sampai tuntas.', 'kindled_flame', 'wildheart'],
    ['Mencari alternatif yang lebih efektif.', 'mindsmith', 'groundbreaker']
  ),
  q(
    13,
    'Dasar Keputusan',
    'Saat membuat keputusan, kamu lebih sering mengandalkan...',
    ['Intuisi dan perasaanmu terhadap situasi sekitar.', 'wildheart', 'heartkeeper'],
    ['Pengalaman dan pertimbangan yang matang.', 'sagekeeper', 'mindsmith']
  ),
  q(
    14,
    'Pertimbangan Keputusan',
    'Ketika harus mengambil keputusan, kamu lebih memikirkan...',
    ['Dampaknya bagi orang-orang yang terlibat.', 'heartkeeper', 'sagekeeper'],
    ['Tujuan yang ingin dicapai dan usaha untuk meraihnya.', 'kindled_flame', 'wildheart']
  ),
  q(
    15,
    'Ingin Dikenal',
    'Kamu ingin dikenal sebagai orang yang...',
    ['Membawa dampak baik bagi orang dan lingkungan sekitar.', 'wildheart', 'heartkeeper'],
    ['Berani mengambil langkah berbeda saat orang lain ragu.', 'groundbreaker', 'kindled_flame']
  ),
];

export const QUESTION_COUNT = QUIZ_QUESTIONS.length;

export type QuizAnswers = Record<string, AnswerId>;

export type QuizResult = {
  type: ArchetypeId;
  /** Persentase 0–100 per archetype; jumlahnya 100. */
  percentages: Record<ArchetypeId, number>;
};

/**
 * Algoritma METHODOLOGY §5 dengan bobot bilangan bulat (70/30) agar tie-break tidak
 * terganggu pembulatan float. Tie-break: (1) jumlah bobot primer, (2) pertanyaan paling
 * awal yang bobotnya berbeda (lebih besar menang), (3) urutan ARCHETYPE_IDS.
 * Melempar error bila belum 15 jawaban (tidak ada skor parsial, METHODOLOGY §10).
 */
export function scoreAnswers(answers: QuizAnswers): QuizResult {
  const weights = Object.fromEntries(
    ARCHETYPE_IDS.map((id) => [id, new Array<number>(QUESTION_COUNT).fill(0)])
  ) as Record<ArchetypeId, number[]>;

  QUIZ_QUESTIONS.forEach((question, index) => {
    const picked = answers[question.id];
    if (!picked) throw new Error(`Pertanyaan ${question.id} belum dijawab`);
    const option = question.options.find((o) => o.id === picked)!;
    weights[option.primary][index] = 70;
    weights[option.secondary][index] = 30;
  });

  const rows = ARCHETYPE_IDS.map((id) => ({
    id,
    ws: weights[id],
    score: weights[id].reduce((a, b) => a + b, 0),
    primaryCount: weights[id].filter((w) => w === 70).length,
  }));

  const compareWeights = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i] - a[i];
    return 0;
  };

  const winner = [...rows].sort(
    (a, b) =>
      b.score - a.score ||
      b.primaryCount - a.primaryCount ||
      compareWeights(a.ws, b.ws) ||
      ARCHETYPE_IDS.indexOf(a.id) - ARCHETYPE_IDS.indexOf(b.id)
  )[0];

  const total = QUESTION_COUNT * 100; // 1500
  const percentages = Object.fromEntries(
    rows.map((r) => [r.id, (r.score / total) * 100])
  ) as Record<ArchetypeId, number>;

  return { type: winner.id, percentages };
}
