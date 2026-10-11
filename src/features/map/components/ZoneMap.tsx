import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { glass } from '@/components/glass/tokens';

import type { Zone } from '../api';

type ZoneMapProps = {
  rooms: Zone[];
  /** zone_id -> jumlah online. Zona yang tidak ada di sini dianggap sepi. */
  counts: Map<string, number>;
  /** false bila pemanggil belum boleh melihat jumlah (belum tampil di peta). */
  showCounts: boolean;
  selectedId: string | null;
  currentZoneId: string | null;
  onSelect: (zoneId: string) => void;
};

// Peta skematis per gedung (koordinat 0–100 per gedung, BUKAN GPS). Setiap ruangan adalah
// kotak kaca dengan "bintang" di tengahnya; bintang antar-ruangan dihubungkan garis tipis
// seperti rasi, dan makin ramai makin besar bintangnya.
export function ZoneMap({
  rooms,
  counts,
  showCounts,
  selectedId,
  currentZoneId,
  onSelect,
}: ZoneMapProps) {
  const links = useMemo(() => {
    const sorted = [...rooms]
      .filter((r) => r.map_x !== null && r.map_y !== null)
      .sort((a, b) => (a.map_y ?? 0) - (b.map_y ?? 0) || (a.map_x ?? 0) - (b.map_x ?? 0));
    return sorted.slice(1).map((room, i) => [sorted[i], room] as const);
  }, [rooms]);

  const center = (r: Zone) => ({
    cx: (r.map_x ?? 0) + (r.map_w ?? 0) / 2,
    cy: (r.map_y ?? 0) + (r.map_h ?? 0) / 2,
  });

  return (
    <View style={{ aspectRatio: 1 }} className="w-full">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {links.map(([a, b]) => {
          const p = center(a);
          const q = center(b);
          return (
            <Line
              key={`${a.id}-${b.id}`}
              x1={p.cx}
              y1={p.cy}
              x2={q.cx}
              y2={q.cy}
              stroke={glass.line}
              strokeOpacity={0.3}
              strokeWidth={0.5}
              strokeLinecap="round"
            />
          );
        })}

        {rooms.map((room) => {
          if (
            room.map_x === null ||
            room.map_y === null ||
            room.map_w === null ||
            room.map_h === null
          )
            return null;
          const count = counts.get(room.id) ?? 0;
          const active = showCounts && count > 0;
          const selected = room.id === selectedId;

          return (
            <Rect
              key={room.id}
              x={room.map_x}
              y={room.map_y}
              width={room.map_w}
              height={room.map_h}
              rx={4}
              fill={active ? 'rgba(230,243,251,0.95)' : 'rgba(255,255,255,0.6)'}
              stroke={
                selected ? glass.starAccent : active ? glass.starPrimary : 'rgba(255,255,255,0.95)'
              }
              strokeWidth={selected ? 1.4 : 0.8}
              onPress={() => onSelect(room.id)}
              accessibilityLabel={`${room.name}${showCounts ? `, ${count} online` : ''}`}
            />
          );
        })}

        {rooms.map((room) => {
          if (
            room.map_x === null ||
            room.map_y === null ||
            room.map_w === null ||
            room.map_h === null
          )
            return null;
          const count = counts.get(room.id) ?? 0;
          const active = showCounts && count > 0;
          const current = room.id === currentZoneId;
          const { cx, cy } = center(room);
          const r = active ? 1.6 + Math.min(count, 8) * 0.35 : 1.3;
          return (
            <G key={`s-${room.id}`} pointerEvents="none">
              <Circle
                cx={cx}
                cy={cy - 2}
                r={r * 2.4}
                fill={glass.starPrimary}
                fillOpacity={active ? 0.12 : 0.05}
              />
              <Circle
                cx={cx}
                cy={cy - 2}
                r={r}
                fill={current ? glass.starAccent : glass.starPrimary}
                fillOpacity={active ? 1 : 0.45}
              />
              <SvgText
                x={cx}
                y={cy + 4}
                fontSize={3.6}
                fontWeight="bold"
                fill="#17352D"
                textAnchor="middle"
              >
                {room.name}
              </SvgText>
              <SvgText x={cx} y={cy + 8.4} fontSize={3} fill="#47645B" textAnchor="middle">
                {showCounts ? (count > 0 ? `${count} online` : 'sepi') : ''}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
