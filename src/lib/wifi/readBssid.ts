// Membaca BSSID Wi-Fi yang sedang tersambung (PRD §7.2).
//
// ATURAN (CLAUDE.md): expo-location HANYA dipakai untuk meminta izin yang diwajibkan Android
// agar BSSID bisa dibaca. Jangan memanggil API posisi (getCurrentPosition dsb.).
// BSSID tidak boleh disimpan atau di-log: kembalikan ke pemanggil, lalu kirim hanya ke
// Edge Function resolve-zone / register-access-point.
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

import { PLACEHOLDER_BSSID, normalizeBssid, BSSID_PATTERN } from '@/lib/validation/wifi';

export type BssidReading =
  | { status: 'ok'; bssid: string }
  | { status: 'no-permission' } // izin lokasi presisi ditolak
  | { status: 'no-wifi' } // tidak tersambung Wi-Fi (mis. data seluler)
  | { status: 'unavailable' }; // terhubung Wi-Fi tapi BSSID tidak terbaca (layanan lokasi mati / Expo Go)

/** Minta izin lokasi presisi (hanya agar BSSID terbaca). Mengembalikan true bila diberikan. */
export async function ensureWifiPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;
  const asked = await Location.requestForegroundPermissionsAsync();
  return asked.granted;
}

export async function readBssid(): Promise<BssidReading> {
  if (!(await ensureWifiPermission())) return { status: 'no-permission' };

  const state = await NetInfo.fetch('wifi');
  if (state.type !== 'wifi' || !state.isConnected) return { status: 'no-wifi' };

  const raw = state.details && 'bssid' in state.details ? state.details.bssid : null;
  if (!raw) return { status: 'unavailable' };

  const bssid = normalizeBssid(raw);
  if (bssid === PLACEHOLDER_BSSID || !BSSID_PATTERN.test(bssid)) return { status: 'unavailable' };
  return { status: 'ok', bssid };
}
