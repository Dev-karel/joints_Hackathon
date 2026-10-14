import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, BookOpen, Mail, MapPin, MessageCircle, ShieldAlert, User, UserPlus } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useFriendships, useSendFriendRequest, useRemoveFriendship } from '@/features/friends/hooks';
import { useProfileDetail } from '@/features/match/hooks';

const ARCHETYPE_LABELS: Record<string, string> = {
  groundbreaker: 'Groundbreaker',
  heartkeeper: 'Heartkeeper',
  kindledflame: 'Kindled Flame',
  mindsmith: 'Mindsmith',
  sagekeeper: 'Sagekeeper',
  wildheart: 'Wildheart',
};

const ARCHETYPE_COLORS: Record<string, string> = {
  groundbreaker: '#10B981',
  heartkeeper: '#EC4899',
  kindledflame: '#F59E0B',
  mindsmith: '#8B5CF6',
  sagekeeper: '#3B82F6',
  wildheart: '#EF4444',
};

export default function ViewProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((s) => s.session?.user.id);
  
  const profile = useProfileDetail(id);
  const friendships = useFriendships(currentUserId);
  const sendRequest = useSendFriendRequest(currentUserId);
  const removeFriend = useRemoveFriendship(currentUserId);

  if (!id || !currentUserId) {
    return null;
  }

  const isOwnProfile = id === currentUserId;

  // Check friendship status
  const friendship = friendships.data?.find((f) => f.other_id === id);
  const isFriend = friendship?.status === 'accepted';
  const isPending = friendship?.status === 'pending';
  const isIncoming = isPending && friendship?.incoming;

  const handleAddFriend = async () => {
    try {
      await sendRequest.mutateAsync({ addresseeId: id });
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await removeFriend.mutateAsync(id);
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const getArchetypeColor = (type: string | null) => ARCHETYPE_COLORS[type ?? ''] ?? palette.slate500;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-[12px] border-b border-slateBorder px-[20px] py-[12px]">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            className="h-[40px] w-[40px] items-center justify-center"
          >
            <ArrowLeft size={24} color={palette.slateInk} />
          </Pressable>
          <Text className="flex-1 text-[18px] font-extrabold text-slateInk">Profil</Text>
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
                  <View className="h-full w-full overflow-hidden rounded-full">
                    {/* TODO: Image component */}
                    <View className="h-full w-full items-center justify-center bg-surfaceSky">
                      <User size={48} color={palette.primary} />
                    </View>
                  </View>
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
                  style={{ backgroundColor: `${getArchetypeColor(profile.data.personality_type)}15` } as any}
                >
                  <Text
                    className="text-[14px] font-bold"
                    style={{ color: getArchetypeColor(profile.data.personality_type) } as any}
                  >
                    {ARCHETYPE_LABELS[profile.data.personality_type] ?? profile.data.personality_type}
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
                {isFriend ? (
                  <>
                    <PrimaryButton
                      label="Kirim Pesan"
                      icon={<MessageCircle size={18} color="#FFFFFF" />}
                      onPress={() => router.push(`/pesan/${id}`)}
                    />
                    <PrimaryButton
                      label="Hapus Teman"
                      variant="outline"
                      onPress={handleRemoveFriend}
                      loading={removeFriend.isPending}
                    />
                  </>
                ) : isPending ? (
                  <PrimaryButton
                    label={isIncoming ? 'Terima Permintaan' : 'Permintaan Terkirim'}
                    variant={isIncoming ? 'primary' : 'outline'}
                    disabled={!isIncoming}
                    onPress={isIncoming ? handleAddFriend : undefined}
                  />
                ) : (
                  <PrimaryButton
                    label="Tambah Teman"
                    icon={<UserPlus size={18} color="#FFFFFF" />}
                    onPress={handleAddFriend}
                    loading={sendRequest.isPending}
                  />
                )}

                <PrimaryButton
                  label="Laporkan Pengguna"
                  variant="outline"
                  icon={<ShieldAlert size={18} color={palette.slateInk} />}
                  onPress={() => {
                    // TODO: Implement report user
                    console.log('Report user:', id);
                  }}
                />
              </View>
            )}

            {/* Personality Scores */}
            {profile.data.personality_scores && (
              <View className="gap-[12px] px-[20px] pt-[24px]">
                <Text className="text-[16px] font-extrabold text-slateInk">Skor Kepribadian</Text>
                {Object.entries(profile.data.personality_scores)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([key, value]) => {
                    const label = ARCHETYPE_LABELS[key] ?? key;
                    const color = ARCHETYPE_COLORS[key] ?? palette.slate500;
                    const percent = Math.round((value as number) * 100);
                    return (
                      <View key={key} className="gap-[6px]">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[13px] font-semibold text-slateInk">{label}</Text>
                          <Text className="text-[13px] font-bold" style={{ color } as any}>
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
    </View>
  );
}
