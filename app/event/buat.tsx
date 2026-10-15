import { useRouter } from 'expo-router';
import { Minus, Plus, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { formatDateShort } from '@/features/events/format';
import { useApprovedVenues, useCreateEvent } from '@/features/events/hooks';
import {
  EVENT_KINDS,
  eventCapacitySchema,
  eventCostSchema,
  eventDescriptionSchema,
  eventTimeSchema,
  eventTitleSchema,
  type EventKind,
} from '@/lib/validation/event';

const DAYS_AHEAD = 14;
const KIND_ORDER: EventKind[] = ['partner', 'hobby', 'small_table', 'monthly'];

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <View className="gap-[6px]">
      <Text className="text-[13px] font-bold text-slateInk">{label}</Text>
      {children}
      {hint ? <Text className="text-[12px] text-slate500">{hint}</Text> : null}
    </View>
  );
}

function Input(props: TextInputProps) {
  return (
    <TextInput
 maxFontSizeMultiplier={1.3}
      placeholderTextColor={palette.slate500}
      style={{ fontFamily: INTER.regular, paddingVertical: 0 }}
      className="min-h-[46px] rounded-[14px] border border-slateBorder px-[14px] text-[14px] text-slateInk"
      {...props}
    />
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      className={`rounded-full px-[12px] py-[8px] ${
        active ? 'bg-primary' : 'border border-slateBorder bg-white'
      }`}
    >
      <Text className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}>{label}</Text>
    </Pressable>
  );
}

