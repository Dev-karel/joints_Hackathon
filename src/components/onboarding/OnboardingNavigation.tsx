import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from './palette';
import { cardShadow } from './shadows';

export type SecondaryAction = { kind: 'skip'; label: string } | { kind: 'back' };

export type PrimaryIcon = 'arrow-right' | 'sparkles';

type OnboardingNavigationProps = {
  secondary: SecondaryAction;
  primaryLabel: string;
  primaryIcon: PrimaryIcon;
  onSecondaryPress: () => void;
  onPrimaryPress: () => void;
};

export function OnboardingNavigation({
  secondary,
  primaryLabel,
  primaryIcon,
  onSecondaryPress,
  onPrimaryPress,
}: OnboardingNavigationProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="w-full bg-surfaceSky px-[22px] pt-[12px]"
      style={{ paddingBottom: 18 + insets.bottom }}
    >
      <View className="h-[54px] flex-row items-center gap-[10px]">
        <Pressable
          onPress={onSecondaryPress}
          accessibilityRole="button"
          accessibilityLabel={secondary.kind === 'skip' ? secondary.label : 'Kembali'}
          style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
          className="h-[54px] w-[84px] items-center justify-center rounded-full border border-borderSubtle bg-white"
        >
          {secondary.kind === 'skip' ? (
            <Text className="text-[13px] text-inkMuted">{secondary.label}</Text>
          ) : (
            <ArrowLeft size={20} strokeWidth={2.2} color={palette.primary} />
          )}
        </Pressable>

        <Pressable
          onPress={onPrimaryPress}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          style={({ pressed }) => [cardShadow, pressed ? { opacity: 0.9 } : null]}
          className="h-[54px] flex-1 flex-row items-center justify-center gap-[9px] rounded-full bg-primary"
        >
          <Text className="text-[15px] font-semibold text-white">{primaryLabel}</Text>
          {primaryIcon === 'sparkles' ? (
            <Sparkles size={18} strokeWidth={2.2} color={palette.accent} />
          ) : (
            <ArrowRight size={18} strokeWidth={2.2} color={palette.accent} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
