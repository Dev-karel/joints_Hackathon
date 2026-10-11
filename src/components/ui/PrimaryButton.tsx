import { ActivityIndicator, Pressable } from 'react-native';

import { Text } from '@/components/ui/AppText';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** solid = tombol pil biru; outline = tombol sekunder bergaris biru (Figma "Pelajari lebih lanjut"). */
  variant?: 'solid' | 'outline';
  /** sm = tombol di dalam popup (teks 15). */
  size?: 'md' | 'sm';
};

// Tombol dari Figma: pil biru #0072B8 dengan teks putih Bold; varian sekunder bergaris 2 px.
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'solid',
  size = 'md',
}: PrimaryButtonProps) {
  const inactive = disabled || loading;
  const solid = variant === 'solid';

  const shape = solid
    ? `rounded-full bg-primary ${size === 'sm' ? 'py-[14px]' : 'py-[16px]'}`
    : 'rounded-[14px] border-2 border-primary py-[12px]';
  const textSize = solid ? (size === 'sm' ? 'text-[15px]' : 'text-[16px]') : 'text-[14px]';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
      className={`min-h-[48px] w-full items-center justify-center ${shape} ${
        inactive ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color={solid ? '#FFFFFF' : '#0072B8'} />
      ) : (
        <Text
          className={`text-center font-bold ${textSize} ${solid ? 'text-white' : 'text-primary'}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
