/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Sumber kebenaran token warna. Nilai di bawah diambil dari file Figma
      // AyokMatch (VVKGydFbHIgG3gBPVmozCm). Kalau ada yang diubah di sini,
      // ubah juga src/components/onboarding/palette.ts supaya tetap identik.
      colors: {
        primary: '#0072B8',
        accent: '#F39C12',
        accentText: '#A65C00',
        ink: '#17352D',
        inkMuted: '#47645B',
        inkOnDark: '#C8D8D2',
        titleAccent: '#5266D8',
        surfaceLilac: '#E8ECFF',
        surfaceSky: '#E6F3FB',
        surfaceMint: '#CDEFD8',
        surfaceSand: '#F2E7CE',
        surfaceCanvas: '#FAFBFD',
        limeHighlight: '#DDF27A',
        coral: '#FF765C',
        onlineGreen: '#72C68B',
        borderSubtle: '#DDE7DF',
        accentSoft: '#FEF3E2',
        slateInk: '#0F172A',
        slateMuted: '#94A3B8',
        slateBorder: '#E2E8F0',
        slateBorderMuted: '#CBD5E1',
        slateSurface: '#F8FAFC',
      },
    },
  },
  plugins: [],
};
