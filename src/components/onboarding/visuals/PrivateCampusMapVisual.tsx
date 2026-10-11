import { MapPinOff } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { palette } from '../palette';
import { cardShadow } from '../shadows';

// Avatar contoh berupa inisial berwarna (menggantikan foto).
const roomAvatars = [
  { initial: 'R', className: 'bg-limeHighlight' },
  { initial: 'D', className: 'bg-surfaceSand' },
  { initial: 'A', className: 'bg-surfaceLilac' },
];

export function PrivateCampusMapVisual() {
  return (
    <View className="min-h-[316px] w-full gap-[12px] overflow-hidden rounded-[32px] bg-surfaceMint p-[16px]">
      {/* Privacy control */}
      <View
        className="h-[44px] w-full flex-row items-center justify-between rounded-[16px] bg-white px-[12px]"
        style={cardShadow}
      >
        <View className="flex-row items-center gap-[8px]">
          <View className="size-[28px] items-center justify-center rounded-[10px] bg-ink">
            <MapPinOff size={15} strokeWidth={2} color={palette.limeHighlight} />
          </View>
          <View className="gap-px">
            <Text className="text-[11px] text-ink">Lokasi mati secara default</Text>
            <Text className="text-[9px] text-inkMuted">Kamu yang memutuskan</Text>
          </View>
        </View>

        {/* Off toggle: statis (bukan Switch), knob di posisi OFF sesuai Figma. */}
        <View className="h-[24px] w-[42px] justify-center rounded-full bg-borderSubtle">
          <View className="ml-[3px] size-[18px] rounded-full bg-white" style={cardShadow} />
        </View>
      </View>

      {/* Map area */}
      <View className="relative h-[228px] w-full overflow-hidden rounded-[24px] bg-white">
        {/* Map route: aproksimasi bentuk. Figma memakai hypot() + rotasi yang tidak
            punya padanan di React Native, jadi tiga "jalan" dibuat dari View pil
            yang dirotasi dengan warna dan arah yang sama. */}
        <View className="absolute left-[-20px] right-[-10px] top-[25px] h-[16px] rotate-[-8deg] rounded-full bg-surfaceSand" />
        <View className="absolute bottom-[-15px] left-[70px] top-[-25px] w-[14px] rotate-[10deg] rounded-full bg-surfaceLilac" />
        <View className="absolute bottom-[-5px] right-[10px] top-[-15px] w-[13px] rotate-[-16deg] rounded-full bg-surfaceSand" />

        {/* Approximate area */}
        <View className="absolute left-1/2 top-1/2 -ml-[56px] -mt-[56px] size-[112px] rounded-full bg-surfaceMint opacity-60" />

        {/* Kartu Ruangan aktif */}
        <View className="absolute left-[8px] top-[12px] w-[180px] gap-[8px] rounded-[18px] border border-slateBorder bg-white p-[14px]">
          <Text className="text-[15px] font-bold text-slateInk">BeeHub</Text>
          <View className="flex-row items-center">
            {roomAvatars.map((avatar, index) => (
              <View
                key={avatar.initial}
                className={`size-[28px] items-center justify-center rounded-full border-2 border-white ${avatar.className} ${
                  index < roomAvatars.length - 1 ? '-mr-[8px]' : ''
                }`}
                accessibilityLabel="Anggota ruangan"
              >
                <Text className="text-[11px] font-bold text-ink">{avatar.initial}</Text>
              </View>
            ))}
          </View>
          <Text className="text-[20px] font-extrabold text-slateInk">4 online</Text>
          <View className="self-start rounded-[99px] bg-accentSoft px-[8px] py-[3px]">
            <Text className="text-[11px] font-bold text-accentText">1 cocok denganmu</Text>
          </View>
        </View>

        {/* Kartu Ruangan non-aktif */}
        <View className="absolute bottom-[10px] right-[8px] w-[180px] gap-[8px] rounded-[18px] border border-dashed border-slateBorderMuted bg-slateSurface p-[14px]">
          <Text className="text-[15px] font-bold text-slateMuted">Gazebo</Text>
          <Text className="text-[20px] font-extrabold text-slateMuted">2 online</Text>
        </View>
      </View>
    </View>
  );
}
