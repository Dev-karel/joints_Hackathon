-- AyokMatch: Row Level Security untuk semua tabel (ARCHITECTURE §6).
-- RLS aktif tanpa policy = ditolak untuk klien; Edge Function memakai service role
-- (bypass RLS) dan fungsi security definer untuk operasi yang sengaja tidak dibuka.

-- anon tidak boleh menyentuh tabel aplikasi sama sekali.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- Data API: beri hak tabel ke authenticated secara eksplisit (tidak bergantung pengaturan
-- auto-expose project). Baris yang boleh disentuh tetap ditentukan policy RLS di bawah.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table profiles enable row level security;
alter table trusted_devices enable row level security;
alter table personality_answers enable row level security;
alter table courses enable row level security;
alter table campus_zones enable row level security;
alter table wifi_access_points enable row level security;
alter table presence enable row level security;
alter table study_sessions enable row level security;
alter table study_session_members enable row level security;
alter table study_session_materials enable row level security;
alter table session_host_exits enable row level security;
alter table session_host_votes enable row level security;
alter table team_openings enable row level security;
alter table team_join_requests enable row level security;
alter table venues enable row level security;
alter table events enable row level security;
alter table event_rsvps enable row level security;
alter table event_groups enable row level security;
alter table event_group_members enable row level security;
alter table reconnect_votes enable row level security;
alter table friendships enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;

-- ───────────────────────── profiles ─────────────────────────
-- Klien hanya membaca baris sendiri; profil orang lain lewat view public_profiles
-- (tanpa ktm_url dan role). Baris dibuat oleh trigger handle_new_user, bukan klien.

create policy profiles_select_own on profiles
  for select to authenticated using (id = (select auth.uid()));

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- SENGAJA tanpa security_invoker: view ini memberi semua pengguna login akses baca ke
-- kolom publik profil (bukan ktm_url/role/campus_email), sementara tabel profiles tetap
-- hanya terbaca pemiliknya. Supabase advisor akan menandai view ini; itu diharapkan.
create view public_profiles as
  select id, full_name, major, semester, avatar_url, personality_type, personality_scores
  from profiles;

revoke all on public_profiles from anon;
grant select on public_profiles to authenticated;

-- Lapisan kedua di atas RLS: kolom yang tidak boleh diubah klien. Pemanggil internal
-- (fungsi security definer, SQL Editor, service role) memakai role selain
-- authenticated/anon sehingga lolos.
create function public.guard_profile_update()
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
    then
      raise exception 'Kolom ini tidak dapat diubah dari aplikasi.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_update_trg
  before update on profiles
  for each row execute function public.guard_profile_update();

-- ───────────────────────── trusted_devices ─────────────────────────

create policy trusted_devices_own on trusted_devices
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ───────────────────────── personality_answers ─────────────────────────
-- Boleh di-upsert selama kuis belum submit akhir; terkunci permanen sesudahnya.

create policy personality_answers_select_own on personality_answers
  for select to authenticated using (profile_id = (select auth.uid()));

create policy personality_answers_insert_own on personality_answers
  for insert to authenticated
  with check (profile_id = (select auth.uid()) and not private.quiz_is_locked((select auth.uid())));

create policy personality_answers_update_own on personality_answers
  for update to authenticated
  using (profile_id = (select auth.uid()) and not private.quiz_is_locked((select auth.uid())))
  with check (profile_id = (select auth.uid()) and not private.quiz_is_locked((select auth.uid())));

create function public.guard_personality_answers()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and private.quiz_is_locked(new.profile_id) then
    raise exception 'Jawaban kuis sudah terkunci permanen.'
      using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger guard_personality_answers_trg
  before insert or update on personality_answers
  for each row execute function public.guard_personality_answers();

-- ───────────────────────── referensi kampus ─────────────────────────

create policy courses_select on courses for select to authenticated using (true);
create policy campus_zones_select on campus_zones for select to authenticated using (true);

-- wifi_access_points: hanya admin. Klien biasa tidak perlu membaca tabel ini
-- (resolve-zone memakai service role).
create policy wifi_access_points_admin on wifi_access_points
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- presence: sengaja TANPA policy untuk klien. Penulisan lewat Edge Function
-- resolve-zone (service role); pembacaan lewat fungsi get_zone_presence()
-- (visibilitas timbal balik + zona berisi 1 orang hanya tampil jumlah).

-- ───────────────────────── Match › Belajar ─────────────────────────

create policy study_sessions_select on study_sessions
  for select to authenticated using (true);

create policy study_sessions_insert on study_sessions
  for insert to authenticated with check (host_id = (select auth.uid()));

-- host_id null (sesi tanpa host) tidak pernah cocok dengan (select auth.uid()): terkunci otomatis.
create policy study_sessions_update_host on study_sessions
  for update to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

create policy study_session_members_select on study_session_members
  for select to authenticated using (true);

create policy study_session_members_insert on study_session_members
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Peserta keluar sendiri; host tidak bisa keluar lewat delete biasa (aturan khusus PRD §8.1).
create policy study_session_members_delete_own on study_session_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and not exists (
      select 1 from study_sessions s where s.id = session_id and s.host_id = (select auth.uid())
    )
  );

