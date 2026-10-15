import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { LoginBanner } from '@/components/auth/LoginBanner';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { TextField } from '@/components/auth/TextField';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { signInWithGate, signInWithGoogleGate } from '@/features/auth/useAuthActions';
import { env } from '@/lib/env';
import { signInSchema, type SignInValues } from '@/lib/validation/auth';

const schema = signInSchema(env.allowedEmailDomains);

// Frame Figma "Login Page" (3:189). Tautan "Lupa kata sandi?" di Figma belum ditampilkan
// karena alur reset kata sandi belum ada.
export default function MasukScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
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
        router.push({
          pathname: '/verifikasi',
          params: { mode: 'device', email: values.email.trim().toLowerCase() },
        });
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  });

  const onGoogle = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      // Berhasil: sesi terbentuk dan gerbang rute di root layout yang memindahkan layar.
      await signInWithGoogleGate();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthScreen
      banner={<LoginBanner />}
      footer={
        <View className="flex-row items-center justify-center gap-[6px]">
          <Text className="text-[14px] text-slate500">Belum punya akun?</Text>
          <Pressable
            onPress={() => router.replace('/daftar')}
            accessibilityRole="link"
            hitSlop={12}
            className="min-h-[48px] justify-center"
          >
            <Text className="text-[14px] font-bold text-primary underline">Daftar</Text>
          </Pressable>
        </View>
      }
    >
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
            label="Kata sandi"
            placeholder="Masukkan kata sandi"
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

      {formError ? <FormError message={formError} /> : null}

      <PrimaryButton label="Masuk" onPress={onSubmit} loading={isSubmitting} />
      <SocialButtons onGooglePress={onGoogle} googleLoading={googleLoading} />
    </AuthScreen>
  );
}
