import { useRouter } from 'expo-router';
import { ChevronRight, Mail, Search, SquarePen, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import type { Conversation } from '@/features/chat/api';
import { listTime } from '@/features/chat/format';
import { useConversations, useStartDirect } from '@/features/chat/hooks';
import { useFriendships } from '@/features/friends/hooks';
import { useNow } from '@/lib/useNow';

type Filter = 'all' | 'unread' | 'session' | 'direct';

function Avatar({ c }: { c: Conversation }) {
  if (c.kind === 'session') {
    return (
      <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-surfaceSky">
        <Users size={24} color={palette.primary} />
      </View>
    );
  }
  return (
    <View className="h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
      {c.other_avatar ? (
        <Image source={{ uri: c.other_avatar }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="text-[20px] font-extrabold text-primary">
          {(c.title ?? '?').charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

// Daftar Pesan (Figma: Pesan - Daftar). Chat langsung hanya dengan teman; grup chat dibuat
// otomatis untuk tiap sesi belajar. Lomba dan Event belum punya grup chat.
export default function PesanScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const conversations = useConversations();
  const friendships = useFriendships(userId);
  const startDirect = useStartDirect();
  const now = useNow();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Percakapan langsung yang belum pernah berisi pesan tidak ditampilkan.
  const all = (conversations.data ?? []).filter((c) => c.kind === 'session' || c.last_content !== null);
  const unreadChats = all.filter((c) => c.unread > 0).length;
  const q = query.trim().toLowerCase();
  const list = all.filter(
    (c) =>
      (filter === 'all' ||
        (filter === 'unread' && c.unread > 0) ||
        (filter === 'session' && c.kind === 'session') ||
        (filter === 'direct' && c.kind === 'direct')) &&
      (q === '' ||
        (c.title ?? '').toLowerCase().includes(q) ||
        (c.last_content ?? '').toLowerCase().includes(q))
  );

  const friends = (friendships.data ?? []).filter((f) => f.status === 'accepted');
  const incoming = (friendships.data ?? []).filter((f) => f.status === 'pending' && f.incoming);

  const open = (id: string) => router.push({ pathname: '/pesan/[id]', params: { id } });

  const startWith = async (friendId: string) => {
    setError(null);
    try {
      const id = await startDirect.mutateAsync(friendId);
      setPickerOpen(false);
      open(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuka percakapan.');
    }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'unread', label: `Belum dibaca${unreadChats > 0 ? ` · ${unreadChats}` : ''}` },
    { id: 'session', label: 'Sesi' },
    { id: 'direct', label: 'Teman' },
  ];

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-[10px] py-[8px] pl-[12px] pr-[16px]">
          <BackButton />
          <Text className="flex-1 text-[22px] font-extrabold text-slateInk">Pesan</Text>
          <Pressable
            onPress={() => {
              setError(null);
              setPickerOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Pesan baru"
            className="h-[48px] w-[48px] items-center justify-center rounded-[24px] bg-surfaceSky"
          >
            <SquarePen size={20} color={palette.primary} />
          </Pressable>
        </View>

        <View className="px-[16px] pb-[10px]">
          <View className="flex-row items-center gap-[8px] rounded-full bg-slate100 px-[14px] py-[11px]">
            <Search size={18} color={palette.slate500} />
            <TextInput
 maxFontSizeMultiplier={1.3}
              value={query}
              onChangeText={setQuery}
              placeholder="Cari teman atau grup"
              placeholderTextColor={palette.slate500}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Cari teman atau grup"
              style={{ fontFamily: INTER.regular, paddingVertical: 0 }}
              className="flex-1 text-[14px] text-slateInk"
            />
          </View>
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
          >
            {filters.map((f) => {
              const active = f.id === filter;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`rounded-full px-[13px] py-[7px] ${active ? 'bg-primary' : 'border border-slateBorder bg-white'}`}
                >
                  <Text className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {incoming.length > 0 ? (
          <Pressable
            onPress={() => router.push('/teman')}
            accessibilityRole="button"
            className="flex-row items-center gap-[12px] bg-surfaceSky px-[16px] py-[10px]"
          >
            <View className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white">
              <Mail size={22} color={palette.primary} />
            </View>
            <View className="flex-1 gap-px">
              <Text className="text-[14px] font-bold text-slateInk">Permintaan pertemanan</Text>
              <Text className="text-[12px] text-slate500">
                {incoming.length} orang ingin berteman. Setelah berteman, kalian bisa ngobrol.
              </Text>
            </View>
            <ChevronRight size={18} color={palette.slate500} />
          </Pressable>
        ) : null}

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={conversations.isRefetching} onRefresh={() => void conversations.refetch()} />
          }
        >
          {conversations.isPending ? (
            <View className="items-center py-[32px]">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : conversations.isError ? (
            <View className="gap-[10px] px-[16px] pt-[16px]">
              <FormError message="Gagal memuat pesan. Periksa internet kamu." size={14} />
              <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void conversations.refetch()} />
            </View>
          ) : list.length === 0 ? (
            <View className="items-center gap-[6px] px-[24px] py-[48px]">
              <Text className="text-[15px] font-bold text-slateInk">Belum ada pesan</Text>
              <Text className="text-center text-[13px] text-slate500">
                Tekan ikon pensil untuk mulai ngobrol dengan temanmu, atau gabung sesi belajar untuk masuk grup chat-nya.
              </Text>
            </View>
          ) : (
            list.map((c) => {
              const unread = c.unread > 0;
              const mine = c.last_sender_id === userId;
              const preview = c.last_content
                ? c.kind === 'session' && !mine
                  ? `${(c.last_sender_name ?? '').split(' ')[0]}: ${c.last_content}`
                  : mine
                    ? `Kamu: ${c.last_content}`
                    : c.last_content
                : 'Belum ada pesan';
              return (
                <Pressable
                  key={c.conversation_id}
                  onPress={() => open(c.conversation_id)}
                  accessibilityRole="button"
                  accessibilityLabel={c.title ?? 'Percakapan'}
                  className="flex-row items-center gap-[12px] px-[16px] py-[12px]"
                >
                  <Avatar c={c} />
                  <View className="flex-1 gap-[2px]">
                    <View className="flex-row items-center gap-[6px]">
                      <Text className="shrink text-[15px] font-bold text-slateInk" numberOfLines={1}>
                        {c.title ?? 'Percakapan'}
                      </Text>
                      {c.kind === 'session' ? (
                        <View className="rounded-[6px] bg-surfaceSky px-[6px] py-px">
                          <Text className="text-[12px] font-bold text-primary">Sesi</Text>
                        </View>
                      ) : null}
                      <View className="flex-1" />
                      {c.last_at ? (
                        <Text className={`text-[11px] ${unread ? 'font-bold text-primary' : 'text-slate500'}`}>
                          {listTime(c.last_at, now)}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row items-center gap-[8px]">
                      <Text
                        className={`flex-1 text-[13px] ${unread ? 'font-semibold text-slateInk' : 'text-slate500'}`}
                        numberOfLines={1}
                      >
                        {preview}
                      </Text>
                      {unread ? (
                        <View className="rounded-full bg-primary px-[7px] py-px">
                          <Text className="text-[11px] font-bold text-white">{c.unread}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text className="w-full text-[20px] font-extrabold text-slateInk">Pesan baru</Text>
        {friends.length === 0 ? (
          <Text className="w-full text-[14px] leading-[21px] text-slate500">
            Kamu belum punya teman. Tambah teman dulu lewat Cari teman, lalu kalian bisa ngobrol.
          </Text>
        ) : (
          friends.map((f) => (
            <Pressable
              key={f.other_id}
              onPress={() => void startWith(f.other_id)}
              disabled={startDirect.isPending}
              accessibilityRole="button"
              accessibilityLabel={`Pesan ${f.full_name}`}
              className="w-full flex-row items-center gap-[12px] py-[8px]"
            >
              <View className="h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
                {f.avatar_url ? (
                  <Image source={{ uri: f.avatar_url }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <Text className="text-[16px] font-bold text-primary">{f.full_name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text className="flex-1 text-[15px] font-bold text-slateInk" numberOfLines={1}>
                {f.full_name}
              </Text>
            </Pressable>
          ))
        )}
        {error ? <FormError message={error} size={12} /> : null}
      </BottomSheet>
    </View>
  );
}
