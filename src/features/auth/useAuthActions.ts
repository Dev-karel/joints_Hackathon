import { queryClient } from '@/lib/queryClient';

import {
  deleteMyAccount,
  resendDeviceCode,
  signIn,
  signInWithGoogle,
  signOut,
  verifyDeviceCode,
} from './api';
import { useAuthStore } from './authStore';

const setGate = (gate: ReturnType<typeof useAuthStore.getState>['gate']) =>
  useAuthStore.setState({ gate });

/** @returns true bila HP belum dikenal (OTP dikirim, gerbang 'otp' aktif). */
export async function signInWithGate(email: string, password: string): Promise<boolean> {
  setGate({ kind: 'checking' });
  try {
    const needsOtp = await signIn(email, password);
    setGate(needsOtp ? { kind: 'otp', email: email.trim().toLowerCase() } : { kind: 'none' });
    return needsOtp;
  } catch (e) {
    setGate({ kind: 'none' });
    throw e;
  }
}

/** @returns false bila pengguna membatalkan login Google. Sesi dipindahkan oleh gerbang rute. */
export async function signInWithGoogleGate(): Promise<boolean> {
  setGate({ kind: 'checking' });
  try {
    return await signInWithGoogle();
  } finally {
    setGate({ kind: 'none' });
  }
}

export async function confirmDeviceCode(email: string, token: string) {
  await verifyDeviceCode(email, token);
  setGate({ kind: 'none' });
}

export const requestDeviceCode = resendDeviceCode;

/** Batalkan verifikasi HP baru: keluar supaya sesi tidak menggantung. */
export async function cancelDeviceGate() {
  await signOut();
  setGate({ kind: 'none' });
}

export async function logout() {
  await signOut();
  setGate({ kind: 'none' });
  queryClient.clear();
}

/** Hapus akun lalu bersihkan sesi lokal (token lama sudah tidak berlaku). */
export async function deleteAccount() {
  await deleteMyAccount();
  await logout();
}
