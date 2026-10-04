// Konfigurasi Babel untuk Expo SDK 57 + NativeWind v4.
// Plugin Babel Reanimated/Worklets tidak ditulis di sini karena sudah diatur
// otomatis oleh babel-preset-expo.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
