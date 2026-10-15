import { useRouter, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  MapPin,
  Share2,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassBackground } from '@/components/glass/GlassBackground';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TabHero } from '@/components/ui/TabHero';
import { FormError } from '@/components/ui/FormError';
import { useAuthStore } from '@/features/auth/authStore';
import { deleteAccount, logout } from '@/features/auth/useAuthActions';
import { useProfile } from '@/features/auth/useProfile';
import { useCourses, useMyCourseIds } from '@/features/courses/hooks';
import { useFriendships } from '@/features/friends/hooks';
import { useSharingSwitch } from '@/features/map/useSharingSwitch';
import { useMyStats, useUploadAvatar } from '@/features/profile/hooks';
import { ARCHETYPES, archetypeIdSchema } from '@/lib/validation/personalityQuiz';

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-[20px] border border-slateBorder bg-white px-[16px] py-[14px] ${className}`}
    >
      {children}
    </View>
  );
}

function CardHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[15px] font-extrabold text-slateInk">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={10}>
          <Text className="text-[12px] font-bold text-primary">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({
  value,
  label,
  onPress,
}: {
  value: number | string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Lihat daftar`}
      className="flex-1 items-center gap-[2px] rounded-[16px] border border-slateBorder py-[10px]"
    >
      <Text className="text-[20px] font-extrabold text-accentText">{value}</Text>
      <Text className="text-[11px] font-semibold text-slate500">{label}</Text>
    </Pressable>
  );
}

