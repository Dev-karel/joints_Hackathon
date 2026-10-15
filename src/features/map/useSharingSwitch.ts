import { useCallback, useState } from 'react';

import { useToggleSharing } from './hooks';

const NO_PERMISSION =
  'Izin lokasi tepat ditolak. Aktifkan di pengaturan, lalu coba lagi.';
const FAILED = 'Gagal mengubah pengaturan. Periksa internet kamu lalu coba lagi.';

/**
 * Status saklar "Tampil di peta" untuk layar Profil dan Peta. Saklar langsung berpindah saat
 * diketuk (nilai optimistis) dan kembali sendiri bila gagal, supaya tidak terasa macet menunggu
 * server.
 */
export function useSharingSwitch(userId: string | undefined, serverValue: boolean) {
  const toggleSharing = useToggleSharing(userId);
  const [pending, setPending] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const busy = pending !== null;
  const value = pending ?? serverValue;

  const toggle = useCallback(
    async (next?: boolean) => {
      if (busy) return;
      const target = next ?? !serverValue;
      setMessage(null);
      setPending(target);
      const result = await toggleSharing(target);
      setPending(null);
      if (!result.ok) setMessage(result.reason === 'no-permission' ? NO_PERMISSION : FAILED);
    },
    [busy, serverValue, toggleSharing],
  );

  return { value, busy, message, toggle };
}
