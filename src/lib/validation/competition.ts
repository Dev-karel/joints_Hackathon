// Skema form "Buat ajakan" tab Lomba (lowongan anggota tim). Aturan tim dicek juga oleh constraint
// tabel team_openings (team_size >= 2).
import { z } from 'zod';

export const COMPETITION_CATEGORIES = [
  'Hackathon',
  'Sains data',
  'UI/UX',
  'Rencana bisnis',
  'Lainnya',
] as const;
export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

export const competitionNameSchema = z
  .string()
  .trim()
  .min(3, 'Nama lomba minimal 3 karakter')
  .max(80, 'Nama lomba maksimal 80 karakter');

export const roleSchema = z
  .string()
  .trim()
  .min(2, 'Nama peran minimal 2 karakter')
  .max(30, 'Nama peran maksimal 30 karakter');

export const guidebookUrlSchema = z
  .string()
  .trim()
  .max(300, 'Tautan terlalu panjang')
  .refine((v) => v === '' || /^https?:\/\/\S+\.\S+/i.test(v), 'Tautan harus diawali https://');

export const teamDescriptionSchema = z
  .string()
  .trim()
  .max(300, 'Deskripsi maksimal 300 karakter');

export const joinMessageSchema = z.string().trim().max(200, "Pesan maksimal 200 karakter");
