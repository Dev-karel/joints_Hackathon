// Root layout aplikasi. Impor global.css harus tetap paling atas karena itulah
// yang mengaktifkan NativeWind. SafeAreaProvider dipasang di sini supaya
// useSafeAreaInsets() di layar onboarding punya nilai yang benar.
import '../src/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/AppText';
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';
import { useAuthPhase } from '@/features/auth/useAuthPhase';
import { envProblem } from '@/lib/env';
import { queryClient } from '@/lib/queryClient';

// Tahan splash sampai font Inter (font Figma) siap, supaya teks tidak berganti huruf di tengah.
void SplashScreen.preventAutoHideAsync();

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
        <Stack.Screen name="mata-kuliah" />
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}

function ConfigMissing({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-[10px] bg-white px-[28px]">
      <Text className="text-[20px] font-bold text-slateInk">Konfigurasi belum lengkap</Text>
      <Text className="text-center text-[14px] text-slate500">{message}</Text>
      <Text className="text-center text-[13px] text-slate500">
        Salin .env.example menjadi .env, isi nilainya, lalu jalankan ulang dev server dengan
        --clear.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('../assets/fonts/Inter-ExtraBold.ttf'),
  });

  useEffect(() => {
    // Jika font gagal dimuat, tetap lanjut dengan font sistem daripada menahan aplikasi.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

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
