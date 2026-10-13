import { Platform } from 'react-native';

import type { EventItem } from './api';

const HOUR = 3_600_000;

type NotificationsModule = typeof import('expo-notifications');

// expo-notifications dimuat saat dipakai, bukan di baris import teratas: di Expo Go (Android)
// modulnya melempar error begitu dimuat dan menjatuhkan semua layar yang mengimpor file ini.
// Notifikasi lokal saja (tanpa server push). Semua gagal-diam: izin ditolak atau perangkat tidak
// mendukung tidak boleh membatalkan RSVP.
async function loadNotifications(): Promise<NotificationsModule | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function ensurePermission(Notifications: NotificationsModule): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function cancelEventReminders(eventId: string): Promise<void> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return;
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => (n.content.data as { eventId?: string } | null)?.eventId === eventId)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // abaikan
  }
}

/** Pengingat H-1 dan 3 jam sebelum acara (PRD §5). Pengingat yang waktunya sudah lewat dilewati. */
export async function scheduleEventReminders(event: EventItem): Promise<void> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return;
    if (!(await ensurePermission(Notifications))) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Pengingat acara',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await cancelEventReminders(event.id);

    const start = new Date(event.starts_at).getTime();
    const reminders = [
      { at: start - 24 * HOUR, body: `Besok: ${event.title}` },
      { at: start - 3 * HOUR, body: `3 jam lagi: ${event.title}` },
    ];
    for (const r of reminders) {
      if (r.at <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Pengingat event', body: r.body, data: { eventId: event.id } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(r.at),
          channelId: 'reminders',
        },
      });
    }
  } catch {
    // abaikan
  }
}
