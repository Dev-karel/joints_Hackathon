import { useRouter } from 'expo-router';
import {
  CircleQuestionMark,
  CloudOff,
  Eye,
  EyeOff,
  MapPinOff,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { RankRow } from '@/components/ui/RankRow';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { TabHero } from '@/components/ui/TabHero';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { useCourses, useMyCourseIds } from '@/features/courses/hooks';
import { formatDateTime } from '@/features/events/format';
import type { PresenceMember, Zone, ZonePresence } from '@/features/map/api';
import {
  NoticeCard,
  RoomCard,
  StatusBanner,
  type RoomState,
} from '@/features/map/components/MapParts';
import { useZonePresence, useZones } from '@/features/map/hooks';
import type { StudySession } from '@/features/match/api';
import { useSessions } from '@/features/match/hooks';
import { useMapStore, type MapStatus } from '@/features/map/mapStore';
import { useSharingSwitch } from '@/features/map/useSharingSwitch';
import { useNow } from '@/lib/useNow';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';

type Filter =
  | { kind: 'all' }
  | { kind: 'archetype'; value: string }
  | { kind: 'major'; value: string }
  | { kind: 'course'; value: string };

type Notice = 'show' | 'wifi' | 'outside' | 'permission' | 'location';

const BANNER: Record<
  Exclude<MapStatus, 'idle' | 'in_zone'>,
  { icon: LucideIcon; title: string; subtitle: string }
> = {
  checking: {
    icon: Wifi,
    title: 'Memeriksa Wi-Fi...',
    subtitle: 'Mencocokkan ruanganmu',
  },
  outside: {
    icon: WifiOff,
    title: 'Tidak di Wi-Fi kampus',
    subtitle: 'Kamu tidak terlihat di peta',
  },
  'no-wifi': {
    icon: WifiOff,
    title: 'Belum tersambung Wi-Fi',
    subtitle: 'Kamu tidak terlihat di peta',
  },
  'no-permission': {
    icon: MapPinOff,
    title: 'Izin lokasi tepat belum ada',
    subtitle: 'Cuma untuk baca Wi-Fi',
  },
  'location-off': {
    icon: MapPinOff,
    title: 'Lokasi HP mati',
    subtitle: 'Nyalakan lokasi untuk baca Wi-Fi',
  },
  unavailable: {
    icon: WifiOff,
    title: 'Wi-Fi tidak terbaca',
    subtitle: 'Sambungkan ulang Wi-Fi',
  },
  offline: {
    icon: CloudOff,
    title: 'Tidak bisa menghubungi server',
    subtitle: 'Mungkin perlu login Wi-Fi dulu',
  },
};

const openIntent = (action: string) =>
  Linking.sendIntent(action).catch(() => Linking.openSettings());

const matches = (m: PresenceMember, f: Filter) =>
  f.kind === 'all' ||
  (f.kind === 'archetype' && m.personality_type === f.value) ||
  (f.kind === 'major' && m.major === f.value) ||
  (f.kind === 'course' && (m.shared_course_ids ?? []).includes(f.value));

type RoomView = {
  zone: Zone;
  p: ZonePresence | undefined;
  state: RoomState;
  amount: string;
  count: number;
  faces: PresenceMember[];
  matchCount: number;
};

// Match Map (PRD §7, §15.3). Daftar kartu ruangan per kampus. Privasi ditegakkan di database:
// tanpa tampil sendiri, get_zone_presence mengembalikan kosong; zona berisi 1 orang tanpa identitas.
export default function PetaScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const zones = useZones();
  const { status, zoneId, zoneName, confirmedAt } = useMapStore();
  const sharingSwitch = useSharingSwitch(userId, profile?.show_on_map === true);
  const sharing = sharingSwitch.value;
  const canView = sharing && status === 'in_zone';
  const presence = useZonePresence(canView);
  const courses = useCourses();
  const myCourseIds = useMyCourseIds(userId);
  const now = useNow(30_000);
  const sessions = useSessions();

  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [openZone, setOpenZone] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Notice | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const byZone = useMemo(
    () => new Map((canView ? (presence.data ?? []) : []).map((p) => [p.zone_id, p])),
    [canView, presence.data]
  );

  const archetype = archetypeIdSchema.safeParse(profile?.personality_type);
  // Chip filter: Semua, archetype-mu, jurusanmu, dan mata kuliahmu (maks. 5).
  const total = [...byZone.values()].reduce((n, p) => n + p.online_count, 0);
  const chips: { label: string; filter: Filter }[] = [
    { label: `Semua · ${total}`, filter: { kind: 'all' } },
  ];
  if (archetype.success)
    chips.push({
      label: ARCHETYPES[archetype.data].name,
      filter: { kind: 'archetype', value: archetype.data },
    });
  if (profile?.major)
    chips.push({ label: profile.major, filter: { kind: 'major', value: profile.major } });
  const names = new Map((courses.data ?? []).map((c) => [c.id, c.name]));
  for (const id of myCourseIds.data ?? [])
    if (names.has(id)) chips.push({ label: names.get(id)!, filter: { kind: 'course', value: id } });

  const groups = useMemo(() => {
    const all = zones.data ?? [];
    const view = (zone: Zone): RoomView => {
      const p = byZone.get(zone.id);
      const mine = canView && zone.id === zoneId;
      const others = (p?.members ?? []).filter((m) => m.id !== userId);
      const shown = others.filter((m) => matches(m, filter));
      // Filter hanya bisa memilah orang yang identitasnya terlihat (zona ≥ 2 orang).
      const count =
        filter.kind === 'all' ? Math.max(0, (p?.online_count ?? 0) - (mine ? 1 : 0)) : shown.length;
      const state: RoomState = !canView
        ? 'calm'
        : mine
          ? 'mine'
          : count >= 3
            ? 'busy'
            : count > 0
              ? 'calm'
              : 'empty';
      const amount = !canView
        ? '—'
        : mine
          ? count > 0
            ? `Kamu + ${count} orang`
            : 'Hanya kamu'
          : count > 0
            ? `${count} orang`
            : 'Masih kosong';
      return {
        zone,
        p,
        state,
        amount,
        count: count + (mine ? 1 : 0),
        faces: shown,
        matchCount: others.filter((m) => (m.shared_course_ids ?? []).length > 0).length,
      };
    };
    const buildings = all.filter((z) => z.level === 'building');
    const ids = new Set(buildings.map((b) => b.id));
    const sections = [
      ...buildings.map((b) => ({
        id: b.id,
        name: b.name,
        rooms: all.filter((z) => z.parent_zone_id === b.id),
      })),
      {
        id: 'other',
        name: 'Lainnya',
        rooms: all.filter((z) => z.level === 'room' && !ids.has(z.parent_zone_id ?? '')),
      },
    ]
      .filter((s) => s.rooms.length > 0)
      .map((s) => {
        const rooms = s.rooms
          .map(view)
          .sort(
            (a, b) =>
              Number(b.state === 'mine') - Number(a.state === 'mine') ||
              b.count - a.count ||
              a.zone.name.localeCompare(b.zone.name)
          );
        return {
          ...s,
          rooms,
          total: rooms.reduce((n, r) => n + r.count, 0),
          mine: rooms.some((r) => r.state === 'mine'),
        };
      });
    return sections.sort((a, b) => Number(b.mine) - Number(a.mine));
  }, [zones.data, byZone, canView, zoneId, userId, filter]);

  // Peringkat ruangan berdasarkan jumlah orang (mengikuti filter yang aktif), 5 teratas.
  const ranked = groups
    .flatMap((g) => g.rooms.map((r) => ({ ...r, building: g.name })))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || a.zone.name.localeCompare(b.zone.name))
    .slice(0, 5);

  const notice: Notice | null = !sharing
    ? 'show'
    : status === 'no-wifi'
      ? 'wifi'
      : status === 'outside'
        ? 'outside'
        : status === 'no-permission'
          ? 'permission'
          : status === 'location-off'
            ? 'location'
            : null;
  const shownNotice = notice && notice !== dismissed ? notice : null;

  const banner = !sharing
    ? { icon: EyeOff, title: 'Kamu tidak terlihat', subtitle: 'Ruanganmu tidak dikirim' }
    : status === 'in_zone'
      ? {
          icon: Wifi,
          title: `Kamu di ${zoneName ?? 'kampus'}`,
          subtitle: `Dari Wi-Fi kampus · ${minutesAgo(confirmedAt, now)}`,
        }
      : BANNER[status === 'idle' ? 'checking' : status];

  const open = groups.flatMap((g) => g.rooms).find((r) => r.zone.id === openZone) ?? null;

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <TabHero
            title="Match Map"
            right={
              <Pressable
                onPress={() => setGuideOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Panduan Match Map"
                className="min-h-[44px] flex-row items-center gap-[6px] rounded-full bg-white px-[14px]"
              >
                <CircleQuestionMark size={18} color={palette.primary} />
                <Text className="text-[13px] font-bold text-primary">Panduan</Text>
              </Pressable>
            }
          >
            <Pressable
              onPress={() => void sharingSwitch.toggle()}
              disabled={!profile || sharingSwitch.busy}
              accessibilityRole="switch"
              accessibilityState={{ checked: sharing, disabled: !profile || sharingSwitch.busy }}
              accessibilityLabel="Aku di kampus"
              className="min-h-[52px] flex-row items-center justify-between gap-[8px] rounded-[18px] bg-white px-[16px]"
            >
              <Text className="text-[15px] font-bold text-slateInk">Aku di kampus</Text>
              <View pointerEvents="none" className={sharingSwitch.busy ? 'opacity-60' : ''}>
                <Switch
                  value={sharing}
                  trackColor={{ false: palette.slateBorderMuted, true: palette.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Pressable>
          </TabHero>

          <View className="gap-[8px] px-[20px] pb-[12px]">
            <StatusBanner {...banner} active={sharing && status === 'in_zone'} />
            {sharingSwitch.message ? <FormError message={sharingSwitch.message} /> : null}
          </View>

          <View className="px-[20px] pb-[16px]">
            <SelectSheet
              label="Tampilkan"
              value={JSON.stringify(filter)}
              disabled={!canView}
              options={chips.map((c) => ({ value: JSON.stringify(c.filter), label: c.label }))}
              onChange={(key) =>
                setFilter(
                  chips.find((c) => JSON.stringify(c.filter) === key)?.filter ?? { kind: 'all' }
                )
              }
            />
          </View>

          {zones.isPending ? (
            <ActivityIndicator color={palette.primary} />
          ) : zones.isError ? (
            <View className="gap-[10px] px-[20px]">
              <FormError message="Gagal memuat daftar ruangan. Periksa internet kamu." size={14} />
              <PrimaryButton
                label="Coba lagi"
                variant="outline"
                onPress={() => void zones.refetch()}
              />
            </View>
          ) : (
            <View className="relative px-[20px]">
              {canView && presence.isError ? (
                <View className="pb-[12px]">
                  <FormError message="Gagal memperbarui yang online. Menampilkan data terakhir." />
                </View>
              ) : null}

              <View
                className={`gap-[22px] ${shownNotice ? 'opacity-40' : ''}`}
                accessibilityElementsHidden={!!shownNotice}
                importantForAccessibility={shownNotice ? 'no-hide-descendants' : 'auto'}
              >
                {canView && ranked.length > 0 ? (
                  <View className="gap-[10px]">
                    <View className="flex-row items-center justify-between gap-[8px]">
                      <Text className="text-[17px] font-extrabold text-slateInk">
                        Paling ramai sekarang
                      </Text>
                      <Legend />
                    </View>
                    {ranked.map((r, i) => (
                      <RankRow
                        key={r.zone.id}
                        title={r.zone.name}
                        subtitle={r.state === 'mine' ? `${r.building} · kamu di sini` : r.building}
                        value={r.count}
                        unit="orang"
                        dotColor={levelColor(r.count)}
                        highlight={i === 0}
                        onPress={() => setOpenZone(r.zone.id)}
                        a11yLabel={`Peringkat ${i + 1}, ${r.zone.name}, ${r.count} orang`}
                      />
                    ))}
                  </View>
                ) : null}

                {groups.map((g) => (
                  <View key={g.id} className="gap-[10px]">
                    <View className="flex-row flex-wrap items-center gap-[8px]">
                      <Text className="text-[17px] font-extrabold text-slateInk">{g.name}</Text>
                      {canView ? (
                        <Text className="text-[13px] font-semibold text-slate500">
                          · {g.total > 0 ? `${g.total} orang` : 'sepi'}
                        </Text>
                      ) : null}
                      {g.mine ? (
                        <View className="rounded-full bg-surfaceSky px-[8px] py-[2px]">
                          <Text className="text-[11px] font-bold text-primary">Gedungmu</Text>
                        </View>
                      ) : null}
                    </View>
                    {pairs(g.rooms).map((row) => (
                      <View key={row[0].zone.id} className="flex-row gap-[12px]">
                        {row.map((r) => (
                          <RoomCard
                            key={r.zone.id}
                            name={r.zone.name}
                            state={r.state}
                            amount={r.amount}
                            faces={r.faces}
                            matchCount={canView && filter.kind === 'all' ? r.matchCount : 0}
                            onPress={canView ? () => setOpenZone(r.zone.id) : undefined}
                            a11yLabel={canView ? `${r.zone.name}, ${r.amount}` : r.zone.name}
                          />
                        ))}
                        {row.length === 1 ? <View className="flex-1" /> : null}
                      </View>
                    ))}
                  </View>
                ))}
                <Text className="text-[12px] leading-[18px] text-slate500">
                  Bisa terbaca sebagai ruangan sebelah. Hilang sendiri 15 menit setelah aplikasi
                  ditutup.
                </Text>
              </View>

              {shownNotice ? (
                <View className="absolute left-[32px] right-[32px] top-[24px]">
                  <MapNotice
                    kind={shownNotice}
                    busy={sharingSwitch.busy}
                    permissionError={!!sharingSwitch.message}
                    onShow={() => void sharingSwitch.toggle(true)}
                    onLater={() => setDismissed(shownNotice)}
                  />
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomSheet visible={guideOpen} onClose={() => setGuideOpen(false)}>
        <Text className="w-full text-[20px] font-extrabold text-slateInk">
          Cara kerja Match Map
        </Text>
        {[
          [
            'Wi-Fi → nama ruangan',
            'Ruanganmu dikenali dari access point Wi-Fi kampus yang tersambung.',
          ],
          ['Tanpa GPS', 'Posisimu tidak dibaca. Yang terlihat cuma nama ruangan.'],
          [
            'Timbal balik',
            'Kamu baru bisa melihat orang lain kalau kamu juga menyalakan "Aku di kampus".',
          ],
          ['Hilang 15 menit', 'Tutup aplikasi atau matikan saklar, kamu hilang sendiri dari peta.'],
          [
            'Satu orang = anonim',
            'Ruangan berisi satu orang hanya menampilkan jumlah, tanpa nama.',
          ],
        ].map(([t, d]) => (
          <View
            key={t}
            className="w-full gap-[2px] rounded-[14px] bg-surfaceSky px-[14px] py-[10px]"
          >
            <Text className="text-[14px] font-bold text-slateInk">{t}</Text>
            <Text className="text-[13px] leading-[19px] text-slate500">{d}</Text>
          </View>
        ))}
      </BottomSheet>

      <BottomSheet visible={!!open} onClose={() => setOpenZone(null)}>
        {open ? (
          <RoomDetail
            room={open}
            userId={userId}
            sessions={(sessions.data ?? []).filter((s) => s.zone_id === open.zone.id)}
            onSession={(id) => {
              setOpenZone(null);
              router.push({ pathname: '/sesi/[id]', params: { id } });
            }}
            onPerson={(id) => {
              setOpenZone(null);
              router.push({ pathname: '/profil/[id]', params: { id } });
            }}
          />
        ) : null}
      </BottomSheet>
    </GlassBackground>
  );
}

// Tingkat keramaian, sama dengan warna kartu ruangan: sepi abu, tenang biru muda, ramai biru.
const levelColor = (count: number) =>
  count >= 3 ? palette.primary : count > 0 ? palette.skyBlob : palette.slateBorderMuted;

function Legend() {
  return (
    <View
      className="flex-row items-center gap-[6px]"
      accessibilityLabel="Skala: sepi, tenang, ramai"
    >
      <Text className="text-[12px] text-slate500">Sepi</Text>
      <View className="h-[8px] w-[60px] flex-row overflow-hidden rounded-full">
        <View className="flex-1" style={{ backgroundColor: palette.slateBorderMuted }} />
        <View className="flex-1" style={{ backgroundColor: palette.skyBlob }} />
        <View className="flex-1" style={{ backgroundColor: palette.primary }} />
      </View>
      <Text className="text-[12px] text-slate500">Ramai</Text>
    </View>
  );
}

function minutesAgo(at: number | null, now: number) {
  if (!at) return 'baru saja';
  const m = Math.floor((now - at) / 60_000);
  return m < 1 ? 'baru saja' : `${m} mnt lalu`;
}

function pairs<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 2) out.push(items.slice(i, i + 2));
  return out;
}

function MapNotice({
  kind,
  busy,
  permissionError,
  onShow,
  onLater,
}: {
  kind: Notice;
  busy: boolean;
  permissionError: boolean;
  onShow: () => void;
  onLater: () => void;
}) {
  const later = (
    <Pressable
      onPress={onLater}
      accessibilityRole="button"
      hitSlop={8}
      className="min-h-[44px] justify-center"
    >
      <Text className="text-[14px] font-semibold text-primary">Nanti saja</Text>
    </Pressable>
  );

  if (kind === 'show')
    return (
      <NoticeCard
        icon={Eye}
        title="Nyalakan dulu buat lihat teman"
        body="Orang lain cuma lihat nama ruanganmu, bukan posisimu."
      >
        <PrimaryButton label="Nyalakan sekarang" onPress={onShow} loading={busy} size="sm" />
        {permissionError ? (
          <Pressable
            onPress={() => void Linking.openSettings()}
            accessibilityRole="button"
            className="min-h-[44px] justify-center"
          >
            <Text className="text-[14px] font-semibold text-primary">Buka pengaturan izin</Text>
          </Pressable>
        ) : (
          later
        )}
      </NoticeCard>
    );

  if (kind === 'permission')
    return (
      <NoticeCard
        icon={MapPinOff}
        title="Izinkan lokasi tepat"
        body="Izin ini cuma untuk membaca Wi-Fi. GPS-mu tidak dipakai."
      >
        <PrimaryButton
          label="Buka pengaturan izin"
          onPress={() => void Linking.openSettings()}
          size="sm"
        />
        {later}
      </NoticeCard>
    );

  if (kind === 'location')
    return (
      <NoticeCard
        icon={MapPinOff}
        title="Nyalakan lokasi HP"
        body="Android butuh lokasi menyala untuk membaca Wi-Fi. GPS-mu tidak dipakai."
      >
        <PrimaryButton
          label="Buka pengaturan lokasi"
          onPress={() => void openIntent('android.settings.LOCATION_SOURCE_SETTINGS')}
          size="sm"
        />
        {later}
      </NoticeCard>
    );

  return (
    <NoticeCard
      icon={Wifi}
      title="Sambung ke Wi-Fi kampus"
      body={
        kind === 'outside'
          ? 'Wi-Fi ini belum terdaftar sebagai Wi-Fi kampus.'
          : 'Ruanganmu dikenali dari Wi-Fi, tanpa GPS.'
      }
    >
      <PrimaryButton
        label="Buka pengaturan Wi-Fi"
        onPress={() => void openIntent('android.settings.WIFI_SETTINGS')}
        size="sm"
      />
      {later}
    </NoticeCard>
  );
}

function RoomDetail({
  room,
  userId,
  sessions,
  onPerson,
  onSession,
}: {
  room: RoomView;
  userId: string | undefined;
  sessions: StudySession[];
  onPerson: (id: string) => void;
  onSession: (id: string) => void;
}) {
  const total = room.p?.online_count ?? 0;
  const members = room.p?.members ?? [];
  return (
    <View className="w-full gap-[12px]">
      <View className="gap-[2px]">
        <Text className="text-[20px] font-extrabold text-slateInk">{room.zone.name}</Text>
        <Text className="text-[13px] text-slate500">
          {total > 0 ? `${total} orang online` : 'Sepi'}
        </Text>
      </View>
      {total === 0 ? (
        <Text className="text-[14px] leading-[21px] text-slate500">
          Belum ada yang online di sini.
        </Text>
      ) : members.length === 0 ? (
        <Text className="text-[14px] leading-[21px] text-slate500">
          {room.state === 'mine'
            ? 'Hanya kamu di ruangan ini.'
            : 'Cuma satu orang, jadi namanya disembunyikan.'}
        </Text>
      ) : (
        members.map((m) => {
          const me = m.id === userId;
          const type = archetypeIdSchema.safeParse(m.personality_type);
          const shared = (m.shared_course_ids ?? []).length;
          const sub = [type.success ? ARCHETYPES[type.data].name : null, m.major]
            .filter(Boolean)
            .join(' · ');
          return (
            <Pressable
              key={m.id}
              onPress={me ? undefined : () => onPerson(m.id)}
              disabled={me}
              accessibilityRole={me ? 'text' : 'button'}
              accessibilityLabel={me ? 'Kamu' : `${m.full_name}, buka profil`}
              className="min-h-[56px] flex-row items-center gap-[12px] rounded-[16px] border border-slateBorder px-[14px] py-[10px]"
            >
              <View className="flex-1 gap-[2px]">
                <Text className="text-[15px] font-bold text-slateInk">
                  {me ? `${m.full_name} (kamu)` : m.full_name}
                </Text>
                {sub ? <Text className="text-[12px] text-slate500">{sub}</Text> : null}
              </View>
              {!me && shared > 0 ? (
                <View className="rounded-full bg-accentSoft px-[8px] py-[3px]">
                  <Text className="text-[11px] font-bold text-accentText">
                    {shared} mata kuliah sama
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })
      )}

      {/* PRD §8: sesi yang tempatnya di ruangan ini ikut tampil di lembar ruangan. */}
      {sessions.length > 0 ? (
        <View className="gap-[8px] pt-[6px]">
          <Text className="text-[15px] font-bold text-slateInk">Sesi belajar di sini</Text>
          {sessions.map((s) => {
            const when = formatDateTime(s.starts_at);
            const count = s.study_session_members.length;
            return (
              <Pressable
                key={s.id}
                onPress={() => onSession(s.id)}
                accessibilityRole="button"
                accessibilityLabel={`${s.title}, ${when}, buka sesi`}
                className="min-h-[56px] gap-[2px] rounded-[16px] bg-surfaceSky px-[14px] py-[10px]"
              >
                <Text className="text-[14px] font-bold text-slateInk">{s.title}</Text>
                <Text className="text-[12px] text-slate500">
                  {when} · {count >= s.capacity ? 'Penuh' : `${count}/${s.capacity} peserta`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
