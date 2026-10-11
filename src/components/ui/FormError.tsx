import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { palette } from '@/components/onboarding/palette';

type FormErrorProps = {
  message: string;
  /** Ukuran teks; field kecil memakai 12. */
  size?: 12 | 13 | 14;
};

// Pesan error yang terbaca: teks memakai ink (≥12:1) dan warna coral hanya di ikon, karena
// coral sebagai teks di atas putih hanya 2,6:1. Diumumkan ke screen reader saat muncul.
export function FormError({ message, size = 13 }: FormErrorProps) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      className="flex-row items-start gap-[6px]"
    >
      <View className="pt-[1px]">
        <CircleAlert size={size + 3} strokeWidth={2.2} color={palette.coral} />
      </View>
      <Text className="flex-1 text-slateInk" style={{ fontSize: size, lineHeight: size + 6 }}>
        {message}
      </Text>
    </View>
  );
}
