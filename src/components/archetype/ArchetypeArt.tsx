import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Mask, Path, Rect } from 'react-native-svg';

import type { ArchetypeId } from '@/lib/validation/personalityQuiz';

import { groundbreakerArt } from './art/groundbreaker';
import { heartkeeperArt } from './art/heartkeeper';
import { kindled_flameArt } from './art/kindled_flame';
import { mindsmithArt } from './art/mindsmith';
import { sagekeeperArt } from './art/sagekeeper';
import { wildheartArt } from './art/wildheart';
import type { ArchetypeArtData } from './types';

const ART: Record<ArchetypeId, ArchetypeArtData> = {
  wildheart: wildheartArt,
  heartkeeper: heartkeeperArt,
  mindsmith: mindsmithArt,
  groundbreaker: groundbreakerArt,
  kindled_flame: kindled_flameArt,
  sagekeeper: sagekeeperArt,
};

type ArchetypeArtProps = {
  type: ArchetypeId;
  /** Sisi terpanjang gambar, dalam dp. Rasio asli dijaga. */
  size?: number;
  /** Ganti warna tinta (default: warna asli desain). */
  color?: string;
};

// Ilustrasi archetype: tinta satu warna dengan latar TRANSPARAN. Bentuk dirender lewat
// <Mask> supaya lubang (area putih di dalam garis) tetap tembus ke latar kaca.
function ArchetypeArtBase({ type, size = 200, color }: ArchetypeArtProps) {
  const art = ART[type];
  const [x, y, w, h] = art.viewBox;
  const scale = size / Math.max(w, h);
  const maskId = `mask-${type}`;

  return (
    <View
      style={{ width: w * scale, height: h * scale }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Svg width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`}>
        <Defs>
          <Mask id={maskId} x={x} y={y} width={w} height={h} maskUnits="userSpaceOnUse">
            {art.ops.map(([ink, d], i) => (
              <Path key={i} d={d} fill={ink ? '#FFFFFF' : '#000000'} />
            ))}
          </Mask>
        </Defs>
        <Rect x={x} y={y} width={w} height={h} fill={color ?? art.color} mask={`url(#${maskId})`} />
      </Svg>
    </View>
  );
}

export const ArchetypeArt = memo(ArchetypeArtBase);
