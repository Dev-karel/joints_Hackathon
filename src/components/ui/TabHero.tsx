import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/AppText';

type TabHeroProps = {
  title: string;
  subtitle?: string;
  /** Aksi di kanan judul (mis. tombol "Buat event", saklar "Tampil di peta"). */
  right?: ReactNode;
  /** Kontrol di dalam blok (mis. kolom cari, pilihan Belajar/Lomba). */
  children?: ReactNode;
};

// Blok pembuka tiap tab: biru utama Figma (#0072B8) dengan teks putih (kontras 5,3:1).
// Satu-satunya bidang warna besar di layar, supaya tiap tab punya titik fokus yang jelas.
// Kartu di dalam layar (bukan di header status bar) supaya ikon status bar tetap gelap.
export function TabHero({ title, subtitle, right, children }: TabHeroProps) {
  return (
    <View className="mx-[20px] mb-[16px] mt-[8px] gap-[14px] rounded-[28px] bg-primary px-[20px] pb-[20px] pt-[18px]">
      <View className="flex-row items-center gap-[12px]">
        <View className="flex-1 gap-[4px]">
          <Text className="text-[26px] font-extrabold leading-[32px] tracking-[-0.4px] text-white">
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[14px] leading-[20px] text-white">{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}
