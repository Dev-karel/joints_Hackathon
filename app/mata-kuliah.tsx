import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/AppText';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FormError } from '@/components/ui/FormError';
import { useAuthStore } from '@/features/auth/authStore';
import { useCourses, useMyCourseIds, useSaveMyCourses } from '@/features/courses/hooks';

const MAX_COURSES = 5; // dijaga juga oleh trigger di database

// Pilih mata kuliah yang sedang diambil (maks 5); dipakai untuk skor kecocokan partner belajar.
export default function MataKuliahScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const courses = useCourses();
  const mine = useMyCourseIds(userId);
  const save = useSaveMyCourses(userId);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Isi pilihan awal dari server sekali (turunan state saat render, bukan efek).
  if (mine.data && selected === null) setSelected(new Set(mine.data));

  const loading = courses.isPending || mine.isPending;
  const chosen = selected ?? new Set<string>();

  const toggle = (id: string) => {
    if (!selected) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < MAX_COURSES) next.add(id);
    else return;
    setSelected(next);
  };

  const onSave = async () => {
    if (!selected) return;
    setError(null);
    try {
      await save.mutateAsync([...selected]);
      // Redirect ke root untuk automatic routing ke fase selanjutnya
      router.replace('/');
    } catch {
      setError('Gagal menyimpan. Periksa internet kamu lalu coba lagi.');
    }
  };

  return (
    <AuthScreen
      title="Pilih mata kuliah"
      subtitle={`Pilih maksimal ${MAX_COURSES} mata kuliah yang kamu ambil semester ini (${chosen.size}/${MAX_COURSES}). Ini akan membantu kami mencarikan teman belajar yang cocok untukmu.`}
      // Tidak ada tombol back di onboarding flow - ini step wajib
    >
      {loading ? (
        <View className="items-center py-[24px]">
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : courses.isError || mine.isError ? (
        <View className="gap-[10px]">
          <FormError message="Gagal memuat daftar mata kuliah. Periksa internet kamu." size={14} />
          <PrimaryButton
            label="Coba lagi"
            variant="outline"
            onPress={() => {
              void courses.refetch();
              void mine.refetch();
            }}
          />
        </View>
      ) : (
        <View className="gap-[10px]">
          {(courses.data ?? []).length === 0 ? (
            <View className="items-center gap-[12px] py-[20px]">
              <Text className="text-center text-[14px] leading-[21px] text-slate500">
                Belum ada mata kuliah di sistem. Silakan hubungi admin untuk menambahkan daftar mata kuliah.
              </Text>
            </View>
          ) : (
            <View className="mb-[8px] rounded-[12px] bg-accent50 px-[14px] py-[10px]">
              <Text className="text-[13px] text-accentText">
                💡 Pilih mata kuliah yang kamu ambil semester ini. Minimal 1, maksimal 5. Ini akan membantu sistem mencarikan teman belajar yang pas untukmu.
              </Text>
            </View>
          )}
          {(courses.data ?? []).map((course) => {
            const active = chosen.has(course.id);
            const full = !active && chosen.size >= MAX_COURSES;
            return (
              <Pressable
                key={course.id}
                onPress={() => toggle(course.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active, disabled: full }}
                accessibilityLabel={course.name}
                className={`flex-row items-center gap-[12px] rounded-[16px] border-[1.5px] px-[14px] py-[14px] ${
                  active ? 'border-primary bg-white/90' : 'border-white bg-white/60'
                } ${full ? 'opacity-50' : ''}`}
              >
                <View
                  className={`h-[24px] w-[24px] items-center justify-center rounded-[8px] ${
                    active ? 'bg-primary' : 'bg-slateSurface'
                  }`}
                >
                  {active ? <Check size={16} strokeWidth={3} color="#FFFFFF" /> : null}
                </View>
                <Text className="flex-1 text-[15px] text-slateInk">{course.name}</Text>
                <Text className="text-[13px] text-slate500">{course.credits} SKS</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? <FormError message={error} /> : null}
      
      {chosen.size === 0 && !loading ? (
        <View className="rounded-[12px] bg-amber-50 px-[14px] py-[10px]">
          <Text className="text-[13px] text-amber-700">
            Pilih minimal 1 mata kuliah untuk melanjutkan
          </Text>
        </View>
      ) : null}
      
      <PrimaryButton 
        label="Lanjutkan" 
        onPress={onSave} 
        loading={save.isPending} 
        disabled={loading || chosen.size === 0} 
      />
    </AuthScreen>
  );
}
