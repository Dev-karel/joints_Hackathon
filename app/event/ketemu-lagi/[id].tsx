import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import {
  useEvent,
  useMyReconnectVotes,
  useReconnectCandidates,
  useSaveReconnectVotes,
} from '@/features/events/hooks';
import { archetypeName } from '@/features/personality/archetype';
import { useNow } from '@/lib/useNow';

const DAY_MS = 24 * 3_600_000;

// "Mau ketemu lagi?" (PRD §5 #12): saling pilih -> otomatis berteman (trigger di database).
// Pilihan yang tidak berbalas tidak pernah terlihat orang lain.
export default function KetemuLagiScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const event = useEvent(id);
  const candidates = useReconnectCandidates(id);
  const votes = useMyReconnectVotes(id, userId);
  const save = useSaveReconnectVotes(id, userId);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(3_600_000);

  // Isi pilihan awal dari server sekali (turunan state saat render, bukan efek).
  if (votes.data && selected === null) setSelected(new Set(votes.data));
  const chosen = selected ?? new Set<string>();

  const loading = event.isPending || candidates.isPending || votes.isPending;
  const failed = event.isError || candidates.isError || votes.isError;

  const ended = event.data
    ? new Date(event.data.ends_at ?? new Date(event.data.starts_at).getTime() + 3 * 3_600_000)
    : null;
  const daysAgo = ended ? Math.floor((now - ended.getTime()) / DAY_MS) : 0;
  const when = daysAgo <= 0 ? 'hari ini' : daysAgo === 1 ? 'kemarin' : `${daysAgo} hari lalu`;

  const toggle = (userIdToToggle: string) => {
    if (!selected) return;
    const next = new Set(selected);
    if (next.has(userIdToToggle)) next.delete(userIdToToggle);
    else next.add(userIdToToggle);
    setSelected(next);
  };

  const onSubmit = async () => {
    if (!selected) return;
    setError(null);
    try {
      await save.mutateAsync({ previous: votes.data ?? [], next: [...selected] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan pilihan. Coba lagi.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="gap-[8px] px-[20px] pb-[20px] pt-[16px]">
        <Text className="text-[13px] font-semibold text-slate500">
          {event.data?.title ?? 'Event'} · {when}
        </Text>
        <Text className="text-[28px] font-extrabold tracking-[-0.56px] text-slateInk">
          Mau ketemu lagi?
        </Text>
        <Text className="text-[14px] leading-[21px] text-slate500">
          Pilih siapa yang ingin kamu temui lagi. Kalau dia juga memilihmu, kalian otomatis
          berteman. Pilihan yang tidak berbalas tidak akan pernah terlihat.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="items-center py-[32px]">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : failed ? (
          <View className="gap-[10px]">
            <FormError
              message="Pilihan belum bisa dibuka. Pastikan acara sudah selesai dan kamu ikut."
              size={14}
            />
            <PrimaryButton
              label="Coba lagi"
              variant="outline"
              onPress={() => {
                void event.refetch();
                void candidates.refetch();
                void votes.refetch();
              }}
            />
          </View>
        ) : (candidates.data ?? []).length === 0 ? (
          <Text className="text-[14px] text-slate500">
            Belum ada peserta lain yang bisa dipilih untuk acara ini.
          </Text>
        ) : (
          <>
            {(candidates.data ?? []).map((c) => {
              const active = chosen.has(c.user_id);
              const subtitle = [c.major, archetypeName(c.personality_type)].filter(Boolean).join(' · ');
              return (
                <Pressable
                  key={c.user_id}
                  onPress={() => toggle(c.user_id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={c.full_name}
                  className={`flex-row items-center gap-[12px] rounded-[18px] border-[1.5px] py-[12px] pl-[12px] pr-[14px] ${
                    active ? 'border-[#FAC96E] bg-accentSoft' : 'border-slateBorder bg-white'
                  }`}
                >
                  <View className="h-[48px] w-[48px] items-center justify-center overflow-hidden rounded-[24px] bg-surfaceSky">
                    {c.avatar_url ? (
                      <Image source={{ uri: c.avatar_url }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <Text className="text-[18px] font-bold text-primary">
                        {c.full_name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1 gap-[2px]">
                    <Text className="text-[15px] font-bold text-slateInk" numberOfLines={1}>
                      {c.full_name}
                    </Text>
                    {subtitle ? (
                      <Text className="text-[12px] text-slate500" numberOfLines={1}>
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {active ? (
                    <View className="h-[28px] w-[28px] items-center justify-center rounded-[14px] bg-accent">
                      <Check size={16} color={palette.ink} strokeWidth={3} />
                    </View>
                  ) : (
                    <View className="h-[28px] w-[28px] rounded-[14px] border-2 border-slateBorderMuted" />
                  )}
                </Pressable>
              );
            })}
            <Text className="pt-[4px] text-[12px] text-slate500">
              {chosen.size} orang dipilih. Kamu bisa ubah pilihan sampai 3 hari setelah acara.
            </Text>
            {error ? <FormError message={error} size={13} /> : null}
          </>
        )}
      </ScrollView>

      <View className="items-center gap-[12px] px-[20px] pb-[12px] pt-[12px]">
        <PrimaryButton
          label="Kirim pilihan"
          loading={save.isPending}
          disabled={loading || failed || selected === null}
          onPress={() => void onSubmit()}
        />
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={10}>
          <Text className="text-[14px] font-semibold text-primary">Lewati</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
