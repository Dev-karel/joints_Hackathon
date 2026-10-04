// NativeWind v4 tidak punya utility yang memetakan ke shadowColor/shadowOpacity,
// dan Android merender bayangan dari `elevation`. Jadi dua bayangan kartu
// onboarding dipusatkan di sini sebagai objek style biasa (bukan
// StyleSheet.create) dan dipakai lewat prop `style`.
import { palette } from './palette';

export const cardShadow = {
  shadowColor: palette.ink,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.09,
  shadowRadius: 12,
  elevation: 4,
};

export const cardShadowStrong = {
  shadowColor: palette.ink,
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.13,
  shadowRadius: 32,
  elevation: 8,
};
