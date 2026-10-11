// Validasi BSSID. Pola yang sama dipakai Edge Function resolve-zone dan
// register-access-point (supabase/functions/*/index.ts); jaga agar tetap identik.
import { z } from 'zod';

// Nilai samaran Android bila izin lokasi presisi atau layanan lokasi tidak aktif.
export const PLACEHOLDER_BSSID = '02:00:00:00:00:00';

export const BSSID_PATTERN = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/;

export const normalizeBssid = (value: string) => value.trim().toLowerCase();

export const bssidSchema = z
  .string()
  .transform(normalizeBssid)
  .pipe(z.string().regex(BSSID_PATTERN, 'Format BSSID tidak valid'))
  .refine((v) => v !== PLACEHOLDER_BSSID, 'BSSID samaran: izin atau layanan lokasi belum aktif');

export const registerAccessPointSchema = z.object({
  bssid: bssidSchema,
  zoneId: z.uuid('Pilih zona dulu'),
  label: z.string().trim().max(80).optional(),
});
