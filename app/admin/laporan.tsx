import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfile } from '@/features/auth/useProfile';
import { formatDateTime } from '@/features/events/format';
import type { AdminReport, ReportStatus } from '@/features/moderation/api';
import { useAdminReports, useReviewReport, useSetBanned } from '@/features/moderation/hooks';

const TABS: { id: ReportStatus; label: string }[] = [
  { id: 'pending_review', label: 'Menunggu' },
  { id: 'valid', label: 'Valid' },
  { id: 'dismissed', label: 'Ditolak' },
];

type Decision = { report: AdminReport; valid: boolean; ban: boolean };

// Moderasi (PRD §10): laporan masuk pending_review, admin memutuskan valid/ditolak, dan blokir
// akun hanya lewat keputusan ini (tidak ada auto-ban). Role admin dicek ulang di database.
export default function LaporanScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);
  const profile = useProfile(userId);
  const [tab, setTab] = useState<ReportStatus>('pending_review');
  const reports = useAdminReports(tab);
  const review = useReviewReport();
  const ban = useSetBanned();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (profile.data && profile.data.role !== 'admin') return <Redirect href="/(tabs)" />;

  const confirm = async () => {
    if (!decision) return;
    setError(null);
    try {
      await review.mutateAsync({
        reportId: decision.report.id,
        valid: decision.valid,
        ban: decision.ban,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan keputusan.');
    }
    setDecision(null);
  };

  const toggleBan = async (r: AdminReport) => {
    if (!r.target_user_id) return;
    setError(null);
    try {
      await ban.mutateAsync({ userId: r.target_user_id, banned: !r.target_user_banned });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengubah status akun.');
    }
  };

  return (
    <AuthScreen
      title="Laporan"
      subtitle="Satu laporan tidak otomatis memblokir."
      onBack={() => router.back()}
    >
      <View className="flex-row gap-[8px]">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`min-h-[44px] justify-center rounded-full border px-[14px] ${
                active ? 'border-primary bg-primary' : 'border-slateBorder bg-white'
              }`}
            >
              <Text
                className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-slateInk'}`}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <FormError message={error} /> : null}

      {reports.isPending ? (
        <ActivityIndicator color={palette.primary} />
      ) : reports.isError ? (
        <View className="gap-[10px]">
          <FormError message={reports.error.message} />
          <PrimaryButton
            label="Coba lagi"
            variant="outline"
            onPress={() => void reports.refetch()}
          />
        </View>
      ) : reports.data.length === 0 ? (
        <Text className="text-[14px] text-slate500">Tidak ada laporan di sini.</Text>
      ) : (
        <View className="gap-[12px]">
          {reports.data.map((r) => {
            const target =
              r.target_user_name ??
              r.target_event_title ??
              r.target_session_title ??
              'Target terhapus';
            const kind = r.target_user_id ? 'Pengguna' : r.target_event_id ? 'Event' : 'Sesi';
            return (
              <View
                key={r.id}
                className="gap-[8px] rounded-[16px] border border-slateBorder bg-white p-[14px]"
              >
                <Text className="text-[12px] font-bold text-primary">
                  {kind.toUpperCase()} · {formatDateTime(r.created_at)}
                </Text>
                <Text className="text-[16px] font-bold text-slateInk">
                  {target}
                  {r.target_user_banned ? ' (diblokir)' : ''}
                </Text>
                <Text className="text-[13px] leading-[19px] text-slateInk">{r.reason}</Text>
                <Text className="text-[12px] text-slate500">
                  Pelapor: {r.reporter_name ?? 'akun terhapus'}
                </Text>

                {tab === 'pending_review' ? (
                  <View className="gap-[8px] pt-[4px]">
                    {r.target_user_id ? (
                      <PrimaryButton
                        label="Valid, blokir akun"
                        size="sm"
                        onPress={() => setDecision({ report: r, valid: true, ban: true })}
                      />
                    ) : null}
                    <PrimaryButton
                      label="Valid, tanpa blokir"
                      variant="outline"
                      onPress={() => setDecision({ report: r, valid: true, ban: false })}
                    />
                    <PrimaryButton
                      label="Tolak laporan"
                      variant="outline"
                      onPress={() => setDecision({ report: r, valid: false, ban: false })}
                    />
                  </View>
                ) : r.target_user_id ? (
                  <PrimaryButton
                    label={r.target_user_banned ? 'Buka blokir akun' : 'Blokir akun'}
                    variant="outline"
                    loading={ban.isPending}
                    onPress={() => void toggleBan(r)}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <ConfirmModal
        visible={!!decision}
        title={
          decision?.ban
            ? 'Blokir akun ini?'
            : decision?.valid
              ? 'Tandai laporan valid?'
              : 'Tolak laporan?'
        }
        message={
          decision?.ban
            ? 'Akun tidak bisa dipakai dan hilang dari peta dan daftar. Bisa dibuka lagi dari tab Valid.'
            : 'Keputusan ini tercatat dan laporan pindah dari daftar Menunggu.'
        }
        confirmLabel="Ya, simpan"
        cancelLabel="Batal"
        loading={review.isPending}
        onConfirm={() => void confirm()}
        onCancel={() => setDecision(null)}
      />
    </AuthScreen>
  );
}
