import { useRouter } from 'expo-router';
import { Image, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WelcomeBackdrop } from '@/components/onboarding/WelcomeBackdrop';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

// Logo di layar Welcome (Figma node 278:370, "Group 10" = mark + wordmark).
//
// PENTING soal aset: hasil export Figma (939x621) ternyata hanya berisi konten
// logo seukuran 342x270 yang menempel di kiri-atas, sisanya padding transparan
// (555px kanan, 349px bawah). Itu membuat logo tampak kecil dan tidak terpusat.
// Berkas `assets/brand/brand-logo-stacked.png` sudah DIPOTONG tepat di batas
// kontennya, jadi rasio di bawah mengacu ke ukuran hasil potong — bukan ke
// ukuran frame Figma. Kalau aset ini di-export ulang dari Figma, padding-nya
// kembali dan rasio ini harus dihitung lagi.
const LOGO_ASPECT = 342 / 270;
const LOGO_WIDTH_RATIO = 0.6; // ±60% lebar layar, menyamai proporsi render Figma
const LOGO_MAX_WIDTH = 300; // batas atas supaya tidak berlebihan di tablet

export default function WelcomeScreen() {
  const router = useRouter();
  // Ukuran dihitung eksplisit dalam piksel, BUKAN lewat `width: '%'` +
  // `aspectRatio` pada <Image>. Kombinasi persentase + aspectRatio pada Image
  // tidak andal di React Native: persentasenya terabaikan dan gambar dirender
  // pada ukuran intrinsiknya, sehingga meluber keluar layar.
  const { width: screenWidth } = useWindowDimensions();
  const logoWidth = Math.min(screenWidth * LOGO_WIDTH_RATIO, LOGO_MAX_WIDTH);
  const logoHeight = logoWidth / LOGO_ASPECT;

  return (
    <View className="flex-1 bg-surfaceCanvas">
      <WelcomeBackdrop />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-between px-[28px] pb-[24px]">
          {/* spacer atas (Figma 278:374) */}
          <View className="h-px w-px" />

          <Image
            source={require('../../assets/brand/brand-logo-stacked.png')}
            resizeMode="contain"
            style={{ width: logoWidth, height: logoHeight }}
            accessibilityLabel="AyokMatch"
          />

          {/* Tanpa bg-white: di Figma latar dekoratif menerus sampai bawah layar,
              tidak ada pita putih di belakang tombol. */}
          <View className="w-full items-center gap-[12px]">
            <PrimaryButton label="Daftar Akun" onPress={() => router.push('/daftar')} />
            <PrimaryButton label="Masuk" variant="outlinePill" onPress={() => router.push('/masuk')} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
