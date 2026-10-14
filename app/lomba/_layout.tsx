import { Stack } from 'expo-router';

export default function LombaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' } as any,
      }}
    />
  );
}