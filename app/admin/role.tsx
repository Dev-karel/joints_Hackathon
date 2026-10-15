import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { TextField } from '@/components/auth/TextField';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { useSetRole } from '@/features/moderation/hooks';
import { env } from '@/lib/env';
import { campusEmailSchema } from '@/lib/validation/auth';

const ROLES = [
  { id: 'student', label: 'Mahasiswa', hint: 'Default. Semua fitur biasa.' },
  { id: 'curator', label: 'Kurator', hint: 'Bisa membuat event di luar kampus.' },
  { id: 'admin', label: 'Admin', hint: 'Daftarkan Wi-Fi, tinjau laporan, atur role.' },
] as const;

// PRD §10: admin memberi role kurator/admin. Penegakan tetap di database (admin_set_role).
export default function RoleScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const profile = useProfile(userId);
  const setRole = useSetRole();
  const [email, setEmail] = useState('');
  const [role, setRoleId] = useState<(typeof ROLES)[number]['id']>('curator');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (profile.data && profile.data.role !== 'admin') return <Redirect href="/(tabs)" />;

  const save = async () => {
    setMessage(null);
    const parsed = campusEmailSchema(env.allowedEmailDomains).safeParse(email);
    if (!parsed.success) {
      setMessage({ text: parsed.error.issues[0]?.message ?? 'Email tidak valid', ok: false });
      return;
    }
    try {
      const name = await setRole.mutateAsync({ email: parsed.data, role });
      const label = ROLES.find((r) => r.id === role)?.label ?? role;
      setMessage({ text: `${name} sekarang berperan ${label}.`, ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Gagal mengubah role.', ok: false });
    }
  };

  return (
    <AuthScreen
      title="Atur role"
      subtitle="Akun harus sudah terdaftar di aplikasi."
      onBack={() => router.back()}
    >
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Masukkan emailmu"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <View className="gap-[8px]">
        {ROLES.map((r) => {
          const active = r.id === role;
          return (
            <Pressable
              key={r.id}
              onPress={() => setRoleId(r.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              className={`min-h-[56px] justify-center rounded-[14px] border px-[14px] py-[10px] ${
                active ? 'border-primary bg-surfaceSky' : 'border-slateBorder bg-white'
              }`}
            >
              <Text className="text-[14px] font-bold text-slateInk">{r.label}</Text>
              <Text className="text-[12px] text-slate500">{r.hint}</Text>
            </Pressable>
          );
        })}
      </View>
      {message ? (
        message.ok ? (
          <Text className="text-[13px] text-slate500">{message.text}</Text>
        ) : (
          <FormError message={message.text} />
        )
      ) : null}
      <PrimaryButton label="Simpan role" onPress={save} loading={setRole.isPending} />
    </AuthScreen>
  );
}
