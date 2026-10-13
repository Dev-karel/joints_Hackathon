-- Bucket Storage untuk materi sesi belajar (PRD §8). Tabel study_session_materials (metadata, nama
-- file terlihat semua pengguna) sudah ada; migration ini menambah penyimpanan isi file:
--   * Bucket privat, PDF atau gambar, maks. 10 MB per file.
--   * Isi file hanya bisa dibaca anggota sesi. Hanya host yang bisa menambah/menghapus.
--   * Path objek: <session_id>/<nama-unik>. Maks. 5 file per sesi dijaga trigger
--     limit_session_materials pada tabel metadata.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-materials',
  'session-materials',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy session_materials_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'session-materials'
    and private.is_session_member(((storage.foldername(name))[1])::uuid)
  );

create policy session_materials_insert_host on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'session-materials'
    and exists (
      select 1 from public.study_sessions s
      where s.id = ((storage.foldername(name))[1])::uuid
        and s.host_id = (select auth.uid())
    )
  );

create policy session_materials_delete_host on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'session-materials'
    and exists (
      select 1 from public.study_sessions s
      where s.id = ((storage.foldername(name))[1])::uuid
        and s.host_id = (select auth.uid())
    )
  );
