import { Tabs } from 'expo-router';
import { CalendarDays, House, Map, User, Users } from 'lucide-react-native';

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
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.slate500,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        // Bilah tab putih translusen bertepi tipis (tema kaca; tanpa blur nyata).
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderTopColor: 'rgba(255, 255, 255, 1)',
          borderTopWidth: 1,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Beranda', tabBarIcon: ({ color }) => <House size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="match"
        options={{ title: 'Match', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="event"
        options={{
          title: 'Event',
          tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="peta"
        options={{ title: 'Peta', tabBarIcon: ({ color }) => <Map size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }}
      />
    </Tabs>
  );
}
