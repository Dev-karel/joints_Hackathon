import { useRouter } from 'expo-router';

import { OnboardingScreenLayout } from '@/components/onboarding/OnboardingScreenLayout';
import { QuizResultVisual } from '@/components/onboarding/visuals/QuizResultVisual';

export default function KuisArchetypeScreen() {
  const router = useRouter();

  return (
    <OnboardingScreenLayout
      step={2}
      visual={<QuizResultVisual />}
      titleSegments={[
        { text: 'Jawab kuis, dapat ' },
        { text: 'archetype', highlight: true },
        { text: ' kamu' },
      ]}
      description="15 pertanyaan singkat. Jawab jujur, hasilnya dipakai untuk mencarikan partner belajar dan tim lomba yang pas."
      secondary={{ kind: 'back' }}
      primaryLabel="Lanjut"
      primaryIcon="arrow-right"
      onSecondaryPress={() => router.back()}
      onPrimaryPress={() => router.push('/(onboarding)/privasi-kampus')}
    />
  );
}
