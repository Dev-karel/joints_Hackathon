import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/AppText';

import { ArchetypeArt } from '@/components/archetype/ArchetypeArt';
import { ArchetypeConstellation } from '@/components/glass/ArchetypeConstellation';
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

// Satu momen gerak di aplikasi: pengungkapan hasil kuis (puncak emosi onboarding).
// Ilustrasi muncul membesar, nama menyusul, lalu sisi lain berurutan. Ease-out eksponensial;
// dimatikan otomatis bila "Kurangi animasi" aktif di HP.
const OUT = Easing.out(Easing.exp);
const reveal = (delay: number) =>
  FadeInDown.delay(delay).duration(420).easing(OUT).reduceMotion(ReduceMotion.System);

// Kartu putih polos seperti di tab Profil (tanpa kaca translusen: di Android bayangan
// elevation tembus ke kartu translusen dan membuat bingkai abu-abu).
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-[20px] border border-slateBorder bg-white px-[16px] py-[14px] ${className}`}
    >
      {children}
    </View>
  );
}

// Presentasi hasil sesuai METHODOLOGY §7: identitas utama + trait sekunder terurut.
export function ArchetypeResult({ type, scores }: ArchetypeResultProps) {
  const info = ARCHETYPES[type];
  const secondary = ARCHETYPE_IDS.filter((id) => id !== type)
    .map((id) => ({ id, value: scores[id] ?? 0 }))
    .sort((a, b) => b.value - a.value || ARCHETYPE_IDS.indexOf(a.id) - ARCHETYPE_IDS.indexOf(b.id));

  return (
    <View className="gap-[14px]">
      <Card className="gap-[10px] pb-[18px]">
        <View className="items-center justify-center" style={{ height: 220 }}>
          <Animated.View
            className="absolute opacity-40"
            entering={FadeIn.delay(150).duration(900).reduceMotion(ReduceMotion.System)}
          >
            <ArchetypeConstellation type={type} size={220} />
          </Animated.View>
          <Animated.View
            entering={ZoomIn.duration(650).easing(OUT).reduceMotion(ReduceMotion.System)}
          >
            <ArchetypeArt type={type} size={180} />
          </Animated.View>
        </View>
        <Animated.View entering={reveal(280)} className="items-center gap-[6px]">
          <Text className="text-[12px] font-bold tracking-[1px] text-primary">
            KAMU ADALAH {info.tagline.toUpperCase()}
          </Text>
          <Text className="text-[30px] font-extrabold tracking-[-0.4px] text-slateInk">
            {info.name}
          </Text>
          <View className="rounded-full bg-accent50 px-[12px] py-[5px]">
            <Text className="text-[12px] font-bold text-accentText">
              Skor tertinggi: {Math.round(scores[type] ?? 0)}%
            </Text>
          </View>
          <Text className="pt-[6px] text-center text-[14px] leading-[21px] text-slate500">
            {info.description}
          </Text>
        </Animated.View>
      </Card>

      <Animated.View
        entering={reveal(420)}
        className="gap-[4px] rounded-[20px] border border-accent200 bg-accent50 px-[16px] py-[14px]"
      >
        <Text className="text-[15px] font-extrabold text-accent800">Perananmu di tim</Text>
        <Text className="text-[13px] leading-[19px] text-accent800">{info.role}</Text>
      </Animated.View>

      <Card className="gap-[10px]">
        <Text className="text-[15px] font-extrabold text-slateInk">Sisi lain dirimu</Text>
        {secondary.map(({ id, value }, i) => (
          <Animated.View key={id} entering={reveal(520 + i * 70)} className="gap-[5px]">
            <View className="flex-row justify-between">
              <Text className="text-[13px] font-semibold text-slateInk">{ARCHETYPES[id].name}</Text>
              <Text className="text-[13px] font-semibold text-slate500">{Math.round(value)}%</Text>
            </View>
            <View className="h-[8px] overflow-hidden rounded-full bg-surfaceSky">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </View>
          </Animated.View>
        ))}
      </Card>

      <Text className="text-[12px] leading-[18px] text-slate500">{RESULT_DISCLAIMER}</Text>
    </View>
  );
}
