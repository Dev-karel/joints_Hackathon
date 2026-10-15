import { useRouter } from 'expo-router';
import {
  CalendarDays,
  Check,
  Coffee,
  Dices,
  Footprints,
  MapPin,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { goingCount, type EventItem } from '@/features/events/api';
import {
  costLabel,
  formatDateTime,
  formatDayTime,
  isFree,
  kindLabel,
} from '@/features/events/format';
import { useRecentlyAttended, useUpcomingEvents } from '@/features/events/hooks';
import { useFriendships } from '@/features/friends/hooks';
import { useNow } from '@/lib/useNow';
import type { EventKind } from '@/lib/validation/event';

const WEEK_MS = 7 * 24 * 3_600_000;

const KIND_ICON: Record<EventKind, LucideIcon> = {
  small_table: Coffee,
  hobby: Footprints,
  partner: Dices,
  monthly: Sparkles,
};

type Filter = 'all' | 'week' | EventKind | 'free';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'week', label: 'Minggu ini' },
  { id: 'small_table', label: 'Meja Kecil' },
  { id: 'hobby', label: 'Hobi' },
  { id: 'partner', label: 'Mitra' },
  { id: 'free', label: 'Gratis' },
];

function matches(event: EventItem, filter: Filter, now: number) {
  if (filter === 'all') return true;
  if (filter === 'week') return new Date(event.starts_at).getTime() - now <= WEEK_MS;
  if (filter === 'free') return isFree(event.cost_note);
  return event.event_kind === filter;
}

