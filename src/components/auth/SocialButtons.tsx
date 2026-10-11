import { Text, View } from 'react-native';

// Hanya tampilan di MVP: OAuth belum diimplementasikan (CLAUDE.md).
export function SocialButtons() {
  return (
    <View className="w-full gap-[10px]">
      <View className="flex-row items-center gap-[10px]">
        <View className="h-px flex-1 bg-borderSubtle" />
        <Text className="text-[12px] text-slateMuted">atau lanjut dengan</Text>
        <View className="h-px flex-1 bg-borderSubtle" />
      </View>
      <View className="flex-row gap-[10px]">
        {['Google', 'Facebook', 'Apple'].map((name) => (
          <View
            key={name}
            accessibilityState={{ disabled: true }}
            className="h-[46px] flex-1 items-center justify-center rounded-full border border-white bg-white/50 opacity-70">
            <Text className="text-[13px] font-semibold text-inkMuted">{name}</Text>
          </View>
        ))}
      </View>
      <Text className="text-center text-[11px] text-slateMuted">Segera hadir</Text>
    </View>
  );
}
