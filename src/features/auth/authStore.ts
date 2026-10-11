import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

// Gerbang HP baru:
//  - checking: signInWithPassword sedang berjalan; sesi yang baru muncul belum dipercaya.
//  - otp: HP belum dikenal, kode sudah dikirim, menunggu verifikasi.
export type Gate = { kind: 'none' } | { kind: 'checking' } | { kind: 'otp'; email: string };

type AuthState = {
  ready: boolean;
  session: Session | null;
  gate: Gate;
};

export const useAuthStore = create<AuthState>(() => ({
  ready: false,
  session: null,
  gate: { kind: 'none' },
}));
