import { createContext, useContext } from 'react';
import { Text as RNText, type TextProps } from 'react-native';

// Font Inter dari Figma. Di Android, font kustom per-bobot (family terpisah) tidak boleh
// dikombinasikan dengan fontWeight (akan ditebalkan ganda/palsu), jadi kelas bobot Tailwind
// (font-medium/semibold/bold/extrabold) diterjemahkan ke family yang tepat dan dibuang dari
// className sebelum diteruskan ke NativeWind. Teks tanpa kelas bobot memakai Regular.
export const INTER = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
} as const;

const WEIGHT_CLASS = /(?:^|\s)font-(medium|semibold|bold|extrabold)(?=\s|$)/;

// Teks bersarang mewarisi family induknya kecuali menyebut bobot sendiri.
const InsideText = createContext(false);

type AppTextProps = TextProps & { className?: string };

export function Text({ className, style, ...props }: AppTextProps) {
  const nested = useContext(InsideText);
  const weight = className?.match(WEIGHT_CLASS)?.[1] as keyof typeof INTER | undefined;
  const fontFamily = weight ? INTER[weight] : nested ? undefined : INTER.regular;

  return (
    <InsideText.Provider value>
      <RNText
        // Ukuran font sistem dibatasi 1,1×: tanpa batas, pengaturan "Ukuran font" besar di HP
        // (mis. Samsung) membuat teks memenuhi dan menembus kotak/pil yang ukurannya tetap.
        maxFontSizeMultiplier={1.1}
        {...props}
        className={className?.replace(WEIGHT_CLASS, ' ').trim()}
        style={[fontFamily ? { fontFamily } : null, style]}
      />
    </InsideText.Provider>
  );
}
