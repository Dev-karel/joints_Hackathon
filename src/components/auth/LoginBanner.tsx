import { Image, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';

const brandLockup = require('../../../assets/brand/brand-lockup.png');

// Banner layar Masuk (Figma "Decorative Blob", node 3:273): kartu slate-100 setinggi 220 dengan
// bentuk biru muda di sudut, logo AyokMatch, dan tagline. Bentuk (path) disalin dari aset Figma.
export function LoginBanner() {
  return (
    <View className="h-[220px] w-full overflow-hidden rounded-[24px] bg-slate100">
      <View className="absolute" style={{ left: -60, top: -280 }} pointerEvents="none">
        <Svg width={480} height={480} viewBox="0 0 480 480">
          <Path
            d="M480 63.6145C480 234.226 369.4 480 179.337 480C-10.7251 480 0.113603 361.393 0.113603 190.782C0.113603 20.1701 16.9008 119.589 206.963 119.589C397.026 119.589 480 -106.997 480 63.6145Z"
            fill={palette.skyBlob}
          />
        </Svg>
      </View>
      <Image
        source={brandLockup}
        resizeMode="contain"
        style={{ position: 'absolute', left: 24, top: 43, width: 164, height: 26 }}
        accessibilityLabel="AyokMatch"
      />
      <Text className="absolute left-[24px] top-[76px] text-[14px] font-medium text-slateInk">
        Temukan teman belajarmu
      </Text>
    </View>
  );
}
