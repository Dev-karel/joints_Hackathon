import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { formatDateTime } from '@/features/events/format';
import { useFriendships } from '@/features/friends/hooks';
import { archetypeName, archetypePill } from '@/features/personality/archetype';
import { useMyActivity } from '@/features/profile/hooks';

type Tab = 'teman' | 'sesi' | 'event';
const TABS: { id: Tab; label: string }[] = [
  { id: 'teman', label: 'Teman' },
  { id: 'sesi', label: 'Sesi' },
  { id: 'event', label: 'Event' },
];

function Row({
  title,
  subtitle,
  badge,
  badgeStyle,
  leading,
  onPress,
}: {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  badgeStyle?: { bg: string; text: string } | null;
  leading?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder bg-white p-[14px]"
    >
      {leading}
      <View className="flex-1 gap-[3px]">
        <Text className="text-[14px] font-bold text-slateInk" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[12px] text-slate500" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View className="rounded-full px-[9px] py-[4px]" style={{ backgroundColor: badgeStyle?.bg ?? '#F1F5F9' }}>
          <Text className="text-[12px] font-bold" style={{ color: badgeStyle?.text ?? palette.slate500 }}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function statusLabel(status: string, startsAt: string): string | null {
  if (status === 'cancelled') return 'Dibatalkan';
  return new Date(startsAt).getTime() < Date.now() ? 'Selesai' : 'Akan datang';
}

// Daftar teman, sesi belajar, dan event yang diikuti; dibuka dari angka statistik di Profil.
export default function AktivitasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === params.tab) ? (params.tab as Tab) : 'teman');

  const friendships = useFriendships(userId);
  const activity = useMyActivity(userId);

  const friends = (friendships.data ?? []).filter((f) => f.status === 'accepted');
  const query = tab === 'teman' ? friendships : activity;

  return (
    <View className="flex-1 bg-surfaceCanvas">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="gap-[14px] bg-white px-[20px] pb-[14px] pt-[8px]">
          <View className="flex-row items-center gap-[10px]">
            <BackButton />
            <Text className="flex-1 text-[22px] font-extrabold text-slateInk">Aktivitasku</Text>
          </View>
          <View className="flex-row gap-[8px]">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`rounded-full border px-[16px] py-[9px] ${
                    active ? 'border-primary bg-primary' : 'border-slateBorder bg-white'
                  }`}
                >
                  <Text className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 12 }} showsVerticalScrollIndicator={false}>
          {query.isPending ? (
            <View className="items-center py-[24px]">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : query.isError ? (
            <View className="gap-[10px]">
              <FormError message="Gagal memuat. Periksa internet kamu lalu coba lagi." size={13} />
              <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void query.refetch()} />
            </View>
          ) : tab === 'teman' ? (
            friends.length === 0 ? (
              <Text className="text-[13px] text-slate500">Belum ada teman. Cari teman lewat menu Cari teman di Beranda.</Text>
            ) : (
              friends.map((f) => (
                <Row
                  key={f.other_id}
                  title={f.full_name}
                  subtitle={f.major}
                  badge={archetypeName(f.personality_type)}
                  badgeStyle={archetypePill(f.personality_type)}
                  leading={
                    <View className="h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
                      {f.avatar_url ? (
                        <Image source={{ uri: f.avatar_url }} className="h-full w-full" resizeMode="cover" />
                      ) : (
                        <Text className="text-[18px] font-bold text-primary">{f.full_name.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                  }
                  onPress={() => router.push({ pathname: '/profil/[id]', params: { id: f.other_id } })}
                />
              ))
            )
          ) : tab === 'sesi' ? (
            (activity.data?.sessions ?? []).length === 0 ? (
              <Text className="text-[13px] text-slate500">Belum ikut sesi belajar. Gabung lewat tab Match.</Text>
            ) : (
              activity.data!.sessions.map((s) => (
                <Row
                  key={s.id}
                  title={s.title}
                  subtitle={[formatDateTime(s.starts_at), s.place].filter(Boolean).join(' · ')}
                  badge={statusLabel(s.status, s.starts_at)}
                  onPress={() => router.push({ pathname: '/sesi/[id]', params: { id: s.id } })}
                />
              ))
            )
          ) : (activity.data?.events ?? []).length === 0 ? (
            <Text className="text-[13px] text-slate500">Belum ikut event. Lihat daftar acara di tab Event.</Text>
          ) : (
            activity.data!.events.map((e) => (
              <Row
                key={e.id}
                title={e.title}
                subtitle={[formatDateTime(e.starts_at), e.place].filter(Boolean).join(' · ')}
                badge={statusLabel(e.status, e.starts_at)}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
