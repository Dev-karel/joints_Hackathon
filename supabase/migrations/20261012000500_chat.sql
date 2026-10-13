-- Pesan (PRD §5 #8, ARCHITECTURE §4.7). Tabel conversations / conversation_members / messages dan
-- RLS dasarnya sudah ada (init_schema, rls): hanya anggota percakapan yang bisa membaca dan
-- menulis pesan. Migration ini menambah:
--   * Jenis percakapan: 'direct' (dua teman) dan 'session' (grup chat satu sesi belajar).
--   * Penanda baca per anggota untuk hitungan "belum dibaca".
--   * Fungsi: get_or_create_direct, my_conversations, mark_conversation_read.
--   * Trigger: grup chat dibuat otomatis untuk tiap sesi dan keanggotaannya mengikuti peserta sesi.
--   * Batas panjang pesan dan batas kirim (rate limit), plus publikasi Realtime untuk messages.
--
-- Pesan hanya antar TEMAN (friendships.accepted). Permintaan pesan dari non-teman belum ada.

alter table conversations
  add column kind text not null default 'direct' check (kind in ('direct', 'session')),
  add column session_id uuid unique references study_sessions (id) on delete cascade;

alter table conversation_members
  add column last_read_at timestamptz not null default now();

alter table messages
  add constraint messages_content_len check (char_length(btrim(content)) between 1 and 1000);

-- ───────────────────────── Batas kirim ─────────────────────────

create function public.limit_message_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if (
      select count(*) from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute'
    ) >= 30 then
      raise exception 'Terlalu banyak pesan. Coba lagi sebentar.';
    end if;
  end if;
  return new;
end;
$$;

create trigger messages_rate_limit
  before insert on messages
  for each row execute function public.limit_message_rate();

-- ───────────────────────── Chat langsung antar teman ─────────────────────────

create function public.get_or_create_direct(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null or p_other is null or p_other = v_me then
    raise exception 'Penerima tidak valid.';
  end if;
  if not exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = v_me and f.addressee_id = p_other)
        or (f.requester_id = p_other and f.addressee_id = v_me))
  ) then
    raise exception 'Kamu hanya bisa mengirim pesan ke temanmu.';
  end if;

  -- Cegah dua percakapan untuk pasangan yang sama bila dua HP menekan bersamaan.
  perform pg_advisory_xact_lock(hashtextextended(least(v_me, p_other)::text || greatest(v_me, p_other)::text, 0));

  select c.id into v_id
  from public.conversations c
  where c.kind = 'direct'
    and exists (select 1 from public.conversation_members m where m.conversation_id = c.id and m.user_id = v_me)
    and exists (select 1 from public.conversation_members m where m.conversation_id = c.id and m.user_id = p_other)
  limit 1;

  if v_id is null then
    insert into public.conversations (kind) values ('direct') returning id into v_id;
    insert into public.conversation_members (conversation_id, user_id) values (v_id, v_me), (v_id, p_other);
  end if;
  return v_id;
end;
$$;

-- ───────────────────────── Daftar percakapan ─────────────────────────

create function public.my_conversations()
returns table (
  conversation_id uuid,
  kind text,
  title text,
  session_id uuid,
  other_id uuid,
  other_avatar text,
  last_content text,
  last_at timestamptz,
  last_sender_id uuid,
  last_sender_name text,
  unread integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.kind,
    case when c.kind = 'session' then s.title else p.full_name end,
    c.session_id,
    p.id,
    p.avatar_url,
    lm.content,
    lm.created_at,
    lm.sender_id,
    sp.full_name,
    (
      select count(*) from public.messages m
      where m.conversation_id = c.id and m.sender_id <> auth.uid() and m.created_at > cm.last_read_at
    )::integer
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  left join public.study_sessions s on s.id = c.session_id
  left join lateral (
    select om.user_id from public.conversation_members om
    where om.conversation_id = c.id and om.user_id <> auth.uid() limit 1
  ) o on c.kind = 'direct'
  left join public.profiles p on p.id = o.user_id
  left join lateral (
    select m.content, m.created_at, m.sender_id from public.messages m
    where m.conversation_id = c.id order by m.created_at desc limit 1
  ) lm on true
  left join public.profiles sp on sp.id = lm.sender_id
  where cm.user_id = auth.uid()
  order by coalesce(lm.created_at, c.created_at) desc
$$;

create function public.mark_conversation_read(p_conversation uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversation_members
  set last_read_at = now()
  where conversation_id = p_conversation and user_id = auth.uid()
$$;

revoke execute on function public.get_or_create_direct(uuid) from public, anon;
revoke execute on function public.my_conversations() from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.get_or_create_direct(uuid) to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ───────────────────────── Grup chat per sesi belajar ─────────────────────────
-- Satu grup per sesi; anggota grup = peserta sesi (otomatis masuk/keluar bersama sesi).

create function public.create_session_chat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.conversations (kind, session_id) values ('session', new.id) returning id into v_id;
  insert into public.conversation_members (conversation_id, user_id)
  select v_id, m.user_id from public.study_session_members m where m.session_id = new.id
  on conflict do nothing;
  return new;
end;
$$;

-- Nama diawali "sessions_" supaya jalan SETELAH add_host_as_member_trg (urut abjad): host sudah
-- jadi anggota sesi saat grup dibuat.
create trigger sessions_create_chat_trg
  after insert on study_sessions
  for each row execute function public.create_session_chat();

create function public.sync_session_chat_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.conversation_members (conversation_id, user_id)
    select c.id, new.user_id from public.conversations c where c.session_id = new.session_id
    on conflict do nothing;
    return new;
  end if;
  delete from public.conversation_members cm
  using public.conversations c
  where c.id = cm.conversation_id and c.session_id = old.session_id and cm.user_id = old.user_id;
  return old;
end;
$$;

create trigger session_members_sync_chat_trg
  after insert or delete on study_session_members
  for each row execute function public.sync_session_chat_member();

-- Sesi yang sudah ada sebelum migration ini.
insert into conversations (kind, session_id)
select 'session', s.id from study_sessions s
where not exists (select 1 from conversations c where c.session_id = s.id);

insert into conversation_members (conversation_id, user_id)
select c.id, m.user_id
from conversations c
join study_session_members m on m.session_id = c.session_id
where c.kind = 'session'
on conflict do nothing;

-- ───────────────────────── Realtime ─────────────────────────
-- Dibungkus supaya migration tetap lolos bila publikasi belum tersedia.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then
  raise notice 'Realtime untuk messages belum diaktifkan: %', sqlerrm;
end;
$$;
