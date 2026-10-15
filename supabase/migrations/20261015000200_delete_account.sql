-- Hapus akun sendiri (UU PDP No. 27/2022: hak menghapus data pribadi).
-- Menghapus baris auth.users milik pemanggil; profiles ikut terhapus (on delete cascade) dan
-- semua tabel turunan mengikuti aturan FK masing-masing: data milik akun terhapus (jawaban kuis,
-- mata kuliah, presence, pertemanan, RSVP, keanggotaan sesi), sedangkan jejak bersama diputus
-- (host sesi/pelapor menjadi null). Hanya bisa menghapus akun sendiri.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Belum masuk.';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