export default function ProfilScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const { data: profile } = useProfile(userId);
  const friendships = useFriendships(userId);
  const stats = useMyStats(userId);
  const courses = useCourses();
  const myCourseIds = useMyCourseIds(userId);
  const sharingSwitch = useSharingSwitch(userId, profile?.show_on_map === true);
  const uploadAvatar = useUploadAvatar(userId);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const archetype = archetypeIdSchema.safeParse(profile?.personality_type);
  const info = archetype.success ? ARCHETYPES[archetype.data] : null;
  const friendCount = (friendships.data ?? []).filter((f) => f.status === 'accepted').length;

  const myCourses = useMemo(() => {
    const ids = new Set(myCourseIds.data ?? []);
    return (courses.data ?? []).filter((c) => ids.has(c.id));
  }, [courses.data, myCourseIds.data]);

  const subtitle = [profile?.major, profile?.semester ? `Semester ${profile.semester}` : null]
    .filter(Boolean)
    .join(' · ');

  // Ganti foto: pilih dari galeri (pemilih foto sistem Android, tanpa izin tambahan), potong persegi.
  const onChangeAvatar = async () => {
    if (uploadAvatar.isPending) return;
    setAvatarError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      await uploadAvatar.mutateAsync({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        base64: asset.base64,
      });
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : 'Gagal mengganti foto. Coba lagi.');
    }
  };

  const onShare = () => {
    void Share.share({
      message: `${profile?.full_name ?? 'Aku'}${info ? ` (${info.name})` : ''} di AyokMatch. Yuk cari teman belajar bareng!`,
    });
  };

  return (
    <GlassBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <TabHero
          title="Profil saya"
          subtitle={info ? `${info.name} · ${info.tagline}` : 'Kepribadian, teman, dan privasimu.'}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Kartu identitas */}
          <Card className="flex-row items-center gap-[14px] p-[16px]">
            <Pressable
              onPress={() => void onChangeAvatar()}
              disabled={!profile || uploadAvatar.isPending}
              accessibilityRole="button"
              accessibilityLabel="Ganti foto profil"
              hitSlop={8}
            >
              <View className="h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <User size={34} color={palette.primary} />
                )}
                {uploadAvatar.isPending ? (
                  <View className="absolute inset-0 items-center justify-center bg-white/70">
                    <ActivityIndicator color={palette.primary} />
                  </View>
                ) : null}
              </View>
              <View
                className="absolute h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-primary"
                style={{ right: -2, bottom: -2 }}
              >
                <Camera size={13} color="#FFFFFF" />
              </View>
            </Pressable>
            <View className="flex-1 gap-[3px]">
              <Text className="text-[19px] font-extrabold text-slateInk" numberOfLines={1}>
                {profile?.full_name ?? '...'}
              </Text>
              <Text className="text-[13px] text-slate500" numberOfLines={2}>
                {subtitle || session?.user.email}
              </Text>
              <View className="flex-row items-center gap-[4px] pt-[3px]">
                <BadgeCheck size={14} color={palette.successText} />
                <Text className="text-[11px] font-bold text-successText">Terverifikasi</Text>
              </View>
            </View>
          </Card>

          {avatarError ? <FormError message={avatarError} size={13} /> : null}

          {/* Tombol */}
          <Pressable
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Bagikan profil"
            className="flex-row items-center justify-center gap-[6px] rounded-full border-[1.5px] border-primary py-[11px]"
          >
            <Share2 size={16} color={palette.primary} />
            <Text className="text-[14px] font-bold text-primary">Bagikan profil</Text>
          </Pressable>

          {/* Statistik */}
          <View className="flex-row gap-[10px]">
            <Stat
              value={friendCount}
              label="Teman"
              onPress={() => router.push('/aktivitas?tab=teman' as Href)}
            />
            <Stat
              value={stats.data?.sessions ?? 0}
              label="Sesi diikuti"
              onPress={() => router.push('/aktivitas?tab=sesi' as Href)}
            />
            <Stat
              value={stats.data?.events ?? 0}
              label="Event diikuti"
              onPress={() => router.push('/aktivitas?tab=event' as Href)}
            />
          </View>

          {/* Kepribadian */}
          {info ? (
            <View className="gap-[8px] rounded-[20px] border border-accent200 bg-accent50 px-[16px] py-[14px]">
              <Text className="text-[15px] font-extrabold text-accent800">Kepribadianmu</Text>
              <Text className="text-[20px] font-extrabold tracking-[-0.2px] text-accent800">
                {info.name}
              </Text>
              <View className="flex-row flex-wrap gap-[6px]">
                <View className="rounded-full bg-white px-[10px] py-[5px]">
                  <Text className="text-[12px] font-semibold text-accentText">{info.tagline}</Text>
                </View>
              </View>
              <Text className="text-[12px] leading-[17px] text-accent800">
                Peranmu di tim: {info.role.charAt(0).toLowerCase() + info.role.slice(1)}
              </Text>
            </View>
          ) : null}

          {/* Mata kuliah */}
          <Card className="gap-[8px]">
            <CardHeader
              title="Mata kuliah"
              action="Ubah"
              onAction={() => router.push('/mata-kuliah')}
            />
            {myCourses.length > 0 ? (
              <View className="flex-row flex-wrap gap-[6px]">
                {myCourses.map((c) => (
                  <View key={c.id} className="rounded-full bg-surfaceSky px-[11px] py-[6px]">
                    <Text className="text-[12px] font-semibold text-primary">{c.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-[12px] text-slate500">
                Belum memilih mata kuliah. Pilih supaya partner belajar yang disarankan lebih pas.
              </Text>
            )}
          </Card>

          {/* Privasi */}
          <Card className="pb-[2px]">
            <CardHeader title="Privasi" />
            {/* Seluruh baris bisa diketuk (bukan hanya saklar kecil di kanan). */}
            <Pressable
              onPress={() => void sharingSwitch.toggle()}
              disabled={!profile || sharingSwitch.busy}
              accessibilityRole="switch"
              accessibilityState={{
                checked: sharingSwitch.value,
                disabled: !profile || sharingSwitch.busy,
              }}
              accessibilityLabel="Aku di kampus"
              className="min-h-[64px] flex-row items-center gap-[12px] py-[12px]"
            >
              <MapPin size={20} color={palette.primary} />
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-slateInk">Aku di kampus</Text>
                <Text className="text-[12px] text-slate500">
                  Orang lain cuma lihat nama ruanganmu.
                </Text>
              </View>
              <View pointerEvents="none" className={sharingSwitch.busy ? 'opacity-60' : ''}>
                <Switch
                  value={sharingSwitch.value}
                  trackColor={{ false: palette.slateMuted, true: palette.primary }}
                  thumbColor="#FFFFFF"
                  style={{ transform: [{ scale: 1.15 }] }}
                />
              </View>
            </Pressable>
            {sharingSwitch.message ? (
              <View className="pb-[12px]">
                <FormError message={sharingSwitch.message} size={12} />
              </View>
            ) : null}
          </Card>

          {profile?.role === 'admin' ? (
            <Card className="py-[2px]">
              <Pressable
                onPress={() => router.push('/admin/daftar-wifi' as Href)}
                accessibilityRole="button"
                className="flex-row items-center gap-[12px] py-[12px]"
              >
                <ShieldCheck size={20} color={palette.primary} />
                <Text className="flex-1 text-[14px] font-bold text-slateInk">
                  Daftarkan Wi-Fi (admin)
                </Text>
                <ChevronRight size={16} color={palette.slate500} />
              </Pressable>
              {(
                [
                  ['/admin/laporan', 'Tinjau laporan (admin)'],
                  ['/admin/role', 'Atur role pengguna (admin)'],
                ] as const
              ).map(([href, label]) => (
                <Pressable
                  key={href}
                  onPress={() => router.push(href as Href)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-[12px] border-t border-slateBorder py-[12px]"
                >
                  <ShieldCheck size={20} color={palette.primary} />
                  <Text className="flex-1 text-[14px] font-bold text-slateInk">{label}</Text>
                  <ChevronRight size={16} color={palette.slate500} />
                </Pressable>
              ))}
            </Card>
          ) : null}

          {/* Keluar */}
          <Pressable
            onPress={() => setConfirmLogout(true)}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Keluar"
            className={`items-center rounded-full bg-dangerSoft py-[13px] ${loggingOut ? 'opacity-50' : ''}`}
          >
            <Text className="text-[14px] font-bold text-danger">Keluar</Text>
          </Pressable>

          {/* Hapus akun: sengaja kecil dan terpisah dari Keluar supaya tidak tertekan tidak sengaja. */}
          <Pressable
            onPress={() => {
              setDeleteError(null);
              setConfirmDelete(true);
            }}
            disabled={deleting}
            accessibilityRole="button"
            className="min-h-[48px] items-center justify-center"
          >
            <Text className="text-[13px] font-semibold text-slate500 underline">Hapus akun</Text>
          </Pressable>
          {deleteError ? <FormError message={deleteError} /> : null}
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={confirmLogout}
        title="Keluar dari akun?"
        message="Kamu perlu masuk lagi dengan email dan kata sandi."
        confirmLabel="Ya, keluar"
        cancelLabel="Batal"
        loading={loggingOut}
        onConfirm={() => {
          setLoggingOut(true);
          void logout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />

      <ConfirmModal
        visible={confirmDelete}
        title="Hapus akun permanen?"
        message="Profil, hasil kuis, mata kuliah, teman, dan pesanmu dihapus dan tidak bisa dikembalikan. Sesi yang kamu host akan kehilangan host-nya."
        confirmLabel="Ya, hapus akun"
        cancelLabel="Batal"
        loading={deleting}
        onConfirm={() => {
          setDeleting(true);
          deleteAccount().catch((e: unknown) => {
            setDeleting(false);
            setConfirmDelete(false);
            setDeleteError(e instanceof Error ? e.message : 'Gagal menghapus akun.');
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </GlassBackground>
  );
}
