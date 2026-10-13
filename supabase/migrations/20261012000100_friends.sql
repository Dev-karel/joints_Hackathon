-- Fitur pertemanan (PRD §5 #8, ARCHITECTURE §4.7). Tabel friendships + RLS dasar sudah ada
-- (init_schema, rls). Migration ini menutup celah di sana dan menambah fungsi daftar teman.
--
-- Celah yang ditutup:
--   * friendships_update mengizinkan PENGIRIM menyetujui permintaannya sendiri, dan salah satu
--     pihak mengubah status/kolom kunci seenaknya. Sekarang hanya PENERIMA yang boleh mengubah
--     pending → accepted, tidak ada perubahan lain dari klien.
--   * friendships_delete mengizinkan pihak mana pun menghapus baris berstatus blocked. Sekarang
--     baris blocked tidak bisa dihapus klien (blokir belum ada UI; dikelola server nanti).
--   * Tidak ada batas kirim permintaan → dibatasi 20 permintaan per jam per pengguna.

-- ───────────────────────── 1. Kebijakan update & delete ─────────────────────────

drop policy friendships_update on friendships;
create policy friendships_update_addressee on friendships
  for update to authenticated
  using (addressee_id = (select auth.uid()))
  with check (addressee_id = (select auth.uid()));

drop policy friendships_delete on friendships;
create policy friendships_delete on friendships
  for delete to authenticated
  using (
    status <> 'blocked'
    and (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()))
  );

-- Lapisan kedua di atas RLS (pola sama dengan guard_profile_update): satu-satunya perubahan
-- yang lolos dari klien adalah penerima menyetujui permintaan yang masih pending.
create function public.guard_friendship_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.requester_id is distinct from old.requester_id
      or new.addressee_id is distinct from old.addressee_id
      or new.created_at is distinct from old.created_at then
      raise exception 'Data pertemanan tidak bisa diubah.';
    end if;
    if not (old.status = 'pending' and new.status = 'accepted') then
      raise exception 'Perubahan status pertemanan tidak diizinkan.';
    end if;
  end if;
  return new;
end;
$$;

create trigger friendships_guard_update
  before update on friendships
  for each row execute function public.guard_friendship_update();

-- ───────────────────────── 2. Batas kirim permintaan ─────────────────────────

create function public.limit_friend_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if (
      select count(*) from public.friendships
      where requester_id = new.requester_id
        and created_at > now() - interval '1 hour'
    ) >= 20 then
      raise exception 'Terlalu banyak permintaan pertemanan. Coba lagi nanti.';
    end if;
  end if;
  return new;
end;
$$;

create trigger friendships_limit_insert
  before insert on friendships
  for each row execute function public.limit_friend_requests();

-- ───────────────────────── 3. Daftar teman & permintaan ─────────────────────────
-- Satu panggilan untuk semua baris pertemanan milik pemanggil, digabung dengan kolom publik
-- profil lawan (sama dengan view public_profiles; tanpa ktm_url/role/campus_email).
-- `incoming` = true bila pemanggil adalah penerima.

create function public.my_friendships()
returns table (
  other_id uuid,
  full_name text,
  major text,
  avatar_url text,
  personality_type text,
  status text,
  incoming boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.full_name,
    p.major,
    p.avatar_url,
    p.personality_type::text,
    f.status::text,
    (f.addressee_id = auth.uid()),
    f.created_at
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
    and f.status <> 'blocked'
  order by f.created_at desc
$$;

revoke execute on function public.my_friendships() from public, anon;
grant execute on function public.my_friendships() to authenticated;
