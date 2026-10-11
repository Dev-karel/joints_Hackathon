import { create } from 'zustand';

// Status terakhir hasil pembacaan Wi-Fi + resolve-zone (hanya di memori, tidak disimpan).
export type MapStatus =
  | 'idle' // toggle mati / belum dicek
  | 'in_zone'
  | 'outside' // Wi-Fi tidak dikenal kampus
  | 'no-wifi'
  | 'no-permission'
  | 'unavailable'; // terhubung Wi-Fi tapi BSSID tak terbaca

type MapState = {
  status: MapStatus;
  zoneId: string | null;
  zoneName: string | null;
};

export const useMapStore = create<MapState>(() => ({
  status: 'idle',
  zoneId: null,
  zoneName: null,
}));

export const setMapStatus = (status: MapStatus, zone?: { id?: string; name?: string }) =>
  useMapStore.setState({ status, zoneId: zone?.id ?? null, zoneName: zone?.name ?? null });
