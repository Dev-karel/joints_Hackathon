import { ActivityIndicator, Pressable, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
};

// Tombol pil penuh lebar, gaya sama dengan tombol di layar Welcome.
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'solid',
}: PrimaryButtonProps) {
  const inactive = disabled || loading;
  const solid = variant === 'solid';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
      className={`w-full items-center justify-center rounded-full py-[16px] ${
        solid ? 'bg-primary' : 'border-[1.5px] border-primary/70 bg-white/60'
      } ${inactive ? 'opacity-50' : ''}`}>
      {loading ? (
        <ActivityIndicator color={solid ? '#FFFFFF' : '#0072B8'} />
      ) : (
        <Text className={`text-center text-[16px] font-bold ${solid ? 'text-white' : 'text-primary'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
