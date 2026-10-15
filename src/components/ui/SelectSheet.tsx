import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';

type Option<T extends string> = { value: T; label: string };

type SelectSheetProps<T extends string> = {
  /** Label di depan nilai, mis. "Kategori". */
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

// Pemilih "Label: Nilai ▾" yang membuka lembar bawah. Pengganti deretan chip panjang.
export function SelectSheet<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SelectSheetProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}. Ubah`}
        accessibilityState={{ disabled }}
        className={`min-h-[48px] flex-row items-center gap-[8px] rounded-[14px] border border-slateBorder bg-white px-[14px] ${
          disabled ? 'opacity-40' : ''
        }`}
      >
        <Text className="text-[13px] font-semibold text-slate500">{label}:</Text>
        <Text numberOfLines={1} className="flex-1 text-[14px] font-bold text-slateInk">
          {current}
        </Text>
        <ChevronDown size={18} color={palette.slate500} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text className="w-full text-[20px] font-extrabold text-slateInk">{label}</Text>
        <View className="w-full gap-[8px]">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`min-h-[52px] flex-row items-center justify-between rounded-[14px] border px-[14px] ${
                  active ? 'border-primary bg-surfaceSky' : 'border-slateBorder bg-white'
                }`}
              >
                <Text className="flex-1 text-[15px] font-semibold text-slateInk">{o.label}</Text>
                {active ? <Check size={18} color={palette.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
