import { View } from 'react-native';

import type { ArchetypeId } from '@/lib/validation/personalityQuiz';

import { Constellation } from './Constellation';
import { ARCHETYPE_PATTERNS } from './starfield';

// Rasi bintang unik tiap archetype (gambar kode, bukan AI).
export function ArchetypeConstellation({ type, size = 220 }: { type: ArchetypeId; size?: number }) {
  const pattern = ARCHETYPE_PATTERNS[type];
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Constellation
        stars={pattern.stars}
        edges={pattern.edges}
        viewWidth={100}
        viewHeight={100}
        lineOpacity={0.45}
        starRadius={2.4}
      />
    </View>
  );
}
