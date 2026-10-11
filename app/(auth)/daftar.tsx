import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { TextField } from '@/components/auth/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { signUp } from '@/features/auth/api';
import { env } from '@/lib/env';
import { signUpSchema, type SignUpValues } from '@/lib/validation/auth';

const schema = signUpSchema(env.allowedEmailDomain);

export default function DaftarScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
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
      title="Daftar akun"
      subtitle={`Pakai email kampus @${env.allowedEmailDomain}. Kami kirim kode 6 angka untuk memverifikasi.`}
      onBack={() => router.back()}>
      <View className="gap-[14px]">
        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <TextField
              label="Nama lengkap"
              placeholder="Nama sesuai KTM"
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
              label="Email kampus"
              placeholder={`nama@${env.allowedEmailDomain}`}
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
              label="Kata sandi"
              placeholder="Minimal 8 karakter"
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
              label="Ulangi kata sandi"
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
      </View>

      {formError ? <Text className="text-[13px] text-coral">{formError}</Text> : null}

      <PrimaryButton label="Daftar" onPress={onSubmit} loading={isSubmitting} />
      <SocialButtons />

      <View className="flex-row justify-center gap-[4px] pt-[4px]">
        <Text className="text-[13px] text-inkMuted">Sudah punya akun?</Text>
        <Pressable onPress={() => router.replace('/masuk')} accessibilityRole="link" hitSlop={8}>
          <Text className="text-[13px] font-bold text-primary">Masuk</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
