import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder tab yang belum dibangun (Match, Event, Peta).
export function ComingSoon({ title }: { title: string }) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-[6px] px-[24px]">
        <Text className="text-[20px] font-bold text-ink">{title}</Text>
        <Text className="text-center text-[14px] text-inkMuted">Segera hadir.</Text>
      </View>
    </SafeAreaView>
  );
}
