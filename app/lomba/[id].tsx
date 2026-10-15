import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Clock, ExternalLink, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import type { PersonRef } from '@/features/lomba/api';
import {
  useCancelJoinRequest,
  useLeaveTeam,
  useOpeningDetail,
  useRespondToJoinRequest,
  useSendJoinRequest,
} from '@/features/lomba/hooks';
import { archetypeName, archetypePill } from '@/features/personality/archetype';
import { joinMessageSchema } from '@/lib/validation/competition';
import { useNow } from '@/lib/useNow';

function Avatar({ person, size = 44 }: { person: PersonRef | null; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden bg-surfaceSky"
    >
      {person?.avatar_url ? (
        <Image source={{ uri: person.avatar_url }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="text-[16px] font-bold text-primary">
          {(person?.full_name ?? '?').charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function ArchetypePill({ type }: { type: string | null }) {
  const pill = archetypePill(type);
  const name = archetypeName(type);
  if (!pill || !name) return null;
  return (
    <View className="self-start rounded-full px-[9px] py-[3px]" style={{ backgroundColor: pill.bg }}>
      <Text className="text-[12px] font-bold" style={{ color: pill.text }}>
        {name}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-[16px] font-extrabold text-slateInk">{children}</Text>;
}

// Detail lowongan tim lomba (PRD §8). Kuota, penutupan, dan hak host dijaga database
// (trigger + RPC respond_team_request / leave_team), bukan layar ini.
export default function LombaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const now = useNow();

  const detail = useOpeningDetail(id);
  const sendRequest = useSendJoinRequest();
  const cancelRequest = useCancelJoinRequest(id);
  const respond = useRespondToJoinRequest(id);
  const leave = useLeaveTeam(id);

  const [formOpen, setFormOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!id || !userId) return null;

  const header = (
    <View className="flex-row items-center gap-[12px] border-b border-slateBorder px-[20px] py-[12px]">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        className="h-[48px] w-[48px] items-center justify-center"
      >
        <ArrowLeft size={24} color={palette.slateInk} />
      </Pressable>
      <Text className="flex-1 text-[18px] font-extrabold text-slateInk">Detail Lowongan</Text>
    </View>
  );

  if (detail.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <View className="flex-1 bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1" edges={['top']}>
          {header}
          <View className="flex-1 items-center justify-center gap-[10px] px-[20px]">
            <FormError
              message={detail.isError ? 'Gagal memuat lowongan. Periksa internet kamu.' : 'Lowongan tidak ditemukan.'}
              size={14}
            />
            <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void detail.refetch()} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { opening, host, requests, roster } = detail.data;
  const isHost = opening.host_id === userId;
  const isMember = roster.some((m) => m.id === userId);
  const myRequest = requests.find((r) => r.user_id === userId);
  const pending = requests.filter((r) => r.status === 'requested');
  const deadline = new Date(opening.registration_deadline);
  const isExpired = deadline.getTime() <= now;
  const isFull = opening.current_members >= opening.team_size;
  const isClosed = opening.status !== 'open' || isExpired || isFull;
  const canApply = !isHost && !isMember && !myRequest && !isClosed;
  const busy = sendRequest.isPending || cancelRequest.isPending || respond.isPending || leave.isPending;

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.');
    }
  };

  const openForm = () => {
    setFormError(null);
    setRole(opening.roles_needed.length === 1 ? opening.roles_needed[0] : null);
    setFormOpen(true);
  };

  const submitRequest = async () => {
    if (!role) {
      setFormError('Pilih peran yang kamu lamar.');
      return;
    }
    const parsed = joinMessageSchema.safeParse(message);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Pesan tidak valid.');
      return;
    }
    setFormError(null);
    try {
      await sendRequest.mutateAsync({ opening_id: id, user_id: userId, role_applied: role, message: parsed.data });
      setFormOpen(false);
      setMessage('');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal mengirim permintaan.');
    }
  };

  const confirmLeave = (memberId: string, name: string) => {
    const self = memberId === userId;
    Alert.alert(
      self ? 'Keluar dari tim?' : `Keluarkan ${name}?`,
      self ? 'Kamu bisa mengajukan diri lagi selama pendaftaran masih dibuka.' : 'Anggota ini akan dikeluarkan dari tim.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: self ? 'Keluar' : 'Keluarkan',
          style: 'destructive',
          onPress: () => void run(() => leave.mutateAsync(memberId)),
        },
      ],
    );
  };

  const openProfile = (personId: string) =>
    personId === userId ? router.push('/profil') : router.push({ pathname: '/profil/[id]', params: { id: personId } });

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={['top']}>
        {header}

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="gap-[16px] px-[20px] py-[20px]">
            <View className="flex-row items-start gap-[12px]">
              <View className="h-[48px] w-[48px] items-center justify-center rounded-[24px] bg-accentSoft">
                <Trophy size={24} color={palette.accentText} />
              </View>
              <View className="flex-1 gap-[4px]">
                <Text className="text-[20px] font-extrabold text-slateInk">{opening.competition_name}</Text>
                <View className="flex-row flex-wrap items-center gap-[8px]">
                  <View className="rounded-[6px] bg-accent px-[8px] py-[3px]">
                    <Text className="text-[11px] font-semibold text-slateInk">{opening.category}</Text>
                  </View>
                  <View className="flex-row items-center gap-[4px]">
                    <Clock size={12} color={palette.slate500} />
                    <Text className="text-[11px] text-slate500">
                      Daftar s/d {deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-[8px]">
              <View className="rounded-[8px] bg-surfaceSky px-[10px] py-[4px]">
                <Text className="text-[12px] font-semibold text-primary">
                  {opening.current_members}/{opening.team_size} anggota
                </Text>
              </View>
              {isFull ? (
                <View className="rounded-[8px] bg-red-100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-red-700">Tim penuh</Text>
                </View>
              ) : null}
              {isExpired ? (
                <View className="rounded-[8px] bg-slate100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-slate500">Pendaftaran tutup</Text>
                </View>
              ) : null}
              {isMember ? (
                <View className="rounded-[8px] bg-green-100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-green-700">Kamu anggota tim</Text>
                </View>
              ) : null}
              {myRequest?.status === 'requested' ? (
                <View className="rounded-[8px] bg-blue-100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-blue-700">Menunggu respons host</Text>
                </View>
              ) : null}
              {myRequest?.status === 'rejected' ? (
                <View className="rounded-[8px] bg-red-100 px-[10px] py-[4px]">
                  <Text className="text-[12px] font-semibold text-red-700">Permintaan ditolak</Text>
                </View>
              ) : null}
            </View>

            {opening.description ? (
              <Text className="text-[14px] leading-[21px] text-slateInk">{opening.description}</Text>
            ) : null}

            {opening.guidebook_url ? (
              <Pressable
                onPress={() => void Linking.openURL(opening.guidebook_url!).catch(() => setError('Tautan tidak bisa dibuka.'))}
                accessibilityRole="link"
                accessibilityLabel="Buka guidebook lomba"
                className="flex-row items-center gap-[8px] self-start rounded-full border border-slateBorder px-[14px] py-[8px]"
              >
                <ExternalLink size={14} color={palette.primary} />
                <Text className="text-[13px] font-semibold text-primary">Buka guidebook</Text>
              </Pressable>
            ) : null}
          </View>

          {opening.roles_needed.length > 0 ? (
            <View className="gap-[10px] px-[20px] pb-[20px]">
              <SectionTitle>Peran yang dicari</SectionTitle>
              <View className="flex-row flex-wrap gap-[8px]">
                {opening.roles_needed.map((r) => (
                  <View key={r} className="rounded-full bg-slate100 px-[12px] py-[6px]">
                    <Text className="text-[12px] font-semibold text-slateInk">{r}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View className="gap-[10px] px-[20px] pb-[20px]">
            <SectionTitle>Tim</SectionTitle>
            {host ? (
              <Pressable
                onPress={() => openProfile(host.id)}
                accessibilityRole="button"
                accessibilityLabel={`Lihat profil ${host.full_name}`}
                className="flex-row items-center gap-[12px] rounded-[16px] border border-slateBorder p-[12px]"
              >
                <Avatar person={host} />
                <View className="flex-1 gap-[3px]">
                  <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
                    {host.full_name}
                  </Text>
                  <Text className="text-[11px] text-slate500" numberOfLines={1}>
                    Pembuat lowongan{host.major ? ` · ${host.major}` : ''}
                  </Text>
                  <ArchetypePill type={host.personality_type} />
                </View>
              </Pressable>
            ) : null}
            {roster.map((m) => (
              <View key={m.id} className="flex-row items-center gap-[12px] rounded-[16px] border border-slateBorder p-[12px]">
                <Pressable
                  onPress={() => openProfile(m.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Lihat profil ${m.full_name}`}
                  className="flex-1 flex-row items-center gap-[12px]"
                >
                  <Avatar person={m} />
                  <View className="flex-1 gap-[3px]">
                    <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
                      {m.full_name}
                    </Text>
                    <Text className="text-[11px] text-slate500" numberOfLines={1}>
                      {[m.role_applied, m.major].filter(Boolean).join(' · ')}
                    </Text>
                    <ArchetypePill type={m.personality_type} />
                  </View>
                </Pressable>
                {isHost || m.id === userId ? (
                  <Pressable
                    onPress={() => confirmLeave(m.id, m.full_name)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={m.id === userId ? 'Keluar dari tim' : `Keluarkan ${m.full_name}`}
                    className="rounded-full border border-slateBorder px-[12px] py-[7px]"
                  >
                    <Text className="text-[11px] font-bold text-slateInk">{m.id === userId ? 'Keluar' : 'Keluarkan'}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            {roster.length === 0 ? <Text className="text-[13px] text-slate500">Belum ada anggota lain.</Text> : null}
          </View>

          {isHost ? (
            <View className="gap-[10px] px-[20px] pb-[20px]">
              <SectionTitle>{`Permintaan bergabung${pending.length > 0 ? ` (${pending.length})` : ''}`}</SectionTitle>
              {pending.length === 0 ? (
                <Text className="text-[13px] text-slate500">Belum ada permintaan baru.</Text>
              ) : (
                pending.map((r) => (
                  <View key={r.user_id} className="gap-[10px] rounded-[16px] border border-slateBorder p-[12px]">
                    <Pressable
                      onPress={() => openProfile(r.user_id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Lihat profil ${r.person?.full_name ?? 'pelamar'}`}
                      className="flex-row items-center gap-[12px]"
                    >
                      <Avatar person={r.person} />
                      <View className="flex-1 gap-[3px]">
                        <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
                          {r.person?.full_name ?? 'Pengguna'}
                        </Text>
                        <Text className="text-[11px] text-slate500" numberOfLines={1}>
                          {[r.role_applied ? `Melamar: ${r.role_applied}` : null, r.person?.major]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        <ArchetypePill type={r.person?.personality_type ?? null} />
                      </View>
                    </Pressable>
                    {r.message ? <Text className="text-[13px] text-slate500">“{r.message}”</Text> : null}
                    <View className="flex-row gap-[8px]">
                      <View className="flex-1">
                        <PrimaryButton
                          label="Terima"
                          disabled={busy || isFull}
                          loading={respond.isPending && respond.variables?.userId === r.user_id && respond.variables.accept}
                          onPress={() => void run(() => respond.mutateAsync({ userId: r.user_id, accept: true }))}
                        />
                      </View>
                      <View className="flex-1">
                        <PrimaryButton
                          label="Tolak"
                          variant="outline"
                          disabled={busy}
                          loading={respond.isPending && respond.variables?.userId === r.user_id && !respond.variables.accept}
                          onPress={() => void run(() => respond.mutateAsync({ userId: r.user_id, accept: false }))}
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {error ? (
            <View className="px-[20px] pb-[8px]">
              <FormError message={error} size={14} />
            </View>
          ) : null}
        </ScrollView>

        {!isHost ? (
          <SafeAreaView edges={['bottom']} className="border-t border-slateBorder bg-white">
            <View className="gap-[8px] px-[20px] py-[16px]">
              {canApply ? (
                <PrimaryButton label="Ajukan diri" onPress={openForm} />
              ) : myRequest?.status === 'requested' ? (
                <PrimaryButton
                  label="Batalkan Permintaan"
                  variant="outline"
                  loading={cancelRequest.isPending}
                  onPress={() => void run(() => cancelRequest.mutateAsync(userId))}
                />
              ) : (
                <View className="items-center py-[8px]">
                  <Text className="text-[13px] text-slate500">
                    {isMember
                      ? 'Kamu sudah menjadi anggota tim'
                      : myRequest?.status === 'rejected'
                        ? 'Permintaanmu ditolak host'
                        : isExpired
                          ? 'Pendaftaran sudah ditutup'
                          : isFull
                            ? 'Tim sudah penuh'
                            : 'Tidak bisa bergabung saat ini'}
                  </Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        ) : null}
      </SafeAreaView>

      <BottomSheet visible={formOpen} onClose={() => setFormOpen(false)}>
        <Text className="w-full text-[20px] font-extrabold text-slateInk">Ajukan diri</Text>
        <Text className="w-full text-[13px] text-slate500">Pilih peran yang kamu lamar.</Text>
        <View className="w-full flex-row flex-wrap gap-[8px]">
          {opening.roles_needed.map((r) => {
            const active = role === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`rounded-full border px-[14px] py-[8px] ${
                  active ? 'border-primary bg-primary' : 'border-slateBorder bg-white'
                }`}
              >
                <Text className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}>{r}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          maxFontSizeMultiplier={1.3}
          value={message}
          onChangeText={setMessage}
          placeholder="Pesan singkat untuk host (opsional)"
          placeholderTextColor={palette.slate500}
          multiline
          maxLength={200}
          accessibilityLabel="Pesan untuk host"
          style={{ fontFamily: INTER.regular, minHeight: 72, textAlignVertical: 'top' }}
          className="w-full rounded-[14px] border border-slateBorder px-[14px] py-[10px] text-[14px] text-slateInk"
        />
        {formError ? <FormError message={formError} size={12} /> : null}
        <View className="w-full gap-[8px]">
          <PrimaryButton label="Kirim permintaan" onPress={submitRequest} loading={sendRequest.isPending} />
          <PrimaryButton label="Batal" variant="outline" onPress={() => setFormOpen(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}
