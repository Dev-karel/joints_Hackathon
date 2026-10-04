// Deklarasi tipe untuk side-effect import berkas CSS.
// Dipakai oleh app/_layout.tsx yang mengimpor src/global.css untuk
// mengaktifkan NativeWind.
//
// Normalnya deklarasi ini datang dari `expo-env.d.ts` yang di-generate Expo CLI.
// Berkas itu belum ada di repo yang baru di-scaffold, jadi deklarasinya ditulis
// manual di sini agar `npm run typecheck` lolos tanpa perlu menjalankan dev
// server lebih dulu. Aman dibiarkan setelah expo-env.d.ts muncul.
//
// Catatan: JANGAN taruh deklarasi ini di `nativewind-env.d.ts` (root) — berkas
// itu di-generate ulang otomatis oleh NativeWind setiap kali bundling, sehingga
// isinya akan tertimpa.
declare module '*.css';
