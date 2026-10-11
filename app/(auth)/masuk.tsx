import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { TextField } from '@/components/auth/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { signInWithGate } from '@/features/auth/useAuthActions';
import { env } from '@/lib/env';
import { signInSchema, type SignInValues } from '@/lib/validation/auth';

const schema = signInSchema(env.allowedEmailDomain);

export default function MasukScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const needsDeviceOtp = await signInWithGate(values.email, values.password);
      // HP dikenal: sesi terbentuk dan gerbang rute di root layout yang memindahkan layar.
      if (needsDeviceOtp) {
        router.replace({
          pathname: '/verifikasi',
          params: { mode: 'device', email: values.email.trim().toLowerCase() },
        });
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  });

  return (
    <AuthScreen
      title="Masuk"
      subtitle="Selamat datang kembali. Masuk dengan email kampus kamu."
      onBack={() => router.back()}>
      <View className="gap-[14px]">
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
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />
      </View>

      {formError ? <Text className="text-[13px] text-coral">{formError}</Text> : null}

      <PrimaryButton label="Masuk" onPress={onSubmit} loading={isSubmitting} />
      <SocialButtons />

      <View className="flex-row justify-center gap-[4px] pt-[4px]">
        <Text className="text-[13px] text-inkMuted">Belum punya akun?</Text>
        <Pressable onPress={() => router.replace('/daftar')} accessibilityRole="link" hitSlop={8}>
          <Text className="text-[13px] font-bold text-primary">Daftar</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
