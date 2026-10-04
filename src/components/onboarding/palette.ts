// Hex warna untuk konsumen yang TIDAK bisa memakai className NativeWind:
// react-native-svg (prop fill/stroke), lucide-react-native (prop color), dan
// shadow React Native (shadowColor).
//
// tailwind.config.js adalah SUMBER KEBENARAN token warna. Nilai di file ini
// wajib identik dengan theme.extend.colors di sana — kalau salah satu diubah,
// ubah keduanya dalam satu perubahan.
export const palette = {
  primary: '#0072B8',
  accent: '#F39C12',
  accentText: '#A65C00',
  ink: '#17352D',
  inkMuted: '#47645B',
  titleAccent: '#5266D8',
  limeHighlight: '#DDF27A',
  coral: '#FF765C',
  onlineGreen: '#72C68B',
  surfaceMint: '#CDEFD8',
  surfaceSky: '#E6F3FB',
  accentSoft: '#FEF3E2',
  slateMuted: '#94A3B8',
  borderSubtle: '#DDE7DF',
} as const;
