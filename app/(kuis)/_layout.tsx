import { Stack } from 'expo-router';

export default function KuisLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false, // jangan bisa swipe keluar dari kuis wajib
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    />
  );
}
