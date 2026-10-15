import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  /** Petunjuk kecil di bawah kolom (Figma: "Minimal 8 karakter, ..."). */
  hint?: string;
};

// Kolom isian gaya Figma: label Bold 14, garis bawah (biru 2 px saat fokus), ikon mata biru
// untuk kata sandi.
export function TextField({
  label,
  error,
  hint,
  secureTextEntry,
  onBlur,
  onFocus,
  ...inputProps
}: TextFieldProps) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View className="w-full gap-[8px]">
      <Text className="text-[14px] font-bold text-slateInk">{label}</Text>
      <View
        className={`min-h-[40px] flex-row items-center pb-[10px] ${
          focused
            ? 'border-b-2 border-primary'
            : error
              ? 'border-b-2 border-coral'
              : 'border-b border-slateBorder'
        }`}
      >
        <TextInput
 maxFontSizeMultiplier={1.3}
          {...inputProps}
          secureTextEntry={isPassword && hidden}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={palette.slate500}
          accessibilityLabel={label}
          style={{ fontFamily: INTER.regular, paddingVertical: 0 }}
          className="flex-1 text-[14px] text-slateInk"
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
            hitSlop={14}
          >
            {hidden ? (
              <Eye size={20} strokeWidth={2} color={palette.primary} />
            ) : (
              <EyeOff size={20} strokeWidth={2} color={palette.primary} />
            )}
          </Pressable>
        ) : null}
      </View>
      {hint && !error ? <Text className="text-[11px] text-slate500">{hint}</Text> : null}
      {error ? <FormError message={error} size={12} /> : null}
    </View>
  );
}
