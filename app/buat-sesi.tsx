import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { CompetitionForm } from '@/features/match/components/CompetitionForm';
import { StudyForm } from '@/features/match/components/StudyForm';

// "Buat ajakan" (Figma: Match - Buat Sesi / Buat Lowongan). Satu layar, dua bentuk:
// Belajar membuat sesi belajar (host otomatis jadi anggota pertama lewat trigger database),
// Lomba memasang lowongan anggota tim.
export default function BuatAjakanScreen() {
  const router = useRouter();
  const { tipe } = useLocalSearchParams<{ tipe?: string }>();
  const [type, setType] = useState<'belajar' | 'lomba'>(tipe === 'lomba' ? 'lomba' : 'belajar');

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center justify-between px-[20px] pb-[12px] pt-[8px]">
          <Text className="text-[24px] font-extrabold tracking-[-0.48px] text-slateInk">Buat ajakan</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Tutup"
            hitSlop={12}
          >
            <X size={24} color={palette.slate500} />
          </Pressable>
        </View>

        <View className="px-[20px] pb-[16px]">
          <View className="flex-row rounded-full bg-slate100 p-[4px]">
            {(['belajar', 'lomba'] as const).map((t) => {
              const active = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  className={`flex-1 items-center rounded-full py-[9px] ${active ? 'bg-white' : ''}`}
                  style={active ? { elevation: 1 } : undefined}
                >
                  <Text className={`text-[14px] font-bold ${active ? 'text-primary' : 'text-slate500'}`}>
                    {t === 'belajar' ? 'Belajar' : 'Lomba'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {type === 'belajar' ? <StudyForm /> : <CompetitionForm />}
    </View>
  );
}
