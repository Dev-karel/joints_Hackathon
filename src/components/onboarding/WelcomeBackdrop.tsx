import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { palette } from './palette';

// Port 1:1 dari node Figma 280:370 ("Connection Network") plus tiga ellipse
// dekoratif latar. Koordinat & warna diambil dari SVG asli, bukan aproksimasi.
// viewBox 412x924 adalah satu-satunya tempat ukuran frame Figma dipakai —
// preserveAspectRatio="xMidYMid slice" membuatnya mengisi layar apa pun.
const connectionLines = [
  'M52 162L112 120',
  'M52 162L96 232',
  'M112 120L162 96',
  'M332 132L282 200',
  'M332 132L366 230',
  'M282 200L366 230',
  'M46 624L100 662',
  'M372 562L332 632',
  'M100 662L332 632',
];

const connectionNodes = [
  { cx: 52, cy: 162, r: 5, fill: palette.primary },
  { cx: 112, cy: 120, r: 4, fill: palette.accent },
  { cx: 96, cy: 232, r: 4, fill: palette.primary },
  { cx: 162, cy: 96, r: 3.5, fill: palette.accent },
  { cx: 332, cy: 132, r: 5, fill: palette.accent },
  { cx: 282, cy: 200, r: 4, fill: palette.primary },
  { cx: 366, cy: 230, r: 4, fill: palette.accent },
  { cx: 46, cy: 624, r: 4, fill: palette.primary },
  { cx: 100, cy: 662, r: 5, fill: palette.accent },
  { cx: 372, cy: 562, r: 4, fill: palette.accent },
  { cx: 332, cy: 632, r: 4, fill: palette.primary },
];

export function WelcomeBackdrop() {
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 412 924" preserveAspectRatio="xMidYMid slice">
        {/* Tiga ellipse dekoratif */}
        <Circle cx={40} cy={270} r={130} fill={palette.surfaceSky} />
        <Circle cx={345} cy={185} r={95} fill={palette.accentSoft} />
        <Circle cx={-51} cy={695} r={95} fill={palette.accentSoft} />

        <G opacity={0.55}>
          {connectionLines.map((d) => (
            <Path
              key={d}
              d={d}
              stroke={palette.slateMuted}
              strokeWidth={1.5}
              strokeDasharray="4 5"
            />
          ))}
        </G>

        {connectionNodes.map((node) => (
          <Circle
            key={`${node.cx}-${node.cy}`}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill={node.fill}
          />
        ))}
      </Svg>
    </View>
  );
}
