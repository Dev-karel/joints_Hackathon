// Tujuan deep link `ayokmatch://auth/callback` setelah login Google. Token/kode ditangani oleh
// signInWithGoogle (src/features/auth/api.ts) lewat hasil browser; layar ini hanya mencegah
// expo-router menampilkan "Unmatched Route" dan menyerahkan tujuan akhir ke gerbang di '/'.
import { Redirect } from 'expo-router';

export default function AuthCallbackScreen() {
  return <Redirect href="/" />;
}
