import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { glassShadow } from '@/components/glass/tokens';
import { Text } from '@/components/ui/AppText';

// Ikon dari aset Figma (node 3:471 Google, 3:473 Facebook, 276:626 Microsoft). Path disalin
// apa adanya dari SVG Figma.
function GoogleIcon() {
  return (
    <Svg width={31} height={31} viewBox="0 0 30.5473 31.1727">
      <Path
        d="M30.2464 12.6635C30.4412 13.7069 30.5473 14.7978 30.5473 15.9363C30.5473 24.8409 24.5876 31.1727 15.5863 31.1727C13.5393 31.1735 11.5121 30.7709 9.62072 29.9879C7.72932 29.2049 6.01077 28.0569 4.56328 26.6094C3.11579 25.1619 1.96774 23.4433 1.18475 21.5519C0.401753 19.6606 -0.00083102 17.6334 1.2879e-06 15.5863C-0.00083102 13.5393 0.401753 11.5121 1.18475 9.62072C1.96774 7.72932 3.11579 6.01077 4.56328 4.56328C6.01077 3.11579 7.72932 1.96774 9.62072 1.18475C11.5121 0.401753 13.5393 -0.00083102 15.5863 1.2879e-06C19.7948 1.2879e-06 23.3114 1.5485 26.0094 4.06283L21.6157 8.45658V8.4455C19.9801 6.8875 17.9043 6.08792 15.5863 6.08792C10.4437 6.08792 6.26367 10.4326 6.26367 15.5768C6.26367 20.7211 10.4437 25.0753 15.5863 25.0753C20.2524 25.0753 23.4286 22.4058 24.0809 18.7419H15.5863V12.6635H30.2464Z"
        fill="#E00000"
      />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 38 38">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 19.1061C0 28.5538 6.86058 36.4072 15.8333 38V24.2773H11.0833V19H15.8333V14.7773C15.8333 10.0273 18.8939 7.38942 23.2228 7.38942C24.5939 7.38942 26.0728 7.6 27.4439 7.81058V12.6667H25.0167C22.6939 12.6667 22.1667 13.8273 22.1667 15.3061V19H27.2333L26.3894 24.2773H22.1667V38C31.1394 36.4072 38 28.5538 38 19.1061C38 8.5975 29.45 0 19 0C8.55 0 0 8.5975 0 19.1061Z"
        fill="#0751C8"
      />
    </Svg>
  );
}

function MicrosoftIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 38 38">
      <Rect x={0} y={0} width={18.0598} height={18.0598} fill="#F1511B" />
      <Rect x={19.9404} y={0} width={18.0596} height={18.0598} fill="#80CC28" />
      <Rect x={0} y={19.9405} width={18.0594} height={18.0598} fill="#00ADEF" />
      <Rect x={19.9404} y={19.9405} width={18.0596} height={18.0598} fill="#FBBC09" />
    </Svg>
  );
}

const PROVIDERS = [
  { name: 'Google', Icon: GoogleIcon },
  { name: 'Facebook', Icon: FacebookIcon },
  { name: 'Microsoft', Icon: MicrosoftIcon },
] as const;

// Hanya tampilan di MVP: OAuth belum diimplementasikan (CLAUDE.md). Tombol bulat kuning muda
// dengan bayangan, persis Figma ("Atau masuk dengan"), tanpa aksi.
export function SocialButtons() {
  return (
    <View className="w-full gap-[22px]">
      <View className="flex-row items-center gap-[16px]">
        <View className="h-px flex-1 bg-slateBorder" />
        <Text className="text-[14px] font-medium text-slate500">Atau masuk dengan</Text>
        <View className="h-px flex-1 bg-slateBorder" />
      </View>
      <View className="flex-row justify-center gap-[39px]">
        {PROVIDERS.map(({ name, Icon }) => (
          <View
            key={name}
            accessible
            accessibilityLabel={`${name} (segera hadir)`}
            accessibilityState={{ disabled: true }}
            className="size-[56px] items-center justify-center rounded-full border border-slateBorder bg-white opacity-70"
            style={glassShadow}
          >
            <Icon />
          </View>
        ))}
      </View>
      <Text className="text-center text-[11px] text-slate500">Segera hadir</Text>
    </View>
  );
}
