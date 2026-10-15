import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArchetypeArt } from '@/components/archetype/ArchetypeArt';
import { GlassBackground } from '@/components/glass/GlassBackground';
import { palette } from '@/components/onboarding/palette';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TabHero } from '@/components/ui/TabHero';
import { useAuthStore } from '@/features/auth/authStore';
import { profileKey, useProfile } from '@/features/auth/useProfile';
import { ArchetypeResult } from '@/features/personality/components/ArchetypeResult';
import {
  ARCHETYPES,
  archetypeIdSchema,
  personalityScoresSchema,
} from '@/lib/validation/personalityQuiz';

export default function HasilKuisScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const profile = useProfile(userId);
  const [congratsOpen, setCongratsOpen] = useState(true);

  // Segarkan profil agar gerbang rute tahu kuis sudah selesai (tab Beranda terbuka).
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: profileKey(userId) });
  }, [queryClient, userId]);

  const type = archetypeIdSchema.safeParse(profile.data?.personality_type);
  const scores = personalityScoresSchema.safeParse(profile.data?.personality_scores);

  return (
    <GlassBackground stars={false}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {type.success && scores.success ? (
          <>
            <TabHero
              title="Hasil kuismu"
              subtitle={`${ARCHETYPES[type.data].name} · ${ARCHETYPES[type.data].tagline}`}
            />
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <ArchetypeResult type={type.data} scores={scores.data} />
            </ScrollView>
            <View className="px-[20px] pb-[18px] pt-[8px]">
              {/* Langsung ke mata kuliah: '/' ambigu karena (kuis), (tabs), dan app/index sama-sama
                  beralamat '/', sehingga replace('/') bisa berujung layar kosong. */}
              <PrimaryButton label="Lanjutkan" onPress={() => router.replace('/mata-kuliah')} />
            </View>
            <ConfirmModal
              visible={congratsOpen}
              title="Selamat! 🎉"
              message={`Kamu adalah ${ARCHETYPES[type.data].name}, ${ARCHETYPES[type.data].tagline.toLowerCase()}. Hasil ini sekarang menjadi label kepribadian di akunmu.`}
              confirmLabel="Lihat hasil lengkap"
              onConfirm={() => setCongratsOpen(false)}
            >
              <View className="items-center">
                <ArchetypeArt type={type.data} size={140} />
              </View>
            </ConfirmModal>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette.primary} />
          </View>
        )}
      </SafeAreaView>
    </GlassBackground>
  );
}
