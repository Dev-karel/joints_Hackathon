import { z } from 'zod';

export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam atau iklan' },
  { id: 'pelecehan', label: 'Pelecehan atau kata-kata kasar' },
  { id: 'tidak_pantas', label: 'Konten tidak pantas' },
  { id: 'penipuan', label: 'Penipuan atau akun palsu' },
  { id: 'lainnya', label: 'Lainnya' },
] as const;

export const reportReasonSchema = z.enum([
  'spam',
  'pelecehan',
  'tidak_pantas',
  'penipuan',
  'lainnya',
]);

export const reportInputSchema = z
  .object({
    targetUserId: z.string().uuid().optional(),
    /** Lapor event (PRD §9.3) sebagai ganti pengguna. */
    targetEventId: z.string().uuid().optional(),
    reason: reportReasonSchema,
    note: z.string().trim().max(300, 'Catatan maksimal 300 karakter.').optional(),
    /** Cuplikan pesan yang dilaporkan (bila laporan berasal dari chat). */
    context: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.targetUserId || v.targetEventId, 'Target laporan tidak valid.');

export type ReportInput = z.infer<typeof reportInputSchema>;
