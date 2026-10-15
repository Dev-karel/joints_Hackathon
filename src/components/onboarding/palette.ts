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
  surfaceCanvas: '#FAFBFD',
  accentSoft: '#FEF3E2',
  slateInk: '#0F172A',
  slateMuted: '#94A3B8',
  slateBorderMuted: '#CBD5E1',
  borderSubtle: '#DDE7DF',
  accent50: '#FFF8EB',
  accent200: '#FDE2B3',
  accent800: '#7C4700',
  skyBlob: '#CCE8F6',
  primaryDeep: '#0C447C',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  dangerLine: '#FCA5A5',
  dangerDot: '#DC2626',
  slate500: '#64748B',
  slate100: '#F1F5F9',
  successSoft: '#DCF4E5',
  success: '#16A34A',
  successText: '#166534',
} as const;
