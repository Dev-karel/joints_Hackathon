import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogOut,
  MapPin,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
  Wifi,
  CircleCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useConversations } from '@/features/chat/hooks';
import { formatRange } from '@/features/events/format';
import { useMapStore } from '@/features/map/mapStore';
import { signedMaterialUrl, type HostExit, type SessionMaterial } from '@/features/match/api';
import {
  HostHistory,
  LockedBanner,
  PollingCard,
  VotingCard,
} from '@/features/match/components/HostExitCards';
import { MaterialsList, ParticipantsCard, Rundown } from '@/features/match/components/SessionParts';
import { HostLeaveSheet, LeaveSheet, ReportSheet } from '@/features/match/components/SessionSheets';
import {
  useCastHostVote,
  useHostExits,
  useHostExitState,
  useHostLeave,
  useJoinSession,
  useLeaveSession,
  useMaterials,
  useProfiles,
  useReportHost,
  useSession,
} from '@/features/match/hooks';
import { archetypeName } from '@/features/personality/archetype';
import { useNow } from '@/lib/useNow';
import { SESSION_KINDS } from '@/lib/validation/studySession';

const HOUR = 3_600_000;
const pad = (n: number) => String(n).padStart(2, '0');
const clock = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
};

function Tag({ icon: Icon, label, tone }: { icon: typeof BookOpen; label: string; tone: 'sky' | 'slate' }) {
  return (
    <View className={`flex-row items-center gap-[5px] rounded-[8px] px-[9px] py-[3px] ${tone === 'sky' ? 'bg-surfaceSky' : 'bg-slate100'}`}>
      <Icon size={14} color={tone === 'sky' ? palette.primary : palette.ink} />
      <Text className={`text-[12px] font-bold ${tone === 'sky' ? 'text-primary' : 'text-slateInk'}`}>{label}</Text>
    </View>
  );
}

function Banner({ title, sub, tone }: { title: string; sub: string; tone: 'green' | 'amber' }) {
  return (
    <View
      className={`flex-row items-center gap-[10px] rounded-[16px] border px-[14px] py-[12px] ${
        tone === 'green' ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-accent200 bg-accent50'
      }`}
    >
      <CircleCheck size={22} color={tone === 'green' ? '#16A34A' : palette.accentText} />
      <View className="flex-1 gap-px">
        <Text className={`text-[14px] font-bold ${tone === 'green' ? 'text-[#166534]' : 'text-accent800'}`}>{title}</Text>
        <Text className={`text-[12px] ${tone === 'green' ? 'text-[#166534]' : 'text-accentText'}`}>{sub}</Text>
      </View>
    </View>
  );
}

