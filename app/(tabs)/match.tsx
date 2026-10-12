import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { GlassCard } from '@/components/glass/GlassCard';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useMyCourseIds } from '@/features/courses/hooks';
import type { Partner, StudySession } from '@/features/match/api';
import {
  useJoinSession,
  useLeaveSession,
  usePartners,
  useSessions,
} from '@/features/match/hooks';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';
import { SESSION_KINDS } from '@/lib/validation/studySession';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const pad = (n: number) => String(n).padStart(2, '0');

function whenLabel(startsAt: string, endsAt: string) {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  return `${DAYS[s.getDay()]}, ${s.getDate()}/${s.getMonth() + 1} · ${pad(s.getHours())}:${pad(s.getMinutes())}–${pad(e.getHours())}:${pad(e.getMinutes())}`;
}

export default function MatchScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [tab, setTab] = useState<'belajar' | 'lomba'>('belajar');

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text className="px-[4px] pt-[8px] text-[26px] font-extrabold leading-[32px] text-slateInk">
            Match
          </Text>
          <View className="flex-row gap-[8px]">
            {(['belajar', 'lomba'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
                className={`min-h-[48px] flex-1 items-center justify-center rounded-full ${
                  tab === t ? 'bg-primary' : 'border border-slateBorder bg-white'
                }`}
              >
                <Text
                  className={`text-[15px] font-bold ${tab === t ? 'text-white' : 'text-slateInk'}`}
                >
                  {t === 'belajar' ? 'Belajar' : 'Lomba'}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === 'belajar' ? (
            <Belajar userId={userId} onCreate={() => router.push('/buat-sesi')} />
          ) : (
            <Text className="px-[4px] pt-[6px] text-[14px] leading-[21px] text-slate500">
              Competition Match menyusul. Untuk saat ini, mulai dari Study Match di tab Belajar.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}

function Belajar({ userId, onCreate }: { userId: string | undefined; onCreate: () => void }) {
  const router = useRouter();
  const myCourses = useMyCourseIds(userId);
  const partners = usePartners();
  const sessions = useSessions();
  const join = useJoinSession(userId);
  const leave = useLeaveSession(userId);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<StudySession | null>(null);

  const onJoin = async (id: string) => {
    setError(null);
    try {
      await join.mutateAsync(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal bergabung.');
    }
  };

  const onLeave = async () => {
    if (!leaving) return;
    setError(null);
    try {
      await leave.mutateAsync(leaving.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal keluar dari sesi.');
    }
    setLeaving(null);
  };

  return (
    <View className="gap-[14px]">
      <Text className="px-[4px] pt-[6px] text-[18px] font-bold text-slateInk">Sesi belajar</Text>
      <PrimaryButton label="Buat sesi" onPress={onCreate} />
      {error ? <FormError message={error} /> : null}

      {sessions.isPending ? (
        <ActivityIndicator color={palette.primary} />
      ) : sessions.isError ? (
        <FormError message="Gagal memuat sesi. Periksa internet kamu." />
      ) : sessions.data.length === 0 ? (
        <Text className="px-[4px] text-[14px] leading-[21px] text-slate500">
          Belum ada sesi yang dibuka. Jadilah yang pertama membuat sesi.
        </Text>
      ) : (
        sessions.data.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            userId={userId}
            busy={join.isPending || leave.isPending}
            onJoin={() => void onJoin(s.id)}
            onLeave={() => setLeaving(s)}
          />
        ))
      )}

      <Text className="px-[4px] pt-[10px] text-[18px] font-bold text-slateInk">
        Partner untuk kamu
      </Text>
      {myCourses.data?.length === 0 ? (
        <Pressable onPress={() => router.push('/mata-kuliah')} accessibilityRole="button">
          <GlassCard className="gap-[2px] p-[16px]">
            <Text className="text-[14px] font-bold text-accentText">Pilih mata kuliahmu</Text>
            <Text className="text-[13px] leading-[19px] text-slate500">
              Tanpa mata kuliah, skor kecocokan hanya dari gaya belajar dan jurusan.
            </Text>
          </GlassCard>
        </Pressable>
      ) : null}
      {partners.isPending ? (
        <ActivityIndicator color={palette.primary} />
      ) : partners.isError ? (
        <FormError message="Gagal memuat rekomendasi. Periksa internet kamu." />
      ) : partners.data.length === 0 ? (
        <Text className="px-[4px] text-[14px] leading-[21px] text-slate500">
          Belum ada pengguna lain yang selesai kuis. Rekomendasi muncul saat temanmu ikut bergabung.
        </Text>
      ) : (
        partners.data.map((p) => <PartnerCard key={p.user_id} partner={p} />)
      )}

      <ConfirmModal
        visible={!!leaving}
        title="Keluar dari sesi?"
        message={`Kamu akan keluar dari "${leaving?.title ?? ''}". Kursimu bisa diambil orang lain.`}
        confirmLabel="Keluar"
        cancelLabel="Batal"
        onConfirm={() => void onLeave()}
        onCancel={() => setLeaving(null)}
        loading={leave.isPending}
      />
    </View>
  );
}

function SessionCard({
  session: s,
  userId,
  busy,
  onJoin,
  onLeave,
}: {
  session: StudySession;
  userId: string | undefined;
  busy: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const count = s.study_session_members.length;
  const joined = s.study_session_members.some((m) => m.user_id === userId);
  const isHost = s.host_id === userId;
  const full = count >= s.capacity;

  return (
    <GlassCard strong className="gap-[8px] p-[16px]">
      <Text className="text-[12px] font-bold text-primary">
        {SESSION_KINDS[s.session_kind].toUpperCase()}
      </Text>
      <Text className="text-[17px] font-bold text-slateInk">{s.title}</Text>
      <Text className="text-[13px] leading-[19px] text-slate500">
        {s.courses?.name ?? 'Mata kuliah'} · {s.campus_zones?.name ?? 'Zona'}
      </Text>
      <Text className="text-[13px] text-slate500">{whenLabel(s.starts_at, s.ends_at)}</Text>
      <Text className="text-[13px] font-semibold text-slateInk">
        {count}/{s.capacity} peserta
      </Text>
      {isHost ? (
        <Text className="text-[13px] font-bold text-accentText">Kamu host sesi ini</Text>
      ) : joined ? (
        <PrimaryButton label="Keluar dari sesi" variant="outline" onPress={onLeave} disabled={busy} />
      ) : (
        <PrimaryButton
          label={full ? 'Sesi penuh' : 'Gabung'}
          onPress={onJoin}
          disabled={full || busy}
          size="sm"
        />
      )}
    </GlassCard>
  );
}

function PartnerCard({ partner: p }: { partner: Partner }) {
  const parsed = archetypeIdSchema.safeParse(p.personality_type);
  return (
    <GlassCard className="flex-row items-center gap-[12px] p-[14px]">
      <View className="size-[52px] items-center justify-center rounded-full bg-surfaceSky">
        <Text className="text-[20px] font-extrabold text-primary">
          {p.full_name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 gap-[2px]">
        <Text className="text-[15px] font-bold text-slateInk">{p.full_name}</Text>
        <Text className="text-[13px] text-slate500">
          {[parsed.success ? ARCHETYPES[parsed.data].name : null, p.major]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text className="text-[12px] text-slate500">
          {p.shared_courses > 0
            ? `${p.shared_courses} mata kuliah sama`
            : 'Belum ada mata kuliah yang sama'}
        </Text>
      </View>
      <View className="items-center">
        <Text className="text-[20px] font-extrabold text-primary">{p.score}</Text>
        <Text className="text-[11px] text-slate500">dari 100</Text>
      </View>
    </GlassCard>
  );
}
