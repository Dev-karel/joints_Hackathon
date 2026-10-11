// Satu-satunya tempat membuat Supabase client. Layar tidak boleh memanggilnya
// langsung: bungkus di hook/query di src/features/ (CLAUDE.md).
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '../env';
import { secureStorage } from './secureStorage';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh token hanya jalan saat app di foreground (hemat baterai, sesuai prinsip
// "tidak ada background task").
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
