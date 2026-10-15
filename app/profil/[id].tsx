import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { BookOpen, User } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useStartDirect } from '@/features/chat/hooks';
import {
  useAcceptFriendRequest,
  useFriendships,
  useRemoveFriendship,
  useSendFriendRequest,
} from '@/features/friends/hooks';
import { useProfileDetail } from '@/features/match/hooks';
import { ReportSheet } from '@/features/moderation/ReportSheet';
import { archetypeName, archetypePill } from '@/features/personality/archetype';

export default function ViewProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((s) => s.session?.user.id);
  
  const profile = useProfileDetail(id);
  const friendships = useFriendships(currentUserId);
  const sendRequest = useSendFriendRequest(currentUserId);
  const removeFriend = useRemoveFriendship(currentUserId);
  const acceptRequest = useAcceptFriendRequest(currentUserId);
  const startDirect = useStartDirect();
  const [actionError, setActionError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!id || !currentUserId) {
    return null;
  }

  const isOwnProfile = id === currentUserId;

  // Check friendship status
  const friendship = friendships.data?.find((f) => f.other_id === id);
  const isFriend = friendship?.status === 'accepted';
  const isPending = friendship?.status === 'pending';
  const isIncoming = isPending && friendship?.incoming;

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.');
    }
  };

  const handleAddFriend = () => run(() => sendRequest.mutateAsync({ addresseeId: id }));
  const handleAccept = () => run(() => acceptRequest.mutateAsync(id));
  // Dipakai untuk menolak permintaan masuk dan membatalkan permintaan terkirim.
  const handleDropRequest = () => run(() => removeFriend.mutateAsync(id));
  const handleMessage = () =>
    run(async () => {
      const conversationId = await startDirect.mutateAsync(id);
      router.push({ pathname: '/pesan/[id]', params: { id: conversationId } });
    });
  const handleRemoveFriend = () => setConfirmRemove(true);

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-[12px] border-b border-slateBorder px-[20px] py-[12px]">
          <BackButton />
          <Text className="flex-1 text-[22px] font-extrabold text-slateInk">Profil</Text>
        </View>

        {profile.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : profile.isError ? (
          <View className="flex-1 items-center justify-center gap-[10px] px-[20px]">
            <FormError message="Gagal memuat profil. Periksa internet kamu." size={14} />
            <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void profile.refetch()} />
          </View>
        ) : !profile.data ? (
          <View className="flex-1 items-center justify-center px-[20px]">
            <Text className="text-center text-[15px] text-slate500">Profil tidak ditemukan.</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Avatar & Name Section */}
            <View className="items-center gap-[12px] px-[20px] py-[24px]">
              <View className="h-[96px] w-[96px] items-center justify-center rounded-full bg-surfaceSky">
                {profile.data.avatar_url ? (
                  <Image
                    source={{ uri: profile.data.avatar_url }}
                    className="h-full w-full rounded-full"
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <User size={48} color={palette.primary} />
                )}
              </View>

              <View className="items-center gap-[4px]">
                <Text className="text-center text-[22px] font-extrabold text-slateInk">
                  {profile.data.full_name}
                </Text>
                {profile.data.major && (
                  <View className="flex-row items-center gap-[6px]">
                    <BookOpen size={14} color={palette.slate500} />
                    <Text className="text-[14px] text-slate500">{profile.data.major}</Text>
                  </View>
                )}
                {profile.data.semester && (
                  <Text className="text-[13px] text-slate500">Semester {profile.data.semester}</Text>
                )}
              </View>

              {/* Archetype Badge */}
              {profile.data.personality_type && (
                <View
                  className="rounded-[12px] px-[16px] py-[8px]"
                  style={{ backgroundColor: archetypePill(profile.data.personality_type)?.bg ?? palette.slate100 }}
                >
                  <Text
                    className="text-[14px] font-bold"
                    style={{ color: archetypePill(profile.data.personality_type)?.text ?? palette.slateInk }}
                  >
                    {archetypeName(profile.data.personality_type) ?? profile.data.personality_type}
                  </Text>
                </View>
              )}

              {/* Bio */}
              {profile.data.bio && (
                <Text className="text-center text-[14px] text-slate500">{profile.data.bio}</Text>
              )}
            </View>

            {/* Stats */}
            <View className="flex-row border-y border-slateBorder">
              <View className="flex-1 items-center gap-[4px] border-r border-slateBorder py-[16px]">
                <Text className="text-[24px] font-extrabold text-slateInk">
                  {profile.data.stats.sessions_attended}
                </Text>
                <Text className="text-[12px] text-slate500">Sesi Diikuti</Text>
              </View>
              <View className="flex-1 items-center gap-[4px] py-[16px]">
                <Text className="text-[24px] font-extrabold text-slateInk">
                  {profile.data.stats.friends_count}
                </Text>
                <Text className="text-[12px] text-slate500">Teman</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <View className="gap-[12px] px-[20px] pt-[20px]">
                {actionError ? <FormError message={actionError} size={13} /> : null}
                {isFriend ? (
                  <>
                    <PrimaryButton label="Kirim Pesan" onPress={handleMessage} loading={startDirect.isPending} />
                    <PrimaryButton
                      label="Hapus Teman"
                      variant="outline"
                      onPress={handleRemoveFriend}
                      loading={removeFriend.isPending}
                    />
                  </>
                ) : isIncoming ? (
                  <>
                    <PrimaryButton label="Terima Permintaan" onPress={handleAccept} loading={acceptRequest.isPending} />
                    <PrimaryButton
                      label="Tolak"
                      variant="outline"
                      onPress={handleDropRequest}
                      loading={removeFriend.isPending}
                    />
                  </>
                ) : isPending ? (
                  <PrimaryButton
                    label="Batalkan Permintaan"
                    variant="outline"
                    onPress={handleDropRequest}
                    loading={removeFriend.isPending}
                  />
                ) : (
                  <PrimaryButton label="Tambah Teman" onPress={handleAddFriend} loading={sendRequest.isPending} />
                )}

                <PrimaryButton label="Laporkan Pengguna" variant="outline" onPress={() => setReportOpen(true)} />
              </View>
            )}

            {/* Personality Scores */}
            {profile.data.personality_scores && (
              <View className="gap-[12px] px-[20px] pt-[24px]">
                <Text className="text-[16px] font-extrabold text-slateInk">Skor Kepribadian</Text>
                {Object.entries(profile.data.personality_scores)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([key, value]) => {
                    const label = archetypeName(key) ?? key;
                    // Warna batang dari pil archetype (palet aplikasi); angka tetap slateInk agar terbaca.
                    const color = archetypePill(key)?.text ?? palette.slate500;
                    // Skor dari database sudah dalam persen (6 archetype berjumlah 100), bukan 0–1.
                    const percent = Math.min(100, Math.max(0, Math.round(value as number)));
                    return (
                      <View key={key} className="gap-[6px]">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[13px] font-semibold text-slateInk">{label}</Text>
                          <Text className="text-[13px] font-bold text-slateInk">
                            {percent}%
                          </Text>
                        </View>
                        <View className="h-[6px] overflow-hidden rounded-[3px] bg-slate100">
                          <View
                            className="h-full rounded-[3px]"
                            style={{ width: `${percent}%`, backgroundColor: color } as any}
                          />
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {/* Courses */}
            {profile.data.courses.length > 0 && (
              <View className="gap-[12px] px-[20px] pt-[24px]">
                <Text className="text-[16px] font-extrabold text-slateInk">Mata Kuliah</Text>
                <View className="flex-row flex-wrap gap-[8px]">
                  {profile.data.courses.map((course) => (
                    <View key={course.id} className="rounded-[8px] bg-slate100 px-[12px] py-[6px]">
                      <Text className="text-[12px] font-semibold text-slateInk">{course.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {profile.data && !isOwnProfile ? (
        <ReportSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          targetUserId={id}
          targetName={profile.data.full_name}
        />
      ) : null}

      <ConfirmModal
        visible={confirmRemove}
        title="Hapus teman?"
        message={`${profile.data?.full_name ?? 'Orang ini'} akan dihapus dari daftar temanmu dan kalian tidak bisa saling kirim pesan lagi.`}
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        loading={removeFriend.isPending}
        onConfirm={() => {
          setConfirmRemove(false);
          void run(() => removeFriend.mutateAsync(id));
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </View>
  );
}
