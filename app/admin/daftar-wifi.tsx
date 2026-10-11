import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { registerAccessPoint } from '@/features/map/api';
import { useZones } from '@/features/map/hooks';
import { readBssid, type BssidReading } from '@/lib/wifi/readBssid';

const READING_TEXT: Record<Exclude<BssidReading['status'], 'ok'>, string> = {
  'no-permission': 'Izin lokasi presisi ditolak. Izin ini hanya dipakai untuk membaca nama Wi-Fi.',
  'no-wifi': 'Tidak tersambung Wi-Fi. Sambungkan HP ke Wi-Fi kampus dulu.',
  unavailable:
    'Wi-Fi tersambung tapi BSSID tidak terbaca. Aktifkan layanan lokasi HP dan pakai dev build (bukan Expo Go).',
};

// Mode admin (PRD §7.3): daftarkan BSSID Wi-Fi yang sedang tersambung ke sebuah zona.
// Sekaligus berfungsi sebagai spike: layar ini menampilkan hasil pembacaan BSSID di HP fisik.
export default function DaftarWifiScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const profile = useProfile(userId);
  const zones = useZones();

  // BSSID hanya di memori (gcTime 0): tidak disimpan di cache maupun disk.
  const bssidQuery = useQuery({
    queryKey: ['bssid-reading'],
    queryFn: readBssid,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const reading: BssidReading | null = bssidQuery.isFetching ? null : (bssidQuery.data ?? null);
  const refresh = () => void bssidQuery.refetch();

  const [zoneId, setZoneId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (profile.data && profile.data.role !== 'admin') return <Redirect href="/(tabs)" />;

  const rooms = (zones.data ?? []).filter((z) => z.level === 'room');
  const buildings = new Map(
    (zones.data ?? []).filter((z) => z.level === 'building').map((b) => [b.id, b.name])
  );

  const save = async () => {
    if (reading?.status !== 'ok' || !zoneId) return;
    setSaving(true);
    setMessage(null);
    try {
      await registerAccessPoint({ bssid: reading.bssid, zoneId, label: label.trim() || undefined });
      void queryClient.invalidateQueries({ queryKey: ['zone-presence'] });
      setMessage({ text: 'Tersimpan. BSSID ini sekarang terhubung ke zona itu.', ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Gagal menyimpan.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthScreen
      title="Daftarkan Wi-Fi"
      subtitle="Sambungkan HP ke Wi-Fi di ruangan yang mau didaftarkan, lalu pilih zonanya. Ulangi untuk tiap access point dan band."
      onBack={() => router.back()}
    >
      <View className="gap-[6px]">
        <Text className="text-[13px] font-semibold text-ink">BSSID saat ini</Text>
        <View className="rounded-[14px] border border-white bg-white/70 px-[14px] py-[12px]">
          <Text selectable className="text-[16px] font-bold text-ink">
            {reading === null ? 'Membaca...' : reading.status === 'ok' ? reading.bssid : '—'}
          </Text>
        </View>
        {reading && reading.status !== 'ok' ? (
          <Text className="text-[13px] leading-[19px] text-coral">
            {READING_TEXT[reading.status]}
          </Text>
        ) : null}
        <Pressable onPress={refresh} accessibilityRole="button" hitSlop={8}>
          <Text className="text-[13px] font-bold text-primary">Baca ulang</Text>
        </Pressable>
      </View>

      <View className="gap-[8px]">
        <Text className="text-[13px] font-semibold text-ink">Zona</Text>
        {zones.isPending ? <Text className="text-[13px] text-inkMuted">Memuat zona...</Text> : null}
        {rooms.map((room) => {
          const active = room.id === zoneId;
          return (
            <Pressable
              key={room.id}
              onPress={() => setZoneId(room.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              className={`rounded-[14px] border px-[14px] py-[12px] ${
                active ? 'border-primary bg-surfaceSky' : 'border-white bg-white/60'
              }`}
            >
              <Text className="text-[14px] font-semibold text-ink">{room.name}</Text>
              <Text className="text-[12px] text-inkMuted">
                {room.parent_zone_id ? buildings.get(room.parent_zone_id) : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-[6px]">
        <Text className="text-[13px] font-semibold text-ink">Catatan (opsional)</Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="mis. AP lantai 2, 5 GHz"
          placeholderTextColor={palette.slateMuted}
          maxLength={80}
          className="h-[52px] rounded-[14px] border border-white bg-white/70 px-[14px] text-[15px] text-ink"
        />
      </View>

      {message ? (
        <Text className={`text-[13px] ${message.ok ? 'text-inkMuted' : 'text-coral'}`}>
          {message.text}
        </Text>
      ) : null}

      <PrimaryButton
        label="Simpan"
        onPress={save}
        loading={saving}
        disabled={reading?.status !== 'ok' || !zoneId}
      />
    </AuthScreen>
  );
}
