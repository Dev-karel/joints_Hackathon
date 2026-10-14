import { Download, FileText, Lock, Package, Plus } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import type { AgendaItem, PublicProfile, SessionMaterial, SessionMember } from '@/features/match/api';

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

// ───────────────────────── Peserta Sesi (Figma komponen 144:300) ─────────────────────────
// Varian: Terisi, Host, Kamu, Kosong. Foto tidak ada di data, jadi tampil inisial berwarna.

type SeatProps =
  | { variant: 'kosong' }
  | { variant: 'terisi' | 'host' | 'kamu'; name: string; avatarUrl: string | null };

function Seat(props: SeatProps) {
  if (props.variant === 'kosong') {
    return (
      <View className="w-[84px] items-center gap-[6px]">
        <View className="h-[72px] w-[72px] items-center justify-center rounded-full border-[1.5px] border-dashed border-slateBorderMuted bg-slateSurface">
          <Plus size={22} color={palette.slateMuted} />
        </View>
        <Text className="text-[12px] font-semibold text-slateMuted">Kosong</Text>
      </View>
    );
  }
  const ring =
    props.variant === 'host'
      ? 'border-[3px] border-accent'
      : props.variant === 'kamu'
        ? 'border-[3px] border-primary'
        : '';
  return (
    <View className="w-[84px] items-center gap-[6px]">
      <View className={`h-[72px] w-[72px] items-center justify-center rounded-full ${ring}`}>
        <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
          {props.avatarUrl ? (
            <Image source={{ uri: props.avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Text className="text-[26px] font-extrabold text-primary">
              {props.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        {props.variant === 'host' ? (
          <View className="rounded-full bg-accentSoft px-[6px] py-px" style={{ position: "absolute", bottom: -8 }}>
            <Text className="text-[9px] font-bold text-accentText">Host</Text>
          </View>
        ) : props.variant === 'kamu' ? (
          <View className="rounded-full bg-primary px-[6px] py-px" style={{ position: "absolute", bottom: -8 }}>
            <Text className="text-[9px] font-bold text-white">Kamu</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-[12px] font-semibold text-slateInk" numberOfLines={1}>
        {props.variant === 'kamu' ? 'Kamu' : firstName(props.name)}
      </Text>
    </View>
  );
}

export function ParticipantsCard({
  members,
  capacity,
  hostId,
  userId,
  profiles,
}: {
  members: SessionMember[];
  capacity: number;
  hostId: string | null;
  userId: string | undefined;
  profiles: PublicProfile[];
}) {
  // Host paling depan, sisanya menurut waktu gabung.
  const sorted = [...members].sort((a, b) => {
    if (a.user_id === hostId) return -1;
    if (b.user_id === hostId) return 1;
    return (a.joined_at ?? '').localeCompare(b.joined_at ?? '');
  });
  const empty = Math.max(0, capacity - sorted.length);

  return (
    <View className="gap-[14px] rounded-[20px] border border-slateBorder px-[16px] pb-[16px] pt-[14px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-slateInk">Peserta</Text>
        <View className="rounded-full bg-surfaceSky px-[10px] py-[3px]">
          <Text className="text-[12px] font-bold text-primary">
            {sorted.length}/{capacity} orang
          </Text>
        </View>
      </View>
      <View className="flex-row flex-wrap justify-between gap-y-[14px]">
        {sorted.map((m) => {
          const p = profiles.find((x) => x.id === m.user_id);
          const variant = m.user_id === userId ? 'kamu' : m.user_id === hostId ? 'host' : 'terisi';
          return (
            <Seat key={m.user_id} variant={variant} name={p?.full_name ?? '...'} avatarUrl={p?.avatar_url ?? null} />
          );
        })}
        {Array.from({ length: empty }, (_, i) => (
          <Seat key={`kosong-${i}`} variant="kosong" />
        ))}
        {/* Pengisi tak terlihat supaya baris terakhir tetap rata kiri (justify-between). */}
        {Array.from({ length: (4 - ((sorted.length + empty) % 4)) % 4 }, (_, i) => (
          <View key={`pad-${i}`} className="w-[84px]" />
        ))}
      </View>
      <Text className="text-[13px] text-slate500">
        {empty > 0 ? `Sisa ${empty} tempat` : 'Sesi sudah penuh'}
      </Text>
    </View>
  );
}

// ───────────────────────── Agenda (rundown) ─────────────────────────

export function Rundown({
  agenda,
  endLabel,
  bring,
}: {
  agenda: AgendaItem[];
  endLabel: string;
  bring: string | null;
}) {
  const rows = [...agenda.map((a) => ({ ...a, last: false })), { time: endLabel, text: 'Selesai', last: true }];
  return (
    <View className="gap-[12px]">
      <Text className="text-[16px] font-extrabold text-slateInk">Agenda</Text>
      {agenda.length > 0 ? (
        <View className="relative">
          <View className="bg-[#CFE3F1]" style={{ position: "absolute", bottom: 18, left: 56, top: 18, width: 2 }} />
          {rows.map((r, i) => (
            <View key={i} className="flex-row items-center gap-[12px] py-[7px]">
              <Text className={`w-[40px] text-[13px] font-bold ${r.last ? 'text-slate500' : 'text-primary'}`}>
                {r.time}
              </Text>
              <View
                className={`h-[10px] w-[10px] rounded-full ${
                  r.last ? 'bg-slateMuted' : 'border-2 border-primary bg-white'
                }`}
              />
              <Text
                className={`flex-1 text-[14px] ${r.last ? 'font-semibold text-slate500' : 'text-slateInk'}`}
              >
                {r.text}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-[13px] text-slate500">Host belum menulis agenda untuk sesi ini.</Text>
      )}
      {bring ? (
        <View className="flex-row items-center gap-[8px] rounded-[12px] bg-slate100 px-[12px] py-[10px]">
          <Package size={16} color={palette.slate500} />
          <Text className="flex-1 text-[13px] font-semibold text-[#475569]">Bawa {bring.charAt(0).toLowerCase() + bring.slice(1)}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ───────────────────────── Materi tambahan ─────────────────────────

const sizeLabel = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const kindLabel = (mime: string) => (mime === 'application/pdf' ? 'PDF' : 'Gambar');

export function MaterialsList({
  materials,
  unlocked,
  onOpen,
}: {
  materials: SessionMaterial[];
  /** Hanya anggota sesi yang bisa membuka isi file; nama file terlihat semua pengguna. */
  unlocked: boolean;
  onOpen: (m: SessionMaterial) => void;
}) {
  if (materials.length === 0) return null;
  return (
    <View className="gap-[12px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-slateInk">Materi tambahan</Text>
        {unlocked ? <Text className="text-[12px] font-semibold text-slate500">{materials.length} file</Text> : null}
      </View>
      <View className="rounded-[16px] border border-slateBorder px-[14px]">
        {materials.map((m, i) => (
          <Pressable
            key={m.id}
            onPress={() => onOpen(m)}
            disabled={!unlocked}
            accessibilityRole="button"
            accessibilityLabel={unlocked ? `Unduh ${m.file_name}` : `${m.file_name}, terkunci`}
            className={`flex-row items-center gap-[12px] py-[12px] ${i > 0 ? 'border-t border-slate100' : ''}`}
          >
            <View className={`rounded-[10px] p-[9px] ${unlocked ? 'bg-surfaceSky' : 'bg-slate100'}`}>
              <FileText size={20} color={unlocked ? palette.primary : palette.slate500} />
            </View>
            <View className="flex-1 gap-[2px]">
              <Text className="text-[14px] font-semibold text-slateInk" numberOfLines={2}>
                {m.file_name}
              </Text>
              <Text className="text-[12px] text-slate500">
                {kindLabel(m.mime_type)} · {sizeLabel(m.size_bytes)}
              </Text>
            </View>
            {unlocked ? (
              <Download size={20} color={palette.primary} />
            ) : (
              <Lock size={20} color={palette.slateMuted} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