create policy study_session_materials_select on study_session_materials
  for select to authenticated using (true);

create policy study_session_materials_insert_host on study_session_materials
  for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and exists (select 1 from study_sessions s where s.id = session_id and s.host_id = (select auth.uid()))
  );

create policy study_session_materials_delete_host on study_session_materials
  for delete to authenticated
  using (
    exists (select 1 from study_sessions s where s.id = session_id and s.host_id = (select auth.uid()))
  );

-- Riwayat & suara host keluar: hanya anggota sesi itu. Penulisan lewat fungsi
-- host_leave_session (migration terpisah nanti), jadi tidak ada policy tulis.
create policy session_host_exits_select_members on session_host_exits
  for select to authenticated using (private.is_session_member(session_id));

create policy session_host_votes_select_members on session_host_votes
  for select to authenticated
  using (
    exists (
      select 1 from session_host_exits e
      where e.id = exit_id and private.is_session_member(e.session_id)
    )
  );

-- ───────────────────────── Match › Lomba ─────────────────────────

create policy team_openings_select on team_openings
  for select to authenticated using (true);

create policy team_openings_insert on team_openings
  for insert to authenticated with check (host_id = (select auth.uid()));

create policy team_openings_update_host on team_openings
  for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));

create policy team_openings_delete_host on team_openings
  for delete to authenticated using (host_id = (select auth.uid()));

create policy team_join_requests_select on team_join_requests
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from team_openings o where o.id = opening_id and o.host_id = (select auth.uid()))
  );

create policy team_join_requests_insert on team_join_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'requested');

-- Hanya pembuat lowongan yang boleh menyetujui/menolak.
create policy team_join_requests_update_host on team_join_requests
  for update to authenticated
  using (exists (select 1 from team_openings o where o.id = opening_id and o.host_id = (select auth.uid())))
  with check (exists (select 1 from team_openings o where o.id = opening_id and o.host_id = (select auth.uid())));

create policy team_join_requests_delete_own on team_join_requests
  for delete to authenticated using (user_id = (select auth.uid()));

-- ───────────────────────── Event ─────────────────────────

create policy venues_select on venues
  for select to authenticated
  using (status = 'approved' or private.is_curator_or_admin());

create policy venues_admin_write on venues
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy events_select on events
  for select to authenticated
  using (status = 'published' or curator_id = (select auth.uid()) or private.is_admin());

-- Hanya curator/admin; venue wajib approved. Edge Function create-event mengecek hal yang sama.
create policy events_insert_curator on events
  for insert to authenticated
  with check (
    private.is_curator_or_admin()
    and curator_id = (select auth.uid())
    and exists (select 1 from venues v where v.id = venue_id and v.status = 'approved')
  );

create policy events_update_curator on events
  for update to authenticated
  using (private.is_curator_or_admin() and (curator_id = (select auth.uid()) or private.is_admin()))
  with check (private.is_curator_or_admin() and (curator_id = (select auth.uid()) or private.is_admin()));

create policy event_rsvps_select on event_rsvps
  for select to authenticated using (true);

create policy event_rsvps_insert on event_rsvps
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy event_rsvps_update_own on event_rsvps
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy event_rsvps_delete_own on event_rsvps
  for delete to authenticated using (user_id = (select auth.uid()));

-- Meja Kecil (Could-have): grup dibentuk fungsi server; anggota hanya melihat grupnya.
create policy event_group_members_select_own on event_group_members
  for select to authenticated using (user_id = (select auth.uid()));

create policy event_groups_select_member on event_groups
  for select to authenticated
  using (
    exists (select 1 from event_group_members m where m.group_id = event_groups.id and m.user_id = (select auth.uid()))
  );

-- Suara "mau ketemu lagi?" tidak pernah bisa dibaca target.
create policy reconnect_votes_select_own on reconnect_votes
  for select to authenticated using (voter_id = (select auth.uid()));

create policy reconnect_votes_insert_own on reconnect_votes
  for insert to authenticated
  with check (
    voter_id = (select auth.uid())
    and exists (
      select 1 from event_rsvps r
      where r.event_id = reconnect_votes.event_id and r.user_id = (select auth.uid()) and r.status = 'going'
    )
  );

-- ───────────────────────── Sosial & moderasi ─────────────────────────

create policy friendships_select on friendships
  for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy friendships_insert on friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');

create policy friendships_update on friendships
  for update to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()))
  with check (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy friendships_delete on friendships
  for delete to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

-- Percakapan dibuat oleh fungsi server nanti; klien hanya membaca/menulis pesan di percakapannya.
create policy conversations_select_member on conversations
  for select to authenticated using (private.is_conversation_member(id));

create policy conversation_members_select on conversation_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_conversation_member(conversation_id));

create policy messages_select_member on messages
  for select to authenticated using (private.is_conversation_member(conversation_id));

create policy messages_insert_member on messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and private.is_conversation_member(conversation_id));

-- Moderasi: pending_review sebelum banned, tanpa auto-ban; admin meninjau.
create policy reports_insert_own on reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'pending_review');

create policy reports_select_own on reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or private.is_admin());

create policy reports_admin_update on reports
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
