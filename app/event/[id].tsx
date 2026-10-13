import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarDays,
  ChevronLeft,
  Coffee,
  Dices,
  Footprints,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { goingCount } from '@/features/events/api';
import { costLabel, formatDateTime, formatRange, kindLabel } from '@/features/events/format';
import { useEvent, useRsvp } from '@/features/events/hooks';
import { useFriendships } from '@/features/friends/hooks';
import { useNow } from '@/lib/useNow';
import type { EventKind } from '@/lib/validation/event';

const KIND_ICON: Record<EventKind, LucideIcon> = {
  small_table: Coffee,
  hobby: Footprints,
  partner: Dices,
  monthly: Sparkles,
};
const HOURS_3 = 3 * 3_600_000;

function InfoRow({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: ReactNode }) {
  return (
    <View className="flex-row items-center gap-[12px]">
      <View className="h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-surfaceSky">
        <Icon size={20} color={palette.primary} />
      </View>
      <View className="flex-1 gap-px">
        <Text className="text-[14px] font-bold text-slateInk">{title}</Text>
        <Text className="text-[12px] text-slate500">{subtitle}</Text>
      </View>
    </View>
  );
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const event = useEvent(id);
  const friendships = useFriendships(userId);
  const rsvp = useRsvp(userId);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const now = useNow();

  if (event.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }
  const item = event.data;
  if (event.isError || !item || item.status !== 'published') {
    return (
      <SafeAreaView className="flex-1 bg-white px-[20px] pt-[16px]" edges={['top', 'bottom']}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          className="h-[40px] w-[40px] items-center justify-center rounded-full border border-slateBorder"
        >
          <ChevronLeft size={20} color={palette.slate500} />
        </Pressable>
        <View className="gap-[10px] pt-[24px]">
          <FormError message="Event tidak ditemukan atau belum dibuka." size={14} />
          <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void event.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const Icon = KIND_ICON[item.event_kind];
  const going = goingCount(item);
  const full = going >= item.capacity;
  const joined = item.event_rsvps.some((r) => r.user_id === userId && r.status === 'going');
  const endMs = new Date(item.ends_at ?? new Date(item.starts_at).getTime() + HOURS_3).getTime();
  const finished = now >= endMs;
  const venueName = item.venues?.name ?? 'Tempat belum diumumkan';

  const goingIds = new Set(item.event_rsvps.filter((r) => r.status === 'going').map((r) => r.user_id));
  const friendsGoing = (friendships.data ?? [])
    .filter((f) => f.status === 'accepted' && goingIds.has(f.other_id))
    .map((f) => f.full_name.split(' ')[0]);

  const run = async (goingNext: boolean) => {
    setError(null);
    try {
      await rsvp.mutateAsync({ event: item, going: goingNext });
      setConfirmLeave(false);
    } catch (e) {
      setConfirmLeave(false);
      setError(e instanceof Error ? e.message : 'Gagal menyimpan. Coba lagi.');
    }
  };

  const onShare = () => {
    void Share.share({
      message: `${item.title}\n${formatDateTime(item.starts_at)}\n${venueName}\n${costLabel(item.cost_note)}\n\nAyo ikut lewat AyokMatch!`,
    });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-accentSoft px-[20px] pb-[20px]">
          <SafeAreaView edges={['top']}>
            <View className="pt-[8px]">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Kembali"
                className="h-[40px] w-[40px] items-center justify-center rounded-[20px] bg-white"
              >
                <ChevronLeft size={20} color={palette.slate500} />
              </Pressable>
            </View>
          </SafeAreaView>
          <View className="items-center pb-[8px] pt-[4px]">
            <Icon size={64} color={palette.accentText} strokeWidth={1.6} />
          </View>
          <View className="self-start rounded-full bg-white px-[10px] py-[4px]">
            <Text className="text-[12px] font-bold text-accent800">{kindLabel(item.event_kind)}</Text>
          </View>
          <Text className="pt-[10px] text-[24px] font-extrabold leading-[28px] tracking-[-0.36px] text-slateInk">
            {item.title}
          </Text>
          <View className="flex-row items-center gap-[6px] pt-[8px]">
            <ShieldCheck size={14} color={palette.primary} />
            <Text className="text-[13px] font-semibold text-primary">Dikurasi oleh tim AyoMatch</Text>
          </View>
        </View>

        <View className="gap-[14px] px-[20px] pb-[24px] pt-[18px]">
          <InfoRow
            icon={CalendarDays}
            title={formatRange(item.starts_at, item.ends_at)}
            subtitle="Pengingat H-1 dan 3 jam sebelum acara"
          />
          <InfoRow
            icon={MapPin}
            title={venueName}
            subtitle={
              item.venues?.venue_type === 'partner' ? 'Tempat mitra terverifikasi' : 'Tempat publik'
            }
          />
          <InfoRow
            icon={Wallet}
            title={costLabel(item.cost_note)}
            subtitle="Tidak ada pembayaran di aplikasi"
          />
          <InfoRow
            icon={Users}
            title={`${going} dari ${item.capacity} orang ikut`}
            subtitle={
              friendsGoing.length > 0
                ? `${friendsGoing.length} temanmu ikut: ${friendsGoing.join(', ')}`
                : 'Belum ada temanmu yang ikut'
            }
          />
          {item.description ? (
            <Text className="text-[14px] leading-[21px] text-slateInk">{item.description}</Text>
          ) : null}

          <View className="flex-row items-start gap-[10px] rounded-[16px] border border-accent200 bg-accent50 px-[14px] py-[12px]">
            <ShieldCheck size={20} color={palette.accentText} />
            <Text className="flex-1 text-[13px] leading-[19px] text-accent800">
              Acara hanya di tempat publik atau mitra. Bagikan detail acara ke temanmu, dan laporkan
              kalau ada yang bikin tidak nyaman.
            </Text>
          </View>

          {error ? <FormError message={error} size={13} /> : null}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-slateBorder bg-white">
        <View className="flex-row items-center gap-[10px] px-[20px] pb-[12px] pt-[12px]">
          <Pressable
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Bagikan acara"
            className="h-[54px] w-[54px] items-center justify-center rounded-[28px] border-[1.5px] border-primary"
          >
            <Share2 size={22} color={palette.primary} />
          </Pressable>
          <View className="flex-1">
            {finished ? (
              joined ? (
                <PrimaryButton
                  label="Mau ketemu lagi?"
                  onPress={() =>
                    router.push({ pathname: '/event/ketemu-lagi/[id]', params: { id: item.id } })
                  }
                />
              ) : (
                <PrimaryButton label="Acara sudah selesai" disabled onPress={() => undefined} />
              )
            ) : joined ? (
              <PrimaryButton
                label="Batal ikut"
                variant="outlinePill"
                loading={rsvp.isPending}
                onPress={() => setConfirmLeave(true)}
              />
            ) : full ? (
              <PrimaryButton label="Acara penuh" disabled onPress={() => undefined} />
            ) : (
              <PrimaryButton
                label="Ikut acara ini"
                loading={rsvp.isPending}
                onPress={() => void run(true)}
              />
            )}
          </View>
        </View>
      </SafeAreaView>

      <ConfirmModal
        visible={confirmLeave}
        title="Batal ikut acara?"
        message="Tempatmu akan dibuka untuk peserta lain. Kamu bisa daftar lagi selama kuota masih ada."
        confirmLabel="Ya, batal ikut"
        cancelLabel="Tetap ikut"
        loading={rsvp.isPending}
        onConfirm={() => void run(false)}
        onCancel={() => setConfirmLeave(false)}
      />
    </View>
  );
}
