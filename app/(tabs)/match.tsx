import { useRouter } from 'expo-router';
import {
  Atom,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Languages,
  MapPin,
  Plus,
  Search,
  Sigma,
  SlidersHorizontal,
  Trophy,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { RankRow } from '@/components/ui/RankRow';
import { SelectSheet } from '@/components/ui/SelectSheet';
import { TabHero } from '@/components/ui/TabHero';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { formatTime } from '@/features/events/format';
import { useFriendships } from '@/features/friends/hooks';
import type { TeamOpening } from '@/features/lomba/api';
import { useOpenings } from '@/features/lomba/hooks';
import type { StudySession } from '@/features/match/api';
import { usePartners, useProfiles, useSessions } from '@/features/match/hooks';
import { archetypeName } from '@/features/personality/archetype';
import { useNow } from '@/lib/useNow';
import { COMPETITION_CATEGORIES } from '@/lib/validation/competition';
import { SESSION_KINDS } from '@/lib/validation/studySession';

const DAY_MS = 24 * 3_600_000;
const DAYS_UPPER = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Ikon mata kuliah: tebakan dari nama; cadangannya buku.
function subjectIcon(courseName: string | undefined): LucideIcon {
  const n = (courseName ?? '').toLowerCase();
  if (/(kalkulus|matematika|aljabar|statistik|diskrit)/.test(n)) return Sigma;
  if (/(fisika|kimia)/.test(n)) return Atom;
  if (/(inggris|bahasa)/.test(n)) return Languages;
  if (/(algoritma|program|struktur|basis data|oop|web|jaringan|sistem)/.test(n)) return Code2;
  return BookOpen;
}

export default function MatchScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'belajar' | 'lomba'>('belajar');
  const [query, setQuery] = useState('');

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <TabHero title="Match">
          {/* Belajar / Lomba sebagai pilihan bersegmen di dalam blok biru */}
          <View className="flex-row rounded-full bg-primaryDeep p-[4px]">
            {(['belajar', 'lomba'] as const).map((t) => {
              const active = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  className={`min-h-[44px] flex-1 items-center justify-center rounded-full ${
                    active ? 'bg-white' : ''
                  }`}
                >
                  <Text
                    className={`text-[15px] font-bold ${active ? 'text-primary' : 'text-white'}`}
                  >
                    {t === 'belajar' ? 'Belajar' : 'Lomba'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View className="min-h-[48px] flex-row items-center gap-[10px] rounded-[18px] bg-white px-[14px]">
            <Search size={18} color={palette.primary} />
            <TextInput
              maxFontSizeMultiplier={1.3}
              value={query}
              onChangeText={setQuery}
              placeholder="Cari sesi, mata kuliah, atau lomba"
              placeholderTextColor={palette.slate500}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Cari sesi, mata kuliah, atau lomba"
              style={{ fontFamily: INTER.regular, paddingVertical: 0 }}
              className="flex-1 text-[14px] text-slateInk"
            />
          </View>
        </TabHero>

        {tab === 'belajar' ? <BelajarTab query={query} /> : <LombaTab query={query} />}

        <Pressable
          onPress={() => router.push({ pathname: '/buat-sesi', params: { tipe: tab } })}
          accessibilityRole="button"
          accessibilityLabel={tab === 'belajar' ? 'Buat sesi' : 'Buka lowongan tim'}
          // Posisi lewat style (bukan kelas): di Android kelas "absolute bottom-/right-" tidak
          // terbaca dan tombol menempel di pojok kiri atas, menimpa status bar.
          className="flex-row items-center gap-[6px] rounded-full bg-primary py-[13px] pl-[16px] pr-[18px]"
          style={{ position: 'absolute', right: 20, bottom: 16, elevation: 6 } as any}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text className="text-[14px] font-bold text-white">
            {tab === 'belajar' ? 'Buat sesi' : 'Buka lowongan tim'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </GlassBackground>
  );
}

function GroupHeader({
  title,
  count,
  unit,
  tone = 'plain',
  collapsed,
  onToggle,
}: {
  title: string;
  count: number;
  unit: string;
  tone?: 'plain' | 'warm';
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const Chevron = collapsed ? ChevronUp : ChevronDown;
  return (
    <Pressable
      onPress={onToggle}
      disabled={!onToggle}
      accessibilityRole={onToggle ? 'button' : undefined}
      className={`flex-row items-center gap-[8px] px-[20px] py-[10px] ${
        tone === 'warm' ? 'bg-accent50' : 'bg-slate100'
      }`}
    >
      <Text
        className={`text-[16px] font-extrabold ${tone === 'warm' ? 'text-accent800' : 'text-slateInk'}`}
      >
        {title}
      </Text>
      <Text className="flex-1 text-[13px] text-slate500">
        · {count} {unit}
      </Text>
      {onToggle ? <Chevron size={20} color={palette.slate500} /> : null}
    </Pressable>
  );
}

function CapacityBadge({ current, max }: { current: number; max: number }) {
  const full = current >= max;
  return (
    <View
      className={`rounded-[8px] border px-[8px] py-[3px] ${
        full ? 'border-dangerBorder bg-dangerSoft' : 'border-slateBorder bg-slateSurface'
      }`}
    >
      <Text className={`text-[12px] font-bold ${full ? 'text-danger' : 'text-slateInk'}`}>
        {current}/{max}
      </Text>
    </View>
  );
}

// ───────────────────────── Avatar partner ─────────────────────────

function PartnerAvatar({ name, uri }: { name: string; uri: string | null }) {
  return (
    <View className="size-[44px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
      {uri ? (
        <Image
          source={{ uri }}
          className="h-full w-full"
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text className="text-[17px] font-extrabold text-primary">
          {name.trim().charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

// ───────────────────────── Belajar ─────────────────────────

function BelajarTab({ query }: { query: string }) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const sessions = useSessions();
  const partners = usePartners();
  const friendships = useFriendships(userId);
  const now = useNow();
  const [dayIndex, setDayIndex] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [courseFilter, setCourseFilter] = useState<string>('Semua');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAllPartners, setShowAllPartners] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(now + i * DAY_MS)),
    // Hari berganti tiap tengah malam; now diperbarui tiap menit sudah cukup.
    [now]
  );

  const hostIds = (sessions.data ?? []).map((s) => s.host_id).filter((id): id is string => !!id);
  const hosts = useProfiles(hostIds);
  const hostName = (id: string | null) =>
    id ? (hosts.data?.find((h) => h.id === id)?.full_name ?? '...') : null;

  const friendIds = useMemo(
    () =>
      new Set(
        (friendships.data ?? []).filter((f) => f.status === 'accepted').map((f) => f.other_id)
      ),
    [friendships.data]
  );

  const q = query.trim().toLowerCase();
  const matchesQuery = (s: StudySession) =>
    q === '' ||
    s.title.toLowerCase().includes(q) ||
    (s.courses?.name ?? '').toLowerCase().includes(q) ||
    (s.campus_zones?.name ?? '').toLowerCase().includes(q) ||
    (hostName(s.host_id) ?? '').toLowerCase().includes(q);

  const matchesCourseFilter = (s: StudySession) =>
    courseFilter === 'Semua' || s.courses?.name === courseFilter;

  const all = useMemo(() => sessions.data ?? [], [sessions.data]);
  const countOn = (d: Date) =>
    all.filter((s) => sameDay(new Date(s.starts_at), d) && matchesCourseFilter(s)).length;
  // Saat mencari, tampilkan semua hari supaya hasilnya tidak tersembunyi di hari lain.
  const visible = all.filter(
    (s) =>
      matchesQuery(s) &&
      matchesCourseFilter(s) &&
      (q !== '' || sameDay(new Date(s.starts_at), days[dayIndex]))
  );

  // Get unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = new Set<string>();
    all.forEach((s) => {
      if (s.courses?.name) courses.add(s.courses.name);
    });
    return ['Semua', ...Array.from(courses).sort()];
  }, [all]);

  const groups = useMemo(() => {
    const byHour = new Map<string, StudySession[]>();
    for (const s of visible) {
      const key =
        q !== ''
          ? `${DAYS_UPPER[new Date(s.starts_at).getDay()]} ${formatTime(s.starts_at)}`
          : formatTime(s.starts_at);
      byHour.set(key, [...(byHour.get(key) ?? []), s]);
    }
    return [...byHour.entries()];
  }, [visible, q]);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        // Partner ikut menggulir; hanya strip hari dan filter yang menempel di atas.
        stickyHeaderIndices={query ? [0] : [1]}
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={sessions.isRefetching}
            onRefresh={() => void sessions.refetch()}
          />
        }
      >
        {/* Rekomendasi Partner Belajar */}
        {!query && (
          <View className="border-b border-slateBorder bg-surfaceCanvas">
            <View className="gap-[6px] px-[20px] pb-[10px] pt-[14px]">
              <Text className="text-[17px] font-extrabold text-slateInk">Partner terbaik</Text>
              {/* Transparansi skor (METHODOLOGY §15): menjawab "skornya dari mana?". */}
              <Text className="text-[12px] leading-[18px] text-slate500">
                Skor dari 100 = mata kuliah sama (60, berbobot SKS) + archetype (20 sama, 10 beda) +
                jurusan sama (10) + sesi bersama (10).
              </Text>
            </View>
            {partners.isPending ? (
              <View className="items-center py-[16px]">
                <ActivityIndicator size="small" color={palette.primary} />
              </View>
            ) : partners.isError ? (
              <View className="gap-[10px] px-[20px] pb-[14px]">
                <FormError message="Gagal memuat rekomendasi. Periksa internet kamu." size={13} />
                <PrimaryButton
                  label="Coba lagi"
                  variant="outline"
                  onPress={() => void partners.refetch()}
                />
              </View>
            ) : (partners.data ?? []).length === 0 ? (
              <View className="px-[20px] pb-[14px]">
                <Text className="text-[13px] text-slate500">
                  Belum ada rekomendasi. Lengkapi mata kuliahmu dulu.
                </Text>
              </View>
            ) : (
              <View className="gap-[8px] px-[20px] pb-[14px]">
                {(partners.data ?? []).slice(0, showAllPartners ? 10 : 3).map((p, i) => (
                  <RankRow
                    key={p.user_id}
                    title={p.full_name}
                    subtitle={[
                      archetypeName(p.personality_type),
                      `${p.shared_courses} mata kuliah sama`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    value={Math.max(0, Math.min(100, Math.round(p.score)))}
                    unit="dari 100"
                    highlight={i === 0}
                    leading={<PartnerAvatar name={p.full_name} uri={p.avatar_url} />}
                    onPress={() =>
                      router.push({ pathname: '/profil/[id]', params: { id: p.user_id } })
                    }
                    a11yLabel={`Peringkat ${i + 1}, ${p.full_name}, skor ${Math.round(p.score)} dari 100`}
                  />
                ))}
                {(partners.data ?? []).length > 3 ? (
                  <Pressable
                    onPress={() => setShowAllPartners((v) => !v)}
                    accessibilityRole="button"
                    className="min-h-[44px] items-center justify-center"
                  >
                    <Text className="text-[14px] font-semibold text-primary">
                      {showAllPartners
                        ? 'Tampilkan lebih sedikit'
                        : `Lihat ${Math.min(10, partners.data!.length) - 3} lainnya`}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        )}
        <View className="bg-surfaceCanvas">
          <View className="flex-row items-center border-b border-slateBorder bg-slateSurface">
            {uniqueCourses.length > 1 && !query ? (
              <Pressable
                onPress={() => setFilterOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={
                  courseFilter === 'Semua'
                    ? 'Filter mata kuliah'
                    : `Filter mata kuliah: ${courseFilter}`
                }
                style={{ width: 50, height: 56, borderRadius: 14, marginLeft: 20 }}
                className={`items-center justify-center ${
                  courseFilter === 'Semua' ? 'border border-slateBorder bg-white' : 'bg-primary'
                }`}
              >
                <SlidersHorizontal
                  size={20}
                  color={courseFilter === 'Semua' ? palette.slateInk : '#FFFFFF'}
                />
              </Pressable>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingLeft: uniqueCourses.length > 1 && !query ? 8 : 20,
                paddingVertical: 12,
                gap: 8,
              }}
            >
              {days.map((d, i) => {
                const active = i === dayIndex;
                const empty = countOn(d) === 0;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setDayIndex(i)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    // Ukuran lewat style supaya chip tidak menyusut jadi pil sempit.
                    style={{ width: 50, height: 56, borderRadius: 14, flexShrink: 0 }}
                    className={`items-center justify-center ${
                      active ? 'bg-primary' : 'border border-slateBorder bg-white'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-bold ${
                        active ? 'text-white' : empty ? 'text-slate500' : 'text-slateInk'
                      }`}
                    >
                      {DAYS_UPPER[d.getDay()]}
                    </Text>
                    <Text
                      className={`text-[17px] font-extrabold ${
                        active ? 'text-white' : empty ? 'text-slate500' : 'text-slateInk'
                      }`}
                    >
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
        {sessions.isPending ? (
          <View className="items-center py-[32px]">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : sessions.isError ? (
          <View className="gap-[10px] px-[20px] pt-[16px]">
            <FormError message="Gagal memuat sesi. Periksa internet kamu." size={14} />
            <PrimaryButton
              label="Coba lagi"
              variant="outline"
              onPress={() => void sessions.refetch()}
            />
          </View>
        ) : groups.length === 0 ? (
          <View className="items-center gap-[6px] px-[20px] py-[40px]">
            <Text className="text-[15px] font-bold text-slateInk">
              {q !== '' ? 'Tidak ada sesi yang cocok' : 'Belum ada sesi di hari ini'}
            </Text>
            <Text className="text-center text-[13px] text-slate500">
              {q !== '' ? 'Coba kata kunci lain.' : 'Jadilah yang pertama membuat sesi belajar.'}
            </Text>
          </View>
        ) : (
          groups.map(([key, items]) => (
            <View key={key}>
              <GroupHeader
                title={key}
                count={items.length}
                unit="sesi"
                collapsed={collapsed.has(key)}
                onToggle={() => toggle(key)}
              />
              {collapsed.has(key)
                ? null
                : items.map((s) => {
                    const Icon = subjectIcon(s.courses?.name);
                    const count = s.study_session_members.length;
                    const full = count >= s.capacity;
                    const friendsIn = s.study_session_members.filter((m) =>
                      friendIds.has(m.user_id)
                    ).length;
                    const host = hostName(s.host_id);
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() =>
                          router.push({ pathname: '/sesi/[id]', params: { id: s.id } })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={s.title}
                        className="flex-row items-start gap-[12px] border-b border-slateBorder px-[20px] py-[14px]"
                      >
                        <View className="h-[36px] w-[36px] items-center justify-center rounded-[18px] bg-surfaceSky">
                          <Icon size={18} color={palette.primary} />
                        </View>
                        <View className="flex-1 gap-[3px]">
                          <Text
                            className="text-[11px] font-semibold text-slate500"
                            numberOfLines={1}
                          >
                            {host ? `oleh ${host}` : 'Tanpa host'}
                          </Text>
                          <Text className="text-[15px] font-extrabold text-slateInk">
                            {s.title}
                          </Text>
                          <View className="flex-row items-center gap-[8px] pt-[3px]">
                            <View className="rounded-[6px] bg-slate100 px-[8px] py-[3px]">
                              <Text className="text-[11px] font-semibold text-slateInk">
                                {SESSION_KINDS[s.session_kind]}
                              </Text>
                            </View>
                            <MapPin size={14} color={palette.slate500} />
                            <Text className="flex-1 text-[12px] text-slate500" numberOfLines={1}>
                              {s.campus_zones?.name ?? 'Zona'}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end gap-[4px]">
                          <CapacityBadge current={count} max={s.capacity} />
                          {full ? (
                            <Text className="text-[11px] font-semibold text-danger">Penuh</Text>
                          ) : friendsIn > 0 ? (
                            <Text className="text-[11px] font-semibold text-accentText">
                              {friendsIn} temanmu ikut
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Filter mata kuliah: satu tombol di strip hari, pilihan di lembar bawah. */}
      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)}>
        <Text className="w-full text-[20px] font-extrabold text-slateInk">Filter mata kuliah</Text>
        <View className="w-full gap-[8px]">
          {uniqueCourses.map((course) => {
            const active = course === courseFilter;
            return (
              <Pressable
                key={course}
                onPress={() => {
                  setCourseFilter(course);
                  setFilterOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`min-h-[52px] flex-row items-center justify-between rounded-[14px] border px-[14px] ${
                  active ? 'border-primary bg-surfaceSky' : 'border-slateBorder bg-white'
                }`}
              >
                <Text className="flex-1 text-[15px] font-semibold text-slateInk">
                  {course === 'Semua' ? 'Semua mata kuliah' : course}
                </Text>
                {active ? <Check size={18} color={palette.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

// ───────────────────────── Lomba ─────────────────────────

const WEEK_MS = 7 * DAY_MS;

function LombaTab({ query }: { query: string }) {
  const router = useRouter();
  const openings = useOpenings();
  const now = useNow();
  const [category, setCategory] = useState<string>('Semua');
  const q = query.trim().toLowerCase();

  const ownerIds = (openings.data ?? []).map((o) => o.host_id);
  const owners = useProfiles(ownerIds);
  const ownerName = (id: string) => owners.data?.find((o) => o.id === id)?.full_name ?? '...';

  const list = (openings.data ?? []).filter(
    (o) =>
      (category === 'Semua' || o.category === category) &&
      (q === '' ||
        o.competition_name.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.roles_needed.some((r) => r.toLowerCase().includes(q)))
  );
  const soon = list.filter((o) => new Date(o.registration_deadline).getTime() - now <= WEEK_MS);
  const later = list.filter((o) => !soon.includes(o));

  const Row = ({ o }: { o: TeamOpening }) => {
    const need = o.team_size - o.current_members;
    const d = new Date(o.registration_deadline);
    return (
      <Pressable
        onPress={() => router.push(`/lomba/${o.id}` as any)}
        accessibilityRole="button"
        accessibilityLabel={o.competition_name}
        className="flex-row items-start gap-[12px] border-b border-slateBorder px-[20px] py-[14px]"
      >
        <View className="h-[36px] w-[36px] items-center justify-center rounded-[18px] bg-accentSoft">
          <Trophy size={18} color={palette.accentText} />
        </View>
        <View className="flex-1 gap-[3px]">
          <Text className="text-[11px] font-semibold text-slate500" numberOfLines={1}>
            {ownerName(o.host_id)} · cari anggota
          </Text>
          <Text className="text-[15px] font-extrabold text-slateInk">{o.competition_name}</Text>
          <View className="flex-row flex-wrap items-center gap-[8px] pt-[3px]">
            <View className="rounded-[6px] bg-accent px-[8px] py-[3px]">
              <Text className="text-[11px] font-semibold text-slateInk">{o.category}</Text>
            </View>
            {o.roles_needed.length > 0 ? (
              <>
                <User size={14} color={palette.slate500} />
                <Text className="flex-1 text-[12px] text-slate500" numberOfLines={1}>
                  Butuh: {o.roles_needed.join(', ')}
                </Text>
              </>
            ) : (
              <Text className="text-[12px] text-slate500">
                Daftar s/d {d.getDate()} {MONTHS[d.getMonth()]}
              </Text>
            )}
          </View>
          {o.roles_needed.length > 0 ? (
            <Text className="text-[12px] text-slate500">
              Daftar s/d {d.getDate()} {MONTHS[d.getMonth()]}
            </Text>
          ) : null}
        </View>
        <View className="items-end gap-[4px]">
          <CapacityBadge current={o.current_members} max={o.team_size} />
          <Text className="text-[11px] text-slate500">butuh {need}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1">
      <View className="border-b border-slateBorder bg-slateSurface px-[20px] py-[12px]">
        <SelectSheet
          label="Kategori"
          value={category}
          options={['Semua', ...COMPETITION_CATEGORIES.filter((c) => c !== 'Lainnya')].map((c) => ({
            value: c,
            label: c,
          }))}
          onChange={setCategory}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={openings.isRefetching}
            onRefresh={() => void openings.refetch()}
          />
        }
      >
        {openings.isPending ? (
          <View className="items-center py-[32px]">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : openings.isError ? (
          <View className="gap-[10px] px-[20px] pt-[16px]">
            <FormError message="Gagal memuat lomba. Periksa internet kamu." size={14} />
            <PrimaryButton
              label="Coba lagi"
              variant="outline"
              onPress={() => void openings.refetch()}
            />
          </View>
        ) : list.length === 0 ? (
          <View className="items-center gap-[6px] px-[20px] py-[40px]">
            <Text className="text-[15px] font-bold text-slateInk">Belum ada lowongan tim</Text>
            <Text className="text-center text-[13px] text-slate500">
              Punya tim yang butuh anggota? Tekan tombol Buka lowongan tim.
            </Text>
          </View>
        ) : (
          <>
            {soon.length > 0 ? (
              <>
                <GroupHeader title="Tutup minggu ini" count={soon.length} unit="tim" tone="warm" />
                {soon.map((o) => (
                  <Row key={o.id} o={o} />
                ))}
              </>
            ) : null}
            {later.length > 0 ? (
              <>
                <GroupHeader title="Setelahnya" count={later.length} unit="tim" />
                {later.map((o) => (
                  <Row key={o.id} o={o} />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
