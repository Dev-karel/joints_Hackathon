import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { CalendarDays, Clock, MapPin, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useCourses } from '@/features/courses/hooks';
import { formatDateShort } from '@/features/events/format';
import { useZones } from '@/features/map/hooks';
import type { AgendaItem, PickedFile } from '@/features/match/api';
import { useCreateSession, useUploadMaterials } from '@/features/match/hooks';
import {
  clockLabel,
  MATERIAL_MIME_TYPES,
  MAX_MATERIAL_BYTES,
  MAX_MATERIALS,
  parseClock,
  parseClockRange,
  SESSION_KINDS,
  sessionBringSchema,
  sessionTitleSchema,
  type SessionKind,
} from '@/lib/validation/studySession';

import { Chip, Field, Input, SelectField, Stepper } from './FormParts';

const DAYS_AHEAD = 14;
const MAX_AGENDA = 10;
const kb = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

type AgendaRow = { time: string; text: string };

export function StudyForm() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const courses = useCourses();
  const zones = useZones();
  const create = useCreateSession();
  const upload = useUploadMaterials(userId);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<SessionKind>('belajar_kelompok');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState<string>('0');
  const [range, setRange] = useState('');
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(4);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [agenda, setAgenda] = useState<AgendaRow[]>([]);
  const [bring, setBring] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const rooms = (zones.data ?? []).filter((z) => z.level === 'room');
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: String(i), label: formatDateShort(d) };
  });

  const pickFiles = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const next = [...files];
      for (const a of result.assets) {
        const mime = a.mimeType ?? 'application/octet-stream';
        if (!MATERIAL_MIME_TYPES.includes(mime)) return setError('Materi harus berupa PDF atau gambar (JPG/PNG/WebP).');
        if ((a.size ?? 0) > MAX_MATERIAL_BYTES) return setError(`"${a.name}" lebih dari 10 MB.`);
        if (next.length >= MAX_MATERIALS) return setError(`Maksimal ${MAX_MATERIALS} file materi.`);
        next.push({ uri: a.uri, name: a.name, mimeType: mime, size: a.size ?? 0 });
      }
      setFiles(next);
    } catch {
      setError('Gagal membuka pemilih file.');
    }
  };

  const onSubmit = async () => {
    if (createdId) return router.replace({ pathname: '/sesi/[id]', params: { id: createdId } });
    setError(null);

    const t = sessionTitleSchema.safeParse(title);
    if (!t.success) return setError(t.error.issues[0]?.message ?? 'Judul tidak valid');
    if (!courseId) return setError('Pilih mata kuliah.');
    const r = parseClockRange(range);
    if (!r) return setError('Isi jam dengan format JJ.MM–JJ.MM, contoh 13.00–15.00 (selesai harus setelah mulai).');
    if (!zoneId) return setError('Pilih tempat.');

    const bringCheck = sessionBringSchema.safeParse(bring);
    if (!bringCheck.success) return setError(bringCheck.error.issues[0]?.message ?? 'Catatan tidak valid');

    const items: AgendaItem[] = [];
    for (const row of agenda) {
      if (row.time.trim() === '' && row.text.trim() === '') continue;
      const m = parseClock(row.time);
      if (m === null || row.text.trim() === '') return setError('Lengkapi jam dan kegiatan di setiap baris agenda.');
      if (m < r[0] || m > r[1]) return setError('Jam agenda harus di antara jam mulai dan selesai sesi.');
      items.push({ time: clockLabel(m), text: row.text.trim() });
    }
    items.sort((a, b) => (parseClock(a.time) ?? 0) - (parseClock(b.time) ?? 0));

    const day = new Date();
    day.setDate(day.getDate() + Number(dayOffset));
    const start = new Date(day);
    start.setHours(Math.floor(r[0] / 60), r[0] % 60, 0, 0);
    const end = new Date(day);
    end.setHours(Math.floor(r[1] / 60), r[1] % 60, 0, 0);
    if (start.getTime() <= Date.now()) return setError('Waktu mulai harus di masa depan.');

    let id: string;
    try {
      id = await create.mutateAsync({
        host_id: userId!,
        course_id: courseId,
        zone_id: zoneId,
        title: t.data,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        session_kind: kind,
        capacity,
        agenda: items.length > 0 ? items : null,
        bring_note: bringCheck.data ? bringCheck.data : null,
      });
    } catch (e) {
      return setError(e instanceof Error ? e.message : 'Gagal membuat sesi.');
    }

    if (files.length > 0) {
      try {
        await upload.mutateAsync({ sessionId: id, files });
      } catch (e) {
        setCreatedId(id);
        return setError(
          `Sesi sudah dibuat, tapi materi gagal diunggah (${e instanceof Error ? e.message : 'coba lagi nanti'}).`
        );
      }
    }
    router.replace({ pathname: '/sesi/[id]', params: { id } });
  };

  const busy = create.isPending || upload.isPending;

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field label="Judul">
            <Input value={title} onChangeText={setTitle} placeholder="Contoh: Belajar Bareng UAS Alpro" maxLength={80} />
          </Field>

          <Field label="Jenis sesi">
            <View className="flex-row flex-wrap gap-[6px]">
              {(Object.keys(SESSION_KINDS) as SessionKind[]).map((k) => (
                <Chip key={k} label={SESSION_KINDS[k]} active={kind === k} onPress={() => setKind(k)} />
              ))}
            </View>
          </Field>

          <Field label="Mata kuliah">
            <SelectField
              value={courseId}
              onChange={setCourseId}
              placeholder="Pilih mata kuliah"
              options={(courses.data ?? []).map((c) => ({ label: c.name, value: c.id }))}
            />
          </Field>

          <View className="flex-row gap-[12px]">
            <View className="flex-1">
              <Field label="Tanggal">
                <SelectField
                  value={dayOffset}
                  onChange={setDayOffset}
                  placeholder="Pilih tanggal"
                  options={days}
                  icon={<CalendarDays size={18} color={palette.primary} />}
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Jam">
                <View className="min-h-[46px] flex-row items-center gap-[8px] rounded-[14px] border border-slateBorder px-[14px]">
                  <Clock size={18} color={palette.primary} />
                  <Input
                    value={range}
                    onChangeText={setRange}
                    placeholder="13.00–15.00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={13}
                    style={{ borderWidth: 0, paddingHorizontal: 0, minHeight: 44, flex: 1 }}
                  />
                </View>
              </Field>
            </View>
          </View>

          <Field label="Tempat" hint="Dipilih dari zona kampus, jadi sesi ini juga muncul di Peta.">
            <SelectField
              value={zoneId}
              onChange={setZoneId}
              placeholder="Pilih tempat"
              options={rooms.map((z) => ({ label: z.name, value: z.id }))}
              icon={<MapPin size={18} color={palette.primary} />}
            />
          </Field>

          <Field label="Kuota">
            <Stepper value={capacity} min={2} max={30} onChange={setCapacity} />
          </Field>

          <Field label="Materi tambahan (opsional)" hint={`PDF atau gambar, maks. ${MAX_MATERIALS} file, 10 MB per file.`}>
            {files.map((f, i) => (
              <View key={`${f.name}-${i}`} className="flex-row items-center gap-[8px] rounded-[14px] border border-slateBorder px-[14px] py-[10px]">
                <Text className="flex-1 text-[14px] text-slateInk" numberOfLines={1}>
                  {f.name}
                </Text>
                <Text className="text-[12px] text-slate500">{kb(f.size)}</Text>
                <Pressable
                  onPress={() => setFiles(files.filter((_, idx) => idx !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus ${f.name}`}
                  hitSlop={10}
                >
                  <X size={18} color={palette.slate500} />
                </Pressable>
              </View>
            ))}
            {files.length < MAX_MATERIALS ? (
              <Pressable
                onPress={() => void pickFiles()}
                accessibilityRole="button"
                className="min-h-[46px] flex-row items-center gap-[8px] rounded-[14px] border border-slateBorder px-[14px]"
              >
                <Plus size={18} color={palette.primary} />
                <Text className="text-[14px] text-[#94A3B8]">Lampirkan file</Text>
              </Pressable>
            ) : null}
          </Field>

          <View className="gap-[8px]">
            <Text className="text-[13px] font-bold text-slateInk">Agenda (opsional)</Text>
            {agenda.map((row, i) => (
              <View key={i} className="flex-row items-center gap-[8px]">
                <Input
                  value={row.time}
                  onChangeText={(v) => setAgenda(agenda.map((a, idx) => (idx === i ? { ...a, time: v } : a)))}
                  placeholder="13.00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={{ width: 68, textAlign: 'center', fontFamily: 'Inter-SemiBold', borderRadius: 12 }}
                />
                <Input
                  value={row.text}
                  onChangeText={(v) => setAgenda(agenda.map((a, idx) => (idx === i ? { ...a, text: v } : a)))}
                  placeholder="Kegiatan"
                  maxLength={80}
                  style={{ flex: 1, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => setAgenda(agenda.filter((_, idx) => idx !== i))}
                  accessibilityRole="button"
                  accessibilityLabel="Hapus baris agenda"
                  hitSlop={10}
                >
                  <X size={18} color={palette.slate500} />
                </Pressable>
              </View>
            ))}
            {agenda.length < MAX_AGENDA ? (
              <Pressable onPress={() => setAgenda([...agenda, { time: '', text: '' }])} accessibilityRole="button" className="self-start">
                <Text className="text-[13px] font-bold text-primary">+ Tambah agenda</Text>
              </Pressable>
            ) : null}
            <Text className="text-[12px] text-slate500">Jam agenda harus di antara jam mulai dan selesai sesi.</Text>
          </View>

          <Field label="Yang perlu dibawa (opsional)">
            <Input value={bring} onChangeText={setBring} placeholder="Contoh: Laptop" maxLength={120} />
          </Field>

          {error ? <FormError message={error} size={13} /> : null}
        </ScrollView>

        <View className="border-t border-slateBorder px-[20px] pb-[12px] pt-[12px]">
          <PrimaryButton
            label={createdId ? 'Lihat sesi' : 'Buat sesi belajar'}
            loading={busy}
            onPress={() => void onSubmit()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
