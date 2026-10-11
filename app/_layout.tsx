// Root layout aplikasi. Impor global.css harus tetap paling atas karena itulah
// yang mengaktifkan NativeWind. SafeAreaProvider dipasang di sini supaya
// useSafeAreaInsets() di layar onboarding punya nilai yang benar.
import '../src/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';
import { useAuthPhase } from '@/features/auth/useAuthPhase';
import { envProblem } from '@/lib/env';
import { queryClient } from '@/lib/queryClient';

// Gerbang rute berdasarkan fase auth (lihat useAuthPhase). Rute yang guard-nya false
// tidak bisa dibuka; `index` selalu terbuka dan mengarahkan ke tujuan yang benar.
function AppStack() {
  useAuthBootstrap();
  const { phase } = useAuthPhase();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={phase === 'signedOut' || phase === 'needsDeviceOtp'}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={phase === 'needsQuiz' || phase === 'ready'}>
        <Stack.Screen name="(kuis)" />
      </Stack.Protected>
      <Stack.Protected guard={phase === 'ready'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

function ConfigMissing({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-[10px] bg-white px-[28px]">
      <Text className="text-[20px] font-bold text-ink">Konfigurasi belum lengkap</Text>
      <Text className="text-center text-[14px] text-inkMuted">{message}</Text>
      <Text className="text-center text-[13px] text-slateMuted">
        Salin .env.example menjadi .env, isi nilainya, lalu jalankan ulang dev server dengan
        --clear.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {envProblem ? (
        <ConfigMissing message={envProblem} />
      ) : (
        <QueryClientProvider client={queryClient}>
          <AppStack />
        </QueryClientProvider>
      )}
    </SafeAreaProvider>
  );
}
