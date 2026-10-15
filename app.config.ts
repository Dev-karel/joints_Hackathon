import type { ExpoConfig } from 'expo/config';

// Konfigurasi app AyokMatch (Android-only untuk MVP).
//
// Aset ikon di assets/ dibuat dari logo di Figma (frame "Brand"). Icon launcher
// memakai MARK saja tanpa wordmark, karena teks "AYOkMATCH" tidak terbaca di
// ukuran launcher (~48dp). Splash memakai logo lengkap karena ukurannya besar.
const config: ExpoConfig = {
  name: 'AyokMatch',
  slug: 'ayokmatch',
  owner: 'sugarbbq',
  version: '0.2.0',
  scheme: 'ayokmatch',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  android: {
    package: 'com.ayokmatch.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    // ACCESS_FINE_LOCATION wajib: Android hanya mengizinkan pembacaan BSSID Wi-Fi
    // (inti fitur Match Map, lihat PRD.md §7.2) kalau izin lokasi presisi diberikan.
    // Aplikasi tidak memanggil API posisi/GPS. ACCESS_WIFI_STATE dibutuhkan NetInfo
    // untuk membaca WifiManager.
    permissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_WIFI_STATE'],
  },
  plugins: [
    'expo-router',
    'expo-location',
    'expo-notifications',
    'expo-secure-store',
    'expo-web-browser', // login Google (OAuth lewat browser sistem)
    // expo-image-picker menyuntikkan izin RECORD_AUDIO (mikrofon) karena library-nya juga mendukung
    // perekaman video. MVP tidak merekam audio/video dan privasi adalah inti produk (PRD.md §10),
    // jadi izin mikrofon dimatikan (14 Okt 2026). Perlu build ulang agar manifest berubah.
    ['expo-image-picker', { microphonePermission: false }],
    'expo-document-picker',
    // Splash screen: logo lengkap (mark + wordmark) di tengah, latar putih.
    // imageWidth = lebar tampil logo dalam dp, bukan ukuran berkasnya.
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  // projectId diisi setelah `eas init` (project EAS milik akun `owner` di atas).
  extra: {
    eas: {},
  },
};

export default config;
