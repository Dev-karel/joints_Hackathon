-- "Mau ketemu lagi?" (PRD §5 #12, ARCHITECTURE §4.6): setelah acara, peserta memilih siapa yang
-- ingin ditemui lagi. Saling pilih → otomatis berteman. Pilihan tidak berbalas tidak pernah
-- terlihat siapa pun selain pemilihnya (RLS reconnect_votes_select_own sudah menjamin ini).
--
-- Yang ditambahkan di sini:
--   * Validasi insert: pemilih dan target sama-sama RSVP 'going', acara sudah selesai, dan
--     masih dalam 3 hari setelah selesai (sesuai teks UI "ubah pilihan sampai 3 hari setelah acara").
--   * Klien boleh menghapus pilihannya sendiri dalam jendela waktu yang sama (untuk mengubah pilihan).
--   * Trigger pembuat friendships berstatus accepted saat dua pengguna saling memilih.
--   * Fungsi daftar peserta lain yang bisa dipilih.

-- Akhir acara; events.ends_at opsional, jadi cadangannya 3 jam setelah mulai.
create function private.event_end(e public.events)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select coalesce(e.ends_at, e.starts_at + interval '3 hours')
$$;

create function public.guard_reconnect_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  finished_at timestamptz;
begin
  select * into e from public.events where id = new.event_id;
  if not found then
    raise exception 'Event tidak ditemukan.';
  end if;
  finished_at := private.event_end(e);
  if now() < finished_at then
    raise exception 'Pilihan baru dibuka setelah acara selesai.';
  end if;
  if now() > finished_at + interval '3 days' then
    raise exception 'Waktu memilih sudah lewat (maksimal 3 hari setelah acara).';
  end if;
  if not exists (
    select 1 from public.event_rsvps
    where event_id = new.event_id and user_id = new.target_id and status = 'going'
  ) then
    raise exception 'Orang itu tidak ikut acara ini.';
  end if;
  return new;
end;
$$;

create trigger reconnect_votes_guard_insert
  before insert on reconnect_votes
  for each row execute function public.guard_reconnect_vote();

-- Saling pilih → berteman. Dijalankan sebagai definer, jadi RLS/guard friendships dilewati dengan
-- sengaja (klien tidak boleh membuat baris accepted sendiri).
create function public.mutual_reconnect_friendship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.reconnect_votes
    where event_id = new.event_id and voter_id = new.target_id and target_id = new.voter_id
  ) then
    update public.friendships
    set status = 'accepted'
    where status = 'pending'
      and ((requester_id = new.voter_id and addressee_id = new.target_id)
        or (requester_id = new.target_id and addressee_id = new.voter_id));

    insert into public.friendships (requester_id, addressee_id, status)
    select new.voter_id, new.target_id, 'accepted'
    where not exists (
      select 1 from public.friendships
      where least(requester_id, addressee_id) = least(new.voter_id, new.target_id)
        and greatest(requester_id, addressee_id) = greatest(new.voter_id, new.target_id)
    );
  end if;
  return new;
end;
$$;

create trigger reconnect_votes_mutual
  after insert on reconnect_votes
  for each row execute function public.mutual_reconnect_friendship();

-- Hapus pilihan sendiri hanya selama jendela 3 hari dan sebelum saling pilih terbentuk
-- (pertemanan yang sudah jadi tidak ikut dibatalkan; itu urusan "hapus teman").
create policy reconnect_votes_delete_own on reconnect_votes
  for delete to authenticated
  using (
    voter_id = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = reconnect_votes.event_id
        and now() between private.event_end(e) and private.event_end(e) + interval '3 days'
    )
  );

-- Peserta lain yang bisa dipilih: hanya untuk peserta 'going' dan setelah acara selesai.
create function public.event_reconnect_candidates(p_event_id uuid)
returns table (
  user_id uuid,
  full_name text,
  major text,
  avatar_url text,
  personality_type text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.major, p.avatar_url, p.personality_type::text
  from public.event_rsvps r
  join public.profiles p on p.id = r.user_id
  join public.events e on e.id = r.event_id
  where r.event_id = p_event_id
    and r.status = 'going'
    and r.user_id <> auth.uid()
    and now() >= private.event_end(e)
    and exists (
      select 1 from public.event_rsvps me
      where me.event_id = p_event_id and me.user_id = auth.uid() and me.status = 'going'
    )
  order by p.full_name
$$;

revoke execute on function public.event_reconnect_candidates(uuid) from public, anon;
grant execute on function public.event_reconnect_candidates(uuid) to authenticated;
