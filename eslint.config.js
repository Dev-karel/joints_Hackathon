// Flat config ESLint 9 memakai eslint-config-expo.
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*', 'android/*', 'ios/*', 'coverage/*']),
  expoConfig,
  {
    // File konfigurasi di root berjalan di Node (module, require, __dirname).
    files: ['*.config.js', 'babel.config.js', 'metro.config.js', 'tailwind.config.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
]);
