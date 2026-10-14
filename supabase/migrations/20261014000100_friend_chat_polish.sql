-- Penyempurnaan pertemanan, notifikasi, dan chat.
--   * friendships.accepted_at: kapan permintaan diterima, supaya pengirim bisa diberi tahu
--     ("X menerima permintaanmu"). Diisi trigger, tidak bisa diatur klien.
--   * my_friendships() ikut mengembalikan accepted_at.
--   * Chat langsung hanya boleh dikirim selama kedua orang masih berteman (sebelumnya, setelah
--     "Hapus Teman" kedua pihak masih bisa saling kirim pesan karena RLS hanya cek keanggotaan).
--   * friendships masuk publikasi Realtime supaya permintaan/penerimaan muncul tanpa menunggu polling.

-- ───────────────────────── 1. accepted_at ─────────────────────────

alter table friendships add column accepted_at timestamptz;

update friendships set accepted_at = created_at where status = 'accepted' and accepted_at is null;

create function public.set_friendship_accepted_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.accepted_at := null;
  elsif old.status = 'pending' and new.status = 'accepted' then
    new.accepted_at := now();
  else
    new.accepted_at := old.accepted_at;
  end if;
  return new;
end;
$$;

create trigger friendships_set_accepted_at
  before insert or update on friendships
  for each row execute function public.set_friendship_accepted_at();

-- ───────────────────────── 2. my_friendships + accepted_at ─────────────────────────

drop function public.my_friendships();

create function public.my_friendships()
returns table (
  other_id uuid,
  full_name text,
  major text,
  avatar_url text,
  personality_type text,
  status text,
  incoming boolean,
  created_at timestamptz,
  accepted_at timestamptz
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
    f.created_at,
    f.accepted_at
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
    and f.status <> 'blocked'
  order by f.created_at desc
$$;

revoke execute on function public.my_friendships() from public, anon;
grant execute on function public.my_friendships() to authenticated;

-- ───────────────────────── 3. Kirim pesan hanya ke teman ─────────────────────────
-- Grup chat sesi: cukup anggota. Chat langsung: kedua anggota harus masih berteman.

create function private.can_post_message(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = cid
      and (
        c.kind = 'session'
        or exists (
          select 1
          from public.conversation_members a
          join public.conversation_members b
            on b.conversation_id = a.conversation_id and b.user_id <> a.user_id
          join public.friendships f
            on f.status = 'accepted'
           and least(f.requester_id, f.addressee_id) = least(a.user_id, b.user_id)
           and greatest(f.requester_id, f.addressee_id) = greatest(a.user_id, b.user_id)
          where a.conversation_id = c.id and a.user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function private.can_post_message(uuid) from public, anon;
grant execute on function private.can_post_message(uuid) to authenticated;

drop policy messages_insert_member on messages;
create policy messages_insert_member on messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
    and private.can_post_message(conversation_id)
  );

-- ───────────────────────── 4. Realtime ─────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.friendships;
exception when others then
  raise notice 'Realtime untuk friendships belum diaktifkan: %', sqlerrm;
end;
$$;

-- ───────────────────────── 5. Jumlah teman profil orang lain ─────────────────────────
-- RLS friendships hanya memperlihatkan baris milik pemanggil, jadi jumlah teman orang lain
-- harus lewat fungsi (hanya mengembalikan angka, bukan siapa temannya).

create function public.friend_count(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.friendships
  where status = 'accepted' and (requester_id = p_user or addressee_id = p_user)
$$;

revoke execute on function public.friend_count(uuid) from public, anon;
grant execute on function public.friend_count(uuid) to authenticated;
