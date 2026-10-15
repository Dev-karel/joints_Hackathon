import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';

import { glassShadow } from '@/components/glass/tokens';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';

import type { PresenceMember } from '../api';

// Bagian layar Peta dari frame Figma "Peta - Ruangan" (138:55), komponen "Kartu Ruangan"
// (138:54), "Peta - Di Luar Wi-Fi Kampus" (139:165), dan "Peta - Lokasi Mati" (139:279).

export type RoomState = 'mine' | 'busy' | 'calm' | 'empty';

const CARD: Record<RoomState, { box: string; text: string }> = {
  mine: { box: 'bg-primary', text: 'text-white' },
  busy: { box: 'bg-skyBlob', text: 'text-primaryDeep' },
  calm: { box: 'border border-slateBorder bg-white', text: 'text-slateInk' },
  empty: {
    box: 'border border-dashed border-slateBorderMuted bg-slateSurface',
    text: 'text-slateMuted',
  },
};

function Face({ member, ring }: { member: PresenceMember; ring: string }) {
  return (
    <View
      className="size-[28px] items-center justify-center overflow-hidden rounded-full border-2 bg-surfaceSky"
      style={{ borderColor: ring }}
    >
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="text-[12px] font-bold text-primary">
          {member.full_name.trim().charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

type RoomCardProps = {
  name: string;
  state: RoomState;
  amount: string;
  faces: PresenceMember[];
  matchCount: number;
  onPress?: () => void;
  a11yLabel: string;
};

/** Kartu satu ruangan. Status: Kamu di sini / Ramai (≥3) / Tenang (1–2) / Sepi (0). */
export function RoomCard({
  name,
  state,
  amount,
  faces,
  matchCount,
  onPress,
  a11yLabel,
}: RoomCardProps) {
  const c = CARD[state];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
      className={`min-h-[96px] flex-1 gap-[8px] rounded-[18px] p-[14px] ${c.box}`}
    >
      <View className="flex-row items-center justify-between gap-[6px]">
        <Text numberOfLines={1} className={`flex-1 text-[15px] font-bold ${c.text}`}>
          {name}
        </Text>
        {state === 'mine' ? (
          <View className="rounded-full bg-white px-[8px] py-[2px]">
            <Text className="text-[12px] font-bold text-primary">Kamu di sini</Text>
          </View>
        ) : null}
      </View>
      {faces.length > 0 ? (
        <View className="flex-row">
          {faces.slice(0, 3).map((m, i) => (
            <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Face member={m} ring={state === 'mine' ? palette.primary : '#FFFFFF'} />
            </View>
          ))}
        </View>
      ) : null}
      <Text className={`text-[20px] font-extrabold ${c.text}`}>{amount}</Text>
      {matchCount > 0 ? (
        <View className="self-start rounded-full bg-accentSoft px-[8px] py-[3px]">
          <Text className="text-[11px] font-bold text-accentText">{matchCount} cocok denganmu</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type BannerProps = { icon: LucideIcon; title: string; subtitle: string; active: boolean };

/** Banner status Wi-Fi di bawah judul. */
export function StatusBanner({ icon: Icon, title, subtitle, active }: BannerProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className={`flex-row items-center gap-[12px] rounded-[16px] px-[12px] py-[10px] ${
        active ? 'bg-surfaceSky' : 'bg-slate100'
      }`}
    >
      <View
        className={`size-[38px] items-center justify-center rounded-[12px] ${
          active ? 'bg-primary' : 'bg-slateBorderMuted'
        }`}
      >
        <Icon size={20} color={active ? '#FFFFFF' : palette.slate500} strokeWidth={2.2} />
      </View>
      <View className="flex-1 gap-[1px]">
        <Text className={`text-[14px] font-bold ${active ? 'text-slateInk' : 'text-slate500'}`}>
          {title}
        </Text>
        <Text className="text-[12px] text-slate500">{subtitle}</Text>
      </View>
    </View>
  );
}

type NoticeProps = { icon: LucideIcon; title: string; body: string; children: ReactNode };

/** Kartu popup di atas daftar ruangan yang dipudarkan (bukan modal: tab bar tetap bisa dipakai). */
export function NoticeCard({ icon: Icon, title, body, children }: NoticeProps) {
  return (
    <View
      style={glassShadow}
      className="items-center gap-[12px] rounded-[28px] bg-white px-[24px] pb-[22px] pt-[26px]"
    >
      <View className="size-[56px] items-center justify-center rounded-full bg-surfaceSky">
        <Icon size={26} color={palette.primary} strokeWidth={2.2} />
      </View>
      <Text className="text-center text-[19px] font-extrabold text-slateInk">{title}</Text>
      <Text className="text-center text-[14px] leading-[21px] text-slate500">{body}</Text>
      {children}
    </View>
  );
}
