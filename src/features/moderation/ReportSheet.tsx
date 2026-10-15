import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import { REPORT_REASONS, type ReportInput } from '@/lib/validation/report';

import { submitReport } from './api';

type Props = {
  visible: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetEventId?: string;
  targetName: string;
  /** Cuplikan pesan bila laporan berasal dari chat. */
  context?: string;
};

// Lembar lapor pengguna/pesan. Laporan tidak langsung memblokir siapa pun; admin yang meninjau.
export function ReportSheet({
  visible,
  onClose,
  targetUserId,
  targetEventId,
  targetName,
  context,
}: Props) {
  const userId = useAuthStore((s) => s.session?.user.id);
  const [reason, setReason] = useState<ReportInput['reason'] | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = () => {
    setReason(null);
    setNote('');
    setError(null);
    setDone(false);
    onClose();
  };

  const submit = async () => {
    if (!reason || !userId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await submitReport(userId, {
        targetUserId,
        targetEventId,
        reason,
        note: note || undefined,
        context,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim laporan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close}>
      {done ? (
        <>
          <Text className="w-full text-[20px] font-extrabold text-slateInk">Laporan terkirim</Text>
          <Text className="w-full text-[14px] leading-[21px] text-slate500">
            Terima kasih. Tim kami akan meninjau laporanmu tentang {targetName}. Tidak ada tindakan
            otomatis sebelum ditinjau.
          </Text>
          <View className="w-full">
            <PrimaryButton label="Tutup" onPress={close} />
          </View>
        </>
      ) : (
        <>
          <Text className="w-full text-[20px] font-extrabold text-slateInk">
            Laporkan {targetName}
          </Text>
          {context ? (
            <View className="w-full rounded-[12px] bg-slate100 px-[12px] py-[8px]">
              <Text className="text-[12px] text-slate500" numberOfLines={3}>
                “{context}”
              </Text>
            </View>
          ) : null}
          {REPORT_REASONS.map((r) => {
            const active = reason === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setReason(r.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`w-full flex-row items-center gap-[12px] rounded-[14px] border px-[14px] py-[12px] ${
                  active ? 'border-primary bg-surfaceSky' : 'border-slateBorder bg-white'
                }`}
              >
                <View
                  className={`h-[22px] w-[22px] items-center justify-center rounded-full ${
                    active ? 'bg-primary' : 'border border-slateBorder'
                  }`}
                >
                  {active ? <Check size={14} strokeWidth={3} color="#FFFFFF" /> : null}
                </View>
                <Text className="flex-1 text-[14px] text-slateInk">{r.label}</Text>
              </Pressable>
            );
          })}
          <TextInput
            maxFontSizeMultiplier={1.3}
            value={note}
            onChangeText={setNote}
            placeholder="Catatan tambahan (opsional)"
            placeholderTextColor={palette.slate500}
            multiline
            maxLength={300}
            accessibilityLabel="Catatan tambahan"
            style={{ fontFamily: INTER.regular, minHeight: 64, textAlignVertical: 'top' }}
            className="w-full rounded-[14px] border border-slateBorder px-[14px] py-[10px] text-[14px] text-slateInk"
          />
          {error ? <FormError message={error} size={12} /> : null}
          <View className="w-full gap-[8px]">
            <PrimaryButton
              label="Kirim laporan"
              onPress={submit}
              loading={busy}
              disabled={!reason}
            />
            <PrimaryButton label="Batal" variant="outline" onPress={close} />
          </View>
        </>
      )}
    </BottomSheet>
  );
}
