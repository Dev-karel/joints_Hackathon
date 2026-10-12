import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, View, StatusBar } from 'react-native';
import { Bell, Calendar, ChevronRight, Home, MapPin, PlusCircle, Search, UserCheck, User, Wifi } from 'lucide-react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';

// Mock data - replace with real data later
const MOCK_USERS = [
  { id: '1', name: 'Anisa Putri', major: 'Informatika', personality: 'Sagekeeper', match: 87, avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Gita Maharani', major: 'DKV', personality: 'Mindsmith', match: 84, avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '3', name: 'Rizky Ramadhan', major: 'Matematika', personality: 'Heartkeeper', match: 81, avatar: 'https://i.pravatar.cc/150?img=12' },
];

const MOCK_SESSIONS = [
  { id: '1', time: '13.00', title: 'Belajar Bareng UAS Alpro', location: 'Perpustakaan Pusat', friendCount: 2, current: 3, max: 6 },
  { id: '2', time: '16.00', title: 'Diskusi Fisika Dasar: Momentum', location: 'Lab Komputer 604', friendCount: 0, current: 2, max: 8 },
];

const ZONES = [
  { id: '1', name: 'BeeNice', count: 3 },
  { id: '2', name: 'Perpustakaan', count: 2 },
  { id: '3', name: 'Lab Komputer', count: 3 },
];

export default function BerandaScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const router = useRouter();
  const { data: profile } = useProfile(userId);
  const archetype = archetypeIdSchema.safeParse(profile?.personality_type);

  return (
    <View className="flex-1 bg-white">
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between bg-white px-[20px] py-[12px]">
          <Text className="text-[24px] font-extrabold text-slateInk">AYOKMATCH</Text>
          <Pressable 
            className="h-[40px] w-[40px] items-center justify-center rounded-[20px] bg-surfaceSky"
            onPress={() => {/* TODO: Navigate to notifications */}}
          >
            <Bell size={20} color="#0072B8" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* User Profile Card */}
          <View className="mx-[20px] mb-[22px] mt-[8px] flex-row items-center rounded-[20px] border border-[rgba(0,0,0,0.16)] bg-white p-[11px] shadow-sm">
            <View className="h-[60px] w-[60px] overflow-hidden rounded-[24px] bg-slate100">
              {/* TODO: Replace with real avatar */}
              <View className="h-full w-full items-center justify-center bg-surfaceSky">
                <User size={32} color="#0072B8" />
              </View>
            </View>
            <View className="ml-[13px] flex-1 gap-[4px]">
              <Text className="text-[16px] font-bold text-slateInk">
                {profile?.full_name ?? 'John Doe'}
              </Text>
              {archetype.success ? (
                <View className="flex-row items-center gap-[8px] self-start rounded-[20px] bg-accentSoft px-[16px] py-[4px]">
                  <User size={16} color="#7C4700" />
                  <Text className="text-[13px] font-bold text-accent800">
                    {ARCHETYPES[archetype.data].name}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mx-[20px] mb-[22px] flex-row gap-[10px]">
            <Pressable 
              className="flex-1 items-center gap-[8px] rounded-[18px] border border-slateBorder bg-white py-[12px]"
              onPress={() => router.push('/match')}
            >
              <View className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-accentSoft">
                <UserCheck size={22} color="#A65C00" />
              </View>
              <Text className="text-[12px] font-bold text-accentText">Study Match</Text>
            </Pressable>
            
            <Pressable 
              className="flex-1 items-center gap-[8px] rounded-[18px] border border-slateBorder bg-white py-[12px]"
              onPress={() => router.push('/buat-sesi')}
            >
              <View className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-surfaceSky">
                <PlusCircle size={22} color="#0072B8" />
              </View>
              <Text className="text-[12px] font-bold text-primary">Buat sesi</Text>
            </Pressable>
            
            <Pressable 
              className="flex-1 items-center gap-[8px] rounded-[18px] border border-slateBorder bg-white py-[12px]"
              onPress={() => router.push('/peta')}
            >
              <View className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-surfaceSky">
                <MapPin size={22} color="#0072B8" />
              </View>
              <Text className="text-[12px] font-bold text-primary">Match Map</Text>
            </Pressable>
            
            <Pressable 
              className="flex-1 items-center gap-[8px] rounded-[18px] border border-slateBorder bg-white py-[12px]"
              onPress={() => {/* TODO: Search friends */}}
            >
              <View className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-surfaceSky">
                <Search size={22} color="#0072B8" />
              </View>
              <Text className="text-[12px] font-bold text-primary">Cari teman</Text>
            </Pressable>
          </View>

          {/* Campus Status */}
          <View className="mx-[20px] mb-[22px] gap-[12px] rounded-[20px] bg-surfaceSky px-[16px] py-[14px]">
            <Pressable className="flex-row items-center gap-[10px]">
              <View className="h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-primary">
                <Wifi size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-slateInk">
                  Kamu di BeeNice Emper
                </Text>
                <Text className="text-[12px] text-slate500">
                  8 orang lain online di Kampus Emper
                </Text>
              </View>
              <ChevronRight size={20} color="#64748B" />
            </Pressable>
            
            {/* Zones */}
            <View className="flex-row gap-[6px]">
              {ZONES.map((zone) => (
                <View 
                  key={zone.id}
                  className="flex-row items-center gap-[6px] rounded-full bg-white px-[9px] py-[5px]"
                >
                  <Text className="text-[12px] font-semibold text-slateInk">{zone.name}</Text>
                  <View className="items-center justify-center rounded-full bg-primary px-[7px] py-[1px]">
                    <Text className="text-[11px] font-bold text-white">{zone.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Cocok denganmu */}
          <View className="mb-[22px] gap-[12px]">
            <View className="mx-[20px] flex-row items-center justify-between">
              <Text className="text-[17px] font-extrabold text-slateInk">Cocok denganmu</Text>
              <Pressable>
                <Text className="text-[13px] font-semibold text-primary">Lihat semua</Text>
              </Pressable>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {MOCK_USERS.map((user) => (
                <View 
                  key={user.id}
                  className="w-[148px] items-center gap-[6px] rounded-[20px] border border-slateBorder bg-white px-[12px] pb-[12px] pt-[14px]"
                >
                  <View className="h-[56px] w-[56px] overflow-hidden rounded-[28px] bg-slate100">
                    <Image 
                      source={{ uri: user.avatar }} 
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                  <Text className="text-[14px] font-bold text-slateInk">{user.name}</Text>
                  <Text className="text-[11px] text-slate500">
                    {user.major} · {user.personality}
                  </Text>
                  <View className="rounded-full bg-accentSoft px-[8px] py-[3px]">
                    <Text className="text-[11px] font-bold text-accentText">
                      {user.match}% Cocok
                    </Text>
                  </View>
                  <Pressable className="w-full items-center justify-center rounded-full bg-primary py-[7px]">
                    <Text className="text-[12px] font-bold text-white">Ajak belajar</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Sesi hari ini */}
          <View className="mx-[20px] mb-[22px] gap-[10px]">
            <View className="flex-row items-center justify-between">
              <Text className="text-[17px] font-extrabold text-slateInk">Sesi hari ini</Text>
              <Pressable>
                <Text className="text-[13px] font-semibold text-primary">Lihat semua</Text>
              </Pressable>
            </View>
            
            {MOCK_SESSIONS.map((session) => (
              <Pressable 
                key={session.id}
                className="flex-row items-center gap-[12px] rounded-[18px] border border-slateBorder bg-white px-[12px] py-[12px]"
              >
                <View className="h-[48px] w-[56px] items-center justify-center rounded-[12px] bg-surfaceSky">
                  <Text className="text-[14px] font-extrabold text-primary">{session.time}</Text>
                </View>
                <View className="flex-1 gap-[2px]">
                  <Text className="text-[14px] font-bold text-slateInk" numberOfLines={1}>
                    {session.title}
                  </Text>
                  <View className="flex-row items-center gap-[6px]">
                    <Text className="text-[12px] text-slate500">{session.location}</Text>
                    {session.friendCount > 0 ? (
                      <Text className="text-[12px] font-semibold text-accentText">
                        · {session.friendCount} temanmu ikut
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View className="rounded-[8px] border border-slateBorder bg-slateSurface px-[8px] py-[3px]">
                  <Text className="text-[12px] font-bold text-slateInk">
                    {session.current}/{session.max}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
