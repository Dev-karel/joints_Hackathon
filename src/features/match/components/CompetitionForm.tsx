import { useRouter } from 'expo-router';
import { CalendarDays, Link2, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { formatDateShort } from '@/features/events/format';
import { useCreateOpening } from '@/features/lomba/hooks';
import {
  COMPETITION_CATEGORIES,
  competitionNameSchema,
  guidebookUrlSchema,
  roleSchema,
  teamDescriptionSchema,
} from '@/lib/validation/competition';

import { Chip, Field, Input, SelectField, Stepper } from './FormParts';

const DAYS_AHEAD = 60;
const MAX_ROLES = 5;
const TEAM_MAX = 10;

export function CompetitionForm() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const create = useCreateOpening();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(COMPETITION_CATEGORIES[0]);
  const [dayOffset, setDayOffset] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState(4);
  const [current, setCurrent] = useState(1);
  const [roles, setRoles] = useState<string[]>([]);
  const [addingRole, setAddingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState('');
  const [link, setLink] = useState('');
  const [about, setAbout] = useState('');
  const [error, setError] = useState<string | null>(null);

  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: String(i), label: `${formatDateShort(d)} ${d.getFullYear()}` };
  });

  // Ukuran tim berubah → anggota saat ini tetap kurang dari ukuran tim.
  const changeSize = (n: number) => {
    setTeamSize(n);
    setCurrent((c) => Math.min(c, n - 1));
  };

  const addRole = () => {
    const r = roleSchema.safeParse(roleDraft);
    if (!r.success) return setError(r.error.issues[0]?.message ?? 'Peran tidak valid');
    if (roles.some((x) => x.toLowerCase() === r.data.toLowerCase())) return setError('Peran itu sudah ada.');
    setError(null);
    setRoles([...roles, r.data]);
    setRoleDraft('');
    setAddingRole(false);
  };

  const onSubmit = async () => {
    setError(null);
    const n = competitionNameSchema.safeParse(name);
    if (!n.success) return setError(n.error.issues[0]?.message ?? 'Nama lomba tidak valid');
    if (dayOffset === null) return setError('Pilih batas pendaftaran.');
    if (roles.length === 0) return setError('Tambahkan minimal satu peran yang dicari.');
    const u = guidebookUrlSchema.safeParse(link);
    if (!u.success) return setError(u.error.issues[0]?.message ?? 'Tautan tidak valid');
    const a = teamDescriptionSchema.safeParse(about);
    if (!a.success) return setError(a.error.issues[0]?.message ?? 'Deskripsi tidak valid');

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Number(dayOffset));
    deadline.setHours(23, 59, 0, 0);
    if (deadline.getTime() <= Date.now()) return setError('Batas pendaftaran harus di masa depan.');

    try {
      await create.mutateAsync({
        host_id: userId!,
        competition_name: n.data,
        category,
        registration_deadline: deadline.toISOString(),
        team_size: teamSize,
        current_members: current,
        roles_needed: roles,
        guidebook_url: u.data ? u.data : null,
        description: a.data ? a.data : null,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat lowongan tim.');
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field label="Nama lomba">
            <Input value={name} onChangeText={setName} placeholder="Contoh: Hackathon JOINTS UGM 2026" maxLength={80} />
          </Field>

          <Field label="Kategori">
            <View className="flex-row flex-wrap gap-[6px]">
              {COMPETITION_CATEGORIES.map((c) => (
                <Chip key={c} label={c} tone="accent" active={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
          </Field>

          <Field label="Batas pendaftaran">
            <SelectField
              value={dayOffset}
              onChange={setDayOffset}
              placeholder="Pilih tanggal"
              options={days}
              icon={<CalendarDays size={18} color={palette.primary} />}
            />
          </Field>

          <View className="flex-row gap-[12px]">
            <View className="flex-1">
              <Field label="Ukuran tim">
                <Stepper full value={teamSize} min={2} max={TEAM_MAX} onChange={changeSize} />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Anggota saat ini">
                <Stepper full value={current} min={1} max={teamSize - 1} onChange={setCurrent} />
              </Field>
            </View>
          </View>

          <Field label="Peran yang dicari">
            <View className="flex-row flex-wrap gap-[6px]">
              {roles.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRoles(roles.filter((x) => x !== r))}
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus peran ${r}`}
                  className="flex-row items-center gap-[6px] rounded-full bg-accent px-[12px] py-[8px]"
                >
                  <Text className="text-[12px] font-semibold text-[#4F2D00]">{r}</Text>
                  <X size={14} color="#4F2D00" />
                </Pressable>
              ))}
              {roles.length < MAX_ROLES && !addingRole ? (
                <Chip dashed label="+ Tambah peran" onPress={() => setAddingRole(true)} />
              ) : null}
            </View>
            {addingRole ? (
              <View className="flex-row items-center gap-[8px]">
                <Input
                  value={roleDraft}
                  onChangeText={setRoleDraft}
                  placeholder="Contoh: Desainer UI/UX"
                  maxLength={30}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={addRole}
                  style={{ flex: 1 }}
                />
                <Pressable onPress={addRole} accessibilityRole="button" className="rounded-full bg-primary px-[14px] py-[10px]">
                  <Text className="text-[12px] font-bold text-white">Tambah</Text>
                </Pressable>
              </View>
            ) : null}
          </Field>

          <Field label="Tautan panduan lomba (opsional)">
            <View className="min-h-[46px] flex-row items-center gap-[8px] rounded-[14px] border border-slateBorder px-[14px]">
              <Link2 size={18} color={palette.primary} />
              <Input
                value={link}
                onChangeText={setLink}
                placeholder="https://"
                autoCapitalize="none"
                keyboardType="url"
                style={{ borderWidth: 0, paddingHorizontal: 0, minHeight: 44, flex: 1 }}
              />
            </View>
          </Field>

          <Field label="Tentang tim (opsional)">
            <Input
              value={about}
              onChangeText={setAbout}
              placeholder="Kami bikin aplikasi matching mahasiswa. Sudah ada 2 programmer dan 1 desainer."
              multiline
              textAlignVertical="top"
              maxLength={300}
              style={{ fontFamily: INTER.regular, minHeight: 72, paddingVertical: 12 }}
            />
          </Field>

          {error ? <FormError message={error} size={13} /> : null}
        </ScrollView>

        <View className="border-t border-slateBorder px-[20px] pb-[12px] pt-[12px]">
          <PrimaryButton label="Buat tim" loading={create.isPending} onPress={() => void onSubmit()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
