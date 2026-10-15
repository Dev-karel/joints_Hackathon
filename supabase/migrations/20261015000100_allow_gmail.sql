-- AyokMatch: izinkan daftar/masuk dengan @gmail.com selain @binus.ac.id (keputusan 15 Okt 2026).
-- Berlaku untuk daftar email+kata sandi dan Google OAuth. Domain lain tetap ditolak.
-- Catatan: akun Gmail tidak terbukti mahasiswa BINUS; fitur Match Map tetap hanya aktif
-- saat tersambung Wi-Fi kampus.

create or replace function public.enforce_campus_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or lower(new.email) !~ '^[^@[:space:]]+@(binus\.ac\.id|gmail\.com)$' then
    raise exception 'Hanya email @binus.ac.id atau @gmail.com yang boleh mendaftar.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
