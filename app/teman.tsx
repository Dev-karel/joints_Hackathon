import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import type { FriendRow } from '@/features/friends/api';
import {
  useAcceptFriendRequest,
  useFriendships,
  useRemoveFriendship,
  useSendFriendRequest,
  useStudentSearch,
} from '@/features/friends/hooks';
import { archetypeName, archetypePill } from '@/features/personality/archetype';
import { usePartners } from '@/features/match/hooks';

type Person = {
  id: string;
  full_name: string;
  major: string | null;
  avatar_url: string | null;
  personality_type: string | null;
  detail: string;
};

type Filter = 'all' | 'archetype' | 'major';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'archetype', label: 'Arketipe Sama' },
  { id: 'major', label: 'Jurusan Sama' },
];

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function Avatar({ name, uri }: { name: string; uri: string | null }) {
  return (
    <View className="h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
      {uri ? (
        <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="text-[20px] font-bold text-primary">{name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant = 'solid',
  done,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'solid' | 'soft';
  done?: boolean;
  disabled?: boolean;
}) {
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`flex-row items-center justify-center gap-[4px] rounded-full px-[14px] py-[8px] ${
        solid ? 'bg-primary' : 'border border-slateBorder bg-surfaceCanvas'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {done ? <Check size={13} color={palette.ink} strokeWidth={2.5} /> : null}
      <Text className={`text-[11px] font-bold ${solid ? 'text-white' : 'text-slateInk'}`}>{label}</Text>
    </Pressable>
  );
}

function PersonCard({ person, actions }: { person: Person; actions: ReactNode }) {
  const pill = archetypePill(person.personality_type);
  const name = archetypeName(person.personality_type);
  return (
    <View className="flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder bg-white p-[14px]">
      <Avatar name={person.full_name} uri={person.avatar_url} />
      <View className="flex-1 gap-[4px]">
        <View className="flex-row flex-wrap items-center gap-[6px]">
          <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
            {person.full_name}
          </Text>
          {pill && name ? (
            <View className="rounded-full px-[9px] py-[4px]" style={{ backgroundColor: pill.bg }}>
              <Text className="text-[10px] font-bold" style={{ color: pill.text }}>
                {name}
              </Text>
            </View>
          ) : null}
        </View>
        {person.detail ? (
          <Text className="text-[11px] text-slate500" numberOfLines={2}>
            {person.detail}
          </Text>
        ) : null}
      </View>
      <View className="items-center gap-[8px]">{actions}</View>
    </View>
  );
}

// Cari teman + kelola permintaan pertemanan. Aturan (siapa boleh menyetujui, batas permintaan)
// dijaga database (RLS + trigger), bukan layar ini.
export default function TemanScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: me } = useProfile(userId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(query, 350);

  const friendships = useFriendships(userId);
  const partners = usePartners();
  const search = useStudentSearch(debounced, userId);
  const send = useSendFriendRequest(userId);
  const accept = useAcceptFriendRequest(userId);
  const remove = useRemoveFriendship(userId);

  const rows = useMemo(() => friendships.data ?? [], [friendships.data]);
  const incoming = rows.filter((r) => r.status === 'pending' && r.incoming);
  const relation = useMemo(() => new Map<string, FriendRow>(rows.map((r) => [r.other_id, r])), [rows]);

  const searching = query.trim().length >= 2;
  const source: Person[] = searching
    ? (search.data ?? []).map((s) => ({
        id: s.id,
        full_name: s.full_name,
        major: s.major,
        avatar_url: s.avatar_url,
        personality_type: s.personality_type,
        detail: [s.major, s.semester ? `Semester ${s.semester}` : null].filter(Boolean).join(' · '),
      }))
    : (partners.data ?? []).map((p) => ({
        id: p.user_id,
        full_name: p.full_name,
        major: p.major,
        avatar_url: p.avatar_url,
        personality_type: p.personality_type,
        detail: [p.major, p.shared_courses > 0 ? `${p.shared_courses} mata kuliah sama` : null]
          .filter(Boolean)
          .join(' · '),
      }));

  const list = source.filter((p) => {
    if (filter === 'archetype') return !!me?.personality_type && p.personality_type === me.personality_type;
    if (filter === 'major') return !!me?.major && p.major === me.major;
    return true;
  });

  const listPending = searching ? search.isFetching && !search.data : partners.isPending;
  const listError = searching ? search.isError : partners.isError;

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.');
    }
  };

  const actionsFor = (p: Person): ReactNode => {
    const rel = relation.get(p.id);
    if (!rel) {
      return (
        <ActionButton
          label="Tambah"
          disabled={send.isPending}
          onPress={() => void run(() => send.mutateAsync({ addresseeId: p.id }))}
        />
      );
    }
    if (rel.status === 'accepted') return <ActionButton label="Teman" variant="soft" done disabled />;
    if (rel.incoming) {
      return (
        <ActionButton
          label="Terima"
          disabled={accept.isPending}
          onPress={() => void run(() => accept.mutateAsync(p.id))}
        />
      );
    }
    return (
      <ActionButton
        label="Batalkan"
        variant="soft"
        disabled={remove.isPending}
        onPress={() => void run(() => remove.mutateAsync(p.id))}
      />
    );
  };

  return (
    <View className="flex-1 bg-surfaceCanvas">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="gap-[16px] bg-white px-[20px] pb-[16px] pt-[8px]">
          <View className="flex-row items-center gap-[10px]">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              hitSlop={10}
            >
              <ArrowLeft size={22} color={palette.slate500} />
            </Pressable>
            <Text className="text-[22px] font-extrabold text-slateInk">Cari Teman</Text>
          </View>

          <View className="flex-row items-center gap-[10px] rounded-[16px] bg-surfaceCanvas px-[16px] py-[12px]">
            <Search size={18} color={palette.slate500} />
            <TextInput
 maxFontSizeMultiplier={1.1}
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama mahasiswa..."
              placeholderTextColor={palette.slate500}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Cari nama mahasiswa"
              style={{ fontFamily: INTER.regular, paddingVertical: 0 }}
              className="flex-1 text-[13px] text-slateInk"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`rounded-full border px-[14px] py-[9px] ${
                    active ? 'border-primary bg-primary' : 'border-slateBorder bg-white'
                  }`}
                >
                  <Text className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? <FormError message={error} size={13} /> : null}

          {incoming.length > 0 ? (
            <View className="gap-[10px]">
              <Text className="text-[13px] font-bold text-slate500">Permintaan masuk</Text>
              {incoming.map((r) => (
                <PersonCard
                  key={r.other_id}
                  person={{
                    id: r.other_id,
                    full_name: r.full_name,
                    major: r.major,
                    avatar_url: r.avatar_url,
                    personality_type: r.personality_type,
                    detail: r.major ?? '',
                  }}
                  actions={
                    <>
                      <ActionButton
                        label="Terima"
                        disabled={accept.isPending}
                        onPress={() => void run(() => accept.mutateAsync(r.other_id))}
                      />
                      <ActionButton
                        label="Tolak"
                        variant="soft"
                        disabled={remove.isPending}
                        onPress={() => void run(() => remove.mutateAsync(r.other_id))}
                      />
                    </>
                  }
                />
              ))}
            </View>
          ) : null}

          <Text className="text-[13px] font-bold text-slate500">
            {searching ? 'Hasil pencarian' : 'Direkomendasikan buatmu'}
          </Text>

          {listPending ? (
            <View className="items-center py-[24px]">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : listError ? (
            <View className="gap-[10px]">
              <FormError message="Gagal memuat. Periksa internet kamu lalu coba lagi." size={13} />
              <PrimaryButton
                label="Coba lagi"
                variant="outline"
                onPress={() => void (searching ? search.refetch() : partners.refetch())}
              />
            </View>
          ) : list.length === 0 ? (
            <Text className="text-[13px] text-slate500">
              {searching
                ? 'Tidak ada mahasiswa dengan nama itu.'
                : filter === 'all'
                  ? 'Belum ada rekomendasi. Pilih mata kuliah di Profil supaya kami bisa mencarikan.'
                  : 'Belum ada yang cocok dengan filter ini.'}
            </Text>
          ) : (
            list.map((p) => <PersonCard key={p.id} person={p} actions={actionsFor(p)} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
