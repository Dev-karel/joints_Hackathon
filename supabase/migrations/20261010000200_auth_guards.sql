-- AyokMatch: gerbang pendaftaran + fungsi bantu untuk RLS.
-- Allowlist domain ditegakkan di database (cadangan bila Auth Hook tidak dipakai).
-- Login kampus: hanya @binus.ac.id (CLAUDE.md, ARCHITECTURE §4.1 & §6).

-- ───────────────────────── Allowlist email kampus ─────────────────────────

create function public.enforce_campus_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or lower(new.email) !~ '^[^@[:space:]]+@binus\.ac\.id$' then
    raise exception 'Hanya email kampus @binus.ac.id yang boleh mendaftar.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger enforce_campus_email_trg
  before insert on auth.users
  for each row execute function public.enforce_campus_email();

-- ───────────────────────── Profil otomatis saat daftar ─────────────────────────

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, campus_email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(new.email)
  );
  return new;
end;
$$;

create trigger handle_new_user_trg
  after insert on auth.users
  for each row execute function public.handle_new_user();

create schema if not exists private;

-- ───────────────────────── Fungsi bantu untuk policy RLS ─────────────────────────
-- security definer + search_path kosong: dipakai di dalam policy tanpa memicu
-- rekursi RLS pada tabel yang dirujuk. Ditaruh di schema `private` (tidak diekspos
-- Data API), karena security definer di schema public bisa dipanggil siapa pun lewat RPC.

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function private.is_curator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('curator', 'admin')
  );
$$;

-- true jika kuis milik uid sudah submit akhir (jawaban & hasil terkunci permanen).
create function private.quiz_is_locked(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and personality_quiz_completed_at is not null
  );
$$;

create function private.is_session_member(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.study_session_members
    where session_id = sid and user_id = auth.uid()
  );
$$;

create function private.is_conversation_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = cid and user_id = auth.uid()
  );
$$;

-- Hanya pengguna login yang boleh memanggil (policy RLS berjalan sebagai authenticated).
grant usage on schema private to authenticated;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_curator_or_admin() from public, anon;
revoke all on function private.quiz_is_locked(uuid) from public, anon;
revoke all on function private.is_session_member(uuid) from public, anon;
revoke all on function private.is_conversation_member(uuid) from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_curator_or_admin() to authenticated;
grant execute on function private.quiz_is_locked(uuid) to authenticated;
grant execute on function private.is_session_member(uuid) to authenticated;
grant execute on function private.is_conversation_member(uuid) to authenticated;
