import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/AppText';

type RankRowProps = {
  title: string;
  subtitle?: string;
  /** Angka utama di kanan (jumlah orang, skor). */
  value: number | string;
  /** Satuan kecil di bawah angka (mis. "orang", "dari 100"). */
  unit?: string;
  /** Penanda tingkat (warna dari palet). Selalu disertai angka, jadi warna bukan satu-satunya info. */
  dotColor?: string;
  /** Baris teratas: bingkai biru. */
  highlight?: boolean;
  /** Mis. foto profil; menggantikan titik. */
  leading?: ReactNode;
  onPress?: () => void;
  a11yLabel: string;
};

// Baris daftar berperingkat: label di kiri, angka besar rata kanan, latar sendiri per baris.
export function RankRow({
  title,
  subtitle,
  value,
  unit,
  dotColor,
  highlight = false,
  leading,
  onPress,
  a11yLabel,
}: RankRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
      className={`min-h-[60px] flex-row items-center gap-[12px] rounded-[16px] bg-white px-[14px] py-[10px] ${
        highlight ? 'border-2 border-primary' : 'border border-slateBorder'
      }`}
    >
      {leading ??
        (dotColor ? (
          <View
            className="size-[12px] rounded-full border border-slateBorderMuted"
            style={{ backgroundColor: dotColor }}
          />
        ) : null)}
      <View className="flex-1 gap-[2px]">
        <Text numberOfLines={1} className="text-[15px] font-bold text-slateInk">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="text-[12px] text-slate500">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="items-end">
        <Text className="text-[24px] font-extrabold leading-[28px] text-primary">{value}</Text>
        {unit ? <Text className="text-[11px] text-slate500">{unit}</Text> : null}
      </View>
    </Pressable>
  );
}
