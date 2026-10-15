import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { palette } from '@/components/onboarding/palette';

type BackButtonProps = {
  /** Lingkaran putih, untuk header berwarna (mis. detail event). */
  onSurface?: boolean;
  onPress?: () => void;
};

// Satu tombol kembali untuk semua layar detail: 48dp, chevron 24, label screen reader.
export function BackButton({ onSurface = false, onPress }: BackButtonProps) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityRole="button"
      accessibilityLabel="Kembali"
      className={`h-[48px] w-[48px] items-center justify-center rounded-full ${onSurface ? 'bg-white' : ''}`}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <ChevronLeft size={24} color={palette.slateInk} />
    </Pressable>
  );
}
