import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { TextField } from '@/components/auth/TextField';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { signUp } from '@/features/auth/api';
import { env } from '@/lib/env';
import { formatDomains, signUpSchema, type SignUpValues } from '@/lib/validation/auth';

const schema = signUpSchema(env.allowedEmailDomains);

// Frame Figma "Sign Up Page" (276:491). Halaman Syarat & Ketentuan / Kebijakan Privasi belum ada,
// jadi teks persetujuan belum berupa tautan.
export default function DaftarScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', agree: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signUp(values);
      router.push({
        pathname: '/verifikasi',
        params: { mode: 'signup', email: values.email.trim().toLowerCase() },
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  });

  return (
    <AuthScreen
      title="Daftar Akun"
      subtitle={`Daftar dengan email ${formatDomains(env.allowedEmailDomains)}. Kode verifikasi dikirim ke email itu.`}
      footer={
        <View className="flex-row items-center justify-center gap-[4px]">
          <Text className="text-[14px] text-slate500">Sudah punya akun?</Text>
          <Pressable
            onPress={() => router.replace('/masuk')}
            accessibilityRole="link"
            hitSlop={12}
            className="min-h-[48px] justify-center"
          >
            <Text className="text-[14px] font-bold text-primary">Masuk</Text>
          </Pressable>
        </View>
      }
    >
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkapmu"
            autoCapitalize="words"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            placeholder="Masukkan emailmu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Kata Sandi"
            placeholder="Masukkan kata sandi"
            hint="Minimal 8 karakter, kombinasi huruf & angka"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="agree"
        render={({ field }) => (
          <View className="gap-[6px]">
            <Pressable
              onPress={() => field.onChange(!field.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: field.value }}
              className="min-h-[48px] flex-row items-center gap-[10px]"
            >
              <View
                className={`size-[20px] items-center justify-center rounded-[6px] border-[1.5px] border-primary ${
                  field.value ? 'bg-primary' : 'bg-white'
                }`}
              >
                {field.value ? <Check size={13} strokeWidth={3} color="#FFFFFF" /> : null}
              </View>
              <Text className="flex-1 text-[12px] text-slate500">
                Saya setuju dengan Syarat & Ketentuan serta Kebijakan Privasi AyokMatch
              </Text>
            </Pressable>
            {errors.agree?.message ? <FormError message={errors.agree.message} size={12} /> : null}
          </View>
        )}
      />

      {formError ? <FormError message={formError} /> : null}

      <PrimaryButton label="Daftar" onPress={onSubmit} loading={isSubmitting} />
    </AuthScreen>
  );
}
