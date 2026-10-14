// Membaca BSSID Wi-Fi yang sedang tersambung (PRD §7.2).
//
// ATURAN (CLAUDE.md): expo-location HANYA dipakai untuk meminta izin yang diwajibkan Android
// agar BSSID bisa dibaca (plus cek apakah layanan lokasi menyala, bukan API posisi).
// Jangan memanggil API posisi (getCurrentPosition dsb.).
// BSSID tidak boleh disimpan atau di-log: kembalikan ke pemanggil, lalu kirim hanya ke
// Edge Function resolve-zone / register-access-point.
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

import { PLACEHOLDER_BSSID, normalizeBssid, BSSID_PATTERN } from '@/lib/validation/wifi';

export type BssidReading =
  | { status: 'ok'; bssid: string }
  | { status: 'no-permission' } // izin lokasi presisi ditolak (atau hanya "perkiraan")
  | { status: 'location-off' } // layanan lokasi HP mati: Android mengembalikan BSSID samaran
  | { status: 'no-wifi' } // tidak tersambung Wi-Fi (mis. data seluler)
  | { status: 'unavailable' }; // terhubung Wi-Fi tapi BSSID tidak terbaca (mis. Expo Go)

// Android 12+ bisa memberi izin "perkiraan" saja; BSSID tetap tidak terbaca tanpa "tepat".
const isPrecise = (p: Location.LocationPermissionResponse) =>
  p.granted && p.android?.accuracy !== 'coarse';

/** Minta izin lokasi presisi (hanya agar BSSID terbaca). Mengembalikan true bila diberikan. */
export async function ensureWifiPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (isPrecise(current)) return true;
  if (!current.canAskAgain) return false;
  return isPrecise(await Location.requestForegroundPermissionsAsync());
}

export async function readBssid(): Promise<BssidReading> {
  if (!(await ensureWifiPermission())) return { status: 'no-permission' };

  const state = await NetInfo.fetch('wifi');
  if (state.type !== 'wifi' || !state.isConnected) return { status: 'no-wifi' };

  const raw = state.details && 'bssid' in state.details ? state.details.bssid : null;
  const bssid = raw ? normalizeBssid(raw) : '';
  if (bssid && bssid !== PLACEHOLDER_BSSID && BSSID_PATTERN.test(bssid))
    return { status: 'ok', bssid };

  return (await Location.hasServicesEnabledAsync())
    ? { status: 'unavailable' }
    : { status: 'location-off' };
}
