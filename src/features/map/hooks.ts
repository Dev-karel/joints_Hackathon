import NetInfo from '@react-native-community/netinfo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { profileKey, useProfile } from '@/features/auth/useProfile';
import { ensureWifiPermission, readBssid } from '@/lib/wifi/readBssid';

import { fetchZonePresence, fetchZones, leaveZone, resolveZone, setShowOnMap } from './api';
import { setMapStatus, useMapStore } from './mapStore';

const HEARTBEAT_MS = 2 * 60_000; // PRD §7.5: tiap 2 menit
const MIN_GAP_MS = 20_000; // sama dengan rate limit resolve-zone (MIN_INTERVAL_SECONDS)
// Sinyal lemah di tepi jangkauan AP sering putus sebentar lalu tersambung lagi. Tunggu sekali
// sebelum menghapus dari peta supaya tidak berkedip; presence tetap kedaluwarsa sendiri (TTL).
const GRACE_MS = 30_000;
const OFFLINE_RETRY_MS = 30_000;

export const useZones = () =>
  useQuery({ queryKey: ['zones'], queryFn: fetchZones, staleTime: 10 * 60_000 });

// Polling (bukan Realtime): klien tidak boleh membaca tabel presence langsung (RLS).
export const useZonePresence = (enabled: boolean) =>
  useQuery({
    queryKey: ['zone-presence'],
    queryFn: fetchZonePresence,
    refetchInterval: 20_000,
    enabled,
  });

/**
 * Heartbeat presence: hanya saat toggle aktif DAN app di foreground (CLAUDE.md: tanpa
 * background location). Dipasang sekali di layout tab. BSSID tidak disimpan dan tidak di-log.
 */
export function usePresenceHeartbeat(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile(userId);
  const enabled = profile?.show_on_map === true;
  useEffect(() => {
    if (!enabled) {
      setMapStatus('idle');
      return;
    }
    if (useMapStore.getState().status === 'idle') setMapStatus('checking');

    let lastBeat = 0;
    let graceUsed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const foreground = () => AppState.currentState === 'active';
    const later = (ms: number) => {
      clearTimeout(retry);
      if (foreground()) retry = setTimeout(() => void beat(), ms);
    };

    async function beat(): Promise<void> {
      // Terlalu rapat: jadwalkan ulang (bukan dibuang), supaya pindah AP tetap tercatat.
      const wait = MIN_GAP_MS - (Date.now() - lastBeat);
      if (wait > 0) return later(wait);
      clearTimeout(retry);
      lastBeat = Date.now();

      try {
        const reading = await readBssid();
        if (reading.status !== 'ok') {
          if (
            reading.status === 'no-wifi' &&
            useMapStore.getState().status === 'in_zone' &&
            !graceUsed
          ) {
            graceUsed = true;
            return later(GRACE_MS);
          }
          graceUsed = false;
          await leaveZone().catch(() => undefined);
          setMapStatus(reading.status);
          return;
        }
        graceUsed = false;

        const result = await resolveZone(reading.bssid);
        // App sempat ke background saat request berjalan: jangan biarkan tampil di peta.
        if (!foreground()) {
          await leaveZone().catch(() => undefined);
          return;
        }
        if (result.status === 'in_zone') {
          setMapStatus('in_zone', { id: result.zone_id, name: result.zone_name });
          void queryClient.invalidateQueries({ queryKey: ['zone-presence'] });
        } else if (result.status === 'throttled') {
          later(MIN_GAP_MS);
        } else {
          setMapStatus('outside');
        }
      } catch {
        // Wi-Fi ada tapi server tak terjangkau (captive portal / internet putus). Presence lama
        // tetap kedaluwarsa sendiri setelah 15 menit.
        setMapStatus('offline');
        later(OFFLINE_RETRY_MS);
      }
    }

    const start = () => {
      void beat();
      timer = setInterval(() => void beat(), HEARTBEAT_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
      clearTimeout(retry);
    };

    if (AppState.currentState === 'active') start();

    const appSub = AppState.addEventListener('change', (state) => {
      stop();
      if (state === 'active') {
        start();
      } else {
        // Ke background: hilang dari peta. Reset jeda supaya saat kembali langsung tampil lagi.
        lastBeat = 0;
        graceUsed = false;
        void leaveZone().catch(() => undefined);
      }
    });
    // Wi-Fi berganti (pindah access point / putus) -> perbarui zona.
    const netUnsub = NetInfo.addEventListener(() => {
      if (AppState.currentState === 'active') void beat();
    });

    return () => {
      stop();
      appSub.remove();
      netUnsub();
    };
  }, [enabled, queryClient]);
}

/** Nyalakan/matikan "Tampil di peta". Mengembalikan alasan bila gagal. */
export function useToggleSharing(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useCallback(
    async (
      next: boolean
    ): Promise<{ ok: true } | { ok: false; reason: 'no-permission' | 'error' }> => {
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
    [userId, queryClient]
  );
}
