import { useRouter } from 'expo-router';

import { OnboardingScreenLayout } from '@/components/onboarding/OnboardingScreenLayout';
import { PrivateCampusMapVisual } from '@/components/onboarding/visuals/PrivateCampusMapVisual';

export default function PrivasiKampusScreen() {
  const router = useRouter();

  return (
    <OnboardingScreenLayout
      step={3}
      visual={<PrivateCampusMapVisual />}
      titleSegments={[{ text: 'Cari teman belajarmu ' }, { text: 'di kampus', highlight: true }]}
      description="Peta hanya menampilkan nama ruangan, bukan lokasi pastimu. Fitur ini mati secara default dan kamu yang memutuskan."
      secondary={{ kind: 'back' }}
      primaryLabel="Lanjut"
      primaryIcon="arrow-right"
      onSecondaryPress={() => router.back()}
      onPrimaryPress={() => router.push('/(onboarding)/event-seru')}
    />
  );
}
