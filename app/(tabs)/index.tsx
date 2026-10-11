import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';

export default function BerandaScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const archetype = archetypeIdSchema.safeParse(profile?.personality_type);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text className="text-[14px] text-inkMuted">Halo,</Text>
        <Text className="text-[26px] font-bold text-ink">{profile?.full_name ?? '...'}</Text>
        {archetype.success ? (
          <View className="mt-[8px] gap-[2px] rounded-[20px] bg-surfaceSky p-[18px]">
            <Text className="text-[12px] font-bold text-primary">
              {ARCHETYPES[archetype.data].tagline.toUpperCase()}
            </Text>
            <Text className="text-[22px] font-bold text-ink">{ARCHETYPES[archetype.data].name}</Text>
          </View>
        ) : null}
        <Text className="pt-[12px] text-[14px] text-inkMuted">
          Fitur Match, Event, dan Peta menyusul. Untuk sementara kamu sudah bisa masuk dan melihat
          archetype-mu di sini.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
