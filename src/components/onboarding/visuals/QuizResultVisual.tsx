import { CalendarCheck, ListChecks } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { palette } from '../palette';
import { cardShadowStrong } from '../shadows';

export function QuizResultVisual() {
  return (
    <View className="min-h-[316px] w-full gap-[14px] overflow-hidden rounded-[32px] bg-accent p-[20px]">
      <View className="absolute bottom-[-42px] right-[-34px] size-[146px] rounded-full bg-coral opacity-95" />

      <View className="flex-row items-center justify-between">
        <View className="size-[44px] rotate-[3deg] items-center justify-center rounded-[16px] bg-ink">
          <Text className="text-[22px]">🧩</Text>
        </View>

        <View className="flex-row items-center gap-[7px] rounded-full bg-white px-[12px] py-[8px]">
          <ListChecks size={15} strokeWidth={2} color={palette.ink} />
          <Text className="text-[11px] text-ink">15 pertanyaan</Text>
        </View>
      </View>

      <View className="w-full gap-[13px] rounded-[24px] bg-white p-[16px]" style={cardShadowStrong}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 gap-[3px]">
            <Text className="text-[10px] uppercase tracking-[0.8px] text-titleAccent">
              Archetype kamu
            </Text>
            <Text className="text-[22px] font-bold tracking-[-0.66px] text-ink">Mindsmith</Text>
          </View>

          <View className="size-[44px] items-center justify-center rounded-[16px] bg-surfaceLilac">
            <CalendarCheck size={21} strokeWidth={2} color={palette.titleAccent} />
          </View>
        </View>

        <View className="h-px w-full bg-borderSubtle" />

        <View className="flex-row items-center gap-[12px]">
          <View className="size-[70px] items-center justify-center rounded-full border-[3px] border-white bg-surfaceMint">
            <Text className="text-[22px] font-bold text-ink">92%</Text>
          </View>

          <View className="flex-1 items-start gap-[7px]">
            <Text className="text-[12px] text-ink">Kecocokan 92%</Text>
            <View className="flex-row items-center gap-[7px] rounded-full bg-surfaceLilac px-[11px] py-[8px]">
              <Text className="text-[13px]">📚</Text>
              <Text className="text-[12px] text-titleAccent">Basis Data</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
