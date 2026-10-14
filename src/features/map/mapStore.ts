import { create } from 'zustand';

// Status terakhir hasil pembacaan Wi-Fi + resolve-zone (hanya di memori, tidak disimpan).
export type MapStatus =
  | 'idle' // toggle mati
  | 'checking' // toggle nyala, pembacaan pertama belum selesai
  | 'in_zone'
  | 'outside' // Wi-Fi tidak dikenal kampus
  | 'no-wifi'
  | 'no-permission'
  | 'location-off' // layanan lokasi HP mati
  | 'unavailable' // terhubung Wi-Fi tapi BSSID tak terbaca
  | 'offline'; // Wi-Fi ada tapi server tak terjangkau (mis. belum login Wi-Fi kampus)

type MapState = {
  status: MapStatus;
  zoneId: string | null;
  zoneName: string | null;
  /** Waktu zona terakhir dikonfirmasi server (ms), untuk "1 mnt lalu". */
  confirmedAt: number | null;
};

export const useMapStore = create<MapState>(() => ({
  status: 'idle',
  zoneId: null,
  zoneName: null,
  confirmedAt: null,
}));

export const setMapStatus = (status: MapStatus, zone?: { id?: string; name?: string }) =>
  useMapStore.setState({
    status,
    zoneId: zone?.id ?? null,
    zoneName: zone?.name ?? null,
    confirmedAt: status === 'in_zone' ? Date.now() : null,
  });
