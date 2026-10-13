import { ARCHETYPES, archetypeIdSchema, type ArchetypeId } from '@/lib/validation/personalityQuiz';

/** Nama tampilan archetype ("Kindled Flame"), atau null bila nilai belum diisi/tidak dikenal. */
export function archetypeName(value: string | null | undefined): string | null {
  const parsed = archetypeIdSchema.safeParse(value);
  return parsed.success ? ARCHETYPES[parsed.data].name : null;
}

// Warna pil archetype (kartu pengguna di Cari Teman). Pasangan latar/teks dipilih supaya
// kontras teks kecil ≥ 4,5:1; teks aksen kuning memakai 700 (#A65C00), bukan 500.
export const ARCHETYPE_PILL: Record<ArchetypeId, { bg: string; text: string }> = {
  wildheart: { bg: '#DCF4E5', text: '#166534' },
  heartkeeper: { bg: '#FEF3E2', text: '#A65C00' },
  mindsmith: { bg: '#E6F3FB', text: '#0072B8' },
  groundbreaker: { bg: '#F1F5F9', text: '#0F172A' },
  kindled_flame: { bg: '#FDE2B3', text: '#7C4700' },
  sagekeeper: { bg: '#EEE8FE', text: '#6D3FD0' },
};

export function archetypePill(value: string | null | undefined) {
  const parsed = archetypeIdSchema.safeParse(value);
  return parsed.success ? ARCHETYPE_PILL[parsed.data] : null;
}
