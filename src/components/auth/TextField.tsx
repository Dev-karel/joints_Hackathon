import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { palette } from '@/components/onboarding/palette';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, secureTextEntry, ...inputProps }: TextFieldProps) {
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View className="w-full gap-[6px]">
      <Text className="text-[13px] font-semibold text-ink">{label}</Text>
      <View
        className={`h-[52px] flex-row items-center rounded-[14px] border bg-white/70 px-[14px] ${
          error ? 'border-coral' : 'border-white'
        }`}>
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && hidden}
          placeholderTextColor={palette.slateMuted}
          accessibilityLabel={label}
          className="flex-1 text-[15px] text-ink"
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
            hitSlop={10}>
            {hidden ? (
              <Eye size={20} color={palette.slateMuted} />
            ) : (
              <EyeOff size={20} color={palette.slateMuted} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-[12px] text-coral">{error}</Text> : null}
    </View>
  );
}
