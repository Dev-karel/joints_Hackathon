// Data & generator rasi bintang. Semuanya digambar dengan kode (titik + garis), bukan gambar,
// jadi asli dan ringan. Koordinat 0–100 (kotak persegi) untuk pola archetype.
import type { ArchetypeId } from '@/lib/validation/personalityQuiz';

export type Star = { x: number; y: number; r?: number; accent?: boolean };
export type Edge = readonly [number, number];
export type Pattern = { stars: Star[]; edges: Edge[] };

const chain = (n: number, closed = false): Edge[] => {
  const edges: Edge[] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
  if (closed) edges.push([n - 1, 0]);
  return edges;
};

// Satu pola unik per archetype, supaya hasil kuis punya "rasi bintang" sendiri.
export const ARCHETYPE_PATTERNS: Record<ArchetypeId, Pattern> = {
  // Wildheart: spiral terbuka (bebas, menjelajah)
  wildheart: {
    stars: [
      { x: 50, y: 50, accent: true },
      { x: 62, y: 46 },
      { x: 66, y: 34 },
      { x: 56, y: 24 },
      { x: 42, y: 24 },
      { x: 30, y: 34 },
      { x: 28, y: 50 },
      { x: 36, y: 66 },
      { x: 52, y: 76 },
      { x: 70, y: 72, accent: true },
    ],
    edges: chain(10),
  },
  // Heartkeeper: lengkung hati (peduli, terhubung)
  heartkeeper: {
    stars: [
      { x: 50, y: 34, accent: true },
      { x: 38, y: 22 },
      { x: 24, y: 28 },
      { x: 20, y: 44 },
      { x: 34, y: 64 },
      { x: 50, y: 80, accent: true },
      { x: 66, y: 64 },
      { x: 80, y: 44 },
      { x: 76, y: 28 },
      { x: 62, y: 22 },
    ],
    edges: chain(10, true),
  },
  // Mindsmith: jaring segi enam (strategi, solusi)
  mindsmith: {
    stars: [
      { x: 50, y: 50, accent: true },
      { x: 80, y: 50 },
      { x: 65, y: 76 },
      { x: 35, y: 76 },
      { x: 20, y: 50 },
      { x: 35, y: 24 },
      { x: 65, y: 24 },
    ],
    edges: [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 1],
      [0, 1],
      [0, 3],
      [0, 5],
    ],
  },
  // Groundbreaker: ujung panah (menantang, mendorong batas)
  groundbreaker: {
    stars: [
      { x: 50, y: 12, accent: true },
      { x: 26, y: 52 },
      { x: 42, y: 52 },
      { x: 34, y: 86 },
      { x: 50, y: 66 },
      { x: 66, y: 86 },
      { x: 58, y: 52 },
      { x: 74, y: 52 },
    ],
    edges: chain(8, true),
  },
  // Kindled Flame: nyala api (ketekunan, terus bergerak)
  kindled_flame: {
    stars: [
      { x: 50, y: 10, accent: true },
      { x: 40, y: 30 },
      { x: 30, y: 46 },
      { x: 32, y: 66 },
      { x: 44, y: 84 },
      { x: 58, y: 84 },
      { x: 70, y: 66 },
      { x: 68, y: 46 },
      { x: 58, y: 30 },
      { x: 50, y: 54, accent: true },
    ],
    edges: [...chain(9, true), [0, 9], [9, 4], [9, 5]],
  },
  // Sagekeeper: rasi mirip Biduk + bintang utara (bimbingan, perspektif)
  sagekeeper: {
    stars: [
      { x: 10, y: 74 },
      { x: 26, y: 66 },
      { x: 42, y: 60 },
      { x: 58, y: 52, accent: true },
      { x: 76, y: 54 },
      { x: 82, y: 32 },
      { x: 62, y: 28 },
      { x: 30, y: 20, accent: true },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
      [6, 7],
    ],
  },
};

// Generator deterministik (LCG) supaya latar sama setiap render.
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Bintang tersebar (grid ber-jitter) dalam kotak width x height dan garis ke tetangga
 * terdekat (maks 2 garis per bintang, tanpa garis ganda). Untuk latar ambient.
 */
export function generateField(
  seed: number,
  cols: number,
  rows: number,
  width: number,
  height: number
) {
  const rand = rng(seed);
  const cw = width / cols;
  const ch = height / rows;
  const stars: Star[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      stars.push({
        x: (c + 0.2 + rand() * 0.6) * cw,
        y: (r + 0.2 + rand() * 0.6) * ch,
        r: 1.4 + rand() * 1.8,
        accent: rand() > 0.72,
      });
    }
  }

  const maxDist = Math.hypot(cw, ch) * 1.05;
  const degree = new Array<number>(stars.length).fill(0);
  const seen = new Set<string>();
  const edges: Edge[] = [];
  stars.forEach((a, i) => {
    const near = stars
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(({ j, d }) => j !== i && d <= maxDist)
      .sort((p, q) => p.d - q.d);
    for (const { j } of near) {
      if (degree[i] >= 2) break;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key) || degree[j] >= 3) continue;
      seen.add(key);
      degree[i]++;
      degree[j]++;
      edges.push([i, j]);
    }
  });
  return { stars, edges };
}
