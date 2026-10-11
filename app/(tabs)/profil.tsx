import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { GlassCard } from '@/components/glass/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { logout } from '@/features/auth/useAuthActions';
import { useProfile } from '@/features/auth/useProfile';

export default function ProfilScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { data: profile } = useProfile(session?.user.id);
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 px-[20px] pt-[24px]">
          <GlassCard strong className="gap-[4px] p-[20px]">
            <Text className="text-[22px] font-bold text-ink">{profile?.full_name ?? '...'}</Text>
            <Text className="text-[14px] text-inkMuted">{session?.user.email}</Text>
          </GlassCard>
        </View>
        <View className="gap-[10px] px-[20px] pb-[24px]">
          <PrimaryButton label="Mata kuliah saya" onPress={() => router.push('/mata-kuliah')} />
          {profile?.role === 'admin' ? (
            <PrimaryButton
              label="Daftarkan Wi-Fi (admin)"
              variant="outline"
              onPress={() => router.push('/admin/daftar-wifi' as Href)}
            />
          ) : null}
          <PrimaryButton
            label="Keluar"
            variant="outline"
            loading={loggingOut}
            onPress={() => {
              setLoggingOut(true);
              void logout();
            }}
          />
        </View>
      </SafeAreaView>
    </GlassBackground>
  );
}
