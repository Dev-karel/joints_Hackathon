// Skema form "Buat sesi belajar". Aturan jam: lihat startsAt di app/buat-sesi.tsx.
import { z } from 'zod';

export const SESSION_KINDS = {
  belajar_kelompok: 'Belajar kelompok',
  tutor_sebaya: 'Tutor sebaya',
  diskusi: 'Diskusi',
} as const;
export type SessionKind = keyof typeof SESSION_KINDS;

export const sessionTitleSchema = z
  .string()
  .trim()
  .min(3, 'Judul minimal 3 karakter')
  .max(80, 'Judul maksimal 80 karakter');

export const sessionTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Isi jam dengan format JJ:MM, contoh 14:30');

export const sessionBringSchema = z.string().trim().max(120, 'Catatan "perlu dibawa" maksimal 120 karakter');

export const MAX_MATERIALS = 5; // dijaga juga trigger limit_session_materials
export const MAX_MATERIAL_BYTES = 10 * 1024 * 1024; // dijaga juga bucket + tabel
export const MATERIAL_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** "13.00" atau "13:00" → menit sejak 00.00, atau null bila tidak valid. */
export function parseClock(value: string): number | null {
  const m = /^\s*([01]?\d|2[0-3])[:.]([0-5]\d)\s*$/.exec(value);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** "13.00–15.00" (tanda hubung biasa juga boleh) → [mulai, selesai] dalam menit, atau null. */
export function parseClockRange(value: string): [number, number] | null {
  const parts = value.split(/\s*[–-]\s*/);
  if (parts.length !== 2) return null;
  const a = parseClock(parts[0]);
  const b = parseClock(parts[1]);
  return a === null || b === null || b <= a ? null : [a, b];
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const clockLabel = (minutes: number) => `${pad2(Math.floor(minutes / 60))}.${pad2(minutes % 60)}`;
