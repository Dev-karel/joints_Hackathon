// Operasi auth Supabase. Alur (ARCHITECTURE §4.1):
//  - Daftar: signUp({email,password}) -> OTP 6 digit ke email kampus -> verifyOtp('signup').
//  - Masuk: signInWithPassword; kalau device_id belum ada di trusted_devices, minta
//    OTP email lagi (signInWithOtp shouldCreateUser:false -> verifyOtp('email')).
// Catatan: gerbang HP baru ini dicek di aplikasi, BUKAN 2FA sungguhan (Supabase MFA tidak
// mendukung OTP email). Jangan diklaim sebagai 2FA di depan juri.
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase/client';

import { getDeviceIdHash } from './deviceId';
import { toAuthError } from './errors';

async function isDeviceTrusted(userId: string): Promise<boolean> {
  const hash = await getDeviceIdHash();
  const { data, error } = await supabase
    .from('trusted_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('device_id_hash', hash)
    .maybeSingle();
  if (error) throw toAuthError(error);
  return data !== null;
}

async function trustCurrentDevice(userId: string): Promise<void> {
  const hash = await getDeviceIdHash();
  const { error } = await supabase
    .from('trusted_devices')
    .upsert(
      { user_id: userId, device_id_hash: hash, last_seen_at: new Date().toISOString() },
      { onConflict: 'user_id,device_id_hash' }
    );
  if (error) throw toAuthError(error);
}

export async function signUp(input: { fullName: string; email: string; password: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { full_name: input.fullName.trim() } },
  });
  if (error) throw toAuthError(error);
  // Email yang sudah terdaftar & terverifikasi tidak menghasilkan error dari Supabase
  // (anti-enumerasi), tapi `identities` kosong dan tidak ada OTP yang dikirim.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    throw toAuthError({ message: 'User already registered', code: 'user_already_exists' });
  }
}

export async function resendSignupCode(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw toAuthError(error);
}

export async function verifySignupCode(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  if (error) throw toAuthError(error);
  // HP tempat mendaftar langsung dicatat sebagai HP terverifikasi.
  if (data.user) await trustCurrentDevice(data.user.id);
}

/** @returns true bila HP ini belum dikenal dan OTP sudah dikirim ke email kampus. */
export async function signIn(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password });
  if (error) throw toAuthError(error);

  try {
    if (await isDeviceTrusted(data.user.id)) {
      await trustCurrentDevice(data.user.id); // perbarui last_seen_at
      return false;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: false },
    });
    if (otpError) throw toAuthError(otpError);
    return true;
  } catch (e) {
    await supabase.auth.signOut(); // jangan biarkan sesi menggantung bila gerbang HP gagal
    throw e;
  }
}

/**
 * Masuk dengan Google lewat browser sistem (OAuth). Akun Google sudah terverifikasi oleh Google,
 * jadi tidak ada OTP HP baru; HP langsung dicatat terverifikasi.
 * @returns false bila pengguna menutup browser tanpa menyelesaikan login.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw toAuthError(error ?? { message: 'oauth_url_missing' });

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  // Supabase mengembalikan hasil lewat query (?code= / ?error=) atau fragment (#access_token=).
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.replace(/^#/, ''));
  url.searchParams.forEach((value, key) => params.set(key, value));

  const oauthError = params.get('error_description') ?? params.get('error');
  if (oauthError) throw toAuthError({ message: oauthError });

  const code = params.get('code');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  let userId: string | undefined;
  if (code) {
    const { data: s, error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) throw toAuthError(e);
    userId = s.user?.id;
  } else if (accessToken && refreshToken) {
    const { data: s, error: e } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (e) throw toAuthError(e);
    userId = s.user?.id;
  } else {
    throw toAuthError({ message: 'oauth_no_session' });
  }

  if (userId) await trustCurrentDevice(userId);
  return true;
}

export async function resendDeviceCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw toAuthError(error);
}

export async function verifyDeviceCode(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw toAuthError(error);
  if (data.user) await trustCurrentDevice(data.user.id);
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Dipakai saat app dibuka: sesi tersimpan di HP yang belum terverifikasi tidak dipercaya.
 * Jika pengecekan gagal karena koneksi, sesi dipertahankan (fail-open) supaya app tetap
 * bisa dibuka offline; RLS tetap melindungi data.
 */
export async function sessionDeviceIsTrusted(userId: string): Promise<boolean> {
  try {
    return await isDeviceTrusted(userId);
  } catch {
    return true;
  }
}
