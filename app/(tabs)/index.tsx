import { useRouter, type Href } from 'expo-router';
import {
  Bell,
  ChevronRight,
  MapPin,
  MessageCircle,
  PlusCircle,
  Search,
  User,
  UserCheck,
  Wifi,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { useStartDirect, useUnreadTotal } from '@/features/chat/hooks';
import { formatTime } from '@/features/events/format';
import { useFriendships, useSendFriendRequest } from '@/features/friends/hooks';
import { useZonePresence, useZones } from '@/features/map/hooks';
import { useMapStore } from '@/features/map/mapStore';
import { usePartners, useSessions } from '@/features/match/hooks';
import { archetypeName } from '@/features/personality/archetype';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';

const brandLockup = require('../../assets/brand/brand-lockup.png');

const MAX_PARTNERS = 5;
const MAX_TODAY = 4;

// Rute baru belum ada di tipe rute sampai dev server membuatnya ulang; cast sementara.
const toChat = (id: string) => ({ pathname: '/pesan/[id]', params: { id } }) as unknown as Href;

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[17px] font-extrabold text-slateInk">{title}</Text>
      <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel={`Lihat semua ${title}`} hitSlop={10}>
        <Text className="text-[13px] font-semibold text-primary">Lihat semua</Text>
      </Pressable>
    </View>
  );
}

