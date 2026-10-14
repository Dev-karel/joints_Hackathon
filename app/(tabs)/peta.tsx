import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { GlassCard } from '@/components/glass/GlassCard';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { palette } from '@/components/onboarding/palette';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { ZoneMap } from '@/features/map/components/ZoneMap';
import { useZonePresence, useZones } from '@/features/map/hooks';
import { useSharingSwitch } from '@/features/map/useSharingSwitch';
import { useMapStore, type MapStatus } from '@/features/map/mapStore';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';

const STATUS_TEXT: Record<MapStatus, string> = {
  idle: 'Tampil di peta mati. Kamu tidak terlihat siapa pun.',
  in_zone: 'Kamu terdeteksi di',
  outside: 'Kamu di luar jaringan kampus, jadi tidak tampil di peta.',
  'no-wifi': 'Sambungkan ke Wi-Fi kampus untuk tampil di peta.',
  'no-permission': 'Izin lokasi presisi dibutuhkan hanya untuk membaca nama Wi-Fi (bukan GPS).',
  unavailable:
    'Wi-Fi tersambung tapi nama jaringannya tidak terbaca. Pastikan izin dan layanan lokasi HP aktif.',
};

export default function PetaScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const zones = useZones();
  const presence = useZonePresence();
  const { status, zoneId, zoneName } = useMapStore();

  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sharingSwitch = useSharingSwitch(userId, profile?.show_on_map === true);

  const sharing = sharingSwitch.value;
  // Visibilitas timbal balik ditegakkan di database; di sini hanya menyesuaikan tampilan.
  const canView = sharing && status === 'in_zone';

  const buildings = useMemo(
    () => (zones.data ?? []).filter((z) => z.level === 'building'),
    [zones.data]
  );
  const building = buildings.find((b) => b.id === buildingId) ?? buildings[0];
  const rooms = useMemo(
    () => (zones.data ?? []).filter((z) => z.parent_zone_id === building?.id),
    [zones.data, building?.id]
  );
  const byZone = useMemo(
    () => new Map((presence.data ?? []).map((p) => [p.zone_id, p])),
    [presence.data]
  );
  const counts = useMemo(
    () => new Map((presence.data ?? []).map((p) => [p.zone_id, p.online_count])),
    [presence.data]
  );
  const selected = rooms.find((r) => r.id === selectedId) ?? null;
  const selectedPresence = selected ? byZone.get(selected.id) : undefined;

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text className="px-[4px] pt-[8px] text-[26px] font-extrabold leading-[32px] text-slateInk">
            Peta kampus
          </Text>

          <GlassCard strong className="gap-[8px] p-[16px]">
            {/* Seluruh baris bisa diketuk (bukan hanya saklar kecil di kanan). */}
            <Pressable
              onPress={() => void sharingSwitch.toggle()}
              disabled={!profile || sharingSwitch.busy}
              accessibilityRole="switch"
              accessibilityState={{ checked: sharing, disabled: !profile || sharingSwitch.busy }}
              accessibilityLabel="Tampil di peta"
              className="min-h-[64px] flex-row items-center justify-between gap-[12px] py-[6px]"
            >
              <View className="flex-1 gap-[2px]">
                <Text className="text-[15px] font-semibold text-slateInk">Tampil di peta</Text>
                <Text className="text-[12px] leading-[17px] text-slate500">
                  Hanya saat aplikasi terbuka dan tersambung Wi-Fi kampus. Mati secara default.
                </Text>
              </View>
              <View pointerEvents="none" className={sharingSwitch.busy ? 'opacity-60' : ''}>
                <Switch
                  value={sharing}
                  trackColor={{ false: palette.borderSubtle, true: palette.primary }}
                  thumbColor="#FFFFFF"
                  style={{ transform: [{ scale: 1.15 }] }}
                />
              </View>
            </Pressable>
            <Text className="text-[13px] leading-[19px] text-slate500">
              {sharing ? STATUS_TEXT[status] : STATUS_TEXT.idle}
              {sharing && status === 'in_zone' && zoneName ? ` ${zoneName}.` : ''}
            </Text>
            {sharingSwitch.message ? <FormError message={sharingSwitch.message} /> : null}
          </GlassCard>

          {zones.isPending ? (
            <ActivityIndicator color={palette.primary} />
          ) : zones.isError ? (
            <View className="gap-[10px]">
              <FormError message="Gagal memuat peta. Periksa internet kamu." size={14} />
              <PrimaryButton
                label="Coba lagi"
                variant="outline"
                onPress={() => void zones.refetch()}
              />
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap gap-[8px]">
                {buildings.map((b) => {
                  const active = b.id === building?.id;
                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => {
                        setBuildingId(b.id);
                        setSelectedId(null);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={`rounded-full border px-[14px] py-[8px] ${
                        active ? 'border-primary bg-primary' : 'border-white bg-white/60'
                      }`}
                    >
                      <Text
                        className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}
                      >
                        {b.name.replace('Kampus ', '')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Peta SVG tidak bisa difokuskan screen reader; daftar ruangan di bawah adalah jalur
                  yang setara, jadi peta disembunyikan dari TalkBack agar tidak ada elemen kosong. */}
              <GlassCard className="p-[10px]">
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <ZoneMap
                    rooms={rooms}
                    counts={counts}
                    showCounts={canView}
                    selectedId={selectedId}
                    currentZoneId={zoneId}
                    onSelect={setSelectedId}
                  />
                </View>
              </GlassCard>

              <GlassCard className="p-[6px]">
                {rooms.map((room) => {
                  const count = counts.get(room.id) ?? 0;
                  const active = room.id === selectedId;
                  const summary = !canView ? '' : count > 0 ? `${count} online` : 'sepi';
                  return (
                    <Pressable
                      key={room.id}
                      onPress={() => setSelectedId(room.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={summary ? `${room.name}, ${summary}` : room.name}
                      className={`min-h-[48px] flex-row items-center justify-between gap-[10px] rounded-[18px] px-[14px] py-[10px] ${
                        active ? 'bg-surfaceSky' : ''
                      }`}
                    >
                      <Text className="flex-1 text-[14px] font-semibold text-slateInk">
                        {room.name}
                      </Text>
                      {summary ? (
                        <Text className="text-[13px] text-slate500">{summary}</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </GlassCard>

              {canView && presence.isError ? (
                <View className="gap-[10px]">
                  <FormError message="Gagal memuat daftar yang online. Menampilkan data terakhir." />
                  <PrimaryButton
                    label="Coba lagi"
                    variant="outline"
                    onPress={() => void presence.refetch()}
                  />
                </View>
              ) : null}

              {!canView ? (
                <Text className="px-[4px] text-[13px] leading-[19px] text-slate500">
                  Nyalakan &quot;Tampil di peta&quot; dan sambungkan ke Wi-Fi kampus untuk melihat
                  siapa yang online. Pengguna yang tidak tampil juga tidak bisa melihat orang lain.
                </Text>
              ) : null}

              {selected ? (
                <GlassCard strong className="gap-[8px] p-[16px]">
                  <Text className="text-[17px] font-bold text-slateInk">{selected.name}</Text>
                  {!canView ? (
                    <Text className="text-[13px] text-slate500">Jumlah online disembunyikan.</Text>
                  ) : !selectedPresence || selectedPresence.online_count === 0 ? (
                    <Text className="text-[13px] text-slate500">
                      Sepi. Belum ada yang online di sini.
                    </Text>
                  ) : selectedPresence.members.length === 0 ? (
                    <Text className="text-[13px] leading-[19px] text-slate500">
                      {selectedPresence.online_count} orang online. Identitas disembunyikan karena
                      hanya satu orang di zona ini.
                    </Text>
                  ) : (
                    <View className="gap-[8px]">
                      <Text className="text-[13px] text-slate500">
                        {selectedPresence.online_count} online
                      </Text>
                      {selectedPresence.members.map((m) => {
                        const type = archetypeIdSchema.safeParse(m.personality_type);
                        return (
                          <View
                            key={m.id}
                            className="flex-row items-center justify-between gap-[10px]"
                          >
                            <Text className="flex-1 text-[14px] font-semibold text-slateInk">
                              {m.full_name}
                            </Text>
                            {type.success ? (
                              <Text className="text-[12px] text-titleAccent">
                                {ARCHETYPES[type.data].name}
                              </Text>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </GlassCard>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
}
