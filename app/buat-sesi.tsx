import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { TextField } from '@/components/auth/TextField';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useCourses } from '@/features/courses/hooks';
import { useZones } from '@/features/map/hooks';
import { useCreateSession } from '@/features/match/hooks';
import {
  SESSION_KINDS,
  sessionTimeSchema,
  sessionTitleSchema,
  type SessionKind,
} from '@/lib/validation/studySession';

const DAY_OPTIONS = [
  { label: 'Hari ini', offset: 0 },
  { label: 'Besok', offset: 1 },
  { label: 'Lusa', offset: 2 },
];
const DURATIONS = [1, 2, 3];
const CAPACITIES = [2, 3, 4, 5, 6, 8];

function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View className="gap-[8px]">
      <Text className="text-[14px] font-bold text-slateInk">{label}</Text>
      <View className="flex-row flex-wrap gap-[8px]">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              className={`min-h-[48px] justify-center rounded-full border px-[16px] ${
                active ? 'border-primary bg-primary' : 'border-slateBorder bg-white'
              }`}
            >
              <Text className={`text-[14px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Buat sesi belajar. Host otomatis jadi anggota pertama (trigger di database).
export default function BuatSesiScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const courses = useCourses();
  const zones = useZones();
  const create = useCreateSession();

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [kind, setKind] = useState<SessionKind>('belajar_kelompok');
  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState('');
  const [hours, setHours] = useState(2);
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState<string | null>(null);

  const rooms = (zones.data ?? []).filter((z) => z.level === 'room');

  const onSubmit = async () => {
    setError(null);
    const t = sessionTitleSchema.safeParse(title);
    if (!t.success) return setError(t.error.issues[0]?.message ?? 'Judul tidak valid');
    if (!courseId) return setError('Pilih mata kuliah.');
    if (!zoneId) return setError('Pilih lokasi.');
    const tm = sessionTimeSchema.safeParse(time);
    if (!tm.success) return setError(tm.error.issues[0]?.message ?? 'Jam tidak valid');

    const [h, m] = tm.data.split(':').map(Number);
    const start = new Date();
    start.setDate(start.getDate() + dayOffset);
    start.setHours(h, m, 0, 0);
    if (start.getTime() <= Date.now()) return setError('Waktu mulai harus di masa depan.');
    const end = new Date(start.getTime() + hours * 3_600_000);

    try {
      await create.mutateAsync({
        host_id: userId!,
        course_id: courseId,
        zone_id: zoneId,
        title: t.data,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        session_kind: kind,
        capacity,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat sesi.');
    }
  };

  return (
    <AuthScreen
      title="Buat sesi belajar"
      subtitle="Sesi tampil untuk semua mahasiswa kampus. Kuota dan jadwal tidak bisa diganti setelah dibuat."
      onBack={() => router.back()}
    >
      <TextField
        label="Judul sesi"
        value={title}
        onChangeText={setTitle}
        placeholder="Contoh: Latihan soal UTS Algoritma"
        maxLength={80}
      />
      <Chips
        label="Jenis sesi"
        value={kind}
        onChange={setKind}
        options={(Object.keys(SESSION_KINDS) as SessionKind[]).map((k) => ({
          label: SESSION_KINDS[k],
          value: k,
        }))}
      />
      <Chips
        label="Mata kuliah"
        value={courseId}
        onChange={setCourseId}
        options={(courses.data ?? []).map((c) => ({ label: c.name, value: c.id }))}
      />
      <Chips
        label="Lokasi"
        value={zoneId}
        onChange={setZoneId}
        options={rooms.map((z) => ({ label: z.name, value: z.id }))}
      />
      <Chips
        label="Hari"
        value={dayOffset}
        onChange={setDayOffset}
        options={DAY_OPTIONS.map((d) => ({ label: d.label, value: d.offset }))}
      />
      <TextField
        label="Jam mulai"
        value={time}
        onChangeText={setTime}
        placeholder="14:30"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
      <Chips
        label="Durasi"
        value={hours}
        onChange={setHours}
        options={DURATIONS.map((d) => ({ label: `${d} jam`, value: d }))}
      />
      <Chips
        label="Kuota peserta (termasuk kamu)"
        value={capacity}
        onChange={setCapacity}
        options={CAPACITIES.map((c) => ({ label: String(c), value: c }))}
      />

      {error ? <FormError message={error} /> : null}
      <PrimaryButton label="Buat sesi" onPress={onSubmit} loading={create.isPending} />
    </AuthScreen>
  );
}
