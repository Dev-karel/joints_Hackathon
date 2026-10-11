import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { GlassCard } from '@/components/glass/GlassCard';
import { palette } from '@/components/onboarding/palette';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { ZoneMap } from '@/features/map/components/ZoneMap';
import { useZonePresence, useZones, useToggleSharing } from '@/features/map/hooks';
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
  const toggleSharing = useToggleSharing(userId);
  const { status, zoneId, zoneName } = useMapStore();

  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sharing = profile?.show_on_map === true;
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

  const onToggle = async (next: boolean) => {
    setMessage(null);
    setBusy(true);
    const result = await toggleSharing(next);
    setBusy(false);
    if (!result.ok) {
      setMessage(
        result.reason === 'no-permission'
          ? 'Izin lokasi presisi ditolak. Izin ini hanya dipakai untuk membaca nama Wi-Fi, bukan untuk GPS.'
          : 'Gagal mengubah pengaturan. Periksa internet kamu.'
      );
    }
  };

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text className="px-[4px] pt-[8px] text-[28px] font-bold leading-[34px] text-ink">
            Peta kampus
          </Text>

          <GlassCard strong className="gap-[8px] p-[16px]">
            <View className="flex-row items-center justify-between gap-[12px]">
              <View className="flex-1 gap-[2px]">
                <Text className="text-[15px] font-semibold text-ink">Tampil di peta</Text>
                <Text className="text-[12px] leading-[17px] text-inkMuted">
                  Hanya saat aplikasi terbuka dan tersambung Wi-Fi kampus. Mati secara default.
                </Text>
              </View>
              <Switch
                value={sharing}
                disabled={busy || !profile}
                onValueChange={onToggle}
                trackColor={{ false: palette.borderSubtle, true: palette.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Tampil di peta"
              />
            </View>
            <Text className="text-[13px] leading-[19px] text-inkMuted">
              {sharing ? STATUS_TEXT[status] : STATUS_TEXT.idle}
              {sharing && status === 'in_zone' && zoneName ? ` ${zoneName}.` : ''}
            </Text>
            {message ? <Text className="text-[13px] text-coral">{message}</Text> : null}
          </GlassCard>

          {zones.isPending ? (
            <ActivityIndicator color={palette.primary} />
          ) : zones.isError ? (
            <Text className="text-[14px] text-coral">
              Gagal memuat peta. Periksa internet kamu.
            </Text>
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
                        className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-ink'}`}
                      >
                        {b.name.replace('Kampus ', '')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <GlassCard className="p-[10px]">
                <ZoneMap
                  rooms={rooms}
                  counts={counts}
                  showCounts={canView}
                  selectedId={selectedId}
                  currentZoneId={zoneId}
                  onSelect={setSelectedId}
                />
              </GlassCard>

              {!canView ? (
                <Text className="px-[4px] text-[13px] leading-[19px] text-inkMuted">
                  Nyalakan &quot;Tampil di peta&quot; dan sambungkan ke Wi-Fi kampus untuk melihat
                  siapa yang online. Pengguna yang tidak tampil juga tidak bisa melihat orang lain.
                </Text>
              ) : null}

              {selected ? (
                <GlassCard strong className="gap-[8px] p-[16px]">
                  <Text className="text-[17px] font-bold text-ink">{selected.name}</Text>
                  {!canView ? (
                    <Text className="text-[13px] text-inkMuted">Jumlah online disembunyikan.</Text>
                  ) : !selectedPresence || selectedPresence.online_count === 0 ? (
                    <Text className="text-[13px] text-inkMuted">
                      Sepi. Belum ada yang online di sini.
                    </Text>
                  ) : selectedPresence.members.length === 0 ? (
                    <Text className="text-[13px] leading-[19px] text-inkMuted">
                      {selectedPresence.online_count} orang online. Identitas disembunyikan karena
                      hanya satu orang di zona ini.
                    </Text>
                  ) : (
                    <View className="gap-[8px]">
                      <Text className="text-[13px] text-inkMuted">
                        {selectedPresence.online_count} online
                      </Text>
                      {selectedPresence.members.map((m) => {
                        const type = archetypeIdSchema.safeParse(m.personality_type);
                        return (
                          <View key={m.id} className="flex-row items-center justify-between">
                            <Text className="text-[14px] font-semibold text-ink">
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
