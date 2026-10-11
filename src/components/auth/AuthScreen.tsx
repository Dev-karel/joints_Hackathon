import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
};

export function AuthScreen({ title, subtitle, onBack, children }: AuthScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <View className="grow gap-[20px] px-[24px] pb-[24px] pt-[12px]">
            {onBack ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Kembali"
                hitSlop={10}
                className="h-[40px] w-[40px] items-center justify-center rounded-full border border-borderSubtle">
                <ArrowLeft size={20} color={palette.primary} />
              </Pressable>
            ) : null}
            <View className="gap-[6px]">
              <Text className="text-[26px] font-bold text-ink">{title}</Text>
              <Text className="text-[14px] leading-[20px] text-inkMuted">{subtitle}</Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
