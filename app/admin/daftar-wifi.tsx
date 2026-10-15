import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { FormError } from '@/components/ui/FormError';
import { useProfile } from '@/features/auth/useProfile';
import { createRoom, registerAccessPoint } from '@/features/map/api';
import { useZones } from '@/features/map/hooks';
import { readBssid, type BssidReading } from '@/lib/wifi/readBssid';

const READING_TEXT: Record<Exclude<BssidReading['status'], 'ok'>, string> = {
  'no-permission': 'Izin lokasi presisi ditolak. Izin ini hanya dipakai untuk membaca nama Wi-Fi.',
  'location-off':
    'Layanan lokasi HP mati, jadi Android menyembunyikan BSSID. Nyalakan lokasi lalu baca ulang.',
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
  const [newRoom, setNewRoom] = useState('');
  const [newBuilding, setNewBuilding] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (profile.data && profile.data.role !== 'admin') return <Redirect href="/(tabs)" />;

  const rooms = (zones.data ?? []).filter((z) => z.level === 'room');
  const buildings = new Map(
    (zones.data ?? []).filter((z) => z.level === 'building').map((b) => [b.id, b.name])
  );

  const addRoom = async () => {
    const name = newRoom.trim();
    if (name.length < 2 || !newBuilding) return;
    setAdding(true);
    setMessage(null);
    try {
      const id = await createRoom(name, newBuilding);
      await queryClient.invalidateQueries({ queryKey: ['zones'] });
      setZoneId(id);
      setNewRoom('');
      setMessage({ text: `Ruangan "${name}" ditambahkan dan dipilih.`, ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Gagal menambah ruangan.', ok: false });
    } finally {
      setAdding(false);
    }
  };

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
        <Text className="text-[13px] font-semibold text-slateInk">BSSID saat ini</Text>
        <View className="rounded-[14px] border border-white bg-white/70 px-[14px] py-[12px]">
          <Text selectable className="text-[16px] font-bold text-slateInk">
            {reading === null ? 'Membaca...' : reading.status === 'ok' ? reading.bssid : '—'}
          </Text>
        </View>
        {reading && reading.status !== 'ok' ? (
          <FormError message={READING_TEXT[reading.status]} />
        ) : null}
        <Pressable onPress={refresh} accessibilityRole="button" hitSlop={8}>
          <Text className="text-[13px] font-bold text-primary">Baca ulang</Text>
        </Pressable>
      </View>

      <View className="gap-[8px]">
        <Text className="text-[13px] font-semibold text-slateInk">Zona</Text>
        {zones.isPending ? <Text className="text-[13px] text-slate500">Memuat zona...</Text> : null}
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
              <Text className="text-[14px] font-semibold text-slateInk">{room.name}</Text>
              <Text className="text-[12px] text-slate500">
                {room.parent_zone_id ? buildings.get(room.parent_zone_id) : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* PRD §7.3: "pilih zona atau buat zona baru" (mis. "Ruang Pitching" untuk demo hotspot). */}
      <View className="gap-[8px]">
        <Text className="text-[13px] font-semibold text-slateInk">Atau tambah ruangan baru</Text>
        <TextInput
          maxFontSizeMultiplier={1.3}
          value={newRoom}
          onChangeText={setNewRoom}
          placeholder="mis. Ruang Pitching"
          placeholderTextColor={palette.slate500}
          accessibilityLabel="Nama ruangan baru"
          maxLength={60}
          className="h-[52px] rounded-[14px] border border-white bg-white/70 px-[14px] text-[15px] text-slateInk"
        />
        <View className="flex-row flex-wrap gap-[8px]">
          {[...buildings.entries()].map(([id, name]) => {
            const active = id === newBuilding;
            return (
              <Pressable
                key={id}
                onPress={() => setNewBuilding(id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`min-h-[44px] justify-center rounded-full border px-[14px] ${
                  active ? 'border-primary bg-primary' : 'border-slateBorder bg-white'
                }`}
              >
                <Text
                  className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton
          label="Tambah ruangan"
          variant="outline"
          onPress={addRoom}
          loading={adding}
          disabled={newRoom.trim().length < 2 || !newBuilding}
        />
      </View>

      <View className="gap-[6px]">
        <Text className="text-[13px] font-semibold text-slateInk">Catatan (opsional)</Text>
        <TextInput
          maxFontSizeMultiplier={1.3}
          value={label}
          onChangeText={setLabel}
          placeholder="mis. AP lantai 2, 5 GHz"
          placeholderTextColor={palette.slate500}
          accessibilityLabel="Catatan access point"
          maxLength={80}
          className="h-[52px] rounded-[14px] border border-white bg-white/70 px-[14px] text-[15px] text-slateInk"
        />
      </View>

      {message ? (
        message.ok ? (
          <Text className="text-[13px] text-slate500">{message.text}</Text>
        ) : (
          <FormError message={message.text} />
        )
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
