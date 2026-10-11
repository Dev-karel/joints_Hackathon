// Skema Zod untuk login kampus. Satu sumber untuk form di aplikasi dan (nanti)
// Edge Function. Domain dilewatkan sebagai parameter supaya file ini tidak
// bergantung pada process.env (Edge Function berjalan di Deno).
import { z } from 'zod';

export const campusEmailSchema = (domain: string) =>
  z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .pipe(z.email('Format email tidak valid'))
    .refine((value) => value.toLowerCase().endsWith(`@${domain.toLowerCase()}`), {
      message: `Gunakan email kampus @${domain}`,
    });

export const passwordSchema = z.string().min(8, 'Kata sandi minimal 8 karakter');

export const otpSchema = z.string().regex(/^\d{6}$/, 'Kode terdiri dari 6 angka');

export const signUpSchema = (domain: string) =>
  z
    .object({
      fullName: z.string().trim().min(2, 'Nama lengkap wajib diisi'),
      email: campusEmailSchema(domain),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Kata sandi tidak sama',
    });

export const signInSchema = (domain: string) =>
  z.object({
    email: campusEmailSchema(domain),
    password: z.string().min(1, 'Kata sandi wajib diisi'),
  });

export type SignUpValues = z.infer<ReturnType<typeof signUpSchema>>;
export type SignInValues = z.infer<ReturnType<typeof signInSchema>>;
