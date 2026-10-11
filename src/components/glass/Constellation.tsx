import { memo } from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

import type { Edge, Star } from './starfield';
import { glass } from './tokens';

type ConstellationProps = {
  stars: Star[];
  edges: readonly Edge[];
  /** Ukuran area gambar (viewBox). Rasio dijaga lewat `meet`, bintang tetap bulat. */
  viewWidth: number;
  viewHeight: number;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  /** Bintang dengan indeks < lit menyala penuh; sisanya redup (untuk progres). Default: semua. */
  lit?: number;
  lineOpacity?: number;
  /** Radius dasar bintang bila `star.r` tidak diisi. */
  starRadius?: number;
  /** Putih untuk latar gelap/berwarna pekat. */
  onDark?: boolean;
};

// Garis tipis + bintang berpendar (lingkaran konsentris transparan, tanpa filter blur
// supaya ringan di Android).
function ConstellationBase({
  stars,
  edges,
  viewWidth,
  viewHeight,
  width = '100%',
  height = '100%',
  lit = stars.length,
  lineOpacity = 0.4,
  starRadius = 2.6,
  onDark = false,
}: ConstellationProps) {
  const lineColor = onDark ? '#FFFFFF' : glass.line;
  const baseStar = onDark ? '#FFFFFF' : glass.starPrimary;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {edges.map(([a, b]) => {
        const on = a < lit && b < lit;
        return (
          <Line
            key={`${a}-${b}`}
            x1={stars[a].x}
            y1={stars[a].y}
            x2={stars[b].x}
            y2={stars[b].y}
            stroke={lineColor}
            strokeWidth={on ? 1.2 : 0.8}
            strokeOpacity={on ? lineOpacity + 0.25 : lineOpacity * 0.55}
            strokeLinecap="round"
          />
        );
      })}
      {stars.map((s, i) => {
        const on = i < lit;
        const r = s.r ?? starRadius;
        const color = s.accent ? glass.starAccent : baseStar;
        return (
          <Circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={r * 3.2}
            fill={color}
            fillOpacity={on ? 0.1 : 0.04}
          />
        );
      })}
      {stars.map((s, i) => {
        const on = i < lit;
        const r = s.r ?? starRadius;
        const color = s.accent ? glass.starAccent : baseStar;
        return (
          <Circle
            key={`c${i}`}
            cx={s.x}
            cy={s.y}
            r={r * 1.8}
            fill={color}
            fillOpacity={on ? 0.22 : 0.08}
          />
        );
      })}
      {stars.map((s, i) => {
        const on = i < lit;
        const r = s.r ?? starRadius;
        const color = s.accent ? glass.starAccent : baseStar;
        return (
          <Circle
            key={`s${i}`}
            cx={s.x}
            cy={s.y}
            r={r}
            fill={on ? color : '#FFFFFF'}
            stroke={color}
            strokeWidth={on ? 0 : 0.8}
            strokeOpacity={0.5}
          />
        );
      })}
    </Svg>
  );
}

export const Constellation = memo(ConstellationBase);