function EventCard({
  event,
  joined,
  friendsGoing,
  onPress,
}: {
  event: EventItem;
  joined: boolean;
  friendsGoing: number;
  onPress: () => void;
}) {
  const Icon = KIND_ICON[event.event_kind];
  const going = goingCount(event);
  const full = going >= event.capacity;
  const venue = event.venues?.name ?? 'Tempat belum diumumkan';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      className="flex-row items-start gap-[12px] rounded-[18px] border border-slateBorder bg-white p-[14px]"
    >
      <View className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-accentSoft">
        <Icon size={22} color={palette.accentText} />
      </View>

      <View className="flex-1 gap-[3px]">
        <View className="flex-row items-center gap-[4px]">
          <Check size={12} color={palette.slate500} />
          <Text className="text-[11px] font-semibold text-slate500" numberOfLines={1}>
            {kindLabel(event.event_kind)} · {venue}
          </Text>
        </View>
        <Text className="text-[15px] font-extrabold text-slateInk">{event.title}</Text>
        <Text className="text-[12px] text-slate500">
          {formatDayTime(event.starts_at)} · {venue}
        </Text>
        <Text className="text-[12px] font-semibold text-accentText">
          {costLabel(event.cost_note)}
        </Text>
        {friendsGoing > 0 ? (
          <Text className="text-[12px] font-semibold text-primary">
            {friendsGoing} temanmu ikut
          </Text>
        ) : null}
      </View>

      <View className="items-end gap-[4px]">
        <View
          className={`rounded-[8px] border px-[8px] py-[3px] ${
            full ? 'border-dangerBorder bg-dangerSoft' : 'border-slateBorder bg-slateSurface'
          }`}
        >
          <Text className={`text-[12px] font-bold ${full ? 'text-danger' : 'text-slateInk'}`}>
            {going}/{event.capacity}
          </Text>
        </View>
        {full ? <Text className="text-[11px] font-semibold text-danger">Penuh</Text> : null}
        {joined && !full ? (
          <Text className="text-[11px] font-semibold text-primary">Terdaftar</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function EventScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const canCreate = profile?.role === 'curator' || profile?.role === 'admin';

  const events = useUpcomingEvents();
  const recent = useRecentlyAttended(userId);
  const [filter, setFilter] = useState<Filter>('all');

  const now = useNow();
  const list = useMemo(
    () => (events.data ?? []).filter((e) => matches(e, filter, now)),
    [events.data, filter, now]
  );

  // Sorotan bulan ini: acara bulanan terdekat (kalau ada); tidak diulang di daftar.
  const featured = list.find((e) => e.event_kind === 'monthly') ?? null;
  const rest = list.filter((e) => e.id !== featured?.id);
  const thisWeek = rest.filter((e) => new Date(e.starts_at).getTime() - now <= WEEK_MS);
  const later = rest.filter((e) => !thisWeek.includes(e));

  const joinedIds = new Set(
    (events.data ?? [])
      .filter((e) => e.event_rsvps.some((r) => r.user_id === userId && r.status === 'going'))
      .map((e) => e.id)
  );
  const open = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });
  // PRD §9.3: kartu event menampilkan jumlah teman yang ikut.
  const friendships = useFriendships(userId);
  const friendIds = new Set(
    (friendships.data ?? []).filter((f) => f.status === 'accepted').map((f) => f.other_id)
  );
  const friendsGoing = (e: EventItem) =>
    e.event_rsvps.filter((r) => r.status === 'going' && friendIds.has(r.user_id)).length;

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-[20px] pb-[12px] pt-[8px]">
          <Text className="text-[26px] font-extrabold tracking-[-0.52px] text-slateInk">Event</Text>
          {canCreate ? (
            <Pressable
              onPress={() => router.push('/event/buat')}
              accessibilityRole="button"
              accessibilityLabel="Buat event"
              hitSlop={{ top: 7, bottom: 7 }}
              className="flex-row items-center gap-[6px] rounded-full bg-accentSoft px-[14px] py-[8px]"
            >
              <Plus size={16} color={palette.accentText} />
              <Text className="text-[13px] font-bold text-accentText">Buat event</Text>
            </Pressable>
          ) : null}
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14, gap: 8 }}
          >
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  hitSlop={{ top: 7, bottom: 7 }}
                  className={`rounded-full px-[14px] py-[7px] ${
                    active ? 'bg-primary' : 'border border-slateBorder bg-white'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={events.isRefetching}
              onRefresh={() => void events.refetch()}
            />
          }
        >
          {(recent.data ?? []).map((e) => (
            <Pressable
              key={e.id}
              onPress={() =>
                router.push({ pathname: '/event/ketemu-lagi/[id]', params: { id: e.id } })
              }
              accessibilityRole="button"
              accessibilityLabel={`Mau ketemu lagi? ${e.title}`}
              className="gap-[2px] rounded-[18px] border border-[#FAC96E] bg-accentSoft px-[16px] py-[12px]"
            >
              <Text className="text-[14px] font-extrabold text-accent800">Mau ketemu lagi?</Text>
              <Text className="text-[12px] text-accent800" numberOfLines={1}>
                Pilih teman dari {e.title}
              </Text>
            </Pressable>
          ))}

          {events.isPending ? (
            <View className="items-center py-[32px]">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : events.isError ? (
            <View className="gap-[10px]">
              <FormError message="Gagal memuat event. Periksa internet kamu." size={14} />
              <PrimaryButton
                label="Coba lagi"
                variant="outline"
                onPress={() => void events.refetch()}
              />
            </View>
          ) : list.length === 0 ? (
            <View className="items-center gap-[8px] py-[40px]">
              <CalendarDays size={32} color={palette.slate500} />
              <Text className="text-[15px] font-bold text-slateInk">Belum ada event</Text>
              <Text className="text-center text-[13px] text-slate500">
                Event yang dikurasi tim AyoMatch akan muncul di sini.
              </Text>
            </View>
          ) : (
            <>
              {featured ? (
                <View className="gap-[8px] rounded-[24px] bg-primary px-[18px] py-[16px]">
                  <View className="self-start rounded-full bg-accentSoft px-[10px] py-[4px]">
                    <Text className="text-[11px] font-bold text-accent800">Sorotan bulan ini</Text>
                  </View>
                  <Text className="text-[21px] font-extrabold text-white">{featured.title}</Text>
                  <View className="flex-row items-center gap-[6px]">
                    <CalendarDays size={15} color={palette.skyBlob} />
                    <Text className="text-[13px] font-semibold text-skyBlob">
                      {formatDateTime(featured.starts_at)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-[6px]">
                    <MapPin size={15} color={palette.skyBlob} />
                    <Text className="flex-1 text-[13px] text-skyBlob" numberOfLines={1}>
                      {featured.venues?.name ?? 'Tempat belum diumumkan'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between pt-[6px]">
                    <Text className="text-[13px] font-semibold text-white">
                      {goingCount(featured)}/{featured.capacity} ikut ·{' '}
                      {isFree(featured.cost_note) ? 'Gratis' : featured.cost_note}
                    </Text>
                    <Pressable
                      onPress={() => open(featured.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Lihat ${featured.title}`}
                      className="rounded-full bg-white px-[16px] py-[8px]"
                    >
                      <Text className="text-[13px] font-bold text-primary">Lihat</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {thisWeek.length > 0 ? (
                <>
                  <View className="flex-row items-start justify-between pt-[4px]">
                    <Text className="text-[17px] font-extrabold text-slateInk">Minggu ini</Text>
                    <Text className="text-[13px] text-slate500">{thisWeek.length} acara</Text>
                  </View>
                  {thisWeek.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      joined={joinedIds.has(e.id)}
                      friendsGoing={friendsGoing(e)}
                      onPress={() => open(e.id)}
                    />
                  ))}
                </>
              ) : null}

              {later.length > 0 ? (
                <>
                  <View className="flex-row items-start justify-between pt-[4px]">
                    <Text className="text-[17px] font-extrabold text-slateInk">Akan datang</Text>
                    <Text className="text-[13px] text-slate500">{later.length} acara</Text>
                  </View>
                  {later.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      joined={joinedIds.has(e.id)}
                      friendsGoing={friendsGoing(e)}
                      onPress={() => open(e.id)}
                    />
                  ))}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}
