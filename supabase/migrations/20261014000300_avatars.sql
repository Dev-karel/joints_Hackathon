-- Foto profil. Bucket publik (foto memang ditampilkan ke sesama mahasiswa lewat public_profiles
-- dan tidak berisi data sensitif); yang dibatasi adalah siapa yang boleh MENULIS:
--   * Hanya gambar JPEG/PNG/WebP, maks. 5 MB.
--   * Path objek: <user_id>/<nama-unik>. Pengguna hanya bisa menambah/mengganti/menghapus/melihat
--     daftar file di folder miliknya sendiri.
-- Kolom profiles.avatar_url sudah ada dan boleh diubah pemiliknya (guard_profile_update tidak
-- menguncinya).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy avatars_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
