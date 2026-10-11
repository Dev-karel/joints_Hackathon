import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { glass, glassShadow } from './tokens';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Lebih pekat untuk teks panjang / modal. */
  strong?: boolean;
  /** Tepi biru + tint, untuk pilihan yang aktif. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Kartu kaca: putih translusen, tepi tipis terang, sorot garis di sisi atas.
export function GlassCard({
  children,
  className = '',
  strong = false,
  active = false,
  style,
}: GlassCardProps) {
  return (
    <View
      className={`overflow-hidden rounded-[24px] border ${className}`}
      style={[
        glassShadow,
        {
          backgroundColor: active
            ? 'rgba(230, 243, 251, 0.92)'
            : strong
              ? glass.surfaceStrong
              : glass.surface,
          borderColor: active ? glass.starPrimary : glass.border,
          borderWidth: active ? 2 : 1,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        className="absolute left-[16px] right-[16px] top-0 h-px"
        style={{ backgroundColor: glass.sheen }}
      />
      {children}
    </View>
  );
}
