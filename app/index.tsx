// Entry route "/": sementara selalu mengarah ke layar onboarding pertama.
// Nanti jadi gerbang "sudah login? -> (tabs), belum? -> onboarding".
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(onboarding)/teman-cocok" />;
}