// Buat event: hanya kurator/admin dan venue approved (dijaga RLS events_insert_curator).
export default function BuatEventScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: profile, isPending: profilePending } = useProfile(userId);
  const venues = useApprovedVenues();
  const create = useCreateEvent();

  const [kind, setKind] = useState<EventKind>('partner');
  const [title, setTitle] = useState('');
  const [dayOffset, setDayOffset] = useState(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [venueId, setVenueId] = useState<string | null>(null);
  const [cost, setCost] = useState('');
  const [capacity, setCapacity] = useState(16);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canCreate = profile?.role === 'curator' || profile?.role === 'admin';
  const venue = (venues.data ?? []).find((v) => v.id === venueId) ?? null;
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { offset: i, date: d };
  });

  const onSubmit = async () => {
    setError(null);
    const t = eventTitleSchema.safeParse(title);
    if (!t.success) return setError(t.error.issues[0]?.message ?? 'Judul tidak valid');
    const s = eventTimeSchema.safeParse(start);
    if (!s.success) return setError(`Jam mulai: ${s.error.issues[0]?.message ?? 'tidak valid'}`);
    const e = eventTimeSchema.safeParse(end);
    if (!e.success) return setError(`Jam selesai: ${e.error.issues[0]?.message ?? 'tidak valid'}`);
    if (!venueId) return setError('Pilih tempat.');
    const c = eventCostSchema.safeParse(cost);
    if (!c.success) return setError(c.error.issues[0]?.message ?? 'Biaya tidak valid');
    const cap = eventCapacitySchema.safeParse(capacity);
    if (!cap.success) return setError(cap.error.issues[0]?.message ?? 'Kuota tidak valid');
    const d = eventDescriptionSchema.safeParse(description);
    if (!d.success) return setError(d.error.issues[0]?.message ?? 'Deskripsi tidak valid');

    const toDate = (hhmm: string) => {
      const [h, m] = hhmm.split(/[:.]/).map(Number);
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      date.setHours(h, m, 0, 0);
      return date;
    };
    const startsAt = toDate(s.data);
    const endsAt = toDate(e.data);
    if (startsAt.getTime() <= Date.now()) return setError('Waktu mulai harus di masa depan.');
    if (endsAt.getTime() <= startsAt.getTime()) return setError('Jam selesai harus setelah jam mulai.');

    try {
      await create.mutateAsync({
        curator_id: userId!,
        event_kind: kind,
        title: t.data,
        description: d.data ? d.data : null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        venue_id: venueId,
        capacity: cap.data,
        cost_note: c.data ? c.data : null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menerbitkan event.');
    }
  };

  if (profilePending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!canCreate) {
    return (
      <SafeAreaView className="flex-1 bg-white px-[20px] pt-[24px]" edges={['top', 'bottom']}>
        <Text className="text-[22px] font-extrabold text-slateInk">Buat event</Text>
        <Text className="pt-[8px] text-[14px] leading-[21px] text-slate500">
          Hanya kurator yang bisa membuat event. Event dikurasi supaya selalu di tempat publik atau mitra.
        </Text>
        <View className="pt-[20px]">
          <PrimaryButton label="Kembali" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="flex-row items-center justify-between px-[20px] py-[8px]">
          <Text className="text-[24px] font-extrabold tracking-[-0.48px] text-slateInk">Buat event</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Tutup"
            hitSlop={12}
          >
            <X size={24} color={palette.slate500} />
          </Pressable>
        </View>

        <View className="flex-row px-[20px] pb-[12px]">
          <View className="rounded-full bg-accentSoft px-[10px] py-[4px]">
            <Text className="text-[12px] font-bold text-accent800">
              Mode kurator{venue ? ` · ${venue.name}` : ''}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field label="Jenis event">
            <View className="flex-row flex-wrap gap-[6px]">
              {KIND_ORDER.map((k) => (
                <Chip key={k} label={EVENT_KINDS[k]} active={kind === k} onPress={() => setKind(k)} />
              ))}
            </View>
          </Field>

          <Field label="Judul">
            <Input value={title} onChangeText={setTitle} placeholder="Contoh: Malam Board Game Pemula" />
          </Field>

          <Field label="Tanggal">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {days.map(({ offset, date }) => (
                <Chip
                  key={offset}
                  label={formatDateShort(date)}
                  active={dayOffset === offset}
                  onPress={() => setDayOffset(offset)}
                />
              ))}
            </ScrollView>
          </Field>

          <View className="flex-row gap-[12px]">
            <View className="flex-1">
              <Field label="Jam mulai">
                <Input
                  value={start}
                  onChangeText={setStart}
                  placeholder="19.00"
                  keyboardType="numbers-and-punctuation"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Jam selesai">
                <Input
                  value={end}
                  onChangeText={setEnd}
                  placeholder="22.00"
                  keyboardType="numbers-and-punctuation"
                />
              </Field>
            </View>
          </View>

          <Field label="Tempat" hint="Hanya tempat publik atau mitra yang sudah disetujui admin.">
            {venues.isPending ? (
              <ActivityIndicator color={palette.primary} />
            ) : venues.isError ? (
              <FormError message="Gagal memuat daftar tempat." size={13} />
            ) : (venues.data ?? []).length === 0 ? (
              <Text className="text-[13px] text-slate500">Belum ada tempat yang disetujui.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-[6px]">
                {(venues.data ?? []).map((v) => (
                  <Chip key={v.id} label={v.name} active={venueId === v.id} onPress={() => setVenueId(v.id)} />
                ))}
              </View>
            )}
          </Field>

          <View className="flex-row items-end gap-[12px]">
            <View className="flex-1">
              <Field label="Perkiraan biaya">
                <Input value={cost} onChangeText={setCost} placeholder="Kosongkan bila gratis, mis. ± Rp25.000" />
              </Field>
            </View>
            <Field label="Kuota">
              <View className="min-h-[46px] flex-row items-center gap-[12px] rounded-[14px] border border-slateBorder px-[12px]">
                <Pressable
                  onPress={() => setCapacity((n) => Math.max(2, n - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Kurangi kuota"
                  hitSlop={8}
                >
                  <Minus size={18} color={palette.primary} />
                </Pressable>
                <Text className="min-w-[24px] text-center text-[15px] font-extrabold text-slateInk">
                  {capacity}
                </Text>
                <Pressable
                  onPress={() => setCapacity((n) => Math.min(200, n + 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Tambah kuota"
                  hitSlop={8}
                >
                  <Plus size={18} color={palette.primary} />
                </Pressable>
              </View>
            </Field>
          </View>

          <Field label="Deskripsi">
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Ceritakan acaranya secara singkat"
              multiline
              textAlignVertical="top"
              style={{ fontFamily: INTER.regular, minHeight: 84, paddingVertical: 12 }}
            />
          </Field>

          {error ? <FormError message={error} size={13} /> : null}
        </ScrollView>

        <View className="border-t border-slateBorder px-[20px] pb-[12px] pt-[12px]">
          <PrimaryButton label="Terbitkan event" loading={create.isPending} onPress={() => void onSubmit()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
