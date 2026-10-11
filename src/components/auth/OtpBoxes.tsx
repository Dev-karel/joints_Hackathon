import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { INTER, Text } from '@/components/ui/AppText';

type OtpBoxesProps = {
  value: string;
  onChange: (value: string) => void;
  length: number;
  /** sheet = kotak terisi abu-abu muda (OTP HP baru); dialog = kotak putih (OTP daftar). */
  variant: 'sheet' | 'dialog';
};

// Kotak kode seperti Figma: 48x56, radius 12, kotak aktif bergaris biru 2 px dengan kursor.
// Satu TextInput tersembunyi menangkap angka (termasuk tempel kode dari email).
export function OtpBoxes({ value, onChange, length, variant }: OtpBoxesProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(true);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View className="w-full">
      <Pressable
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="none"
        className={`w-full flex-row items-center gap-[8px] ${
          variant === 'dialog' ? 'justify-between' : 'justify-center'
        }`}
      >
        {Array.from({ length }, (_, i) => {
          const digit = value[i];
          const active = focused && i === activeIndex;
          return (
            <View
              key={i}
              className={`h-[56px] max-w-[48px] flex-1 items-center justify-center rounded-[12px] ${
                active
                  ? 'border-2 border-primary bg-white'
                  : `border border-slateBorder ${digit && variant === 'sheet' ? 'bg-slateSurface' : 'bg-white'}`
              }`}
            >
              {digit ? (
                <Text
                  className={`font-bold text-slateInk ${variant === 'sheet' ? 'text-[22px]' : 'text-[20px]'}`}
                >
                  {digit}
                </Text>
              ) : active ? (
                <View className="h-[24px] w-[2px] bg-primary" />
              ) : null}
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        accessibilityLabel={`Kode verifikasi ${length} angka`}
        caretHidden
        style={{ position: 'absolute', inset: 0, opacity: 0, fontFamily: INTER.regular }}
      />
    </View>
  );
}