// Detail sesi belajar. Satu layar untuk semua keadaan di Figma: belum gabung, sudah gabung,
// konfirmasi keluar, host (termasuk batas H-24), polling host, voting batal, dan sesi tanpa host.
// Aturannya ditegakkan database (kuota, fungsi host_leave_session); layar ini hanya menampilkan.
export default function SesiDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const now = useNow(30_000);
  const mapStatus = useMapStore((s) => s.status);
  const mapZone = useMapStore((s) => s.zoneName);

  const session = useSession(id);
  const s = session.data;
  const members = s?.study_session_members ?? [];
  const isMember = members.some((m) => m.user_id === userId);
  const isHost = !!s && s.host_id === userId;

  const exits = useHostExits(id, isMember);
  const latest: HostExit | undefined = exits.data?.[0];
  const pending = latest?.result === 'pending' ? latest : undefined;
  const exitState = useHostExitState(isMember ? pending?.id : undefined);
  const materials = useMaterials(id);
  const conversations = useConversations();
  const chat = isMember ? (conversations.data ?? []).find((c) => c.session_id === id) : undefined;

  const profiles = useProfiles([
    ...members.map((m) => m.user_id),
    ...(s?.host_id ? [s.host_id] : []),
    ...(exits.data ?? []).map((e) => e.host_id),
  ]);
  const nameOf = (uid: string) => profiles.data?.find((p) => p.id === uid)?.full_name ?? '...';

  const join = useJoinSession(userId);
  const leave = useLeaveSession(userId);
  const hostLeave = useHostLeave();
  const castVote = useCastHostVote(id);
  const report = useReportHost();

  const [error, setError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [hostLeaveOpen, setHostLeaveOpen] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<HostExit | null>(null);
  const [reported, setReported] = useState(false);

  if (session.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }
  if (session.isError || !s) {
    return (
      <SafeAreaView className="flex-1 bg-white px-[20px] pt-[16px]" edges={['top', 'bottom']}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          className="h-[40px] w-[40px] items-center justify-center rounded-full border border-slateBorder"
        >
          <ChevronLeft size={20} color={palette.slate500} />
        </Pressable>
        <View className="gap-[10px] pt-[24px]">
          <FormError message="Sesi tidak ditemukan." size={14} />
          <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void session.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const startMs = new Date(s.starts_at).getTime();
  const endMs = new Date(s.ends_at).getTime();
  const finished = now >= endMs;
  const cancelled = s.status === 'cancelled';
  const full = members.length >= s.capacity;
  const noHost = s.host_id === null;
  const within24h = startMs - now < 24 * HOUR;
  const hostAlone = isHost && members.length <= 1;
  const inThisZone = mapStatus === 'in_zone' && !!mapZone && mapZone === s.campus_zones?.name;
  const host = s.host_id ? profiles.data?.find((p) => p.id === s.host_id) : undefined;
  const memberProfiles = (profiles.data ?? []).filter((p) => members.some((m) => m.user_id === p.id));
  const polling = pending?.action === 'transfer' ? pending : undefined;
  const voting = pending?.action === 'cancel' ? pending : undefined;

  const fail = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

  const onJoin = async () => {
    setError(null);
    try {
      await join.mutateAsync({ sessionId: s.id, startsAt: s.starts_at, title: s.title });
    } catch (e) {
      setError(fail(e, 'Gagal bergabung.'));
    }
  };

  const onLeave = async () => {
    setSheetError(null);
    try {
      await leave.mutateAsync(s.id);
      setLeaveOpen(false);
    } catch (e) {
      setSheetError(fail(e, 'Gagal keluar dari sesi.'));
    }
  };

  const onHostLeave = async (reason: string, action: 'transfer' | 'cancel') => {
    setSheetError(null);
    try {
      await hostLeave.mutateAsync({ sessionId: s.id, reason, action });
      setHostLeaveOpen(false);
      if (hostAlone) router.back();
    } catch (e) {
      setSheetError(fail(e, 'Gagal mengajukan keluar.'));
    }
  };

  const vote = async (v: { candidateId: string } | { approve: boolean }) => {
    if (!pending) return;
    setError(null);
    try {
      await castVote.mutateAsync({ exitId: pending.id, vote: v });
    } catch (e) {
      setError(fail(e, 'Gagal mengirim pilihan.'));
    }
  };

  const onOpenMaterial = async (m: SessionMaterial) => {
    setError(null);
    try {
      await Linking.openURL(await signedMaterialUrl(m.file_path));
    } catch (e) {
      setError(fail(e, 'Gagal membuka file.'));
    }
  };

  const onReport = async (reason: string) => {
    if (!reportTarget || !userId) return;
    setSheetError(null);
    try {
      await report.mutateAsync({ reporterId: userId, hostId: reportTarget.host_id, sessionId: s.id, reason: reason.trim() });
      setReported(true);
    } catch (e) {
      setSheetError(fail(e, 'Gagal mengirim laporan.'));
    }
  };

  const onShare = () => {
    void Share.share({
      message: `${s.title}\n${formatRange(s.starts_at, s.ends_at)}\n${s.campus_zones?.name ?? ''}\n\nGabung lewat AyokMatch!`,
    });
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-[10px] py-[6px] pl-[12px] pr-[16px]">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            hitSlop={10}
          >
            <ChevronLeft size={24} color={palette.slateInk} />
          </Pressable>
          <Text className="flex-1 text-[16px] font-bold text-slateInk">Detail sesi</Text>
          <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Bagikan sesi" hitSlop={10}>
            <Share2 size={22} color={palette.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {cancelled ? (
          <Banner tone="amber" title="Sesi ini dibatalkan" sub="Sesi tidak akan berlangsung." />
        ) : isHost ? (
          <Banner
            tone="green"
            title="Kamu host sesi ini"
            sub={
              hostAlone
                ? 'Belum ada peserta lain. Kamu bisa membatalkan sesi kapan saja.'
                : within24h
                  ? 'Sesi mulai kurang dari 24 jam lagi'
                  : 'Kamu bisa keluar paling lambat 24 jam sebelum sesi mulai'
            }
          />
        ) : isMember ? (
          <Banner tone="green" title="Kamu sudah bergabung" sub="Kamu akan diingatkan 1 jam sebelum mulai" />
        ) : null}

        {/* Hero */}
        <View className="gap-[10px]">
          <View className="flex-row gap-[6px]">
            <Tag icon={BookOpen} label={s.courses?.name ?? 'Mata kuliah'} tone="sky" />
            <Tag icon={Users} label={SESSION_KINDS[s.session_kind]} tone="slate" />
          </View>
          <Text className="text-[24px] font-extrabold leading-[29px] tracking-[-0.36px] text-slateInk">
            {s.title}
          </Text>
          <View className="flex-row items-center gap-[10px]">
            <CalendarDays size={18} color={palette.primary} />
            <Text className="flex-1 text-[14px] font-semibold text-slateInk">{formatRange(s.starts_at, s.ends_at)}</Text>
          </View>
          <View className="flex-row items-center gap-[10px]">
            <MapPin size={18} color={palette.primary} />
            <Text className="text-[14px] font-semibold text-slateInk">{s.campus_zones?.name ?? 'Zona'}</Text>
            {inThisZone ? (
              <View className="flex-row items-center gap-[4px] rounded-full bg-surfaceSky py-[3px] pl-[8px] pr-[9px]">
                <Wifi size={12} color={palette.primary} />
                <Text className="text-[11px] font-bold text-primary">Kamu di sini</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Polling / voting / terkunci */}
        {polling && isMember ? (
          <PollingCard
            exit={polling}
            hostName={nameOf(polling.host_id)}
            candidates={memberProfiles}
            userId={userId}
            state={exitState.data}
            now={now}
            busy={castVote.isPending}
            error={error}
            onSubmit={(candidateId) => void vote({ candidateId })}
          />
        ) : null}
        {voting && isMember ? (
          <VotingCard
            exit={voting}
            hostName={nameOf(voting.host_id)}
            state={exitState.data}
            now={now}
            busy={castVote.isPending}
            error={error}
            onVote={(approve) => void vote({ approve })}
          />
        ) : null}
        {noHost && !pending && !cancelled ? (
          <>
            <LockedBanner />
          </>
        ) : null}
        {isMember ? (
          <HostHistory
            exits={(exits.data ?? []).filter((e) => e.result !== 'pending')}
            nameOf={nameOf}
            userId={userId}
            onReport={(e) => {
              setReported(false);
              setSheetError(null);
              setReportTarget(e);
            }}
          />
        ) : null}

        {/* Host */}
        {host ? (
          <View className="flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder px-[14px] py-[12px]">
            <View className="h-[48px] w-[48px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
              <Text className="text-[18px] font-extrabold text-primary">
                {host.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1 gap-[4px]">
              <View className="flex-row items-center gap-[6px]">
                <Text className="text-[15px] font-bold text-slateInk" numberOfLines={1}>
                  {host.full_name}
                  {isHost ? ' (kamu)' : ''}
                </Text>
                <View className="rounded-full bg-accentSoft px-[7px] py-px">
                  <Text className="text-[10px] font-bold text-accentText">Host</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-[6px]">
                {host.major ? <Text className="text-[12px] text-slate500">{host.major}</Text> : null}
                {archetypeName(host.personality_type) ? (
                  <View className="flex-row items-center gap-[4px] rounded-full border border-[#FAC96E] bg-accentSoft py-[3px] pl-[7px] pr-[8px]">
                    <Sparkles size={12} color="#7C4700" />
                    <Text className="text-[11px] font-bold text-accent800">{archetypeName(host.personality_type)}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        <ParticipantsCard
          members={members}
          capacity={s.capacity}
          hostId={s.host_id}
          userId={userId}
          profiles={profiles.data ?? []}
        />

        {isMember && chat ? (
          <Pressable
            onPress={() => router.push({ pathname: '/pesan/[id]', params: { id: chat.conversation_id } })}
            accessibilityRole="button"
            accessibilityLabel="Buka grup chat sesi"
            className="flex-row items-center gap-[12px] rounded-[16px] border border-slateBorder px-[14px] py-[12px]"
          >
            <View className="h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-surfaceSky">
              <MessageCircle size={20} color={palette.primary} />
            </View>
            <View className="flex-1 gap-px">
              <Text className="text-[14px] font-bold text-slateInk">Grup chat sesi</Text>
              <Text className="text-[12px] text-slate500" numberOfLines={1}>
                {chat.last_content
                  ? `${(chat.last_sender_name ?? '').split(' ')[0]}: ${chat.last_content}`
                  : 'Belum ada pesan'}
              </Text>
            </View>
            {chat.unread > 0 ? (
              <View className="rounded-full bg-primary px-[7px] py-px">
                <Text className="text-[11px] font-bold text-white">{chat.unread}</Text>
              </View>
            ) : null}
            <ChevronRight size={18} color={palette.slate500} />
          </Pressable>
        ) : null}

        <Rundown agenda={s.agenda ?? []} endLabel={clock(s.ends_at)} bring={s.bring_note} />

        <MaterialsList
          materials={materials.data ?? []}
          unlocked={isMember}
          onOpen={(m) => void onOpenMaterial(m)}
        />

        {error && !pending ? <FormError message={error} size={13} /> : null}
      </ScrollView>

      {/* Footer aksi */}
      <SafeAreaView edges={['bottom']} className="border-t border-slateBorder bg-white">
        <View className="gap-[8px] px-[20px] pb-[12px] pt-[12px]">
          {cancelled || finished ? (
            <PrimaryButton label={cancelled ? 'Sesi dibatalkan' : 'Sesi sudah selesai'} disabled onPress={() => undefined} />
          ) : isHost ? (
            <>
              {!hostAlone && within24h ? (
                <View className="flex-row items-center justify-center gap-[6px]">
                  <Clock size={14} color={palette.slate500} />
                  <Text className="text-[12px] text-slate500">
                    Host nggak bisa keluar kurang dari 24 jam sebelum sesi mulai
                  </Text>
                </View>
              ) : null}
              <LeaveButton
                label="Keluar"
                disabled={!hostAlone && within24h}
                onPress={() => {
                  setSheetError(null);
                  setHostLeaveOpen(true);
                }}
              />
            </>
          ) : isMember ? (
            <LeaveButton
              label="Keluar"
              onPress={() => {
                setSheetError(null);
                setLeaveOpen(true);
              }}
            />
          ) : (
            <PrimaryButton
              label={full ? 'Sesi penuh' : 'Gabung sesi'}
              disabled={full}
              loading={join.isPending}
              onPress={() => void onJoin()}
            />
          )}
        </View>
      </SafeAreaView>

      <LeaveSheet
        visible={leaveOpen}
        loading={leave.isPending}
        error={sheetError}
        onConfirm={() => void onLeave()}
        onClose={() => setLeaveOpen(false)}
      />
      <HostLeaveSheet
        key={hostLeaveOpen ? 'open' : 'closed'}
        visible={hostLeaveOpen}
        alone={hostAlone}
        loading={hostLeave.isPending}
        error={sheetError}
        onSubmit={(reason, action) => void onHostLeave(reason, action)}
        onClose={() => setHostLeaveOpen(false)}
      />
      <ReportSheet
        key={reportTarget?.id ?? 'none'}
        visible={!!reportTarget}
        name={reportTarget ? nameOf(reportTarget.host_id) : ''}
        loading={report.isPending}
        error={sheetError}
        done={reported}
        onSubmit={(reason) => void onReport(reason)}
        onClose={() => setReportTarget(null)}
      />
    </View>
  );
}

function LeaveButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      className={`flex-row items-center justify-center gap-[6px] rounded-[28px] py-[14px] ${
        disabled ? 'bg-slate100' : 'border-[1.5px] border-[#FCA5A5]'
      }`}
    >
      <LogOut size={18} color={disabled ? palette.slateMuted : '#B91C1C'} />
      <Text className={`text-[15px] font-bold ${disabled ? 'text-slateMuted' : 'text-[#B91C1C]'}`}>{label}</Text>
    </Pressable>
  );
}
