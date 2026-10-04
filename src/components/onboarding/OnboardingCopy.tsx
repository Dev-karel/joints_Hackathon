import { Text, View } from 'react-native';

export type TitleSegment = {
  text: string;
  highlight?: boolean;
};

type OnboardingCopyProps = {
  titleSegments: TitleSegment[];
  description: string;
};

// lineHeight React Native harus px, bukan rasio: 31 x 1.04 -> 32, 15 x 1.45 -> 22.
export function OnboardingCopy({ titleSegments, description }: OnboardingCopyProps) {
  return (
    <View className="w-full gap-[9px]">
      <Text className="text-[31px] font-bold leading-[32px] tracking-[-1.24px] text-ink">
        {titleSegments.map((segment, index) => (
          <Text key={index} className={segment.highlight ? 'text-titleAccent' : undefined}>
            {segment.text}
          </Text>
        ))}
      </Text>
      <Text className="text-[15px] leading-[22px] text-inkMuted">{description}</Text>
    </View>
  );
}
