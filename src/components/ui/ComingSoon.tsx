import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { GlassCard } from '@/components/glass/GlassCard';

// Placeholder tab yang belum dibangun (Match, Event, Peta).
export function ComingSoon({ title }: { title: string }) {
  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 items-center justify-center px-[24px]">
          <GlassCard className="items-center gap-[6px] px-[28px] py-[24px]">
            <Text className="text-[20px] font-bold text-ink">{title}</Text>
            <Text className="text-center text-[14px] text-inkMuted">Segera hadir.</Text>
          </GlassCard>
        </View>
      </SafeAreaView>
    </GlassBackground>
  );
}
