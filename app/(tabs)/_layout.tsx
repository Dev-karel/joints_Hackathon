import { Tabs } from 'expo-router';
import { CalendarDays, House, MapPin, User, UserCheck } from 'lucide-react-native';

import { palette } from '@/components/onboarding/palette';
import { useAuthStore } from '@/features/auth/authStore';
import { usePresenceHeartbeat } from '@/features/map/hooks';

// Navigasi utama: Beranda · Match · Event · Peta · Profil (CLAUDE.md).
export default function TabsLayout() {
  // Heartbeat presence: aktif hanya bila "Tampil di peta" nyala dan app di foreground.
  usePresenceHeartbeat(useAuthStore((s) => s.session?.user.id));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Bottom nav Figma: tab aktif berpil kuning muda (accentSoft) dengan teks accentText,
        // tab lain slate-500; ikon 20, label 10.
        tabBarActiveTintColor: palette.accentText,
        tabBarInactiveTintColor: palette.slate500,
        tabBarActiveBackgroundColor: palette.accentSoft,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarItemStyle: { marginHorizontal: 6, marginVertical: 8, borderRadius: 16, overflow: 'hidden' },
        tabBarStyle: {
          height: 72,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Beranda', tabBarIcon: ({ color }) => <House size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="match"
        options={{ title: 'Match', tabBarIcon: ({ color }) => <UserCheck size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="event"
        options={{
          title: 'Event',
          tabBarIcon: ({ color }) => <CalendarDays size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="peta"
        options={{ title: 'Peta', tabBarIcon: ({ color }) => <MapPin size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <User size={20} color={color} /> }}
      />
    </Tabs>
  );
}
