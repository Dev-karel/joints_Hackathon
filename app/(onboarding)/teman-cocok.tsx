import { useRouter } from 'expo-router';

import { OnboardingScreenLayout } from '@/components/onboarding/OnboardingScreenLayout';
import { FriendMatchVisual } from '@/components/onboarding/visuals/FriendMatchVisual';

export default function TemanCocokScreen() {
  const router = useRouter();

  return (
    <OnboardingScreenLayout
      step={1}
      visual={<FriendMatchVisual />}
      titleSegments={[
        { text: 'Kuliah lebih seru kalau bisa' },
        { text: ' belajar bareng', highlight: true },
      ]}
      description="AyokMatch mempertemukan kamu dengan mahasiswa lain berdasarkan kepribadian, mata kuliah, dan minat."
      secondary={{ kind: 'skip', label: 'Lewati' }}
      primaryLabel="Lanjut"
      primaryIcon="arrow-right"
      // replace supaya tombol back hardware tidak kembali ke tengah intro.
      onSecondaryPress={() => router.replace('/(onboarding)/welcome')}
      onPrimaryPress={() => router.push('/(onboarding)/kuis-archetype')}
    />
  );
}
