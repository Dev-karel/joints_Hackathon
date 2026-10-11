// Token tema "glass + rasi bintang". Referensi teknik: lokabis.web.app (lapisan translusen
// di atas latar gradien lembut, tepi tipis terang, sorot atas). Warna tetap warna brand
// AyokMatch (biru #0072B8, kuning #F39C12), bukan palet situs referensi.
//
// Blur nyata (BlurView) sengaja tidak dipakai: butuh dependency native baru dan di Android
// kurang andal. Latar kita gradien halus, jadi kartu putih translusen sudah terbaca sebagai
// kaca tanpa blur. Warna lain tetap mengikuti tailwind.config.js / palette.ts.
import { palette } from '../onboarding/palette';

export const glass = {
  base: palette.surfaceCanvas,
  // Tiga "awan" warna latar yang diberi gradien radial.
  // Hanya warna brand (biru #0072B8, kuning #F39C12, biru muda surfaceSky), tipis supaya
  // tampilan tetap putih bersih seperti desain Figma.
  wash: {
    blue: { color: palette.primary, opacity: 0.14 },
    amber: { color: palette.accent, opacity: 0.13 },
    sky: { color: palette.surfaceSky, opacity: 0.95 },
  },
  // Lapisan kartu kaca.
  surface: 'rgba(255, 255, 255, 0.58)',
  surfaceStrong: 'rgba(255, 255, 255, 0.82)',
  border: 'rgba(255, 255, 255, 0.85)',
  sheen: 'rgba(255, 255, 255, 0.9)',
  // Rasi bintang.
  line: palette.primary,
  starPrimary: palette.primary,
  starAccent: palette.accent,
} as const;

// Bayangan kartu kaca: lembut, tidak pekat (Android memakai elevation).
export const glassShadow = {
  shadowColor: palette.ink,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 3,
};
