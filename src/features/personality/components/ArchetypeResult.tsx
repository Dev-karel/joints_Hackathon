import { View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { ArchetypeArt } from '@/components/archetype/ArchetypeArt';
import { ArchetypeConstellation } from '@/components/glass/ArchetypeConstellation';
import { GlassCard } from '@/components/glass/GlassCard';
import {
  ARCHETYPES,
  ARCHETYPE_IDS,
  RESULT_DISCLAIMER,
  type ArchetypeId,
} from '@/lib/validation/personalityQuiz';

type ArchetypeResultProps = {
  type: ArchetypeId;
  /** Persentase 0–100 per archetype (profiles.personality_scores). */
  scores: Partial<Record<ArchetypeId, number>>;
};

// Presentasi hasil sesuai METHODOLOGY §7: identitas utama + trait sekunder terurut.
export function ArchetypeResult({ type, scores }: ArchetypeResultProps) {
  const info = ARCHETYPES[type];
  const secondary = ARCHETYPE_IDS.filter((id) => id !== type)
    .map((id) => ({ id, value: scores[id] ?? 0 }))
    .sort((a, b) => b.value - a.value || ARCHETYPE_IDS.indexOf(a.id) - ARCHETYPE_IDS.indexOf(b.id));

  return (
    <View className="gap-[18px]">
      <GlassCard strong className="gap-[6px] p-[22px]">
        <View className="items-center justify-center pb-[6px]" style={{ height: 230 }}>
          <View className="absolute opacity-40">
            <ArchetypeConstellation type={type} size={230} />
          </View>
          <ArchetypeArt type={type} size={190} />
        </View>
        <Text className="text-[12px] font-bold tracking-[1px] text-primary">
          KAMU ADALAH {info.tagline.toUpperCase()}
        </Text>
        <Text className="text-[32px] font-bold text-slateInk">{info.name}</Text>
        <Text className="text-[16px] font-semibold text-titleAccent">
          {info.name} — {(scores[type] ?? 0).toFixed(1)}%
        </Text>
        <Text className="pt-[6px] text-[14px] leading-[21px] text-slate500">
          {info.description}
        </Text>
        <Text className="pt-[6px] text-[14px] font-semibold text-slateInk">Perananmu: {info.role}</Text>
      </GlassCard>

      <GlassCard className="gap-[8px] p-[18px]">
        <Text className="text-[14px] font-bold text-slateInk">Trait sekunder</Text>
        {secondary.map(({ id, value }) => (
          <View key={id} className="gap-[4px]">
            <View className="flex-row justify-between">
              <Text className="text-[13px] text-slateInk">{ARCHETYPES[id].name}</Text>
              <Text className="text-[13px] text-slate500">{value.toFixed(1)}%</Text>
            </View>
            <View className="h-[6px] overflow-hidden rounded-full bg-white/70">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </View>
          </View>
        ))}
      </GlassCard>

      <Text className="text-[12px] leading-[18px] text-slate500">{RESULT_DISCLAIMER}</Text>
    </View>
  );
}
