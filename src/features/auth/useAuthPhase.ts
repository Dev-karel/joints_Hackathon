import { useAuthStore } from './authStore';
import { useProfile, type ProfileRow } from './useProfile';
import { useMyCourseIds } from '../courses/hooks';

// Fase aplikasi yang menentukan rute mana yang boleh dibuka (lihat app/_layout.tsx):
//  loading        -> menunggu sesi/profil
//  signedOut      -> onboarding + daftar/masuk
//  needsDeviceOtp -> sudah masuk tapi HP baru wajib OTP
//  profileError   -> gagal memuat profil (mis. offline); tampilkan tombol coba lagi
//  needsQuiz      -> kuis kepribadian wajib sebelum Beranda
//  needsCourses   -> pilih mata kuliah setelah quiz selesai
//  ready          -> Beranda (tab)
export type Phase =
  'loading' | 'signedOut' | 'needsDeviceOtp' | 'profileError' | 'needsQuiz' | 'needsCourses' | 'ready';

export function useAuthPhase(): { phase: Phase; profile: ProfileRow | null; retry: () => void } {
  const { ready, session, gate } = useAuthStore();
  const query = useProfile(session?.user.id);
  const profile = query.data ?? null;
  const courseIds = useMyCourseIds(session?.user.id);
  const hasCourses = (courseIds.data ?? []).length > 0;
  const retry = () => {
    void query.refetch();
    void courseIds.refetch();
  };

  let phase: Phase;
  if (!ready) phase = 'loading';
  else if (!session) phase = 'signedOut';
  else if (gate.kind === 'checking') phase = 'signedOut';
  else if (gate.kind === 'otp') phase = 'needsDeviceOtp';
  else if (query.isError) phase = 'profileError';
  else if (!profile) phase = 'loading';
  else if (!profile.personality_quiz_completed_at) phase = 'needsQuiz';
  else if (!hasCourses && !courseIds.isLoading) phase = 'needsCourses';
  else phase = 'ready';

  return { phase, profile, retry };
}
