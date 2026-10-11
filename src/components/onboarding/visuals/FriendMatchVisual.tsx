import { MessageCircle, ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { palette } from '../palette';
import { cardShadow } from '../shadows';

type FriendCardProps = {
  avatarClassName: string;
  initial: string;
  name: string;
  subtitle: string;
};

function FriendCard({ avatarClassName, initial, name, subtitle }: FriendCardProps) {
  return (
    <View
      className="w-[286px] flex-row items-center gap-[12px] rounded-[24px] bg-white p-[14px]"
      style={cardShadow}
    >
      <View className="relative h-[58px] w-[58px]">
        <View
          className={`size-[58px] items-center justify-center rounded-[24px] border-[3px] border-white ${avatarClassName}`}
        >
          <Text className="text-[21px] font-bold text-ink">{initial}</Text>
        </View>
        <View className="absolute right-[-4px] top-0 size-[9px] rounded-full border-2 border-white bg-onlineGreen" />
      </View>

      <View className="flex-1 gap-[4px]">
        <Text className="text-[16px] font-semibold text-ink">{name}</Text>
        <Text className="text-[11px] text-inkMuted">{subtitle}</Text>
      </View>

      <View className="size-[36px] items-center justify-center rounded-full bg-surfaceLilac">
        <MessageCircle size={17} strokeWidth={2} color={palette.titleAccent} />
      </View>
    </View>
  );
}

export function FriendMatchVisual() {
  return (
    <View className="min-h-[316px] w-full gap-[13px] overflow-hidden rounded-[32px] bg-surfaceLilac px-[20px] pb-[22px] pt-[26px]">
      <View className="absolute right-[-16px] top-[-18px] size-[112px] rounded-full bg-limeHighlight opacity-90" />
      <View className="absolute bottom-[-40px] left-[-28px] size-[126px] rounded-full bg-surfaceMint opacity-[0.85]" />

      <View className="flex-row items-center justify-between">
        <View className="size-[42px] rotate-[-4deg] items-center justify-center rounded-[16px] bg-ink">
          <Text className="text-[22px]">👋</Text>
        </View>

        <View className="flex-row items-center gap-[6px] rounded-full bg-white px-[11px] py-[7px]">
          <ShieldCheck size={14} strokeWidth={2} color={palette.onlineGreen} />
          <Text className="text-[10px] text-ink">teman, bukan dating</Text>
        </View>
      </View>

      <View className="w-full items-center gap-[10px]">
        <FriendCard
          avatarClassName="bg-limeHighlight"
          initial="R"
          name="🎓 Rani"
          subtitle="Satu kelas · suka belajar bareng"
        />

        <View className="h-[18px] w-[250px] flex-row items-center justify-between">
          <View className="size-[6px] rounded-full bg-coral" />
          <View className="mx-[7px] h-0 flex-1 border-t-[1.5px] border-dashed border-coral" />
          <View className="size-[6px] rounded-full bg-coral" />
        </View>

        <FriendCard
          avatarClassName="bg-surfaceSand"
          initial="D"
          name="💬 Dimas"
          subtitle="Minat sama · siap kenalan"
        />
      </View>
    </View>
  );
}
