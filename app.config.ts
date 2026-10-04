import type { ExpoConfig } from 'expo/config';

// Konfigurasi app AyokMatch (Android-only untuk MVP).
//
// Aset ikon di assets/ dibuat dari logo di Figma (frame "Brand"). Icon launcher
// memakai MARK saja tanpa wordmark, karena teks "AYOkMATCH" tidak terbaca di
// ukuran launcher (~48dp). Splash memakai logo lengkap karena ukurannya besar.
const config: ExpoConfig = {
  name: 'AyokMatch',
  slug: 'ayokmatch',
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
    // expo-image-picker menyuntikkan izin RECORD_AUDIO (mikrofon) karena
    // library-nya juga mendukung perekaman video. Dibiarkan aktif atas keputusan
    // tim (4 Okt 2026).
    //
    // PERHATIAN saat pitching: MVP tidak punya fitur rekam video/audio, jadi izin
    // ini belum terpakai. Karena privasi adalah inti produk (PRD.md §10) dan juri
    // diperkirakan menanyakan soal itu (ROADMAP.md Fase 6), siapkan jawabannya —
    // atau matikan dengan menambahkan { microphonePermission: false } di sini.
    'expo-image-picker',
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
};

export default config;
