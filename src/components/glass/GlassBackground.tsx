import type { ReactNode } from 'react';
import { View } from 'react-native';

import { glass } from './tokens';

type GlassBackgroundProps = {
  children: ReactNode;
  /** Tidak dipakai lagi (latar polos); dipertahankan agar pemanggil lama tetap valid. */
  stars?: boolean;
  seed?: number;
};

// Latar polos warna dasar Figma. Gradien warna dan rasi bintang di latar dihapus karena garisnya
// menabrak teks di hampir semua layar; kartu kaca (GlassCard) tetap berfungsi di atas latar ini.
export function GlassBackground({ children }: GlassBackgroundProps) {
  return (
    <View className="flex-1" style={{ backgroundColor: glass.base }}>
      {children}
    </View>
  );
}
