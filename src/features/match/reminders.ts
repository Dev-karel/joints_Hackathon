import { Platform } from 'react-native';

const HOUR = 3_600_000;

type NotificationsModule = typeof import('expo-notifications');

// expo-notifications dimuat saat dipakai, bukan di baris import teratas: di Expo Go (Android)
// modulnya melempar error begitu dimuat, dan itu akan menjatuhkan semua layar yang mengimpor
// file ini. Di development build modulnya normal. Semua pengingat gagal-diam.
async function loadNotifications(): Promise<NotificationsModule | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

// Notifikasi lokal 1 jam sebelum sesi mulai (PRD §8). Izin ditolak atau perangkat tidak
// mendukung tidak boleh membatalkan gabung sesi.
export async function cancelSessionReminder(sessionId: string): Promise<void> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return;
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => (n.content.data as { sessionId?: string } | null)?.sessionId === sessionId)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // abaikan
  }
}

export async function scheduleSessionReminder(
  sessionId: string,
  title: string,
  startsAtIso: string
): Promise<void> {
  try {
    const at = new Date(startsAtIso).getTime() - HOUR;
    if (at <= Date.now()) return;

    const Notifications = await loadNotifications();
    if (!Notifications) return;

    const current = await Notifications.getPermissionsAsync();
    const granted =
      current.granted || (current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Pengingat acara',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await cancelSessionReminder(sessionId);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Sesi belajar 1 jam lagi', body: title, data: { sessionId } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(at),
        channelId: 'reminders',
      },
    });
  } catch {
    // abaikan
  }
}
