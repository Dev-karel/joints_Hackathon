import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, Pressable, View } from 'react-native';

import { OtpBoxes } from '@/components/auth/OtpBoxes';
import { glass } from '@/components/glass/tokens';
import { palette } from '@/components/onboarding/palette';
import { Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { resendSignupCode, verifySignupCode } from '@/features/auth/api';
import {
  cancelDeviceGate,
  confirmDeviceCode,
  requestDeviceCode,
} from '@/features/auth/useAuthActions';
import { OTP_LENGTH, otpSchema } from '@/lib/validation/auth';

const RESEND_SECONDS = 60;
const formatCooldown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Frame Figma "Login - Verifikasi OTP" (174:303, lembar bawah untuk HP baru) dan
// "Sign Up Page / Verifikasi OTP" (208:529, dialog untuk daftar). Tampil sebagai
// transparentModal di atas form, dengan latar redup rgba(15,23,42,0.65).
export default function VerifikasiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const isDevice = params.mode === 'device';
  const email = params.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Hitung mundur dari jam dinding (bukan dikurangi 1 per detik) supaya tetap benar setelah
  // app di latar belakang: timer JS berhenti saat app ditutup sementara.
  const [endAt, setEndAt] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [resent, setResent] = useState(false);
  const cooldown = Math.max(0, Math.ceil((endAt - now) / 1000));
  const counting = cooldown > 0;

  useEffect(() => {
    if (!counting) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(tick);
      sub.remove();
    };
  }, [counting]);

  const close = async () => {
    // HP baru: batal berarti keluar supaya sesi sementara tidak menggantung.
    if (isDevice) await cancelDeviceGate();
    router.back();
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void close();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDevice]);

  const submit = async () => {
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Kode tidak valid');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (isDevice) await confirmDeviceCode(email, parsed.data);
      else await verifySignupCode(email, parsed.data);
      // Sesi terbentuk: gerbang rute di root layout memindahkan ke kuis / Beranda.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      if (isDevice) await requestDeviceCode(email);
      else await resendSignupCode(email);
      setEndAt(Date.now() + RESEND_SECONDS * 1000);
      setNow(Date.now());
      setResent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  const verifyButton = (
    <PrimaryButton
      label="Verifikasi"
      onPress={submit}
      loading={busy}
      disabled={code.length !== OTP_LENGTH}
    />
  );

  return (
    <View className="flex-1" style={{ backgroundColor: glass.scrim }}>
      <Pressable
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="Tutup"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <KeyboardAvoidingView
        behavior="padding"
        className={`flex-1 ${isDevice ? 'justify-end' : 'justify-center'}`}
        pointerEvents="box-none"
      >
        {isDevice ? (
          <View className="items-center gap-[14px] rounded-t-[24px] bg-white px-[20px] pb-[28px] pt-[12px]">
            <View className="h-[4px] w-[40px] rounded-[2px] bg-slateBorderMuted" />
            <View className="rounded-full bg-surfaceSky p-[15px]">
              <Mail size={26} strokeWidth={2} color={palette.primary} />
            </View>
            <Text className="text-center text-[14px] text-slate500">
              HP ini belum dikenali. Kode {OTP_LENGTH} digit dikirim ke{' '}
              <Text className="font-bold text-slateInk">{email}</Text>
            </Text>
            <OtpBoxes value={code} onChange={setCode} length={OTP_LENGTH} variant="sheet" />
            {error ? <FormError message={error} /> : null}
            {verifyButton}
            <ResendRow cooldown={cooldown} onResend={resend} resent={resent} variant="sheet" />
          </View>
        ) : (
          <View className="items-center gap-[24px] rounded-[25px] bg-white px-[24px] pb-[28px] pt-[32px]">
            <View className="size-[80px] items-center justify-center rounded-full bg-surfaceSky">
              <Mail size={36} strokeWidth={2} color={palette.primary} />
            </View>
            <Text className="text-center text-[22px] font-extrabold text-slateInk">
              Verifikasi Email
            </Text>
            <Text className="text-center text-[13px] text-slate500">
              Kami sudah mengirim kode OTP {OTP_LENGTH} digit ke{'\n'}
              <Text className="font-bold text-slateInk">{email}</Text>
            </Text>
            <OtpBoxes value={code} onChange={setCode} length={OTP_LENGTH} variant="dialog" />
            {error ? <FormError message={error} /> : null}
            {verifyButton}
            <ResendRow cooldown={cooldown} onResend={resend} resent={resent} variant="dialog" />
            <View className="w-full rounded-[14px] bg-surfaceSky px-[14px] py-[12px]">
              <Text className="text-[11px] leading-[16px] text-slate500">
                OTP hanya diminta saat Daftar dan saat masuk dari HP baru. Di HP yang sudah
                dikenali, cukup email + kata sandi.
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function ResendRow({
  cooldown,
  onResend,
  resent,
  variant,
}: {
  cooldown: number;
  onResend: () => void;
  resent: boolean;
  variant: 'sheet' | 'dialog';
}) {
  if (cooldown > 0) {
    return (
      <View className="flex-row items-center gap-[4px]">
        <Text className="text-[13px] text-slate500">
          {variant === 'sheet' ? 'Kirim ulang kode dalam' : 'Kirim ulang kode dalam'}
        </Text>
        <Text className="text-[13px] font-semibold text-slateInk">{formatCooldown(cooldown)}</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-[4px]">
      <Text className="text-[13px] text-slate500">
        {resent ? 'Kode baru terkirim.' : 'Tidak menerima kode?'}
      </Text>
      <Pressable
        onPress={onResend}
        accessibilityRole="button"
        hitSlop={12}
        className="min-h-[48px] justify-center"
      >
        <Text className="text-[13px] font-bold text-primary">Kirim ulang</Text>
      </Pressable>
    </View>
  );
}
