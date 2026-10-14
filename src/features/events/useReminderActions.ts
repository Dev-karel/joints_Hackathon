import type { NotificationResponse } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { ACTION_CANCEL, ACTION_STILL_GOING, loadNotifications } from './reminders';

/**
 * Tanggapan atas notifikasi pengingat event (PRD §9.3). "Masih ikut" menutup notifikasi;
 * "Batal" dan ketukan biasa membuka detail event ("Batal" langsung menampilkan dialog batal ikut,
 * jadi tetap ada konfirmasi). Dipasang sekali di layout root saat pengguna sudah masuk.
 */
export function useReminderActions(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    let remove: (() => void) | undefined;
    let cancelled = false;

    void loadNotifications().then(async (Notifications) => {
      if (!Notifications || cancelled) return;
      const handle = (response: NotificationResponse) => {
        const eventId = (response.notification.request.content.data as { eventId?: string } | null)
          ?.eventId;
        if (!eventId) return;
        const action = response.actionIdentifier;
        if (action === ACTION_STILL_GOING) {
          void Notifications.dismissNotificationAsync(response.notification.request.identifier);
          return;
        }
        router.push({
          pathname: '/event/[id]',
          params: action === ACTION_CANCEL ? { id: eventId, batal: '1' } : { id: eventId },
        });
      };
      const sub = Notifications.addNotificationResponseReceivedListener(handle);
      remove = () => sub.remove();
      // App dibuka dari notifikasi saat tertutup: tanggapan terjadi sebelum listener terpasang.
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last && !cancelled) {
        await Notifications.clearLastNotificationResponseAsync();
        handle(last);
      }
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [enabled, router]);
}
