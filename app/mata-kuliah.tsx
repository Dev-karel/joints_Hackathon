import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { palette } from '@/components/onboarding/palette';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useCourses, useMyCourseIds, useSaveMyCourses } from '@/features/courses/hooks';

// Pilih mata kuliah yang sedang diambil; dipakai untuk skor kecocokan partner belajar.
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
    else next.add(id);
    setSelected(next);
  };

  const onSave = async () => {
    if (!selected) return;
    setError(null);
    try {
      await save.mutateAsync([...selected]);
      router.back();
    } catch {
      setError('Gagal menyimpan. Periksa internet kamu lalu coba lagi.');
    }
  };

  return (
    <AuthScreen
      title="Mata kuliah saya"
      subtitle="Pilih mata kuliah yang kamu ambil. Kami pakai ini untuk mencarikan partner belajar yang pas."
      onBack={() => router.back()}
    >
      {loading ? (
        <View className="items-center py-[24px]">
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : courses.isError || mine.isError ? (
        <Text className="text-[14px] text-coral">Gagal memuat daftar mata kuliah.</Text>
      ) : (
        <View className="gap-[10px]">
          {(courses.data ?? []).map((course) => {
            const active = chosen.has(course.id);
            return (
              <Pressable
                key={course.id}
                onPress={() => toggle(course.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={course.name}
                className={`flex-row items-center gap-[12px] rounded-[16px] border-[1.5px] px-[14px] py-[14px] ${
                  active ? 'border-primary bg-white/90' : 'border-white bg-white/60'
                }`}
              >
                <View
                  className={`h-[24px] w-[24px] items-center justify-center rounded-[8px] ${
                    active ? 'bg-primary' : 'bg-slateSurface'
                  }`}
                >
                  {active ? <Check size={16} strokeWidth={3} color="#FFFFFF" /> : null}
                </View>
                <Text className="flex-1 text-[15px] text-ink">{course.name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? <Text className="text-[13px] text-coral">{error}</Text> : null}
      <PrimaryButton label="Simpan" onPress={onSave} loading={save.isPending} disabled={loading} />
    </AuthScreen>
  );
}
