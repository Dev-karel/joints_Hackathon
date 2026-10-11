import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { resendSignupCode, verifySignupCode } from '@/features/auth/api';
import {
  cancelDeviceGate,
  confirmDeviceCode,
  requestDeviceCode,
} from '@/features/auth/useAuthActions';
import { OTP_LENGTH, otpSchema } from '@/lib/validation/auth';

const RESEND_SECONDS = 60;

export default function VerifikasiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const isDevice = params.mode === 'device';
  const email = params.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async () => {
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Kode tidak valid');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (isDevice) await confirmDeviceCode(email, parsed.data);
      else await verifySignupCode(email, parsed.data);
      // Sesi terbentuk: gerbang rute di root layout memindahkan ke kuis / Beranda.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      if (isDevice) await requestDeviceCode(email);
      else await resendSignupCode(email);
      setCooldown(RESEND_SECONDS);
      setInfo('Kode baru sudah dikirim.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  const back = async () => {
    if (isDevice) {
      await cancelDeviceGate();
      router.replace('/masuk');
    } else {
      router.back();
    }
  };

  return (
    <AuthScreen
      title={isDevice ? 'Verifikasi HP baru' : 'Verifikasi email'}
      subtitle={
        isDevice
          ? `Kami tidak mengenali HP ini. Masukkan kode ${OTP_LENGTH} angka yang dikirim ke ${email}.`
          : `Masukkan kode ${OTP_LENGTH} angka yang dikirim ke ${email}.`
      }
      onBack={back}>
      <View className="gap-[6px]">
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, OTP_LENGTH))}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
          placeholder={'0'.repeat(OTP_LENGTH)}
          placeholderTextColor={palette.borderSubtle}
          accessibilityLabel="Kode verifikasi"
          textContentType="oneTimeCode"
          className="h-[60px] rounded-[14px] border border-borderSubtle bg-white text-center text-[28px] font-bold tracking-[8px] text-ink"
        />
        {error ? <Text className="text-[13px] text-coral">{error}</Text> : null}
        {info ? <Text className="text-[13px] text-inkMuted">{info}</Text> : null}
      </View>

      <PrimaryButton label="Verifikasi" onPress={submit} loading={busy} disabled={code.length !== OTP_LENGTH} />

      <View className="items-center">
        {cooldown > 0 ? (
          <Text className="text-[13px] text-slateMuted">Kirim ulang kode dalam {cooldown} detik</Text>
        ) : (
          <Pressable onPress={resend} accessibilityRole="button" hitSlop={8}>
            <Text className="text-[13px] font-bold text-primary">Kirim ulang kode</Text>
          </Pressable>
        )}
      </View>
    </AuthScreen>
  );
}
