import { LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { palette } from '@/components/onboarding/palette';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { INTER, Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';

function DangerButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      className={`w-full items-center rounded-[28px] bg-dangerDot py-[15px] ${off ? 'opacity-50' : ''}`}
    >
      <Text className="text-[15px] font-bold text-white">{loading ? 'Memproses...' : label}</Text>
    </Pressable>
  );
}

function CancelLink({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" hitSlop={10}>
      <Text className="text-[14px] font-semibold text-slate500">Batal</Text>
    </Pressable>
  );
}

// Peserta biasa keluar lewat konfirmasi (PRD §8): "Keluar dari sesi ini?".
export function LeaveSheet({
  visible,
  loading,
  error,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="h-[56px] w-[56px] items-center justify-center rounded-[28px] bg-dangerSoft">
        <LogOut size={26} color={palette.danger} />
      </View>
      <Text className="text-center text-[20px] font-extrabold text-slateInk">Keluar dari sesi ini?</Text>
      <Text className="text-center text-[13px] leading-[19px] text-slate500">
        Tempatmu langsung terbuka untuk orang lain dan belum tentu bisa kamu dapatkan lagi.
      </Text>
      {error ? <FormError message={error} size={12} /> : null}
      <DangerButton label="Ya, keluar" onPress={onConfirm} loading={loading} />
      <CancelLink onPress={onClose} disabled={loading} />
    </BottomSheet>
  );
}

// Host keluar (PRD §8.1). Host sendirian: sesi langsung batal. Selain itu wajib alasan dan satu
// dari dua pilihan; aturan H-24 dan hasil polling/voting ditegakkan fungsi database.
export function HostLeaveSheet({
  visible,
  alone,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  alone: boolean;
  loading: boolean;
  error: string | null;
  onSubmit: (reason: string, action: 'transfer' | 'cancel') => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'transfer' | 'cancel'>('transfer');

  if (alone) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        <View className="h-[56px] w-[56px] items-center justify-center rounded-[28px] bg-dangerSoft">
          <LogOut size={26} color={palette.danger} />
        </View>
        <Text className="text-center text-[20px] font-extrabold text-slateInk">Batalkan sesi ini?</Text>
        <Text className="text-center text-[13px] leading-[19px] text-slate500">
          Belum ada peserta lain, jadi sesi langsung dibatalkan tanpa voting.
        </Text>
        {error ? <FormError message={error} size={12} /> : null}
        <DangerButton label="Ya, batalkan sesi" onPress={() => onSubmit('', 'cancel')} loading={loading} />
        <CancelLink onPress={onClose} disabled={loading} />
      </BottomSheet>
    );
  }

  const options: { id: 'transfer' | 'cancel'; title: string; sub: string }[] = [
    { id: 'transfer', title: 'Pilih host baru lewat polling', sub: 'Peserta memilih host baru dalam 1 jam' },
    { id: 'cancel', title: 'Dibatalkan', sub: 'Butuh 80% peserta setuju dalam 1 jam' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="w-full text-[20px] font-extrabold text-slateInk">Keluar sebagai host</Text>
      <Text className="w-full text-[13px] font-bold text-slateInk">Alasan keluar (wajib)</Text>
      <TextInput
 maxFontSizeMultiplier={1.3}
        value={reason}
        onChangeText={setReason}
        placeholder="Tulis alasanmu"
        placeholderTextColor="#94A3B8"
        multiline
        textAlignVertical="top"
        maxLength={200}
        accessibilityLabel="Alasan keluar"
        style={{ fontFamily: INTER.regular, height: 76 }}
        className="w-full rounded-[14px] border-[1.5px] border-primary px-[14px] py-[12px] text-[14px] text-slateInk"
      />
      <Text className="w-full text-[13px] font-bold text-slateInk">Setelah kamu keluar, sesi ini…</Text>
      {options.map((o) => {
        const active = action === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => setAction(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={`w-full flex-row items-start gap-[12px] rounded-[14px] px-[14px] py-[12px] ${
              active ? 'border-2 border-primary bg-surfaceSky' : 'border-[1.5px] border-slateBorder bg-white'
            }`}
          >
            <View
              className={`mt-[1px] h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                active ? 'border-primary' : 'border-slateBorderMuted'
              }`}
            >
              {active ? <View className="h-[8px] w-[8px] rounded-full bg-primary" /> : null}
            </View>
            <View className="flex-1 gap-[2px]">
              <Text className="text-[14px] font-semibold text-slateInk">{o.title}</Text>
              <Text className="text-[12px] text-slate500">{o.sub}</Text>
            </View>
          </Pressable>
        );
      })}
      <Text className="w-full text-[12px] text-slate500">
        Kamu langsung keluar setelah mengajukan. Alasanmu terlihat oleh peserta sesi.
      </Text>
      {error ? <FormError message={error} size={12} /> : null}
      <DangerButton
        label="Ajukan dan keluar"
        onPress={() => onSubmit(reason, action)}
        loading={loading}
        disabled={reason.trim().length === 0}
      />
      <CancelLink onPress={onClose} disabled={loading} />
    </BottomSheet>
  );
}

// Laporkan host yang keluar (PRD §8.1.6): masuk alur moderasi pending_review, tanpa auto-ban.
export function ReportSheet({
  visible,
  name,
  loading,
  error,
  done,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  name: string;
  loading: boolean;
  error: string | null;
  done: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="w-full text-[20px] font-extrabold text-slateInk">Laporkan {name}</Text>
      {done ? (
        <>
          <Text className="w-full text-[14px] leading-[21px] text-slate500">
            Laporanmu sudah masuk dan akan ditinjau admin. Terima kasih sudah membantu menjaga komunitas.
          </Text>
          <DangerButton label="Tutup" onPress={onClose} />
        </>
      ) : (
        <>
          <Text className="w-full text-[13px] text-slate500">
            Ceritakan singkat apa yang terjadi. Satu laporan tidak langsung memblokir siapa pun.
          </Text>
          <TextInput
 maxFontSizeMultiplier={1.3}
            value={reason}
            onChangeText={setReason}
            placeholder="Tulis alasan laporan"
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            maxLength={300}
            accessibilityLabel="Alasan laporan"
            style={{ fontFamily: INTER.regular, height: 96 }}
            className="w-full rounded-[14px] border-[1.5px] border-primary px-[14px] py-[12px] text-[14px] text-slateInk"
          />
          {error ? <FormError message={error} size={12} /> : null}
          <DangerButton
            label="Kirim laporan"
            onPress={() => onSubmit(reason)}
            loading={loading}
            disabled={reason.trim().length < 3}
          />
          <CancelLink onPress={onClose} disabled={loading} />
        </>
      )}
    </BottomSheet>
  );
}
