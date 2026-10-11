-- AyokMatch: fungsi & trigger logika sensitif.
--  1) kuis kepribadian (submit_personality_quiz, METHODOLOGY §5–6)
--  2) kuota sesi belajar & event dijaga di database (kunci baris)
--  3) Match Map: get_zone_presence (timbal balik; zona berisi 1 orang hanya jumlah)
--  4) rekomendasi partner belajar (heuristik sederhana)
--  5) pembersihan presence kedaluwarsa (pg_cron)
-- DITUNDA ke migration terpisah: host_leave_session (polling/voting host), bucket Storage.

-- ───────────────────────── 1. Kuis kepribadian ─────────────────────────

-- Pemetaan skor (METHODOLOGY §4). Data referensi baca-saja; diisi di migration seed.
create table personality_scoring (
  question_id text not null check (question_id ~ '^q([1-9]|1[0-5])$'),
  question_no smallint not null check (question_no between 1 and 15),
  answer char(1) not null check (answer in ('A', 'B')),
  primary_archetype archetype not null,
  secondary_archetype archetype not null check (secondary_archetype <> primary_archetype),
  primary key (question_id, answer)
);

grant select on personality_scoring to authenticated;
alter table personality_scoring enable row l  evel security;
create policy personality_scoring_select on personality_scoring
  for select to authenticated using (true);

-- Hitung archetype dari 15 jawaban lalu kunci permanen. Bobot memakai bilangan bulat
-- (primer 70, sekunder 30; total 1500) agar tie-break tidak terganggu pembulatan float.
-- Tie-break (METHODOLOGY §5.2): (1) jumlah bobot primer, (2) bobot pertanyaan paling
-- awal yang berbeda (perbandingan array q1..q15), (3) urutan archetype di §3
-- (= urutan deklarasi enum archetype).
create function public.submit_personality_quiz(profile_id uuid default null)
returns table (personality_type archetype, personality_scores jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := coalesce(profile_id, auth.uid());
  v_done timestamptz;
  v_answered integer;
  v_type public.archetype;
  v_scores jsonb;
begin
  if v_id is null then
    raise exception 'Tidak ada pengguna.' using errcode = 'insufficient_privilege';
  end if;
  if auth.uid() is not null and v_id <> auth.uid() then
    raise exception 'Tidak boleh mengirim kuis milik orang lain.' using errcode = 'insufficient_privilege';
  end if;

  select p.personality_quiz_completed_at into v_done
  from public.profiles p where p.id = v_id for update;
  if not found then
    raise exception 'Profil tidak ditemukan.';
  end if;
  if v_done is not null then
    raise exception 'Kuis sudah dikirim dan terkunci permanen.' using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_answered
  from public.personality_answers a
  join public.personality_scoring s on s.question_id = a.question_id and s.answer = a.answer
  where a.profile_id = v_id;
  if v_answered <> 15 then
    raise exception 'Jawab semua 15 pertanyaan dulu (terjawab: %).', v_answered;
  end if;

  with picks as (
    select s.question_no, s.primary_archetype as prim, s.secondary_archetype as sec
    from public.personality_answers a
    join public.personality_scoring s on s.question_id = a.question_id and s.answer = a.answer
    where a.profile_id = v_id
  ),
  grid as (
    select ar.arch, q.n,
      case
        when exists (select 1 from picks k where k.question_no = q.n and k.prim = ar.arch) then 70
        when exists (select 1 from picks k where k.question_no = q.n and k.sec = ar.arch) then 30
        else 0
      end as w
    from (select unnest(enum_range(null::public.archetype)) as arch) ar
    cross join generate_series(1, 15) as q(n)
  ),
  tot as (
    select arch,
           sum(w) as score,
           count(*) filter (where w = 70) as prim_count,
           array_agg(w order by n) as ws
    from grid group by arch
  )
  select
    (select t.arch from tot t order by t.score desc, t.prim_count desc, t.ws desc, t.arch asc limit 1),
    jsonb_object_agg(t.arch::text, round(t.score / 15.0, 4))
  into v_type, v_scores
  from tot t;

  update public.profiles p
  set personality_type = v_type,
      personality_scores = v_scores,
      personality_quiz_completed_at = now()
  where p.id = v_id;

  return query select v_type, v_scores;
end;
$$;

revoke execute on function public.submit_personality_quiz(uuid) from public, anon;
grant execute on function public.submit_personality_quiz(uuid) to authenticated;

-- ───────────────────────── 2. Kuota di database ─────────────────────────

-- Sesi belajar: kunci baris sesi, hitung anggota, tolak jika penuh. Tanpa daftar tunggu.
create function public.enforce_session_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  n integer;
begin
  select id, capacity, status, ends_at into s
  from public.study_sessions where id = new.session_id for update;
  if not found then
    raise exception 'Sesi tidak ditemukan.';
  end if;
  if s.status <> 'open' then
    raise exception 'Sesi ini sudah tidak dibuka.';
  end if;
  if s.ends_at <= now() then
    raise exception 'Sesi ini sudah selesai.';
  end if;
  select count(*) into n from public.study_session_members where session_id = new.session_id;
  if n >= s.capacity then
    raise exception 'Sesi sudah penuh.';
  end if;
  return new;
end;
$$;

create trigger enforce_session_capacity_trg
  before insert on study_session_members
  for each row execute function public.enforce_session_capacity();

-- Pembuat sesi otomatis jadi anggota pertama (host).
create function public.add_host_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.host_id is not null then
    insert into public.study_session_members (session_id, user_id) values (new.id, new.host_id);
  end if;
  return new;
end;
$$;

create trigger add_host_as_member_trg
  after insert on study_sessions
  for each row execute function public.add_host_as_member();

-- Maks. 5 file materi per sesi (PRD §8).
create function public.limit_session_materials()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.study_session_materials where session_id = new.session_id) >= 5 then
    raise exception 'Maksimal 5 file materi per sesi.';
  end if;
  return new;
