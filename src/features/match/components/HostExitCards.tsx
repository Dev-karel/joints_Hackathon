import { Flag, Lock, LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import type { HostExit, HostExitState, PublicProfile } from '@/features/match/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad = (n: number) => String(n).padStart(2, '0');

export const minutesLeft = (deadline: string | null, now: number) =>
  deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 60_000)) : 0;

const leftLabel = (m: number) => (m > 0 ? `sisa ${m} menit` : 'waktu habis');

function CardHead({ title }: { title: string }) {
  return (
    <View className="flex-row items-center gap-[10px]">
      <View className="rounded-[10px] bg-dangerSoft p-[8px]">
        <LogOut size={18} color={palette.danger} />
      </View>
      <Text className="flex-1 text-[15px] font-bold text-slateInk">{title}</Text>
    </View>
  );
}

function ReasonBox({ reason }: { reason: string }) {
  return (
    <View className="rounded-[10px] bg-slate100 px-[12px] py-[8px]">
      <Text className="text-[13px] text-[#475569]">
        <Text className="text-[13px] font-semibold text-[#475569]">Alasan:</Text> {reason}
      </Text>
    </View>
  );
}

// ───────────────────────── Polling calon host (aksi "transfer") ─────────────────────────

export function PollingCard({
  exit,
  hostName,
  candidates,
  userId,
  state,
  now,
  busy,
  error,
  onSubmit,
}: {
  exit: HostExit;
  hostName: string;
  candidates: PublicProfile[];
  userId: string | undefined;
  state: HostExitState | undefined;
  now: number;
  busy: boolean;
  error: string | null;
  onSubmit: (candidateId: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = picked ?? state?.my_candidate_id ?? null;
  const left = minutesLeft(exit.vote_deadline, now);

  return (
    <View className="gap-[12px] rounded-[20px] border-[1.5px] border-primary bg-white p-[16px]">
      <CardHead title={`${hostName} keluar sebagai host`} />
      <ReasonBox reason={exit.reason} />
      <View className="flex-row items-center justify-between">
        <Text className="text-[14px] font-bold text-slateInk">Pilih host baru</Text>
        <Text className="text-[12px] font-semibold text-accentText">{leftLabel(left)}</Text>
      </View>
      {candidates.map((c) => {
        const active = c.id === chosen;
        return (
          <Pressable
            key={c.id}
            onPress={() => setPicked(c.id)}
            disabled={left === 0}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={`flex-row items-center gap-[12px] rounded-[14px] px-[14px] py-[12px] ${
              active ? 'border-2 border-primary bg-surfaceSky' : 'border-[1.5px] border-slateBorder bg-white'
            }`}
          >
            <View
              className={`h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                active ? 'border-primary' : 'border-slateBorderMuted'
              }`}
            >
              {active ? <View className="h-[8px] w-[8px] rounded-full bg-primary" /> : null}
            </View>
            <Text className="flex-1 text-[14px] font-semibold text-slateInk">
              {c.id === userId ? 'Kamu (ajukan diri)' : c.full_name}
            </Text>
          </Pressable>
        );
      })}
      <Text className="text-[12px] text-slate500">
        Suara terbanyak menang. Kalau nggak ada yang memilih, sesi jalan tanpa host.
      </Text>
      {error ? <FormError message={error} size={12} /> : null}
      <Pressable
        onPress={() => chosen && onSubmit(chosen)}
        disabled={!chosen || busy || left === 0}
        accessibilityRole="button"
        className={`items-center rounded-full bg-primary py-[13px] ${!chosen || busy || left === 0 ? 'opacity-50' : ''}`}
      >
        <Text className="text-[14px] font-bold text-white">
          {state?.my_candidate_id ? 'Ubah pilihan' : 'Kirim pilihan'}
        </Text>
      </Pressable>
    </View>
  );
}

// ───────────────────────── Voting pembatalan (aksi "cancel") ─────────────────────────

export function VotingCard({
  exit,
  hostName,
  state,
  now,
  busy,
  error,
  onVote,
}: {
  exit: HostExit;
  hostName: string;
  state: HostExitState | undefined;
  now: number;
  busy: boolean;
  error: string | null;
  onVote: (approve: boolean) => void;
}) {
  const required = exit.required_votes ?? 1;
  const approvals = state?.approvals ?? 0;
  const left = minutesLeft(exit.vote_deadline, now);
  const progress = Math.min(1, approvals / required);
  const disabled = busy || left === 0;

  return (
    <View className="gap-[12px] rounded-[20px] border-[1.5px] border-primary bg-white p-[16px]">
      <CardHead title={`${hostName} mengajukan pembatalan`} />
      <ReasonBox reason={exit.reason} />
      <View className="flex-row items-center justify-between">
        <Text className="text-[14px] font-semibold text-slateInk">
          {approvals} dari {exit.eligible_voters} setuju · butuh {required}
        </Text>
        <Text className="text-[12px] font-semibold text-accentText">{leftLabel(left)}</Text>
      </View>
      <View className="h-[6px] overflow-hidden rounded-[3px] bg-slate100">
        <View className="h-[6px] rounded-[3px] bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
      <Text className="text-[12px] text-slate500">
        Kalau nggak sampai {required} orang setuju dalam 1 jam, sesi tetap jalan tanpa host.
      </Text>
      {error ? <FormError message={error} size={12} /> : null}
      <View className="flex-row gap-[10px]">
        <Pressable
          onPress={() => onVote(true)}
          disabled={disabled}
          accessibilityRole="button"
          className={`flex-1 items-center rounded-full border-[1.5px] py-[13px] ${
            state?.my_approve === true ? 'border-danger bg-dangerSoft' : 'border-dangerLine'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text className="text-[14px] font-bold text-danger">Setuju batal</Text>
        </Pressable>
        <Pressable
          onPress={() => onVote(false)}
          disabled={disabled}
          accessibilityRole="button"
          className={`flex-1 items-center rounded-full py-[13px] ${
            state?.my_approve === false ? 'bg-[#005A94]' : 'bg-primary'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          <Text className="text-[14px] font-bold text-white">Tetap jalan</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ───────────────────────── Sesi tanpa host (terkunci) + riwayat ─────────────────────────

export function LockedBanner() {
  return (
    <View className="flex-row items-start gap-[10px] rounded-[16px] border border-accent200 bg-accent50 px-[14px] py-[12px]">
      <Lock size={20} color={palette.accentText} />
      <View className="flex-1 gap-[2px]">
        <Text className="text-[14px] font-bold text-accent800">Sesi ini tanpa host</Text>
        <Text className="text-[12px] text-accentText">
          Detail sesi dan materi terkunci, nggak ada yang bisa mengubah. Sesinya tetap jalan.
        </Text>
      </View>
    </View>
  );
}

function resultLabel(e: HostExit) {
  if (e.result === 'pending') return 'Menunggu hasil';
  if (e.result === 'na') return 'Sesi dibatalkan';
  if (e.action === 'transfer') return e.result === 'passed' ? 'Host baru terpilih' : 'Polling tanpa suara';
  return e.result === 'passed' ? 'Sesi dibatalkan' : 'Pembatalan tidak disetujui';
}

export function HostHistory({
  exits,
  nameOf,
  userId,
  onReport,
}: {
  exits: HostExit[];
  nameOf: (id: string) => string;
  userId: string | undefined;
  onReport: (exit: HostExit) => void;
}) {
  if (exits.length === 0) return null;
  return (
    <View className="gap-[10px] rounded-[20px] border border-slateBorder px-[16px] py-[14px]">
      <Text className="text-[14px] font-bold text-slateInk">Riwayat keluar host</Text>
      {exits.map((e, i) => {
        const d = new Date(e.created_at);
        const mine = e.host_id === userId;
        return (
          <View key={e.id} className="gap-[8px]">
            <View className="gap-[2px]">
              <Text className="text-[13px] font-semibold text-slateInk">
                {nameOf(e.host_id)} · keluar {d.getDate()} {MONTHS[d.getMonth()]}, {pad(d.getHours())}.{pad(d.getMinutes())}
              </Text>
              <Text className="text-[12px] text-slate500">
                Alasan: {e.reason} · {resultLabel(e)}
              </Text>
            </View>
            {i === 0 && !mine && e.result !== 'na' ? (
              <Pressable
                onPress={() => onReport(e)}
                accessibilityRole="button"
                accessibilityLabel={`Laporkan ${nameOf(e.host_id)}`}
                className="flex-row items-center justify-center gap-[6px] rounded-full border-[1.5px] border-dangerLine py-[11px]"
              >
                <Flag size={16} color={palette.danger} />
                <Text className="text-[14px] font-bold text-danger">Laporkan {nameOf(e.host_id).split(' ')[0]}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
