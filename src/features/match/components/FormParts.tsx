import { ChevronDown, Minus, Plus } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';

// Bagian form "Buat ajakan" yang dipakai tab Belajar dan Lomba (Figma: Match - Buat Sesi / Lowongan).

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-[6px]">
      <Text className="text-[13px] font-bold text-slateInk">{label}</Text>
      {children}
      {hint ? <Text className="text-[12px] text-slate500">{hint}</Text> : null}
    </View>
  );
}

export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput
 maxFontSizeMultiplier={1.3}
      placeholderTextColor="#94A3B8"
      style={[{ fontFamily: INTER.regular, paddingVertical: 0 }, style]}
      className="min-h-[46px] rounded-[14px] border border-slateBorder px-[14px] text-[14px] text-slateInk"
      {...props}
    />
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'primary',
  dashed,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  tone?: 'primary' | 'accent';
  dashed?: boolean;
}) {
  const on = tone === 'accent' ? 'bg-accent' : 'bg-primary';
  const onText = tone === 'accent' ? 'text-[#4F2D00]' : 'text-white';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      className={`rounded-full px-[12px] py-[8px] ${
        active ? on : `border bg-white ${dashed ? 'border-dashed border-slateBorder' : 'border-slateBorder'}`
      }`}
    >
      <Text
        className={`text-[12px] font-semibold ${
          active ? onText : dashed ? 'text-primary' : 'text-slateInk'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Pilihan satu dari banyak, tampil seperti kolom dropdown Figma (daftar terbuka di bawahnya). */
export function SelectField<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  icon,
}: {
  value: T | null;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
  placeholder: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View className="gap-[6px]">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="min-h-[46px] flex-row items-center gap-[8px] rounded-[14px] border border-slateBorder px-[14px]"
      >
        {icon}
        <Text className={`flex-1 text-[14px] ${selected ? 'text-slateInk' : 'text-[#94A3B8]'}`} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={palette.slate500} />
      </Pressable>
      {open ? (
        <View className="max-h-[220px] overflow-hidden rounded-[14px] border border-slateBorder bg-white">
          <ScrollView nestedScrollEnabled>
            {options.length === 0 ? (
              <Text className="px-[14px] py-[12px] text-[13px] text-slate500">Belum ada pilihan.</Text>
            ) : (
              options.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: o.value === value }}
                  className={`px-[14px] py-[12px] ${o.value === value ? 'bg-surfaceSky' : ''}`}
                >
                  <Text className={`text-[14px] ${o.value === value ? 'font-bold text-primary' : 'text-slateInk'}`}>
                    {o.label}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  full,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** full = isi lebar kolom (dua stepper berdampingan di form Lomba). */
  full?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-[12px] rounded-full border border-slateBorder px-[10px] py-[6px] ${
        full ? 'justify-between self-stretch' : 'self-start'
      }`}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        accessibilityRole="button"
        accessibilityLabel="Kurangi"
        hitSlop={8}
        className="p-[4px]"
      >
        <Minus size={18} color={palette.primary} />
      </Pressable>
      <Text className="min-w-[20px] text-center text-[15px] font-extrabold text-slateInk">{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        accessibilityRole="button"
        accessibilityLabel="Tambah"
        hitSlop={8}
        className="p-[4px]"
      >
        <Plus size={18} color={palette.primary} />
      </Pressable>
    </View>
  );
}
