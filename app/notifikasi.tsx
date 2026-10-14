import { useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, UserCheck, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { listTime } from '@/features/chat/format';
import { useConversations } from '@/features/chat/hooks';
import {
  useAcceptFriendRequest,
  useFriendships,
  useRemoveFriendship,
} from '@/features/friends/hooks';
import { useNow } from '@/lib/useNow';

const ACCEPTED_WINDOW_MS = 7 * 24 * 3_600_000;

// "2 menit lalu", "3 jam lalu", "5 hari lalu"
function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Baru saja';
  if (min < 60) return `${min} menit lalu`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function Avatar({ name, uri }: { name: string; uri: string | null }) {
  return (
    <View className="h-[48px] w-[48px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
      {uri ? (
        <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="text-[18px] font-bold text-primary">{name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

// Pusat notifikasi: permintaan pertemanan masuk (bisa langsung diterima/ditolak) dan pesan
// yang belum dibaca. Aturan pertemanan dijaga database (RLS + trigger), bukan layar ini.
export default function NotifikasiScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const friendships = useFriendships(userId);
  const accept = useAcceptFriendRequest(userId);
  const remove = useRemoveFriendship(userId);
  const conversations = useConversations();
  const now = useNow();
  const [error, setError] = useState<string | null>(null);

  const incoming = useMemo(
    () =>
      (friendships.data ?? [])
        .filter((r) => r.status === 'pending' && r.incoming)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [friendships.data],
  );

  // Percakapan dengan pesan belum dibaca, yang terbaru di atas.
  const unreadChats = useMemo(
    () =>
      (conversations.data ?? [])
        .filter((c) => c.unread > 0)
        .sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? '')),
    [conversations.data],
  );

  // Permintaan yang kamu kirim dan sudah diterima (7 hari terakhir).
  const accepted = useMemo(
    () =>
      (friendships.data ?? [])
        .filter(
          (r) =>
            r.status === 'accepted' &&
            !r.incoming &&
            !!r.accepted_at &&
            now - new Date(r.accepted_at).getTime() < ACCEPTED_WINDOW_MS,
        )
        .sort((a, b) => (b.accepted_at ?? '').localeCompare(a.accepted_at ?? '')),
    [friendships.data, now],
  );

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.');
    }
  };

  const empty = incoming.length === 0 && unreadChats.length === 0 && accepted.length === 0;

  return (
    <View className="flex-1 bg-surfaceCanvas">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-[10px] bg-white px-[20px] pb-[16px] pt-[8px]">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            hitSlop={10}
          >
            <ArrowLeft size={22} color={palette.slate500} />
          </Pressable>
          <Text className="text-[22px] font-extrabold text-slateInk">Notifikasi</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {error ? <FormError message={error} size={13} /> : null}

          {friendships.isPending ? (
            <View className="items-center py-[24px]">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : friendships.isError ? (
            <View className="gap-[10px]">
              <FormError message="Gagal memuat notifikasi. Periksa internet kamu." size={13} />
              <PrimaryButton
                label="Coba lagi"
                variant="outline"
                onPress={() => void friendships.refetch()}
              />
            </View>
          ) : empty ? (
            <View className="items-center gap-[6px] py-[48px]">
              <Text className="text-[15px] font-bold text-slateInk">Belum ada notifikasi</Text>
              <Text className="text-center text-[13px] text-slate500">
                Pesan baru, permintaan pertemanan, dan pertemanan yang diterima akan muncul di sini.
              </Text>
            </View>
          ) : (
            <>
              {unreadChats.length > 0 ? (
                <View className="gap-[10px]">
                  <Text className="text-[13px] font-bold text-slate500">Pesan baru</Text>
                  {unreadChats.map((c) => (
                    <Pressable
                      key={c.conversation_id}
                      onPress={() => router.push({ pathname: '/pesan/[id]', params: { id: c.conversation_id } })}
                      accessibilityRole="button"
                      accessibilityLabel={`${c.unread} pesan baru dari ${c.title ?? 'percakapan'}`}
                      className="flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder bg-white p-[14px]"
                    >
                      <View className="h-[48px] w-[48px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
                        {c.kind === 'session' ? (
                          <Users size={22} color={palette.primary} />
                        ) : c.other_avatar ? (
                          <Image source={{ uri: c.other_avatar }} className="h-full w-full" resizeMode="cover" />
                        ) : (
                          <MessageCircle size={22} color={palette.primary} />
                        )}
                      </View>
                      <View className="flex-1 gap-[2px]">
                        <View className="flex-row items-center gap-[6px]">
                          <Text className="shrink text-[14px] font-bold text-slateInk" numberOfLines={1}>
                            {c.title ?? 'Percakapan'}
                          </Text>
                          <View className="flex-1" />
                          {c.last_at ? (
                            <Text className="text-[11px] font-bold text-primary">{listTime(c.last_at, now)}</Text>
                          ) : null}
                        </View>
                        <View className="flex-row items-center gap-[8px]">
                          <Text className="flex-1 text-[13px] font-semibold text-slateInk" numberOfLines={1}>
                            {c.kind === 'session' && c.last_sender_name
                              ? `${c.last_sender_name.split(' ')[0]}: ${c.last_content ?? ''}`
                              : (c.last_content ?? '')}
                          </Text>
                          <View className="rounded-full bg-primary px-[7px] py-px">
                            <Text className="text-[11px] font-bold text-white">{c.unread}</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {incoming.length > 0 ? (
                <View className="gap-[10px]">
                  <Text className="text-[13px] font-bold text-slate500">Permintaan pertemanan</Text>
                  {incoming.map((r) => (
                    <View
                      key={r.other_id}
                      className="gap-[12px] rounded-[18px] border border-slateBorder bg-white p-[14px]"
                    >
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/profil/[id]', params: { id: r.other_id } })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Lihat profil ${r.full_name}`}
                        className="flex-row items-center gap-[12px]"
                      >
                        <Avatar name={r.full_name} uri={r.avatar_url} />
                        <View className="flex-1 gap-[2px]">
                          <Text className="text-[14px] text-slateInk">
                            <Text className="font-bold">{r.full_name}</Text> ingin berteman denganmu
                          </Text>
                          <Text className="text-[11px] text-slate500" numberOfLines={1}>
                            {[r.major, timeAgo(r.created_at)].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      </Pressable>
                      <View className="flex-row gap-[8px]">
                        <View className="flex-1">
                          <PrimaryButton
                            label="Terima"
                            loading={accept.isPending && accept.variables === r.other_id}
                            disabled={accept.isPending || remove.isPending}
                            onPress={() => void run(() => accept.mutateAsync(r.other_id))}
                          />
                        </View>
                        <View className="flex-1">
                          <PrimaryButton
                            label="Tolak"
                            variant="outline"
                            loading={remove.isPending && remove.variables === r.other_id}
                            disabled={accept.isPending || remove.isPending}
                            onPress={() => void run(() => remove.mutateAsync(r.other_id))}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {accepted.length > 0 ? (
                <View className="gap-[10px]">
                  <Text className="text-[13px] font-bold text-slate500">Pertemanan baru</Text>
                  {accepted.map((r) => (
                    <Pressable
                      key={r.other_id}
                      onPress={() => router.push({ pathname: '/profil/[id]', params: { id: r.other_id } })}
                      accessibilityRole="button"
                      accessibilityLabel={`Lihat profil ${r.full_name}`}
                      className="flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder bg-white p-[14px]"
                    >
                      <Avatar name={r.full_name} uri={r.avatar_url} />
                      <View className="flex-1 gap-[2px]">
                        <Text className="text-[14px] text-slateInk">
                          <Text className="font-bold">{r.full_name}</Text> menerima permintaan pertemananmu
                        </Text>
                        <Text className="text-[11px] text-slate500">{r.accepted_at ? timeAgo(r.accepted_at) : ''}</Text>
                      </View>
                      <UserCheck size={20} color={palette.primary} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
