// Konfigurasi Metro: config default Expo dibungkus NativeWind,
// dengan global.css sebagai sumber direktif Tailwind.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css' });
