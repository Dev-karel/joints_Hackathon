// Entry route "/": gerbang berdasarkan fase auth.
//  belum login -> onboarding, perlu OTP HP baru -> verifikasi, kuis belum selesai -> kuis,
//  selesai -> Beranda.
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { logout } from '@/features/auth/useAuthActions';
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
    case 'needsCourses':
      return <Redirect href="/mata-kuliah" />;
    case 'ready':
      return <Redirect href="/(tabs)" />;
    case 'banned':
      return (
        <View className="flex-1 items-center justify-center gap-[12px] bg-white px-[28px]">
          <Text className="text-center text-[20px] font-bold text-slateInk">Akun diblokir</Text>
          <Text className="text-center text-[14px] leading-[21px] text-slate500">
            Akunmu diblokir admin setelah laporan pengguna lain ditinjau. Hubungi admin AyokMatch
            kalau menurutmu ini keliru.
          </Text>
          <PrimaryButton label="Keluar" variant="outline" onPress={() => void logout()} />
        </View>
      );
    case 'profileError':
      return (
        <View className="flex-1 items-center justify-center gap-[12px] bg-white px-[28px]">
          <Text className="text-center text-[14px] text-slate500">
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
