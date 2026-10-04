import { useRouter } from 'expo-router';

import { OnboardingScreenLayout } from '@/components/onboarding/OnboardingScreenLayout';
import { EventDiscoveryVisual } from '@/components/onboarding/visuals/EventDiscoveryVisual';

export default function EventSeruScreen() {
  const router = useRouter();

  return (
    <OnboardingScreenLayout
      step={4}
      visual={<EventDiscoveryVisual />}
      titleSegments={[
        { text: 'Datang ke ' },
        { text: 'event seru', highlight: true },
        { text: ', tanpa canggung' },
      ]}
      description="Acara di luar kampus yang dikurasi dan diadakan di tempat publik. Cocok buat yang biasanya ragu datang sendirian."
      secondary={{ kind: 'back' }}
      primaryLabel="Mulai sekarang"
      primaryIcon="sparkles"
      onSecondaryPress={() => router.back()}
      // replace: intro selesai, jangan balik ke tengah intro.
      onPrimaryPress={() => router.replace('/(onboarding)/welcome')}
    />
  );
}
