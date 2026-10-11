// Variabel EXPO_PUBLIC_* dibaca lewat akses langsung agar Metro bisa menyisipkan
// nilainya saat bundling. Semuanya ikut terbundel di APK: jangan pernah taruh
// service role key di sini (CLAUDE.md).
import { z } from 'zod';

const envSchema = z.object({
  supabaseUrl: z.url('EXPO_PUBLIC_SUPABASE_URL belum diisi / tidak valid'),
  supabaseAnonKey: z.string().min(20, 'EXPO_PUBLIC_SUPABASE_ANON_KEY belum diisi'),
  allowedEmailDomain: z.string().min(3, 'EXPO_PUBLIC_ALLOWED_EMAIL_DOMAIN belum diisi'),
});

const parsed = envSchema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  allowedEmailDomain: process.env.EXPO_PUBLIC_ALLOWED_EMAIL_DOMAIN,
});

// Null jika konfigurasi lengkap. Root layout menampilkan layar bantuan, bukan crash.
export const envProblem: string | null = parsed.success
  ? null
  : parsed.error.issues.map((i) => i.message).join('\n');

export const env = {
  supabaseUrl: parsed.success ? parsed.data.supabaseUrl : 'http://localhost',
  supabaseAnonKey: parsed.success ? parsed.data.supabaseAnonKey : 'missing-anon-key-placeholder',
  allowedEmailDomain: parsed.success ? parsed.data.allowedEmailDomain : 'binus.ac.id',
};
