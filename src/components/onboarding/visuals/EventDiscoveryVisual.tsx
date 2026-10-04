import { ArrowUpRight } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '../palette';
import { cardShadow } from '../shadows';

const featuredEvent = require('../../../../assets/onboarding/featured-event.jpg');
const morningRun = require('../../../../assets/onboarding/morning-run.jpg');

export function EventDiscoveryVisual() {
  return (
    <View className="h-[316px] w-full gap-[10px] overflow-hidden rounded-[32px] bg-surfaceSand p-[14px]">
      {/* Featured event */}
      <View
        className="relative h-[176px] w-full overflow-hidden rounded-[24px]"
        style={cardShadow}>
        <Image
          source={featuredEvent}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
          accessibilityLabel="Nobar final"
        />

        {/* Scrim gradien memakai react-native-svg (expo-linear-gradient belum terpasang). */}
        <View className="absolute bottom-0 left-0 right-0 top-[62px]" pointerEvents="none">
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.ink} stopOpacity={0} />
                <Stop offset="1" stopColor={palette.ink} stopOpacity={0.92} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#scrim)" />
          </Svg>
        </View>

        <View className="absolute left-[12px] top-[12px] flex-row items-center gap-[6px] rounded-full bg-white px-[10px] py-[7px]">
          <Text className="text-[12px]">🎉</Text>
          <Text className="text-[10px] text-ink">EVENT PILIHAN</Text>
        </View>

        <View className="absolute bottom-[12px] left-[14px] right-[14px] flex-row items-end justify-between">
          <View className="w-[210px] gap-[4px]">
            <Text className="text-[20px] font-bold tracking-[-0.6px] text-white">Nobar final</Text>
            <Text className="text-[10px] text-inkOnDark">Sabtu · tempat publik</Text>
          </View>
          <View className="rounded-full bg-limeHighlight px-[12px] py-[8px]">
            <Text className="text-[11px] font-semibold text-ink">Gratis</Text>
          </View>
        </View>
      </View>

      {/* Morning run event */}
      <View
        className="h-[102px] w-full flex-row items-center gap-[12px] rounded-[24px] bg-white p-[10px]"
        style={cardShadow}>
        <View className="size-[82px] overflow-hidden rounded-[16px]">
          <Image
            source={morningRun}
            resizeMode="cover"
            className="h-full w-full"
            accessibilityLabel="Lari pagi"
          />
        </View>

        <View className="flex-1 gap-[5px]">
          <Text className="text-[16px] font-semibold text-ink">🏃 Lari pagi</Text>
          <Text className="text-[10px] leading-[14px] text-inkMuted">
            Minggu, 06.30 · ruang publik
          </Text>
        </View>

        <View className="size-[34px] items-center justify-center rounded-full bg-surfaceLilac">
          <ArrowUpRight size={16} strokeWidth={2} color={palette.titleAccent} />
        </View>
      </View>
    </View>
  );
}
