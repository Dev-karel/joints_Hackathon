import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';

type AuthScreenProps = {
  /** Judul Figma "Daftar Akun": ExtraBold 26. Kosongkan bila layar memakai banner. */
  title?: string;
  subtitle?: string;
  /** Kartu banner di atas (layar Masuk). */
  banner?: ReactNode;
  /** Tombol kembali: hanya untuk layar tanpa frame Figma (Mata kuliah, admin). */
  onBack?: () => void;
  /** Tertempel di dasar layar (mis. "Belum punya akun? Daftar"). */
  footer?: ReactNode;
  children: ReactNode;
};

// Kerangka layar auth mengikuti frame Figma: latar putih bersih, isian langsung di atas latar
// (tanpa kartu), padding 20. Latar kaca/rasi bintang hanya sangat samar di belakangnya.
export function AuthScreen({ title, subtitle, banner, onBack, footer, children }: AuthScreenProps) {
  return (
    <GlassBackground seed={11}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="grow gap-[22px] px-[20px] pb-[24px] pt-[16px]">
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel="Kembali"
                  hitSlop={10}
                  className="h-[48px] w-[48px] items-center justify-center rounded-full border border-slateBorder bg-white"
                >
                  <ArrowLeft size={20} color={palette.primary} />
                </Pressable>
              ) : null}

              {banner}

              {title ? (
                <View className="gap-[6px]">
                  <Text className="text-[26px] font-extrabold text-slateInk">{title}</Text>
                  {subtitle ? <Text className="text-[13px] text-slate500">{subtitle}</Text> : null}
                </View>
              ) : null}

              <View className="gap-[22px]">{children}</View>

              {footer ? <View className="mt-auto items-center pt-[12px]">{footer}</View> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlassBackground>
  );
}
