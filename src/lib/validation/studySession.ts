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
