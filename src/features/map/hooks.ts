import NetInfo from '@react-native-community/netinfo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { profileKey, useProfile } from '@/features/auth/useProfile';
import { ensureWifiPermission, readBssid } from '@/lib/wifi/readBssid';

import { fetchZonePresence, fetchZones, leaveZone, resolveZone, setShowOnMap } from './api';
import { setMapStatus } from './mapStore';

const HEARTBEAT_MS = 2 * 60_000; // PRD §7.5: tiap 2 menit
const MIN_GAP_MS = 15_000; // jangan menembak resolve-zone lebih rapat dari ini

export const useZones = () =>
  useQuery({ queryKey: ['zones'], queryFn: fetchZones, staleTime: 10 * 60_000 });

// Polling (bukan Realtime): klien tidak boleh membaca tabel presence langsung (RLS).
export const useZonePresence = () =>
  useQuery({ queryKey: ['zone-presence'], queryFn: fetchZonePresence, refetchInterval: 20_000 });

/** Baca BSSID lalu kirim ke resolve-zone. BSSID tidak disimpan dan tidak di-log. */
async function beat() {
  const reading = await readBssid();
  if (reading.status !== 'ok') {
    await leaveZone().catch(() => undefined);
    setMapStatus(reading.status);
    return;
  }
  const result = await resolveZone(reading.bssid);
  if (result.status === 'in_zone') setMapStatus('in_zone', { id: result.zone_id, name: result.zone_name });
  else if (result.status === 'outside' || result.status === 'hidden') setMapStatus('outside');
  // 'throttled': biarkan status sebelumnya.
}

/**
 * Heartbeat presence: hanya saat toggle aktif DAN app di foreground (CLAUDE.md: tanpa
 * background location). Dipasang sekali di layout tab.
 */
export function usePresenceHeartbeat(userId: string | undefined) {
  const { data: profile } = useProfile(userId);
  const enabled = profile?.show_on_map === true;
  const lastBeat = useRef(0);

  const safeBeat = useCallback(async () => {
    if (Date.now() - lastBeat.current < MIN_GAP_MS) return;
    lastBeat.current = Date.now();
    try {
      await beat();
    } catch {
      // gagal jaringan: coba lagi di heartbeat berikutnya
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setMapStatus('idle');
      return;
    }

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      void safeBeat();
      timer = setInterval(() => void safeBeat(), HEARTBEAT_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    if (AppState.currentState === 'active') start();

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        stop();
        start();
      } else {
        stop();
        void leaveZone().catch(() => undefined); // ke background: hilang dari peta
      }
    });
    // Wi-Fi berganti (pindah access point) -> perbarui zona.
    const netUnsub = NetInfo.addEventListener(() => void safeBeat());

    return () => {
      stop();
      appSub.remove();
      netUnsub();
    };
  }, [enabled, safeBeat]);
}

/** Nyalakan/matikan "Tampil di peta". Mengembalikan alasan bila gagal. */
export function useToggleSharing(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useCallback(
    async (next: boolean): Promise<{ ok: true } | { ok: false; reason: 'no-permission' | 'error' }> => {
      if (!userId) return { ok: false, reason: 'error' };
      try {
        if (next && !(await ensureWifiPermission())) return { ok: false, reason: 'no-permission' };
        await setShowOnMap(userId, next);
        if (!next) await leaveZone().catch(() => undefined);
        await queryClient.invalidateQueries({ queryKey: profileKey(userId) });
        void queryClient.invalidateQueries({ queryKey: ['zone-presence'] });
        return { ok: true };
      } catch {
        return { ok: false, reason: 'error' };
      }
    },
    [userId, queryClient],
  );
}
