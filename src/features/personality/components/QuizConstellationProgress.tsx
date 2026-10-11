import { useMemo } from 'react';
import { View } from 'react-native';

import { Constellation } from '@/components/glass/Constellation';
import type { Edge, Star } from '@/components/glass/starfield';
import { QUESTION_COUNT } from '@/lib/validation/personalityQuiz';

const VIEW_W = 300;
const VIEW_H = 40;

// Progres kuis sebagai rasi bintang: 15 bintang (satu per pertanyaan) di jalur bergelombang;
// bintang dan garis menyala sampai pertanyaan yang sedang dikerjakan.
export function QuizConstellationProgress({ current }: { current: number }) {
  const { stars, edges } = useMemo(() => {
    const stars: Star[] = Array.from({ length: QUESTION_COUNT }, (_, i) => ({
      x: 10 + (i * (VIEW_W - 20)) / (QUESTION_COUNT - 1),
      y: VIEW_H / 2 + Math.sin(i * 0.95) * 11,
      r: 2.4,
      accent: i === QUESTION_COUNT - 1,
    }));
    const edges: Edge[] = stars.slice(1).map((_, i) => [i, i + 1] as const);
    return { stars, edges };
  }, []);

  return (
    <View
      style={{ aspectRatio: VIEW_W / VIEW_H }}
      className="w-full"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: QUESTION_COUNT, now: current + 1 }}
    >
      <Constellation
        stars={stars}
        edges={edges}
        viewWidth={VIEW_W}
        viewHeight={VIEW_H}
        lit={current + 1}
        lineOpacity={0.3}
      />
    </View>
  );
}
