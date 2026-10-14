import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  ExternalLink, 
  Trophy, 
  Users, 
  UserPlus,
  CheckCircle,
  XCircle,
  User,
  Crown,
  Clock
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { 
  useOpeningDetail, 
  useSendJoinRequest, 
  useRespondToJoinRequest, 
  useRemoveMember 
} from '@/features/lomba/hooks';
import type { TeamJoinRequest, TeamMember } from '@/features/lomba/api';

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

export default function LombaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((s) => s.session?.user.id);
  
  const opening = useOpeningDetail(id);
  const sendJoinRequest = useSendJoinRequest();
  const respondToRequest = useRespondToJoinRequest(id);
  const removeMember = useRemoveMember(id);

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [message, setMessage] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!id || !currentUserId) return null;

  if (opening.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (opening.isError || !opening.data) {
    return (
      <View className="flex-1 bg-white">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-row items-center gap-[12px] border-b border-slateBorder px-[20px] py-[12px]">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              className="h-[40px] w-[40px] items-center justify-center"
            >
              <ArrowLeft size={24} color={palette.slateInk} />
            </Pressable>
            <Text className="flex-1 text-[18px] font-extrabold text-slateInk">Lowongan Tim</Text>
          </View>
          <View className="flex-1 items-center justify-center gap-[10px] px-[20px]">
            <FormError message="Lowongan tidak ditemukan." size={14} />
            <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void opening.refetch()} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const data = opening.data;
  const isHost = data.host_id === currentUserId;
  const isMember = data.team_members.some(m => m.user_id === currentUserId);
  const hasApplied = data.join_requests.some(r => r.requester_id === currentUserId && r.status === 'pending');
  
  const deadline = new Date(data.registration_deadline);
  const isExpired = deadline.getTime() < Date.now();
  const isFull = data.current_members >= data.team_size;

  const canApply = !isHost && !isMember && !hasApplied && !isExpired && !isFull && data.roles_needed.length > 0;

  const handleJoinRequest = async () => {
    if (!selectedRole) {
      setError('Pilih peran yang kamu inginkan.');
      return;
    }

    try {
      setError(null);
      await sendJoinRequest.mutateAsync({
        opening_id: id,
        requester_id: currentUserId,
        role_applied: selectedRole,
        message: message.trim() || undefined,
      });
      setShowJoinForm(false);
      setSelectedRole('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim permintaan.');
    }
  };

  const handleRespondRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      setError(null);
      await respondToRequest.mutateAsync({ requestId, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses permintaan.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setError(null);
      await removeMember.mutateAsync(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengeluarkan anggota.');
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
          <Text className="flex-1 text-[18px] font-extrabold text-slateInk">Detail Lowongan</Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header Info */}
          <View className="gap-[16px] px-[20px] py-[20px]">
            <View className="flex-row items-start gap-[12px]">
              <View className="h-[48px] w-[48px] items-center justify-center rounded-[24px] bg-accentSoft">
                <Trophy size={24} color={palette.accentText} />
              </View>
              <View className="flex-1 gap-[4px]">
                <Text className="text-[20px] font-extrabold text-slateInk">{data.competition_name}</Text>
                <View className="flex-row items-center gap-[8px]">
                  <View className="rounded-[6px] bg-accent px-[8px] py-[3px]">
                    <Text className="text-[11px] font-semibold text-slateInk">{data.category}</Text>
                  </View>
                  <View className="flex-row items-center gap-[4px]">
                    <Clock size={12} color={palette.slate500} />
                    <Text className="text-[11px] text-slate500">
                      Daftar s/d {deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Status Badges */}
            <View className="flex-row flex-wrap gap-[8px]">
              {isFull && (
                <View className="rounded-[8px] bg-red-100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-red-700">Tim Penuh</Text>
                </View>
              )}
              {isExpired && (
                <View className="rounded-[8px] bg-slate100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-slate500">Pendaftaran Tutup</Text>
                </View>
              )}
              {hasApplied && (
                <View className="rounded-[8px] bg-blue-100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-blue-700">Menunggu Respons</Text>
                </View>
              )}
              {isMember && (
                <View className="rounded-[8px] bg-green-100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-green-700">Anggota Tim</Text>
                </View>
              )}
            </View>
          </View>

          {error && (
            <View className="px-[20px] py-[8px]">
              <FormError message={error} size={14} />
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <SafeAreaView edges={['bottom']} className="border-t border-slateBorder bg-white">
          <View className="gap-[12px] px-[20px] py-[16px]">
            {canApply && !showJoinForm && (
              <PrimaryButton
                label="Ajukan Diri"
                onPress={() => setShowJoinForm(true)}
              />
            )}

            {!canApply && !isHost && (
              <View className="items-center py-[8px]">
                <Text className="text-[13px] text-slate500">
                  {isExpired 
                    ? 'Pendaftaran sudah ditutup'
                    : isFull 
                    ? 'Tim sudah penuh' 
                    : hasApplied
                    ? 'Permintaan sudah dikirim'
                    : isMember
                    ? 'Kamu sudah menjadi anggota tim'
                    : 'Tidak bisa bergabung saat ini'
                  }
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
}