function Avatar({ name, uri, size }: { name: string; uri: string | null; size: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden bg-surfaceSky"
    >
      {uri ? (
        <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="text-[20px] font-bold text-primary">{name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

export default function BerandaScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const router = useRouter();
  const { data: profile } = useProfile(userId);
  const archetype = archetypeIdSchema.safeParse(profile?.personality_type);

  const friendships = useFriendships(userId);
  const rows = useMemo(() => friendships.data ?? [], [friendships.data]);
  const friends = rows.filter((f) => f.status === 'accepted');
  const incoming = rows.filter((f) => f.status === 'pending' && f.incoming);
  const hasFriends = friends.length > 0;
  const friendIds = useMemo(() => new Set(friends.map((f) => f.other_id)), [friends]);

  const unreadTotal = useUnreadTotal();
  const startDirect = useStartDirect();
  const sendRequest = useSendFriendRequest(userId);
  const partners = usePartners();
  const sessions = useSessions();
  const zones = useZones();
  const presence = useZonePresence();
  const { status: mapStatus, zoneName } = useMapStore();

  const [error, setError] = useState<string | null>(null);

  const openChat = async (friendId: string) => {
    setError(null);
    try {
      router.push(toChat(await startDirect.mutateAsync(friendId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuka percakapan.');
    }
  };

  // "Ajak belajar": teman → langsung ngobrol; bukan teman → kirim permintaan pertemanan dulu.
  const invite = async (partnerId: string) => {
    setError(null);
    const rel = rows.find((r) => r.other_id === partnerId);
    if (rel?.status === 'accepted') return openChat(partnerId);
    if (rel) return router.push('/teman');
    try {
      await sendRequest.mutateAsync({ addresseeId: partnerId });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim ajakan.');
    }
  };

  // Ruangan yang sedang ramai (hitungan saja; identitas dijaga RLS/fungsi presence di database).
  const busyZones = useMemo(() => {
    const names = new Map((zones.data ?? []).map((z) => [z.id, z.name]));
    return (presence.data ?? [])
      .filter((p) => p.online_count > 0 && names.has(p.zone_id))
      .sort((a, b) => b.online_count - a.online_count)
      .slice(0, 3)
      .map((p) => ({ id: p.zone_id, name: names.get(p.zone_id)!, count: p.online_count }));
  }, [zones.data, presence.data]);
  const onlineTotal = (presence.data ?? []).reduce((n, p) => n + p.online_count, 0);

  const campusTitle =
    mapStatus === 'in_zone' && zoneName ? `Kamu di ${zoneName}` : 'Match Map';
  const campusSub =
    onlineTotal > 0
      ? `${onlineTotal} orang online di kampus`
      : profile?.show_on_map
        ? 'Sambungkan ke Wi-Fi kampus untuk tampil di peta'
        : 'Nyalakan "Tampil di peta" untuk melihat siapa yang online';

  const todayList = useMemo(() => {
    const now = new Date();
    return (sessions.data ?? [])
      .filter((s) => {
        const d = new Date(s.starts_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      })
      .slice(0, MAX_TODAY);
  }, [sessions.data]);

  const suggestions = (partners.data ?? [])
    .filter((p) => !friendIds.has(p.user_id))
    .slice(0, MAX_PARTNERS);

  return (
    <View className="flex-1 bg-white">
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header: lockup merek + Pesan + Notifikasi (permintaan pertemanan) */}
        <View className="flex-row items-center justify-between bg-white px-[36px] py-[12px]">
          <Image
            source={brandLockup}
            resizeMode="contain"
            className="h-[27px] w-[172px]"
            accessibilityLabel="AyokMatch"
          />
          <View className="flex-row items-center gap-[8px]">
            <Pressable
              className="h-[40px] w-[40px] items-center justify-center rounded-[20px] bg-surfaceSky"
              accessibilityRole="button"
              accessibilityLabel={unreadTotal > 0 ? `Pesan, ${unreadTotal} belum dibaca` : 'Pesan'}
              onPress={() => router.push('/pesan' as Href)}
            >
              <MessageCircle size={20} color={palette.primary} />
              {unreadTotal > 0 ? (
                <View className="rounded-full border-2 border-white bg-[#DC2626]" style={{ position: "absolute", right: 6, top: 6, width: 10, height: 10 }} />
              ) : null}
            </Pressable>
            <Pressable
              className="h-[40px] w-[40px] items-center justify-center rounded-[20px] bg-surfaceSky"
              accessibilityRole="button"
              accessibilityLabel={
                incoming.length > 0 || unreadTotal > 0
                  ? `Notifikasi, ${incoming.length} permintaan pertemanan, ${unreadTotal} pesan belum dibaca`
                  : 'Notifikasi'
              }
              onPress={() => router.push('/notifikasi' as Href)}
            >
              <Bell size={20} color={palette.primary} />
              {incoming.length > 0 || unreadTotal > 0 ? (
                <View className="rounded-full border-2 border-white bg-[#DC2626]" style={{ position: "absolute", right: 6, top: 6, width: 10, height: 10 }} />
              ) : null}
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Kartu profil → tab Profil */}
          <Pressable
            onPress={() => router.push('/profil')}
            accessibilityRole="button"
            accessibilityLabel="Buka profilku"
            className="mx-[29px] mb-[16px] min-h-[81px] flex-row items-center rounded-[20px] border border-[rgba(0,0,0,0.16)] bg-white p-[11px]"
            style={{ elevation: 4 }}
          >
            <View className="h-[60px] w-[60px] overflow-hidden rounded-[24px] bg-slate100">
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center bg-surfaceSky">
                  <User size={32} color={palette.primary} />
                </View>
              )}
            </View>
            <View className="ml-[13px] flex-1 gap-[5px]">
              <Text className="text-[16px] font-bold text-slateInk" numberOfLines={1}>
                {profile?.full_name ?? '...'}
              </Text>
              {archetype.success ? (
                <View className="flex-row items-center gap-[8px] self-start rounded-[20px] bg-accentSoft px-[16px] py-[8px]">
                  <User size={16} color="#7C4700" />
                  <Text className="text-[13px] font-bold text-accent800">{ARCHETYPES[archetype.data].name}</Text>
                </View>
              ) : null}
            </View>
            <ChevronRight size={18} color={palette.slate500} />
          </Pressable>

          <View className="gap-[22px]">
            {/* Aksi cepat */}
            <View className="mx-[20px] flex-row gap-[10px]">
              {[
                { label: 'Study Match', icon: UserCheck, soft: true, onPress: () => router.push('/match') },
                { label: 'Buat sesi', icon: PlusCircle, soft: false, onPress: () => router.push('/buat-sesi') },
                { label: 'Match Map', icon: MapPin, soft: false, onPress: () => router.push('/peta') },
                { label: 'Cari teman', icon: Search, soft: false, onPress: () => router.push('/teman') },
              ].map(({ label, icon: Icon, soft, onPress }) => (
                <Pressable
                  key={label}
                  className="flex-1 items-center gap-[8px] rounded-[18px] border border-slateBorder bg-white py-[12px]"
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={onPress}
                >
                  <View
                    className={`h-[44px] w-[44px] items-center justify-center rounded-[14px] ${
                      soft ? 'bg-accentSoft' : 'bg-surfaceSky'
                    }`}
                  >
                    <Icon size={22} color={soft ? palette.accentText : palette.primary} />
                  </View>
                  <Text className={`text-[12px] font-bold ${soft ? 'text-accentText' : 'text-primary'}`}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Sekarang di kampus → tab Peta */}
            <View className="mx-[20px] gap-[12px] rounded-[20px] bg-surfaceSky px-[16px] py-[14px]">
              <Pressable
                className="flex-row items-center gap-[10px]"
                accessibilityRole="button"
                accessibilityLabel="Buka Match Map"
                onPress={() => router.push('/peta')}
              >
                <View className="h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-primary">
                  <Wifi size={20} color="white" />
                </View>
                <View className="flex-1 gap-px">
                  <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
                    {campusTitle}
                  </Text>
                  <Text className="text-[12px] text-slate500" numberOfLines={2}>
                    {campusSub}
                  </Text>
                </View>
                <ChevronRight size={20} color={palette.slate500} />
              </Pressable>

              {busyZones.length > 0 ? (
                <View className="flex-row flex-wrap gap-[6px]">
                  {busyZones.map((zone) => (
                    <Pressable
                      key={zone.id}
                      onPress={() => router.push('/peta')}
                      accessibilityRole="button"
                      accessibilityLabel={`${zone.name}, ${zone.count} online`}
                      className="flex-row items-center gap-[6px] rounded-full bg-white py-[5px] pl-[9px] pr-[5px]"
                    >
                      <Text className="text-[12px] font-semibold text-slateInk">{zone.name}</Text>
                      <View className="items-center justify-center rounded-full bg-primary px-[7px] py-px">
                        <Text className="text-[11px] font-bold text-white">{zone.count}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {error ? (
              <View className="mx-[20px]">
                <FormError message={error} size={13} />
              </View>
            ) : null}

            {/* Teman (sudah punya teman) atau Cocok denganmu (belum) */}
            <View className="gap-[12px]">
              <View className="mx-[20px]">
                <SectionHeader title={hasFriends ? 'Teman' : 'Cocok denganmu'} onSeeAll={() => router.push('/teman')} />
              </View>

              {hasFriends ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                >
                  {friends.map((friend) => (
                    <View key={friend.other_id} className="w-[148px] items-center gap-[12px] rounded-[20px] bg-white px-[14px] py-[16px]">
                      <Avatar name={friend.full_name} uri={friend.avatar_url} size={56} />
                      <Text className="text-center text-[13px] font-bold text-slateInk" numberOfLines={1}>
                        {friend.full_name}
                      </Text>
                      <Text className="text-center text-[10px] text-slate500" numberOfLines={1}>
                        {[friend.major, archetypeName(friend.personality_type)].filter(Boolean).join(' · ') || 'Mahasiswa'}
                      </Text>
                      <Pressable
                        className="flex-row items-center justify-center gap-[6px] rounded-full bg-primary px-[14px] py-[7px]"
                        accessibilityRole="button"
                        accessibilityLabel={`Pesan ${friend.full_name}`}
                        disabled={startDirect.isPending}
                        onPress={() => void openChat(friend.other_id)}
                      >
                        <MessageCircle size={13} color="white" />
                        <Text className="text-[12px] font-bold text-white">Pesan</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              ) : partners.isPending ? (
                <View className="items-center py-[16px]">
                  <ActivityIndicator color={palette.primary} />
                </View>
              ) : suggestions.length === 0 ? (
                <View className="mx-[20px] gap-[8px] rounded-[18px] border border-slateBorder p-[16px]">
                  <Text className="text-[14px] font-bold text-slateInk">Belum ada rekomendasi</Text>
                  <Text className="text-[13px] leading-[19px] text-slate500">
                    Pilih mata kuliahmu supaya kami bisa mencarikan partner belajar yang cocok.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/mata-kuliah')}
                    accessibilityRole="button"
                    className="self-start rounded-full bg-primary px-[16px] py-[9px]"
                  >
                    <Text className="text-[13px] font-bold text-white">Pilih mata kuliah</Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                >
                  {suggestions.map((p) => {
                    const sent = rows.some((r) => r.other_id === p.user_id);
                    return (
                      <View
                        key={p.user_id}
                        className="w-[148px] items-center gap-[6px] rounded-[20px] border border-slateBorder bg-white px-[12px] pb-[12px] pt-[14px]"
                      >
                        <Avatar name={p.full_name} uri={p.avatar_url} size={56} />
                        <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
                          {p.full_name}
                        </Text>
                        <Text className="text-[11px] text-slate500" numberOfLines={1}>
                          {[p.major, archetypeName(p.personality_type)].filter(Boolean).join(' · ') || 'Mahasiswa'}
                        </Text>
                        <View className="rounded-full bg-accentSoft px-[8px] py-[3px]">
                          <Text className="text-[11px] font-bold text-accentText">{p.score}% Cocok</Text>
                        </View>
                        <Pressable
                          className={`w-full items-center justify-center rounded-full py-[7px] ${
                            sent ? 'border border-slateBorder bg-slateSurface' : 'bg-primary'
                          }`}
                          accessibilityRole="button"
                          accessibilityLabel={`Ajak belajar ${p.full_name}`}
                          disabled={sendRequest.isPending}
                          onPress={() => void invite(p.user_id)}
                        >
                          <Text className={`text-[12px] font-bold ${sent ? 'text-slate500' : 'text-white'}`}>
                            {sent ? 'Terkirim' : 'Ajak belajar'}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Sesi hari ini */}
            <View className="mx-[20px] gap-[10px]">
              <SectionHeader title="Sesi hari ini" onSeeAll={() => router.push('/match')} />

              {sessions.isPending ? (
                <View className="items-center py-[12px]">
                  <ActivityIndicator color={palette.primary} />
                </View>
              ) : todayList.length === 0 ? (
                <View className="gap-[8px] rounded-[18px] border border-slateBorder p-[16px]">
                  <Text className="text-[14px] font-bold text-slateInk">Belum ada sesi hari ini</Text>
                  <Pressable
                    onPress={() => router.push('/buat-sesi')}
                    accessibilityRole="button"
                    className="self-start rounded-full bg-primary px-[16px] py-[9px]"
                  >
                    <Text className="text-[13px] font-bold text-white">Buat sesi</Text>
                  </Pressable>
                </View>
              ) : (
                todayList.map((s) => {
                  const friendsIn = s.study_session_members.filter((m) => friendIds.has(m.user_id)).length;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => router.push({ pathname: '/sesi/[id]', params: { id: s.id } })}
                      accessibilityRole="button"
                      accessibilityLabel={s.title}
                      className="flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder bg-white py-[12px] pl-[12px] pr-[14px]"
                    >
                      <View className="h-[48px] w-[56px] items-center justify-center rounded-[12px] bg-surfaceSky">
                        <Text className="text-[14px] font-extrabold text-primary">{formatTime(s.starts_at)}</Text>
                      </View>
                      <View className="flex-1 gap-[2px]">
                        <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
                          {s.title}
                        </Text>
                        <View className="flex-row items-center gap-[6px]">
                          <Text className="shrink text-[12px] text-slate500" numberOfLines={1}>
                            {s.campus_zones?.name ?? 'Zona'}
                          </Text>
                          {friendsIn > 0 ? (
                            <Text className="text-[12px] font-semibold text-accentText">· {friendsIn} temanmu ikut</Text>
                          ) : null}
                        </View>
                      </View>
                      <View className="rounded-[8px] border border-slateBorder bg-slateSurface px-[8px] py-[3px]">
                        <Text className="text-[12px] font-bold text-slateInk">
                          {s.study_session_members.length}/{s.capacity}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
