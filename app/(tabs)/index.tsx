import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArchetypeArt } from '@/components/archetype/ArchetypeArt';
import { GlassBackground } from '@/components/glass/GlassBackground';
import { GlassCard } from '@/components/glass/GlassCard';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { useMyCourseIds } from '@/features/courses/hooks';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';

export default function BerandaScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const router = useRouter();
  const { data: profile } = useProfile(userId);
  const myCourses = useMyCourseIds(userId);
  const archetype = archetypeIdSchema.safeParse(profile?.personality_type);

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <View className="gap-[2px] px-[4px] pt-[8px]">
            <Text className="text-[14px] text-slate500">Halo,</Text>
            <Text className="text-[26px] font-extrabold leading-[32px] text-slateInk">
              {profile?.full_name ?? '...'}
            </Text>
          </View>

          {archetype.success ? (
            <GlassCard strong className="flex-row items-center gap-[12px] p-[16px]">
              <ArchetypeArt type={archetype.data} size={92} />
              <View className="flex-1 gap-[2px]">
                <Text className="text-[12px] font-bold text-primary">
                  {ARCHETYPES[archetype.data].tagline.toUpperCase()}
                </Text>
                <Text className="text-[22px] font-bold text-slateInk">
                  {ARCHETYPES[archetype.data].name}
                </Text>
                <Text className="text-[13px] leading-[19px] text-slate500">
                  {ARCHETYPES[archetype.data].role}
                </Text>
              </View>
            </GlassCard>
          ) : null}

          {myCourses.data?.length === 0 ? (
            <Pressable onPress={() => router.push('/mata-kuliah')} accessibilityRole="button">
              <GlassCard className="gap-[2px] p-[16px]">
                <Text className="text-[14px] font-bold text-accentText">Pilih mata kuliahmu</Text>
                <Text className="text-[13px] leading-[19px] text-slate500">
                  Supaya partner belajar yang direkomendasikan lebih pas.
                </Text>
              </GlassCard>
            </Pressable>
          ) : null}

          <Text className="px-[4px] pt-[6px] text-[14px] leading-[21px] text-slate500">
            Peta zona kampus sudah bisa dicoba. Fitur Match dan Event menyusul.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}
