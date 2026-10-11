import { Image, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const brandLockup = require('../../../assets/brand/brand-lockup.png');

type OnboardingHeaderProps = {
  step: number;
  totalSteps?: number;
};

// Catatan: jam, sinyal, wifi, dan baterai di Figma ("Device status") adalah
// mockup device, bukan elemen app. Ruang status bar asli datang dari insets.top.
export function OnboardingHeader({ step, totalSteps = 4 }: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="gap-[8px] px-[22px]" style={{ paddingTop: insets.top }}>
      <View className="h-[34px] flex-row items-center justify-between">
        {/* Aset lockup sudah dipotong di batas kontennya (189x30, rasio 6.3);
            export mentah dari Figma punya padding transparan besar di kanan/bawah.
            Lebar 148 mengikuti "Group 4" di Figma, tinggi mengikuti rasio aset. */}
        <Image
          source={brandLockup}
          resizeMode="contain"
          className="h-[24px] w-[148px]"
          accessibilityLabel="AyokMatch"
        />
        <Text className="text-[11px] tracking-[0.55px] text-inkMuted">
          {step} / {totalSteps}
        </Text>
      </View>

      <View
        className="h-[5px] flex-row gap-[6px]"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: totalSteps, now: step }}
      >
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            className={`h-[5px] flex-1 rounded-full ${index < step ? 'bg-accent' : 'bg-borderSubtle'}`}
          />
        ))}
      </View>
    </View>
  );
}
