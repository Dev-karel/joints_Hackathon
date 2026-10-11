// Terjemahan error Supabase Auth ke Bahasa Indonesia untuk ditampilkan ke pengguna.
export class AppAuthError extends Error {}

export function toAuthError(error: { message: string; code?: string; name?: string }): AppAuthError {
  const code = error.code;
  const msg = error.message ?? '';

  if (code === 'invalid_credentials') return new AppAuthError('Email atau kata sandi salah.');
  if (code === 'email_not_confirmed')
    return new AppAuthError('Email belum diverifikasi. Selesaikan pendaftaran dengan kode OTP.');
  if (code === 'otp_expired' || (/expired|invalid/i.test(msg) && /token|otp/i.test(msg)))
    return new AppAuthError('Kode salah atau sudah kedaluwarsa. Minta kode baru.');
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit')
    return new AppAuthError('Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.');
  if (code === 'weak_password') return new AppAuthError('Kata sandi terlalu lemah.');
  if (code === 'user_already_exists')
    return new AppAuthError('Email ini sudah terdaftar. Silakan masuk.');
  if (/Database error saving new user/i.test(msg))
    return new AppAuthError('Pendaftaran ditolak. Pastikan memakai email kampus @binus.ac.id.');
  if (/network|fetch/i.test(msg) || error.name === 'AuthRetryableFetchError')
    return new AppAuthError('Tidak ada koneksi. Periksa internet kamu lalu coba lagi.');

  return new AppAuthError('Terjadi kesalahan. Coba lagi sebentar lagi.');
}
