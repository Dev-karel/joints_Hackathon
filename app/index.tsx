// Entry route "/": gerbang berdasarkan fase auth.
//  belum login -> onboarding, perlu OTP HP baru -> verifikasi, kuis belum selesai -> kuis,
//  selesai -> Beranda.
import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useAuthPhase } from '@/features/auth/useAuthPhase';

export default function Index() {
  const { phase, retry } = useAuthPhase();
  const gate = useAuthStore((s) => s.gate);

  switch (phase) {
    case 'signedOut':
      return <Redirect href="/(onboarding)/teman-cocok" />;
    case 'needsDeviceOtp':
      return (
        <Redirect
          href={{
            pathname: '/verifikasi',
            params: { mode: 'device', email: gate.kind === 'otp' ? gate.email : '' },
          }}
        />
      );
    case 'needsQuiz':
      return <Redirect href="/(kuis)" />;
    case 'ready':
      return <Redirect href="/(tabs)" />;
    case 'profileError':
      return (
        <View className="flex-1 items-center justify-center gap-[12px] bg-white px-[28px]">
          <Text className="text-center text-[14px] text-inkMuted">
            Gagal memuat profil. Periksa internet kamu.
          </Text>
          <PrimaryButton label="Coba lagi" onPress={retry} />
        </View>
      );
    default:
      return (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator color={palette.primary} />
        </View>
      );
  }
}
