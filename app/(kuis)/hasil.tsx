import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { profileKey, useProfile } from '@/features/auth/useProfile';
import { ArchetypeResult } from '@/features/personality/components/ArchetypeResult';
import {
  archetypeIdSchema,
  personalityScoresSchema,
} from '@/lib/validation/personalityQuiz';

export default function HasilKuisScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const profile = useProfile(userId);

  // Segarkan profil agar gerbang rute tahu kuis sudah selesai (tab Beranda terbuka).
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: profileKey(userId) });
  }, [queryClient, userId]);

  const type = archetypeIdSchema.safeParse(profile.data?.personality_type);
  const scores = personalityScoresSchema.safeParse(profile.data?.personality_scores);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {type.success && scores.success ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <ArchetypeResult type={type.data} scores={scores.data} />
          </ScrollView>
          <View className="px-[24px] pb-[18px] pt-[8px]">
            <PrimaryButton label="Mulai jelajah" onPress={() => router.replace('/(tabs)')} />
          </View>
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}
