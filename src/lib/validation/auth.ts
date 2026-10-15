// Skema Zod untuk login kampus. Satu sumber untuk form di aplikasi dan (nanti)
// Edge Function. Domain dilewatkan sebagai parameter supaya file ini tidak
// bergantung pada process.env (Edge Function berjalan di Deno).
import { z } from 'zod';

/** "@binus.ac.id" atau "@binus.ac.id atau @gmail.com", untuk pesan di UI. */
export const formatDomains = (domains: string[]) => domains.map((d) => `@${d}`).join(' atau ');

// Email harus berakhir di salah satu domain allowlist (juga ditegakkan trigger database).
export const campusEmailSchema = (domains: string[]) =>
  z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .max(254, 'Email terlalu panjang')
    .pipe(z.email('Format email tidak valid'))
    .refine((value) => domains.some((d) => value.toLowerCase().endsWith(`@${d.toLowerCase()}`)), {
      message: `Gunakan email ${formatDomains(domains)}`,
    });

// Figma (frame Sign Up): "Minimal 8 karakter, kombinasi huruf & angka".
export const passwordSchema = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Kata sandi harus memuat huruf')
  .regex(/\d/, 'Kata sandi harus memuat angka');

// Harus sama dengan Dashboard -> Authentication -> Sign In / Providers -> Email -> Email OTP Length.
export const OTP_LENGTH = 6;

export const otpSchema = z
  .string()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Kode terdiri dari ${OTP_LENGTH} angka`);

export const signUpSchema = (domains: string[]) =>
  z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, 'Nama lengkap wajib diisi')
        .max(100, 'Nama maksimal 100 karakter'),
      email: campusEmailSchema(domains),
      password: passwordSchema,
      confirmPassword: z.string(),
      agree: z.boolean().refine((v) => v, 'Setujui syarat dan kebijakan privasi untuk melanjutkan'),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Kata sandi tidak sama',
    });

export const signInSchema = (domains: string[]) =>
  z.object({
    email: campusEmailSchema(domains),
    password: z.string().min(1, 'Kata sandi wajib diisi'),
  });

export type SignUpValues = z.infer<ReturnType<typeof signUpSchema>>;
export type SignInValues = z.infer<ReturnType<typeof signInSchema>>;
