-- Moderasi (PRD §5 #10, §10): laporan pending_review -> ditinjau admin -> valid/dismissed;
-- akun bisa diblokir hanya lewat keputusan admin (tidak ada auto-ban dari satu laporan).
-- Juga: admin memberi role, admin menambah ruangan (PRD §7.3 "atau membuat zona baru").

-- ───────────────────────── Status blokir akun ─────────────────────────

alter table profiles add column banned_at timestamptz;

-- Sama dengan versi di migration RLS, ditambah banned_at: pengguna tidak boleh membuka blokir sendiri.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.id is distinct from old.id
      or new.role is distinct from old.role
      or new.campus_email is distinct from old.campus_email
      or new.created_at is distinct from old.created_at
      or new.personality_type is distinct from old.personality_type
      or new.personality_scores is distinct from old.personality_scores
      or new.personality_quiz_completed_at is distinct from old.personality_quiz_completed_at
      or new.banned_at is distinct from old.banned_at
    then
      raise exception 'Kolom ini tidak dapat diubah dari aplikasi.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

-- Akun yang diblokir tidak terlihat lagi oleh pengguna lain (profil, teman, peserta sesi, dll.).
create or replace view public_profiles as
  select id, full_name, major, semester, avatar_url, personality_type, personality_scores
  from profiles
  where banned_at is null;

-- Rekomendasi partner (versi 3 dari migration study_match) + lewati akun yang diblokir.
create or replace function public.recommend_study_partners(p_user_id uuid default auth.uid())
returns table (
  user_id uuid,
  full_name text,
  major text,
  avatar_url text,
  personality_type archetype,
  shared_courses integer,
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
  my_credits as (
    select coalesce(sum(c.credits), 0)::integer as n
    from public.user_courses uc
    join public.courses c on c.id = uc.course_id
    where uc.user_id = p_user_id
  ),
  course_overlap as (
    select other.user_id as other_id, count(*)::integer as n, sum(c.credits)::integer as credits
    from public.user_courses mine
    join public.user_courses other
      on other.course_id = mine.course_id and other.user_id <> mine.user_id
    join public.courses c on c.id = mine.course_id
    where mine.user_id = p_user_id
    group by other.user_id
  ),
  session_overlap as (
    select m2.user_id as other_id, count(*)::integer as n
    from public.study_session_members m1
    join public.study_session_members m2
      on m2.session_id = m1.session_id and m2.user_id <> m1.user_id
    where m1.user_id = p_user_id
    group by m2.user_id
  )
  select
    p.id, p.full_name, p.major, p.avatar_url, p.personality_type,
    coalesce(co.n, 0),
    (
      coalesce(round(coalesce(co.credits, 0)::numeric / nullif(mc.n, 0) * 60), 0)
      + case when p.personality_type is not distinct from me.personality_type then 20 else 10 end
      + case when p.major is not null and p.major = me.major then 10 else 0 end
      + least(coalesce(so.n, 0), 2) * 5
    )::integer as score
  from public.profiles p
  cross join me
  cross join my_credits mc
  left join course_overlap co on co.other_id = p.id
  left join session_overlap so on so.other_id = p.id
  where p.id <> p_user_id
    and p.personality_quiz_completed_at is not null
    and p.banned_at is null
  order by score desc, p.full_name
  limit 20
$$;

revoke execute on function public.recommend_study_partners(uuid) from public, anon;
grant execute on function public.recommend_study_partners(uuid) to authenticated;

-- ───────────────────────── Tinjauan laporan (admin) ─────────────────────────

-- Daftar laporan beserta nama pelapor dan target (tabel profiles hanya terbaca pemiliknya).
create function public.admin_list_reports(p_status report_status default 'pending_review')
returns table (
  id uuid,
  created_at timestamptz,
  status report_status,
  reason text,
  reporter_name text,
  target_user_id uuid,
  target_user_name text,
  target_user_banned boolean,
  target_event_id uuid,
  target_event_title text,
  target_session_id uuid,
  target_session_title text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id, r.created_at, r.status, r.reason,
    rep.full_name,
    r.target_user_id, tu.full_name, tu.banned_at is not null,
    r.target_event_id, e.title,
    r.target_session_id, s.title
  from public.reports r
  left join public.profiles rep on rep.id = r.reporter_id
  left join public.profiles tu on tu.id = r.target_user_id
  left join public.events e on e.id = r.target_event_id
  left join public.study_sessions s on s.id = r.target_session_id
  where private.is_admin() and r.status = p_status
  order by r.created_at desc
  limit 100
$$;

-- Putuskan satu laporan. p_ban hanya berlaku bila laporan valid dan menargetkan pengguna.
create function public.admin_review_report(p_report_id uuid, p_valid boolean, p_ban boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not private.is_admin() then
    raise exception 'Hanya admin yang bisa meninjau laporan.';
  end if;

  update public.reports
  set status = case when p_valid then 'valid'::public.report_status else 'dismissed'::public.report_status end
  where id = p_report_id and status = 'pending_review'
  returning target_user_id into target;
  if not found then
    raise exception 'Laporan tidak ditemukan atau sudah ditinjau.';
  end if;

  if p_valid and p_ban and target is not null then
    perform public.admin_set_banned(target, true);
  end if;
end;
$$;

-- Blokir / buka blokir. Blokir juga mematikan "Tampil di peta" dan menghapus presence-nya.
create function public.admin_set_banned(p_user_id uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Hanya admin yang bisa memblokir akun.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Kamu tidak bisa memblokir akunmu sendiri.';
  end if;

  update public.profiles
  set banned_at = case when p_banned then now() else null end,
      show_on_map = case when p_banned then false else show_on_map end
  where id = p_user_id;
  if p_banned then
    delete from public.presence where user_id = p_user_id;
  end if;
end;
$$;

-- ───────────────────────── Role (admin) ─────────────────────────

-- Beri role lewat email kampus. Admin tidak bisa menurunkan role dirinya sendiri (cegah terkunci).
create function public.admin_set_role(p_email text, p_role user_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  name text;
begin
  if not private.is_admin() then
    raise exception 'Hanya admin yang bisa mengubah role.';
  end if;

  select id, full_name into target, name
  from public.profiles
  where lower(campus_email) = lower(btrim(p_email));
  if target is null then
    raise exception 'Akun dengan email itu belum terdaftar.';
  end if;
  if target = auth.uid() then
    raise exception 'Kamu tidak bisa mengubah role akunmu sendiri.';
  end if;

  update public.profiles set role = p_role where id = target;
  return name;
end;
$$;

revoke execute on function public.admin_list_reports(report_status) from public, anon;
revoke execute on function public.admin_review_report(uuid, boolean, boolean) from public, anon;
revoke execute on function public.admin_set_banned(uuid, boolean) from public, anon;
revoke execute on function public.admin_set_role(text, user_role) from public, anon;
grant execute on function public.admin_list_reports(report_status) to authenticated;
grant execute on function public.admin_review_report(uuid, boolean, boolean) to authenticated;
grant execute on function public.admin_set_banned(uuid, boolean) to authenticated;
grant execute on function public.admin_set_role(text, user_role) to authenticated;

-- ───────────────────────── Ruangan baru (admin) ─────────────────────────

create policy campus_zones_admin_insert on campus_zones
  for insert to authenticated
  with check (private.is_admin() and level = 'room' and parent_zone_id is not null);
