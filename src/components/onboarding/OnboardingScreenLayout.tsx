import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { GlassBackground } from '@/components/glass/GlassBackground';

import { OnboardingCopy, type TitleSegment } from './OnboardingCopy';
import { OnboardingHeader } from './OnboardingHeader';
import {
  OnboardingNavigation,
  type PrimaryIcon,
  type SecondaryAction,
} from './OnboardingNavigation';

type OnboardingScreenLayoutProps = {
  step: number;
  visual: ReactNode;
  titleSegments: TitleSegment[];
  description: string;
  secondary: SecondaryAction;
  primaryLabel: string;
  primaryIcon: PrimaryIcon;
  onSecondaryPress: () => void;
  onPrimaryPress: () => void;
};

export function OnboardingScreenLayout({
  step,
  visual,
  titleSegments,
  description,
  secondary,
  primaryLabel,
  primaryIcon,
  onSecondaryPress,
  onPrimaryPress,
}: OnboardingScreenLayoutProps) {
  return (
    <GlassBackground seed={3}>
      <OnboardingHeader step={step} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="grow gap-[18px] px-[22px] pb-[8px] pt-[10px]">
          {visual}
          <OnboardingCopy titleSegments={titleSegments} description={description} />
        </View>
      </ScrollView>

      <OnboardingNavigation
        secondary={secondary}
        primaryLabel={primaryLabel}
        primaryIcon={primaryIcon}
        onSecondaryPress={onSecondaryPress}
        onPrimaryPress={onPrimaryPress}
      />
    </GlassBackground>
  );
}
