import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { logout } from '@/features/auth/useAuthActions';
import { useProfile } from '@/features/auth/useProfile';

export default function ProfilScreen() {
  const session = useAuthStore((s) => s.session);
  const { data: profile } = useProfile(session?.user.id);
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 gap-[6px] px-[24px] pt-[24px]">
        <Text className="text-[22px] font-bold text-ink">{profile?.full_name ?? '...'}</Text>
        <Text className="text-[14px] text-inkMuted">{session?.user.email}</Text>
      </View>
      <View className="px-[24px] pb-[24px]">
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
  );
}
