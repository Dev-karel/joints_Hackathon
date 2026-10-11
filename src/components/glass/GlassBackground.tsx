import { useMemo, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';

import { Constellation } from './Constellation';
import { generateField } from './starfield';
import { glass } from './tokens';

type GlassBackgroundProps = {
  children: ReactNode;
  /** Rasi bintang samar di latar. Matikan bila layar sudah punya ilustrasi sendiri. */
  stars?: boolean;
  seed?: number;
};

// Latar kaca: warna dasar lembut + empat "awan" warna (gradien radial) + rasi bintang samar.
// Tidak ada blur nyata; lihat catatan di tokens.ts.
export function GlassBackground({ children, stars = true, seed = 7 }: GlassBackgroundProps) {
  const { width, height } = useWindowDimensions();

  const field = useMemo(() => generateField(seed, 4, 7, width, height), [seed, width, height]);

  return (
    <View className="flex-1" style={{ backgroundColor: glass.base }}>
      <View className="absolute inset-0" pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            {[
              {
                id: 'wash-blue',
                cx: width * 0.06,
                cy: -height * 0.02,
                r: width * 1.0,
                wash: glass.wash.blue,
              },
              {
                id: 'wash-sky',
                cx: width * 1.0,
                cy: height * 0.04,
                r: width * 0.9,
                wash: glass.wash.sky,
              },
              {
                id: 'wash-amber',
                cx: width * 0.85,
                cy: height * 1.0,
                r: width * 0.95,
                wash: glass.wash.amber,
              },
            ].map((g) => (
              <RadialGradient
                key={g.id}
                id={g.id}
                cx={g.cx}
                cy={g.cy}
                r={g.r}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={g.wash.color} stopOpacity={g.wash.opacity} />
                <Stop offset="1" stopColor={g.wash.color} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {['wash-blue', 'wash-sky', 'wash-amber'].map((id) => (
            <Rect key={id} width={width} height={height} fill={`url(#${id})`} />
          ))}
        </Svg>
      </View>

      {stars ? (
        <View className="absolute inset-0 opacity-70" pointerEvents="none">
          <Constellation
            stars={field.stars}
            edges={field.edges}
            viewWidth={width}
            viewHeight={height}
            lineOpacity={0.14}
            starRadius={1.6}
          />
        </View>
      ) : null}

      {children}
    </View>
  );
}
