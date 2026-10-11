import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { GlassCard } from '@/components/glass/GlassCard';
import { palette } from '@/components/onboarding/palette';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
};

export function AuthScreen({ title, subtitle, onBack, children }: AuthScreenProps) {
  return (
    <GlassBackground seed={11}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled">
            <View className="grow gap-[20px] px-[20px] pb-[24px] pt-[12px]">
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel="Kembali"
                  hitSlop={10}
                  className="h-[42px] w-[42px] items-center justify-center rounded-full border border-white bg-white/60">
                  <ArrowLeft size={20} color={palette.primary} />
                </Pressable>
              ) : null}
              <View className="gap-[6px] px-[4px]">
                <Text className="text-[28px] font-bold leading-[34px] text-ink">{title}</Text>
                <Text className="text-[14px] leading-[21px] text-inkMuted">{subtitle}</Text>
              </View>
              <GlassCard className="gap-[18px] p-[18px]">{children}</GlassCard>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlassBackground>
  );
}