end;
$$;

create trigger limit_session_materials_trg
  before insert on study_session_materials
  for each row execute function public.limit_session_materials();

-- Event: pola yang sama. RSVP "going" ditolak jika kuota penuh; batal langsung membuka tempat.
create function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  e record;
  n integer;
  becomes_going boolean := new.status = 'going';
begin
  -- OLD tidak ada pada INSERT, jadi dicek terpisah (bukan dalam satu ekspresi OR).
  if becomes_going and tg_op = 'UPDATE' then
    becomes_going := old.status is distinct from 'going';
  end if;

  if becomes_going then
    select id, capacity, status, starts_at into e
    from public.events where id = new.event_id for update;
    if not found then
      raise exception 'Event tidak ditemukan.';
    end if;
    if e.status <> 'published' then
      raise exception 'Event ini belum/tidak dibuka.';
    end if;
    if e.starts_at <= now() then
      raise exception 'Event ini sudah dimulai.';
    end if;
    select count(*) into n
    from public.event_rsvps
    where event_id = new.event_id and status = 'going' and user_id <> new.user_id;
    if n >= e.capacity then
      raise exception 'Event sudah penuh.';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_event_capacity_trg
  before insert or update on event_rsvps
  for each row execute function public.enforce_event_capacity();

-- ───────────────────────── 3. Match Map ─────────────────────────

-- Klien tidak membaca tabel presence langsung. Fungsi ini menegakkan:
--  - visibilitas timbal balik: pemanggil harus punya presence aktif DAN show_on_map;
--  - hanya pengguna dengan show_on_map yang dihitung;
--  - zona berisi 1 orang: hanya jumlah, tanpa identitas (members = []).
create function public.get_zone_presence()
returns table (zone_id uuid, online_count integer, members jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select 1
    from public.presence p
    join public.profiles pr on pr.id = p.user_id
    where p.user_id = auth.uid() and p.expires_at > now() and pr.show_on_map
  ),
  visible as (
    select p.zone_id, pr.id, pr.full_name, pr.avatar_url, pr.personality_type
    from public.presence p
    join public.profiles pr on pr.id = p.user_id
    where p.expires_at > now() and pr.show_on_map and exists (select 1 from me)
  )
  select
    v.zone_id,
    count(*)::integer,
    case
      when count(*) >= 2 then jsonb_agg(
        jsonb_build_object(
          'id', v.id,
          'full_name', v.full_name,
          'avatar_url', v.avatar_url,
          'personality_type', v.personality_type
        ) order by v.full_name
      )
      else '[]'::jsonb
    end
  from visible v
  group by v.zone_id
$$;

revoke execute on function public.get_zone_presence() from public, anon;
grant execute on function public.get_zone_presence() to authenticated;

-- ───────────────────────── 4. Rekomendasi partner belajar ─────────────────────────

-- Heuristik sederhana (bukan ML): archetype berbeda (tim yang saling melengkapi),
-- jurusan sama, dan jumlah sesi yang pernah diikuti bersama.
create function public.recommend_study_partners(p_user_id uuid default auth.uid())
returns table (
  user_id uuid,
  full_name text,
  major text,
  avatar_url text,
  personality_type archetype,
  score integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select id, major, personality_type
    from public.profiles
    where id = p_user_id and p_user_id = auth.uid()
  ),
  shared as (
    select m2.user_id as other, count(*) as n
    from public.study_session_members m1
    join public.study_session_members m2
      on m2.session_id = m1.session_id and m2.user_id <> m1.user_id
    where m1.user_id = p_user_id
    group by m2.user_id
  )
  select
    p.id, p.full_name, p.major, p.avatar_url, p.personality_type,
    (
      case when p.personality_type is distinct from me.personality_type then 40 else 20 end
      + case when p.major is not null and p.major = me.major then 30 else 0 end
      + least(coalesce(s.n, 0), 3) * 10
    )::integer as score
  from public.profiles p
  cross join me
  left join shared s on s.other = p.id
  where p.id <> p_user_id and p.personality_quiz_completed_at is not null
  order by score desc, p.full_name
  limit 20
$$;

revoke execute on function public.recommend_study_partners(uuid) from public, anon;
grant execute on function public.recommend_study_partners(uuid) to authenticated;

-- ───────────────────────── 5. Pembersihan presence ─────────────────────────
-- pg_cron tiap menit. Dibungkus agar migration tetap lolos bila ekstensi belum tersedia;
-- kalau gagal, aktifkan pg_cron di Dashboard → Database → Extensions lalu jalankan ulang blok ini.

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'cleanup-expired-presence',
    '* * * * *',
    $job$delete from public.presence where expires_at < now()$job$
  );
exception when others then
  raise notice 'pg_cron tidak aktif, pembersihan presence belum dijadwalkan: %', sqlerrm;
end;
$$;
