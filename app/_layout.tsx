// Root layout aplikasi. Impor global.css harus tetap paling atas karena itulah
// yang mengaktifkan NativeWind. SafeAreaProvider dipasang di sini supaya
// useSafeAreaInsets() di layar onboarding punya nilai yang benar.
import '../src/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
